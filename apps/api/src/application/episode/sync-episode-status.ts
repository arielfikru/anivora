import type { ActivityRepository } from "#/domain/activity/activity-repository.ts"
import type { EpisodeRepository } from "#/domain/catalog/episode-repository.ts"
import type { BunnyService } from "#/domain/ports/bunny.ts"
import { bunnyStatusToEpisodeStatus } from "#/infrastructure/bunny/status.ts"
import type { AuthedContext } from "../shared/context.ts"
import { badRequest, notFound } from "../shared/errors.ts"

export interface SyncEpisodeStatusInput {
	episodeId: string
}

export interface SyncEpisodeStatusDeps {
	episodeRepo: EpisodeRepository
	activityRepo: ActivityRepository
	bunny: BunnyService
}

export function makeSyncEpisodeStatus(deps: SyncEpisodeStatusDeps) {
	return async (input: SyncEpisodeStatusInput, ctx: AuthedContext) => {
		const existing = await deps.episodeRepo.findById(input.episodeId)
		if (!existing) throw notFound("Episode not found")
		if (!existing.bunnyVideoId) throw badRequest("Episode has no Bunny video")
		const raw = await deps.bunny.getVideoStatus(existing.bunnyVideoId)
		const status = bunnyStatusToEpisodeStatus(raw)
		if (status === existing.status) return { episode: existing }
		const episode = await deps.episodeRepo.setStatus(input.episodeId, status)
		if (!episode) throw notFound("Episode not found")
		await deps.activityRepo.insert({
			userId: ctx.session.user.id,
			action: "sync-status",
			resource: "episode",
			resourceId: episode.id,
			metadata: { from: existing.status, to: status, bunnyStatus: raw },
		})
		return { episode }
	}
}
