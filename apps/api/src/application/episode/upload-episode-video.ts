import { createReadStream } from "node:fs"
import { mkdir, rm, stat, writeFile } from "node:fs/promises"
import { join } from "node:path"

import type { ActivityRepository } from "#/domain/activity/activity-repository.ts"
import type { EpisodeRepository } from "#/domain/catalog/episode-repository.ts"
import type { SeasonRepository } from "#/domain/catalog/season-repository.ts"
import type { ObjectStorage } from "#/domain/ports/object-storage.ts"
import type { AuthedContext } from "../shared/context.ts"
import { notFound } from "../shared/errors.ts"
import { transcodeToMp4 } from "../upload/shared/transcode.ts"
import { resolveReadyStatus } from "./resolve-ready-status.ts"
import { episodeVideoKey } from "./video-key.ts"

export interface UploadEpisodeVideoInput {
	episodeId: string
	filename: string
	file: Uint8Array
}

export interface UploadEpisodeVideoDeps {
	episodeRepo: EpisodeRepository
	seasonRepo: SeasonRepository
	activityRepo: ActivityRepository
	objectStorage: ObjectStorage
	workRoot: string
}

export function makeUploadEpisodeVideo(deps: UploadEpisodeVideoDeps) {
	return async (input: UploadEpisodeVideoInput, ctx: AuthedContext) => {
		const existing = await deps.episodeRepo.findById(input.episodeId)
		if (!existing) throw notFound("Episode not found")

		// Normalize to an H.264/AAC faststart mp4 so the browser can stream it
		// progressively, regardless of the source container/codec.
		const workDir = join(deps.workRoot, `direct-${input.episodeId}`)
		await mkdir(workDir, { recursive: true })
		const src = join(workDir, "source.in")
		const mp4 = join(workDir, "source.mp4")
		let episode: Awaited<ReturnType<EpisodeRepository["attachVideo"]>>
		try {
			await writeFile(src, input.file)
			await transcodeToMp4(src, mp4)
			const size = (await stat(mp4)).size
			const key = episodeVideoKey(input.episodeId)
			await deps.objectStorage.putStream(
				key,
				createReadStream(mp4),
				size,
				"video/mp4",
			)
			const resolved = await resolveReadyStatus(
				deps.seasonRepo,
				existing.seasonId,
				"ready",
			)
			episode = await deps.episodeRepo.attachVideo(input.episodeId, {
				storageProvider: "r2",
				mp4Url: deps.objectStorage.publicUrl(key),
				status: resolved.status,
				publishedAt: resolved.publishedAt,
			})
		} finally {
			await rm(workDir, { recursive: true, force: true })
		}
		if (!episode) throw notFound("Episode not found")

		await deps.activityRepo.insert({
			userId: ctx.session.user.id,
			action: "upload",
			resource: "episode",
			resourceId: episode.id,
			metadata: { filename: input.filename, provider: "r2" },
		})
		return { episode }
	}
}
