import type { ActivityRepository } from "#/domain/activity/activity-repository.ts"
import type { EpisodeRepository } from "#/domain/catalog/episode-repository.ts"
import type { EpisodeStatus } from "#/domain/catalog/episode.ts"
import type { AuthedContext } from "../shared/context.ts"

export interface SetSeasonEpisodesStatusInput {
	seasonId: string
	status: EpisodeStatus
}

export interface SetSeasonEpisodesStatusDeps {
	episodeRepo: EpisodeRepository
	activityRepo: ActivityRepository
}

export function makeSetSeasonEpisodesStatus(deps: SetSeasonEpisodesStatusDeps) {
	return async (input: SetSeasonEpisodesStatusInput, ctx: AuthedContext) => {
		const episodes = await deps.episodeRepo.listBySeason(input.seasonId)
		const publishedAt = input.status === "published" ? new Date() : undefined
		let updated = 0
		for (const episode of episodes) {
			if (episode.status === input.status) continue
			await deps.episodeRepo.setStatus(episode.id, input.status, publishedAt)
			updated++
		}
		await deps.activityRepo.insert({
			userId: ctx.session.user.id,
			action: "update",
			resource: "episode",
			resourceId: input.seasonId,
			metadata: { bulkStatus: input.status, updated },
		})
		return { updated }
	}
}
