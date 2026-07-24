import type { EpisodeRepository } from "#/domain/catalog/episode-repository.ts"
import type { Episode } from "#/domain/catalog/episode.ts"
import type { OptionalAuthContext } from "../shared/context.ts"
import { notFound } from "../shared/errors.ts"

export interface GetEpisodeInput {
	slug: string
}

export interface GetEpisodeDeps {
	episodeRepo: EpisodeRepository
	ensureMirror?: (episode: Episode) => Promise<Episode>
	preloadNext?: (episode: Episode) => Promise<void>
}

export function makeGetEpisode(deps: GetEpisodeDeps) {
	return async (input: GetEpisodeInput, _ctx: OptionalAuthContext) => {
		let episode = await deps.episodeRepo.findPublicBySlug(input.slug)
		if (!episode) throw notFound("Episode not found")
		if (deps.ensureMirror) episode = await deps.ensureMirror(episode)
		// Preloading must never prevent the current episode from playing.
		if (deps.preloadNext) await deps.preloadNext(episode).catch(() => undefined)
		return { episode }
	}
}
