import type { Genre, NewGenre } from "./genre.ts"

export interface GenreRepository {
	list(): Promise<Genre[]>
	findById(id: string): Promise<Genre | null>
	findOrCreate(name: string, slug: string): Promise<Genre>
	setForAnime(animeId: string, genreIds: string[]): Promise<void>
	slugExists(slug: string): Promise<boolean>
	create(data: NewGenre): Promise<Genre>
	delete(id: string): Promise<boolean>
}
