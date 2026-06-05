import type { Readable } from "node:stream"

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
	/**
	 * Streams a video body straight to Bunny without buffering it in memory —
	 * used by the remote-upload worker for GB-scale files. `body` is consumed
	 * once; `contentLength` must be the exact byte size on disk.
	 */
	uploadVideoStream(
		videoId: string,
		body: Readable,
		contentLength: number,
	): Promise<void>
	getVideoStatus(videoId: string): Promise<number>
	buildEmbedUrl(videoId: string): string
	buildPlaybackUrl(videoId: string): string
	buildThumbnailUrl(videoId: string): string
}
