import type { ActivityRepository } from "#/domain/activity/activity-repository.ts"
import type { EpisodeUpdate } from "#/domain/catalog/episode.ts"
import type { EpisodeRepository } from "#/domain/catalog/episode-repository.ts"
import type { AuthedContext } from "../shared/context.ts"
import { notFound } from "../shared/errors.ts"

export interface UpdateEpisodeInput {
	id: string
	data: EpisodeUpdate
}

export interface UpdateEpisodeDeps {
	episodeRepo: EpisodeRepository
	activityRepo: ActivityRepository
}

export function makeUpdateEpisode(deps: UpdateEpisodeDeps) {
	return async (input: UpdateEpisodeInput, ctx: AuthedContext) => {
		const episode = await deps.episodeRepo.update(input.id, input.data)
		if (!episode) throw notFound("Episode not found")
		await deps.activityRepo.insert({
			userId: ctx.session.user.id,
			action: "update",
			resource: "episode",
			resourceId: episode.id,
			metadata: { fields: Object.keys(input.data) },
		})
		return { episode }
	}
}
