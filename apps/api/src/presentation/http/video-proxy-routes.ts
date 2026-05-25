import type { Hono } from "hono"

export interface VideoProxyDeps {
	cdnHostname: string
	/** Referer the Bunny CDN allowlists (its direct fetches otherwise 403). */
	referer: string
}

const GUID = /^[0-9a-fA-F-]{36}$/
const FILE =
	/^(play_(240p|360p|480p|720p|1080p)\.mp4|playlist\.m3u8|thumbnail\.jpg)$/

const PASS_HEADERS = [
	"content-type",
	"content-length",
	"content-range",
	"accept-ranges",
	"cache-control",
	"etag",
	"last-modified",
]

/**
 * Streams Bunny media through our own origin. Old smart-TV native players
 * can fetch from anime.mynekomy.site (TLS already proven by the page load)
 * but fail talking directly to the b-cdn.net CDN. Range requests are passed
 * through so seeking/streaming works.
 */
export function registerVideoProxyRoutes(
	app: Hono,
	deps: VideoProxyDeps,
): void {
	app.get("/v/:guid/:file", async (c) => {
		const guid = c.req.param("guid")
		const file = c.req.param("file")
		if (!GUID.test(guid) || !FILE.test(file)) {
			return c.text("Not found", 404)
		}
		const upstream = `https://${deps.cdnHostname}/${guid}/${file}`
		const headers: Record<string, string> = { Referer: deps.referer }
		const range = c.req.header("range")
		if (range) headers.Range = range
		const res = await fetch(upstream, { headers })
		const out = new Headers()
		for (const key of PASS_HEADERS) {
			const value = res.headers.get(key)
			if (value) out.set(key, value)
		}
		out.set("access-control-allow-origin", "*")
		return new Response(res.body, { status: res.status, headers: out })
	})
}
