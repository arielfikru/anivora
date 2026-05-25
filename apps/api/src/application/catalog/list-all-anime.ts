import type { AnimeRepository } from "#/domain/catalog/anime-repository.ts"
import type { AuthedContext } from "../shared/context.ts"

export interface ListAllAnimeDeps {
	animeRepo: AnimeRepository
}

export function makeListAllAnime(deps: ListAllAnimeDeps) {
	return async (_ctx: AuthedContext) => {
		const anime = await deps.animeRepo.listAll()
		return { anime }
	}
}
