import type {
	Anime,
	AnimeListFilters,
	AnimeListItem,
	AnimeUpdate,
	NewAnime,
} from "./anime.ts"

export interface AnimeRepository {
	listAll(): Promise<AnimeListItem[]>
	/** Full provider-backed records used by the artwork mirror backfill. */
	listSourced(): Promise<Anime[]>
	listPublished(filters: AnimeListFilters): Promise<AnimeListItem[]>
	searchPublished(query: string, limit: number): Promise<AnimeListItem[]>
	/** Published anime sharing ≥1 genre with the given anime, excluding it. */
	listRelated(animeId: string, limit: number): Promise<AnimeListItem[]>
	findBySlug(slug: string): Promise<Anime | null>
	findById(id: string): Promise<Anime | null>
	findBySource(provider: string, sourceId: string): Promise<Anime | null>
	slugExists(slug: string): Promise<boolean>
	create(data: NewAnime): Promise<Anime>
	update(id: string, data: AnimeUpdate): Promise<Anime | null>
	/** Updates mirrored artwork without changing catalog recency/order. */
	setCoverImageUrl(id: string, coverImageUrl: string): Promise<void>
	setUpdatedAt(id: string, updatedAt: Date): Promise<void>
	delete(id: string): Promise<boolean>
}
