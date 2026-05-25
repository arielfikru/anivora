import type { EpisodeRepository } from "#/domain/catalog/episode-repository.ts"
import type { OptionalAuthContext } from "../shared/context.ts"
import { notFound } from "../shared/errors.ts"

export interface GetEpisodeInput {
	slug: string
}

export interface GetEpisodeDeps {
	episodeRepo: EpisodeRepository
}

export function makeGetEpisode(deps: GetEpisodeDeps) {
	return async (input: GetEpisodeInput, _ctx: OptionalAuthContext) => {
		const episode = await deps.episodeRepo.findPublicBySlug(input.slug)
		if (!episode) throw notFound("Episode not found")
		return { episode }
	}
}
