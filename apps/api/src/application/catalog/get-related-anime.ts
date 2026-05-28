import type { AnimeRepository } from "#/domain/catalog/anime-repository.ts"
import type { OptionalAuthContext } from "../shared/context.ts"
import { notFound } from "../shared/errors.ts"

export interface GetRelatedAnimeInput {
	slug: string
	limit: number
}

export interface GetRelatedAnimeDeps {
	animeRepo: AnimeRepository
}

export function makeGetRelatedAnime(deps: GetRelatedAnimeDeps) {
	return async (input: GetRelatedAnimeInput, _ctx: OptionalAuthContext) => {
		const anime = await deps.animeRepo.findBySlug(input.slug)
		if (!anime || anime.status !== "published") {
			throw notFound("Anime not found")
		}
		const related = await deps.animeRepo.listRelated(anime.id, input.limit)
		return { anime: related }
	}
}
