import type { ActivityRepository } from "#/domain/activity/activity-repository.ts"
import type { AnimeUpdate } from "#/domain/catalog/anime.ts"
import type { AnimeRepository } from "#/domain/catalog/anime-repository.ts"
import type { AuthedContext } from "../shared/context.ts"
import { notFound } from "../shared/errors.ts"

export interface UpdateAnimeInput {
	id: string
	data: AnimeUpdate
}

export interface UpdateAnimeDeps {
	animeRepo: AnimeRepository
	activityRepo: ActivityRepository
}

export function makeUpdateAnime(deps: UpdateAnimeDeps) {
	return async (input: UpdateAnimeInput, ctx: AuthedContext) => {
		const anime = await deps.animeRepo.update(input.id, input.data)
		if (!anime) throw notFound("Anime not found")
		await deps.activityRepo.insert({
			userId: ctx.session.user.id,
			action: "update",
			resource: "anime",
			resourceId: anime.id,
			metadata: { fields: Object.keys(input.data) },
		})
		return { anime }
	}
}
