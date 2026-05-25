import type { BunnyService } from "#/domain/ports/bunny.ts"

export interface BunnyConfig {
	libraryId: string
	apiKey: string
	baseUrl: string
	cdnHostname: string
}

export function createBunnyService(config: BunnyConfig): BunnyService {
	const videosUrl = `${config.baseUrl}/library/${config.libraryId}/videos`
	const headers = { AccessKey: config.apiKey, accept: "application/json" }

	const request = async (url: string, init: RequestInit): Promise<Response> => {
		const res = await fetch(url, init)
		if (!res.ok) {
			throw new Error(`Bunny request failed (${res.status}): ${res.statusText}`)
		}
		return res
	}

	return {
		libraryId: config.libraryId,

		async createVideo(title) {
			const res = await request(videosUrl, {
				method: "POST",
				headers: { ...headers, "content-type": "application/json" },
				body: JSON.stringify({ title }),
			})
			const body = (await res.json()) as { guid: string }
			return { videoId: body.guid }
		},

		async uploadVideo(videoId, file) {
			await request(`${videosUrl}/${videoId}`, {
				method: "PUT",
				headers: { AccessKey: config.apiKey },
				body: file,
			})
		},

		async getVideoStatus(videoId) {
			const res = await request(`${videosUrl}/${videoId}`, { headers })
			const body = (await res.json()) as { status: number }
			return body.status
		},

		buildEmbedUrl(videoId) {
			return `https://iframe.mediadelivery.net/embed/${config.libraryId}/${videoId}`
		},

		buildPlaybackUrl(videoId) {
			return `https://${config.cdnHostname}/${videoId}/playlist.m3u8`
		},

		buildThumbnailUrl(videoId) {
			return `https://${config.cdnHostname}/${videoId}/thumbnail.jpg`
		},
	}
}
