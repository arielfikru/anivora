import { createReadStream } from "node:fs"
import { mkdir, rename, rm, stat } from "node:fs/promises"
import { basename, join, relative } from "node:path"

import type { EpisodeRepository } from "#/domain/catalog/episode-repository.ts"
import type { SeasonRepository } from "#/domain/catalog/season-repository.ts"
import type { ObjectStorage } from "#/domain/ports/object-storage.ts"
import type { RemoteUploadJobRepository } from "#/domain/upload/remote-upload-job-repository.ts"
import type {
	RemoteUploadFile,
	RemoteUploadJob,
} from "#/domain/upload/remote-upload-job.ts"
import { logger } from "#/infrastructure/observability/logger.ts"
import type { ProviderMediaSource } from "#/infrastructure/content/providers/provider.ts"
import { resolveReadyStatus } from "../episode/resolve-ready-status.ts"
import { episodeVideoKey } from "../episode/video-key.ts"
import { detectArchiveType, extractArchive } from "./shared/archive.ts"
import { downloadToFile } from "./shared/source-downloader.ts"
import { transcodeToMp4 } from "./shared/transcode.ts"
import { scanVideoFiles } from "./shared/video-scan.ts"

// Statuses the worker reclaims. Intermediate A-phase states are restarted from
// a clean work dir, so a crash mid-download self-heals on the next tick.
const CLAIMABLE = ["pending", "downloading", "extracting", "uploading"] as const

// A job past these states owns no live scratch dir. "scanned" is NOT terminal —
// it still holds downloaded files the upload phase consumes.
export const TERMINAL: readonly string[] = ["completed", "failed", "canceled"]

// Statuses whose scratch dir must be preserved (in-flight or awaiting mapping).
export const ACTIVE_WORK: readonly string[] = [
	"pending",
	"downloading",
	"extracting",
	"scanned",
	"uploading",
]

export interface ProcessRemoteUploadJobsDeps {
	jobRepo: RemoteUploadJobRepository
	episodeRepo: EpisodeRepository
	seasonRepo: SeasonRepository
	objectStorage: ObjectStorage
	workRoot: string
	maxBytes?: number
	resolveMirror?: (
		provider: string,
		episodeUrl: string,
	) => Promise<ProviderMediaSource>
	gofileApiToken?: string
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
		if (job.targetEpisodeId)
			await deps.episodeRepo.setStatus(job.targetEpisodeId, "processing")

		const dest = join(downloadDir, filenameFrom(job.sourceUrl, null))
		let lastTick = 0
		const result = await downloadToFile(job.sourceType, job.sourceUrl, dest, {
			maxBytes: deps.maxBytes,
			sourceProvider: job.sourceProvider,
			resolveMirror: deps.resolveMirror,
			gofileApiToken: deps.gofileApiToken,
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

		// The dest name was derived from the URL before the response existed, so a
		// single non-archive file often lands without a video extension (Drive
		// "download", pixeldrain "<id>"). Re-derive from Content-Disposition now and
		// rename, otherwise the extension-based video scan misses it and the job
		// fails with "No video files found". Archives are detected by magic bytes,
		// so they were unaffected — this only rescues bare video files.
		let scanTarget = dest
		const realName = filenameFrom(result.finalUrl, result.contentDisposition)
		if (realName && realName !== basename(dest)) {
			const renamed = join(downloadDir, realName)
			await rename(dest, renamed)
			scanTarget = renamed
		}

		let scanRoot = downloadDir
		const archiveType = await detectArchiveType(scanTarget)
		if (archiveType) {
			await deps.jobRepo.update(job.id, { status: "extracting" })
			const extractDir = join(workDir, "extracted")
			await mkdir(extractDir, { recursive: true })
			await extractArchive(scanTarget, extractDir)
			scanRoot = extractDir
		}

		const scanned = await scanVideoFiles(scanRoot)
		if (scanned.length === 0) {
			await deps.jobRepo.update(job.id, {
				status: "failed",
				error: "No video files found in source",
			})
			if (job.targetEpisodeId)
				await deps.episodeRepo.setStatus(job.targetEpisodeId, "failed")
			return
		}

		const prefix = relative(workDir, scanRoot)
		const files: RemoteUploadFile[] = scanned.map((f, index) => ({
			relPath: join(prefix, f.relPath),
			sizeBytes: f.sizeBytes,
			suggestedNumber: f.suggestedNumber,
			episodeNumber: null,
			episodeId: index === 0 ? job.targetEpisodeId : null,
			uploadStatus: "pending",
			bytesSent: 0,
			videoKey: null,
			error: null,
		}))

		await deps.jobRepo.update(job.id, {
			status: job.targetEpisodeId ? "uploading" : "scanned",
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

		// R2 serves the uploaded file verbatim for progressive playback, so hand
		// it an H.264/AAC faststart mp4 (remuxed when already compatible, else
		// transcoded).
		const src = join(job.workDir ?? "", file.relPath)
		const mp4 = `${src}.out.mp4`
		await transcodeToMp4(src, mp4)
		const size = (await stat(mp4)).size
		try {
			const key = episodeVideoKey(episode.id)
			await deps.objectStorage.putStream(
				key,
				createReadStream(mp4),
				size,
				"video/mp4",
			)
			const resolved = await resolveReadyStatus(
				deps.seasonRepo,
				episode.seasonId,
				"ready",
			)
			await deps.episodeRepo.attachVideo(episode.id, {
				storageProvider: "r2",
				mp4Url: deps.objectStorage.publicUrl(key),
				status: resolved.status,
				publishedAt: resolved.publishedAt,
			})
			return {
				...file,
				uploadStatus: "done",
				bytesSent: size,
				videoKey: key,
				error: null,
			}
		} finally {
			await rm(mp4, { force: true })
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
		if (failed.length && job.targetEpisodeId)
			await deps.episodeRepo.setStatus(job.targetEpisodeId, "failed")
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
			if (job.targetEpisodeId)
				await deps.episodeRepo.setStatus(job.targetEpisodeId, "failed")
		}
		// Reclaim the scratch dir once the job reaches a terminal state. A
		// "scanned" job keeps its dir because the upload phase still needs the
		// downloaded/extracted files; failed/canceled jobs are never re-claimed,
		// so their dir is pure garbage (the error is already persisted in the DB).
		const fresh = await deps.jobRepo.findById(job.id)
		if (fresh?.workDir && TERMINAL.includes(fresh.status))
			await rm(fresh.workDir, { recursive: true, force: true })
		return { processed: 1 }
	}
}
