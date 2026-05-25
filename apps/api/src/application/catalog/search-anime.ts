import type { AnimeRepository } from "#/domain/catalog/anime-repository.ts"
import type { OptionalAuthContext } from "../shared/context.ts"

export interface SearchAnimeInput {
	query: string
	limit: number
}

export interface SearchAnimeDeps {
	animeRepo: AnimeRepository
}

export function makeSearchAnime(deps: SearchAnimeDeps) {
	return async (input: SearchAnimeInput, _ctx: OptionalAuthContext) => {
		const anime = await deps.animeRepo.searchPublished(input.query, input.limit)
		return { anime }
	}
}
