import type {
	Episode,
	EpisodeStatus,
	EpisodeUpdate,
	NewEpisode,
	PublicEpisode,
} from "./episode.ts"

export interface AttachBunnyInput {
	bunnyVideoId: string
	bunnyLibraryId: string
	embedUrl: string
	playbackUrl: string
	thumbnailUrl: string
	status: EpisodeStatus
}

export interface EpisodeRepository {
	listBySeason(seasonId: string): Promise<Episode[]>
	listPublicBySeason(seasonId: string): Promise<PublicEpisode[]>
	findPublicBySlug(slug: string): Promise<Episode | null>
	findById(id: string): Promise<Episode | null>
	findByBunnyVideoId(videoId: string): Promise<Episode | null>
	slugExists(slug: string): Promise<boolean>
	create(data: NewEpisode): Promise<Episode>
	update(id: string, data: EpisodeUpdate): Promise<Episode | null>
	attachBunny(id: string, data: AttachBunnyInput): Promise<Episode | null>
	setStatus(
		id: string,
		status: EpisodeStatus,
		publishedAt?: Date | null,
	): Promise<Episode | null>
	listByStatus(statuses: EpisodeStatus[]): Promise<Episode[]>
	delete(id: string): Promise<boolean>
}
