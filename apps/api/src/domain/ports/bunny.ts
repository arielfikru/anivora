export interface DirectUploadTicket {
	videoId: string
	libraryId: string
	endpoint: string
	signature: string
	expiration: number
}

export interface BunnyService {
	readonly libraryId: string
	createVideo(title: string): Promise<{ videoId: string }>
	createDirectUpload(title: string): Promise<DirectUploadTicket>
	uploadVideo(videoId: string, file: Uint8Array): Promise<void>
	getVideoStatus(videoId: string): Promise<number>
	buildEmbedUrl(videoId: string): string
	buildPlaybackUrl(videoId: string): string
	buildThumbnailUrl(videoId: string): string
}
