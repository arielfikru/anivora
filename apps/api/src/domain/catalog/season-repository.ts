import type { Season, SeasonUpdate, NewSeason } from "./season.ts"

export interface SeasonRepository {
	listByAnime(animeId: string): Promise<Season[]>
	listPublishedByAnime(animeId: string): Promise<Season[]>
	findById(id: string): Promise<Season | null>
	create(data: NewSeason): Promise<Season>
	update(id: string, data: SeasonUpdate): Promise<Season | null>
	delete(id: string): Promise<boolean>
}
