import type { BunnyService } from "#/domain/ports/bunny.ts"

export interface BunnyUrls {
	embedUrl: string
	playbackUrl: string
	thumbnailUrl: string
}

export function buildBunnyUrls(
	bunny: BunnyService,
	videoId: string,
): BunnyUrls {
	return {
		embedUrl: bunny.buildEmbedUrl(videoId),
		playbackUrl: bunny.buildPlaybackUrl(videoId),
		thumbnailUrl: bunny.buildThumbnailUrl(videoId),
	}
}
