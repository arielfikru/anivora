import { createHash } from "node:crypto"
import { Readable } from "node:stream"

import type { BunnyService } from "#/domain/ports/bunny.ts"

// Direct (TUS) uploads are valid for this long; the browser uploads straight
// to Bunny within the window, bypassing our origin and any CDN body limit.
const UPLOAD_TTL_MS = 2 * 60 * 60 * 1000

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

		async createDirectUpload(title) {
			const res = await request(videosUrl, {
				method: "POST",
				headers: { ...headers, "content-type": "application/json" },
				body: JSON.stringify({ title }),
			})
			const { guid } = (await res.json()) as { guid: string }
			const expiration = Date.now() + UPLOAD_TTL_MS
			const signature = createHash("sha256")
				.update(config.libraryId + config.apiKey + expiration + guid)
				.digest("hex")
			return {
				videoId: guid,
				libraryId: config.libraryId,
				endpoint: `${config.baseUrl}/tusupload`,
				signature,
				expiration,
			}
		},

		async uploadVideo(videoId, file) {
			await request(`${videosUrl}/${videoId}`, {
				method: "PUT",
				headers: { AccessKey: config.apiKey },
				body: file,
			})
		},

		async uploadVideoStream(videoId, body, contentLength) {
			await request(`${videosUrl}/${videoId}`, {
				method: "PUT",
				headers: {
					AccessKey: config.apiKey,
					"content-type": "application/octet-stream",
					"content-length": String(contentLength),
				},
				body: Readable.toWeb(body) as ReadableStream,
				// Node's fetch requires duplex for a streaming request body.
				duplex: "half",
			} as RequestInit)
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
