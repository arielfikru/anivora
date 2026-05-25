import type { EpisodeRepository } from "#/domain/catalog/episode-repository.ts"
import type { AuthedContext } from "../shared/context.ts"

export interface ListEpisodesInput {
	seasonId: string
}

export interface ListEpisodesDeps {
	episodeRepo: EpisodeRepository
}

export function makeListEpisodes(deps: ListEpisodesDeps) {
	return async (input: ListEpisodesInput, _ctx: AuthedContext) => {
		const episodes = await deps.episodeRepo.listBySeason(input.seasonId)
		return { episodes }
	}
}
