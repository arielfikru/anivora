import type { EpisodeRepository } from "#/domain/catalog/episode-repository.ts"
import type { Episode } from "#/domain/catalog/episode.ts"
import type { SeasonRepository } from "#/domain/catalog/season-repository.ts"

export interface PreloadNextEpisodeDeps {
	seasonRepo: SeasonRepository
	episodeRepo: EpisodeRepository
	ensureMirror: (episode: Episode) => Promise<Episode>
}

/**
 * Queues the episode after the one being watched, but only after the current
 * episode has a playable video. The mirror claim performed by ensureMirror is
 * atomic, so repeated watch-page requests cannot create duplicate jobs.
 */
export function makePreloadNextEpisode(deps: PreloadNextEpisodeDeps) {
	return async (current: Episode): Promise<void> => {
		if (!current.mp4Url && !current.playbackUrl) return

		const seasons = await deps.seasonRepo.listPublishedByAnime(current.animeId)
		let foundCurrent = false

		for (const season of seasons) {
			const episodes = await deps.episodeRepo.listPublicBySeason(season.id)
			for (const episode of episodes) {
				if (!foundCurrent) {
					foundCurrent = episode.id === current.id
					continue
				}

				if (episode.isReady) return
				const next = await deps.episodeRepo.findById(episode.id)
				if (next) await deps.ensureMirror(next)
				return
			}
		}
	}
}
