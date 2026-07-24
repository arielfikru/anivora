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
	// Legacy Bunny HLS playlist for episodes uploaded before the R2 migration;
	// handed to the native player for browsers that support HLS. New uploads
	// use mp4Url instead.
	playbackUrl: string | null
	mp4Url: string | null
	hlsUrl: string | null
	storageProvider: string | null
	sourceProvider: string | null
	sourceId: string | null
	sourceUrl: string | null
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
	/** True only when this episode already has a playable MP4 or legacy stream. */
	isReady: boolean
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
	sourceProvider?: string | null
	sourceId?: string | null
	sourceUrl?: string | null
	status?: EpisodeStatus
}

export type EpisodeUpdate = Partial<Omit<NewEpisode, "animeId" | "seasonId">>
