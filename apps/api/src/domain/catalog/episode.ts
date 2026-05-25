export type EpisodeStatus =
	| "draft"
	| "uploaded"
	| "processing"
	| "ready"
	| "published"
	| "failed"
	| "hidden"
	| "archived"

export interface Episode {
	id: string
	animeId: string
	seasonId: string
	episodeNumber: number
	episodeCode: string
	title: string | null
	slug: string
	description: string | null
	durationSeconds: number | null
	thumbnailUrl: string | null
	bunnyVideoId: string | null
	bunnyLibraryId: string | null
	playbackUrl: string | null
	embedUrl: string | null
	status: EpisodeStatus
	publishedAt: Date | null
	createdAt: Date
	updatedAt: Date
}

export interface PublicEpisode {
	id: string
	episodeNumber: number
	episodeCode: string
	title: string | null
	slug: string
	durationSeconds: number | null
	thumbnailUrl: string | null
	status: string
}

export interface NewEpisode {
	animeId: string
	seasonId: string
	episodeNumber: number
	episodeCode: string
	slug: string
	title?: string | null
	description?: string | null
	durationSeconds?: number | null
	thumbnailUrl?: string | null
	status?: EpisodeStatus
}

export type EpisodeUpdate = Partial<Omit<NewEpisode, "animeId" | "seasonId">>
