export type CatalogStatus = "draft" | "published" | "hidden" | "archived"
export type ContentRating = "general" | "teen" | "mature" | "adult"

export interface Anime {
	id: string
	title: string
	slug: string
	description: string | null
	coverImageUrl: string | null
	bannerImageUrl: string | null
	status: CatalogStatus
	contentRating: ContentRating
	studioName: string | null
	creatorName: string | null
	releaseYear: number | null
	rightsOwnerName: string | null
	licenseType: string | null
	permissionDocumentUrl: string | null
	isOriginalContent: boolean
	isFanmade: boolean
	requiresAttribution: boolean
	attributionText: string | null
	sourceProvider: string | null
	sourceId: string | null
	sourceUrl: string | null
	createdAt: Date
	updatedAt: Date
}

export interface AnimeListItem {
	id: string
	title: string
	slug: string
	coverImageUrl: string | null
	bannerImageUrl: string | null
	status: string
	releaseYear: number | null
	contentRating: string
}

export interface NewAnime {
	title: string
	slug: string
	description?: string | null
	coverImageUrl?: string | null
	bannerImageUrl?: string | null
	status?: CatalogStatus
	contentRating?: ContentRating
	studioName?: string | null
	creatorName?: string | null
	releaseYear?: number | null
	rightsOwnerName?: string | null
	licenseType?: string | null
	permissionDocumentUrl?: string | null
	isOriginalContent?: boolean
	isFanmade?: boolean
	requiresAttribution?: boolean
	attributionText?: string | null
	sourceProvider?: string | null
	sourceId?: string | null
	sourceUrl?: string | null
}

export type AnimeUpdate = Partial<NewAnime>

export interface AnimeListFilters {
	genreSlug?: string
	search?: string
	limit: number
	offset: number
}
