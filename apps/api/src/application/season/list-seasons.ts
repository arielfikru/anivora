import type { SeasonRepository } from "#/domain/catalog/season-repository.ts"
import type { AuthedContext } from "../shared/context.ts"

export interface ListSeasonsInput {
	animeId: string
}

export interface ListSeasonsDeps {
	seasonRepo: SeasonRepository
}

export function makeListSeasons(deps: ListSeasonsDeps) {
	return async (input: ListSeasonsInput, _ctx: AuthedContext) => {
		const seasons = await deps.seasonRepo.listByAnime(input.animeId)
		return { seasons }
	}
}
