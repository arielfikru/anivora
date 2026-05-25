import type { ActivityRepository } from "#/domain/activity/activity-repository.ts"
import type { EpisodeRepository } from "#/domain/catalog/episode-repository.ts"
import type { BunnyService } from "#/domain/ports/bunny.ts"
import type { AuthedContext } from "../shared/context.ts"
import { notFound } from "../shared/errors.ts"
import { buildBunnyUrls } from "./bunny-urls.ts"

export interface UploadEpisodeVideoInput {
	episodeId: string
	filename: string
	file: Uint8Array
}

export interface UploadEpisodeVideoDeps {
	episodeRepo: EpisodeRepository
	activityRepo: ActivityRepository
	bunny: BunnyService
}

export function makeUploadEpisodeVideo(deps: UploadEpisodeVideoDeps) {
	return async (input: UploadEpisodeVideoInput, ctx: AuthedContext) => {
		const existing = await deps.episodeRepo.findById(input.episodeId)
		if (!existing) throw notFound("Episode not found")
		const title = existing.title ?? existing.episodeCode
		const { videoId } = await deps.bunny.createVideo(title)
		await deps.bunny.uploadVideo(videoId, input.file)
		const episode = await deps.episodeRepo.attachBunny(input.episodeId, {
			bunnyVideoId: videoId,
			bunnyLibraryId: deps.bunny.libraryId,
			...buildBunnyUrls(deps.bunny, videoId),
			status: "processing",
		})
		if (!episode) throw notFound("Episode not found")
		await deps.activityRepo.insert({
			userId: ctx.session.user.id,
			action: "upload",
			resource: "episode",
			resourceId: episode.id,
			metadata: { videoId, filename: input.filename },
		})
		return { episode }
	}
}
