import type { AnimeRepository } from "#/domain/catalog/anime-repository.ts"
import type { AuthedContext } from "../shared/context.ts"
import { notFound } from "../shared/errors.ts"

export interface GetAnimeAdminInput {
	id: string
}

export interface GetAnimeAdminDeps {
	animeRepo: AnimeRepository
}

export function makeGetAnimeAdmin(deps: GetAnimeAdminDeps) {
	return async (input: GetAnimeAdminInput, _ctx: AuthedContext) => {
		const anime = await deps.animeRepo.findById(input.id)
		if (!anime) throw notFound("Anime not found")
		return { anime }
	}
}
