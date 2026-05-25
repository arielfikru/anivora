import type {
	Anime,
	AnimeListFilters,
	AnimeListItem,
	AnimeUpdate,
	NewAnime,
} from "./anime.ts"

export interface AnimeRepository {
	listAll(): Promise<AnimeListItem[]>
	listPublished(filters: AnimeListFilters): Promise<AnimeListItem[]>
	searchPublished(query: string, limit: number): Promise<AnimeListItem[]>
	findBySlug(slug: string): Promise<Anime | null>
	findById(id: string): Promise<Anime | null>
	slugExists(slug: string): Promise<boolean>
	create(data: NewAnime): Promise<Anime>
	update(id: string, data: AnimeUpdate): Promise<Anime | null>
	delete(id: string): Promise<boolean>
}
