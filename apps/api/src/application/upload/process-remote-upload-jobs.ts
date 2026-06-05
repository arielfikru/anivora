import { createReadStream } from "node:fs"
import { mkdir, rm, stat } from "node:fs/promises"
import { basename, join, relative } from "node:path"

import type { EpisodeRepository } from "#/domain/catalog/episode-repository.ts"
import type { BunnyService } from "#/domain/ports/bunny.ts"
import type { RemoteUploadJobRepository } from "#/domain/upload/remote-upload-job-repository.ts"
import type {
	RemoteUploadFile,
	RemoteUploadJob,
} from "#/domain/upload/remote-upload-job.ts"
import { logger } from "#/infrastructure/observability/logger.ts"
import { buildBunnyUrls } from "../episode/bunny-urls.ts"
import { detectArchiveType, extractArchive } from "./shared/archive.ts"
import { downloadToFile } from "./shared/source-downloader.ts"
import { transcodeToMp4 } from "./shared/transcode.ts"
import { scanVideoFiles } from "./shared/video-scan.ts"

// Statuses the worker reclaims. Intermediate A-phase states are restarted from
// a clean work dir, so a crash mid-download self-heals on the next tick.
const CLAIMABLE = ["pending", "downloading", "extracting", "uploading"] as const

export interface ProcessRemoteUploadJobsDeps {
	jobRepo: RemoteUploadJobRepository
	episodeRepo: EpisodeRepository
	bunny: BunnyService
	workRoot: string
	maxBytes?: number
}

function filenameFrom(url: string, contentDisposition: string | null): string {
	const cd = contentDisposition?.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i)
	if (cd) return decodeURIComponent(cd[1])
	try {
		const name = basename(new URL(url).pathname)
		if (name && name !== "/") return name
	} catch {
		/* fall through */
	}
	return "source.bin"
}

export function makeProcessRemoteUploadJobs(deps: ProcessRemoteUploadJobsDeps) {
	async function isCanceled(jobId: string): Promise<boolean> {
		const fresh = await deps.jobRepo.findById(jobId)
		return fresh?.status === "canceled"
	}

	async function runDownloadScan(job: RemoteUploadJob): Promise<void> {
		const workDir = join(deps.workRoot, job.id)
		await rm(workDir, { recursive: true, force: true })
		const downloadDir = join(workDir, "download")
		await mkdir(downloadDir, { recursive: true })

		await deps.jobRepo.update(job.id, {
			status: "downloading",
			workDir,
			bytesDownloaded: 0,
			error: null,
		})

		const dest = join(downloadDir, filenameFrom(job.sourceUrl, null))
		let lastTick = 0
		const result = await downloadToFile(job.sourceType, job.sourceUrl, dest, {
			maxBytes: deps.maxBytes,
			onProgress: (downloaded, total) => {
				// Throttle DB writes to ~every 8 MB.
				if (downloaded - lastTick < 8 * 1024 * 1024) return
				lastTick = downloaded
				void deps.jobRepo.update(job.id, {
					bytesDownloaded: downloaded,
					bytesTotal: total,
				})
			},
		})

		let scanRoot = downloadDir
		const archiveType = await detectArchiveType(dest)
		if (archiveType) {
			await deps.jobRepo.update(job.id, { status: "extracting" })
			const extractDir = join(workDir, "extracted")
			await mkdir(extractDir, { recursive: true })
			await extractArchive(dest, extractDir)
			scanRoot = extractDir
		}

		const scanned = await scanVideoFiles(scanRoot)
		if (scanned.length === 0) {
			await deps.jobRepo.update(job.id, {
				status: "failed",
				error: "No video files found in source",
			})
			return
		}

		const prefix = relative(workDir, scanRoot)
		const files: RemoteUploadFile[] = scanned.map((f) => ({
			relPath: join(prefix, f.relPath),
			sizeBytes: f.sizeBytes,
			suggestedNumber: f.suggestedNumber,
			episodeNumber: null,
			episodeId: null,
			uploadStatus: "pending",
			bytesSent: 0,
			bunnyVideoId: null,
			error: null,
		}))

		await deps.jobRepo.update(job.id, {
			status: "scanned",
			files,
			bytesDownloaded: result.bytesTotal,
			bytesTotal: result.bytesTotal,
		})
	}

	async function uploadFile(
		job: RemoteUploadJob,
		file: RemoteUploadFile,
	): Promise<RemoteUploadFile> {
		if (!file.episodeId || file.uploadStatus === "done") return file
		const episode = await deps.episodeRepo.findById(file.episodeId)
		if (!episode)
			return { ...file, uploadStatus: "failed", error: "Episode missing" }

		// Bunny's MP4-fallback serves the uploaded file verbatim, so always hand
		// it an H.264/AAC mp4 (remuxed when already compatible, else transcoded).
		const src = join(job.workDir ?? "", file.relPath)
		const mp4 = `${src}.bunny.mp4`
		await transcodeToMp4(src, mp4)
		const size = (await stat(mp4)).size
		const title = episode.title ?? episode.episodeCode
		const { videoId } = await deps.bunny.createVideo(title)
		try {
			await deps.bunny.uploadVideoStream(videoId, createReadStream(mp4), size)
		} finally {
			await rm(mp4, { force: true })
		}
		await deps.episodeRepo.attachBunny(episode.id, {
			bunnyVideoId: videoId,
			bunnyLibraryId: deps.bunny.libraryId,
			...buildBunnyUrls(deps.bunny, videoId),
			status: "processing",
		})
		return {
			...file,
			uploadStatus: "done",
			bytesSent: size,
			bunnyVideoId: videoId,
			error: null,
		}
	}

	async function runUpload(job: RemoteUploadJob): Promise<void> {
		const files = [...job.files]
		for (let i = 0; i < files.length; i++) {
			if (await isCanceled(job.id)) return
			const file = files[i]
			if (!file.episodeId || file.uploadStatus === "done") continue
			await deps.jobRepo.update(job.id, {
				files: files.map((f, j) =>
					j === i ? { ...f, uploadStatus: "uploading" } : f,
				),
			})
			try {
				files[i] = await uploadFile(job, file)
			} catch (err) {
				files[i] = {
					...file,
					uploadStatus: "failed",
					error: err instanceof Error ? err.message : "Upload failed",
				}
			}
			await deps.jobRepo.update(job.id, { files })
		}

		const failed = files.filter((f) => f.uploadStatus === "failed")
		await deps.jobRepo.update(job.id, {
			status: failed.length ? "failed" : "completed",
			error: failed.length ? `${failed.length} file(s) failed` : null,
			files,
		})
		if (!failed.length && job.workDir)
			await rm(job.workDir, { recursive: true, force: true })
	}

	return async (): Promise<{ processed: number }> => {
		const job = await deps.jobRepo.claimNext([...CLAIMABLE])
		if (!job) return { processed: 0 }
		try {
			if (job.status === "uploading") await runUpload(job)
			else await runDownloadScan(job)
		} catch (err) {
			logger.error({ err, jobId: job.id }, "remote upload job failed")
			await deps.jobRepo.update(job.id, {
				status: "failed",
				error: err instanceof Error ? err.message : "Job failed",
			})
		}
		return { processed: 1 }
	}
}
