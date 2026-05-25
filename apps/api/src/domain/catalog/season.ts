import type { CatalogStatus } from "./anime.ts"

export interface Season {
	id: string
	animeId: string
	seasonNumber: number
	title: string | null
	description: string | null
	releaseYear: number | null
	status: CatalogStatus
	autoPublish: boolean
	createdAt: Date
	updatedAt: Date
}

export interface NewSeason {
	animeId: string
	seasonNumber: number
	title?: string | null
	description?: string | null
	releaseYear?: number | null
	status?: CatalogStatus
	autoPublish?: boolean
}

export type SeasonUpdate = Partial<Omit<NewSeason, "animeId">>
