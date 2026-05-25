export interface EpisodeRow {
	id: string
	seasonId: string
	episodeNumber: number
	episodeCode: string
	title: string | null
	slug: string
	description: string | null
	durationSeconds: number | null
	bunnyVideoId: string | null
	status: string
}
