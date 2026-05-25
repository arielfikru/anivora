import type { EpisodeRepository } from "#/domain/catalog/episode-repository.ts"
import type { Episode } from "#/domain/catalog/episode.ts"
import type { SeasonRepository } from "#/domain/catalog/season-repository.ts"
import type { BunnyService } from "#/domain/ports/bunny.ts"
import { bunnyStatusToEpisodeStatus } from "#/infrastructure/bunny/status.ts"
import { resolveReadyStatus } from "./resolve-ready-status.ts"

export interface PollProcessingEpisodesDeps {
	episodeRepo: EpisodeRepository
	seasonRepo: SeasonRepository
	bunny: BunnyService
}

const PENDING = ["uploaded", "processing"] as const

export function makePollProcessingEpisodes(deps: PollProcessingEpisodesDeps) {
	const syncOne = async (episode: Episode): Promise<boolean> => {
		if (!episode.bunnyVideoId) return false
		const raw = await deps.bunny.getVideoStatus(episode.bunnyVideoId)
		const bunnyStatus = bunnyStatusToEpisodeStatus(raw)
		const { status, publishedAt } = await resolveReadyStatus(
			deps.seasonRepo,
			episode.seasonId,
			bunnyStatus,
		)
		if (status === episode.status) return false
		await deps.episodeRepo.setStatus(episode.id, status, publishedAt)
		return true
	}

	return async () => {
		const episodes = await deps.episodeRepo.listByStatus([...PENDING])
		const results = await Promise.all(episodes.map(syncOne))
		return { updated: results.filter(Boolean).length }
	}
}
