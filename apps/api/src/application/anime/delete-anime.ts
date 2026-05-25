import type { ActivityRepository } from "#/domain/activity/activity-repository.ts"
import type { AnimeRepository } from "#/domain/catalog/anime-repository.ts"
import type { AuthedContext } from "../shared/context.ts"
import { notFound } from "../shared/errors.ts"

export interface DeleteAnimeInput {
	id: string
}

export interface DeleteAnimeDeps {
	animeRepo: AnimeRepository
	activityRepo: ActivityRepository
}

export function makeDeleteAnime(deps: DeleteAnimeDeps) {
	return async (input: DeleteAnimeInput, ctx: AuthedContext) => {
		const deleted = await deps.animeRepo.delete(input.id)
		if (!deleted) throw notFound("Anime not found")
		await deps.activityRepo.insert({
			userId: ctx.session.user.id,
			action: "delete",
			resource: "anime",
			resourceId: input.id,
		})
		return { success: true as const }
	}
}
