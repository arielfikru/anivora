import type { Hono } from "hono"

import type { AnimeRepository } from "#/domain/catalog/anime-repository.ts"
import { logger } from "#/infrastructure/observability/logger.ts"

export interface SitemapRoutesDeps {
	animeRepo: AnimeRepository
	/** Public origin of the site, e.g. https://anivora.example. */
	webOrigin: string
}

function escapeXml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;")
}

/**
 * Serves /sitemap.xml listing the SPA home and every published anime detail
 * page (under the /app base path) so crawlers can discover catalog content.
 */
export function registerSitemapRoutes(
	app: Hono,
	deps: SitemapRoutesDeps,
): void {
	const base = deps.webOrigin.replace(/\/+$/, "")

	app.get("/sitemap.xml", async (c) => {
		let slugs: string[] = []
		try {
			const anime = await deps.animeRepo.listPublished({
				limit: 5000,
				offset: 0,
			})
			slugs = anime.map((a) => a.slug)
		} catch (err) {
			logger.error({ err }, "sitemap generation failed")
		}

		const locs = [
			`${base}/app/`,
			...slugs.map((slug) => `${base}/app/anime/${encodeURIComponent(slug)}`),
		]
		const urls = locs
			.map((loc) => `  <url><loc>${escapeXml(loc)}</loc></url>`)
			.join("\n")
		const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`
		return c.body(body, 200, {
			"Content-Type": "application/xml; charset=utf-8",
			"Cache-Control": "public, max-age=3600",
		})
	})
}
