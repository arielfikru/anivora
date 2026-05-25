import type {
	Episode,
	EpisodeUpdate,
	NewEpisode,
	PublicEpisode,
} from "./episode.ts"

export interface EpisodeRepository {
	listPublicBySeason(seasonId: string): Promise<PublicEpisode[]>
	findPublicBySlug(slug: string): Promise<Episode | null>
	findById(id: string): Promise<Episode | null>
	slugExists(slug: string): Promise<boolean>
	create(data: NewEpisode): Promise<Episode>
	update(id: string, data: EpisodeUpdate): Promise<Episode | null>
	delete(id: string): Promise<boolean>
}
