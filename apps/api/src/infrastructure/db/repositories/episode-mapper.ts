import type { Episode, EpisodeStatus } from "#/domain/catalog/episode.ts"
import type * as schema from "../schema.ts"

type EpisodeRow = typeof schema.episode.$inferSelect

export function toEpisode(row: EpisodeRow): Episode {
	return {
		id: row.id,
		animeId: row.animeId,
		seasonId: row.seasonId,
		episodeNumber: row.episodeNumber,
		episodeCode: row.episodeCode,
		title: row.title,
		slug: row.slug,
		description: row.description,
		durationSeconds: row.durationSeconds,
		thumbnailUrl: row.thumbnailUrl,
		bunnyVideoId: row.bunnyVideoId,
		bunnyLibraryId: row.bunnyLibraryId,
		playbackUrl: row.playbackUrl,
		embedUrl: row.embedUrl,
		status: row.status as EpisodeStatus,
		publishedAt: row.publishedAt,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
	}
}
