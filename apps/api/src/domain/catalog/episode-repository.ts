import type {
	Episode,
	EpisodeStatus,
	EpisodeUpdate,
	NewEpisode,
	PublicEpisode,
} from "./episode.ts"

/** Persists playback metadata after an R2 upload. */
export interface AttachVideoInput {
	storageProvider: string
	status: EpisodeStatus
	mp4Url?: string | null
	hlsUrl?: string | null
	thumbnailUrl?: string | null
	publishedAt?: Date | null
}

export interface EpisodeRepository {
	listBySeason(seasonId: string): Promise<Episode[]>
	listPublicBySeason(seasonId: string): Promise<PublicEpisode[]>
	findPublicBySlug(slug: string): Promise<Episode | null>
	findById(id: string): Promise<Episode | null>
	slugExists(slug: string): Promise<boolean>
	create(data: NewEpisode): Promise<Episode>
	update(id: string, data: EpisodeUpdate): Promise<Episode | null>
	attachVideo(id: string, data: AttachVideoInput): Promise<Episode | null>
	setStatus(
		id: string,
		status: EpisodeStatus,
		publishedAt?: Date | null,
	): Promise<Episode | null>
	listByStatus(statuses: EpisodeStatus[]): Promise<Episode[]>
	delete(id: string): Promise<boolean>
}
