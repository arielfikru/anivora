import type { ActivityRepository } from "#/domain/activity/activity-repository.ts"
import type { AnimeRepository } from "#/domain/catalog/anime-repository.ts"
import type { NewSeason } from "#/domain/catalog/season.ts"
import type { SeasonRepository } from "#/domain/catalog/season-repository.ts"
import type { AuthedContext } from "../shared/context.ts"
import { notFound } from "../shared/errors.ts"

export type CreateSeasonInput = NewSeason

export interface CreateSeasonDeps {
	seasonRepo: SeasonRepository
	animeRepo: AnimeRepository
	activityRepo: ActivityRepository
}

export function makeCreateSeason(deps: CreateSeasonDeps) {
	return async (input: CreateSeasonInput, ctx: AuthedContext) => {
		if (!(await deps.animeRepo.findById(input.animeId))) {
			throw notFound("Anime not found")
		}
		const season = await deps.seasonRepo.create(input)
		await deps.activityRepo.insert({
			userId: ctx.session.user.id,
			action: "create",
			resource: "season",
			resourceId: season.id,
			metadata: { animeId: input.animeId, seasonNumber: input.seasonNumber },
		})
		return { season }
	}
}
