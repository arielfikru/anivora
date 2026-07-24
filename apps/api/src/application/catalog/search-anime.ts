import type { AnimeRepository } from "#/domain/catalog/anime-repository.ts"
import type { OptionalAuthContext } from "../shared/context.ts"

export interface SearchAnimeInput {
	query: string
	limit: number
}

export interface SearchAnimeDeps {
	animeRepo: AnimeRepository
	discover?: (query: string) => Promise<number>
}

export function makeSearchAnime(deps: SearchAnimeDeps) {
	return async (input: SearchAnimeInput, _ctx: OptionalAuthContext) => {
		let anime = await deps.animeRepo.searchPublished(input.query, input.limit)
		if (input.query.trim().length >= 2 && deps.discover) {
			try {
				const created = await deps.discover(input.query)
				if (created > 0)
					anime = await deps.animeRepo.searchPublished(input.query, input.limit)
			} catch {
				// Provider discovery is additive. A vendor outage must not hide local
				// catalog results or turn the search screen into an error page.
			}
		}
		return { anime }
	}
}
