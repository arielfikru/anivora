import type { AnimeRepository } from "#/domain/catalog/anime-repository.ts"
import type { OptionalAuthContext } from "../shared/context.ts"

export interface ListAnimeInput {
	genreSlug?: string
	search?: string
	limit: number
	offset: number
}

export interface ListAnimeDeps {
	animeRepo: AnimeRepository
}

export function makeListAnime(deps: ListAnimeDeps) {
	return async (input: ListAnimeInput, _ctx: OptionalAuthContext) => {
		const anime = await deps.animeRepo.listPublished({
			genreSlug: input.genreSlug,
			search: input.search,
			limit: input.limit,
			offset: input.offset,
		})
		return { anime }
	}
}
