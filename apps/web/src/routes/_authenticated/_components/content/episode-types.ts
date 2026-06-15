export interface EpisodeRow {
	id: string
	seasonId: string
	episodeNumber: number
	episodeCode: string
	title: string | null
	slug: string
	description: string | null
	durationSeconds: number | null
	mp4Url: string | null
	status: string
}
