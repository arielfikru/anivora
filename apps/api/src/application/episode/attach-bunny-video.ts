import type { ActivityRepository } from "#/domain/activity/activity-repository.ts"
import type { EpisodeRepository } from "#/domain/catalog/episode-repository.ts"
import type { EpisodeStatus } from "#/domain/catalog/episode.ts"
import type { BunnyService } from "#/domain/ports/bunny.ts"
import type { AuthedContext } from "../shared/context.ts"
import { notFound } from "../shared/errors.ts"
import { buildBunnyUrls } from "./bunny-urls.ts"

export interface AttachBunnyVideoInput {
	episodeId: string
	bunnyVideoId: string
	bunnyLibraryId: string
	status?: EpisodeStatus
}

export interface AttachBunnyVideoDeps {
	episodeRepo: EpisodeRepository
	activityRepo: ActivityRepository
	bunny: BunnyService
}

export function makeAttachBunnyVideo(deps: AttachBunnyVideoDeps) {
	return async (input: AttachBunnyVideoInput, ctx: AuthedContext) => {
		const episode = await deps.episodeRepo.attachBunny(input.episodeId, {
			bunnyVideoId: input.bunnyVideoId,
			bunnyLibraryId: input.bunnyLibraryId,
			...buildBunnyUrls(deps.bunny, input.bunnyVideoId),
			status: input.status ?? "processing",
		})
		if (!episode) throw notFound("Episode not found")
		await deps.activityRepo.insert({
			userId: ctx.session.user.id,
			action: "attach-bunny",
			resource: "episode",
			resourceId: episode.id,
			metadata: { bunnyVideoId: input.bunnyVideoId },
		})
		return { episode }
	}
}
