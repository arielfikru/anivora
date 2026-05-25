import type { ActivityRepository } from "#/domain/activity/activity-repository.ts"
import type { EpisodeRepository } from "#/domain/catalog/episode-repository.ts"
import type { AuthedContext } from "../shared/context.ts"
import { notFound } from "../shared/errors.ts"

export interface DeleteEpisodeInput {
	id: string
}

export interface DeleteEpisodeDeps {
	episodeRepo: EpisodeRepository
	activityRepo: ActivityRepository
}

export function makeDeleteEpisode(deps: DeleteEpisodeDeps) {
	return async (input: DeleteEpisodeInput, ctx: AuthedContext) => {
		const deleted = await deps.episodeRepo.delete(input.id)
		if (!deleted) throw notFound("Episode not found")
		await deps.activityRepo.insert({
			userId: ctx.session.user.id,
			action: "delete",
			resource: "episode",
			resourceId: input.id,
		})
		return { success: true as const }
	}
}
