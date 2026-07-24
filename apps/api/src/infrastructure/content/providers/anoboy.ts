import { badRequest } from "#/application/shared/errors.ts"
import {
	absoluteUrl,
	decodeHtml,
	sourceIdFromUrl,
	textContent,
} from "./html.ts"
import type {
	ContentProvider,
	ProviderAnime,
	ProviderAnimeSummary,
	ProviderEpisode,
	ProviderMediaSource,
	ProviderPage,
} from "./provider.ts"

const USER_AGENT =
	"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36 AnivoraMirror/1.0"

export interface AnoboyProviderOptions {
	baseUrl?: string
	fetchImpl?: typeof fetch
}

export class AnoboyProvider implements ContentProvider {
	readonly id = "anoboy"
	private readonly baseUrl: string
	private readonly fetchImpl: typeof fetch

	constructor(options: AnoboyProviderOptions = {}) {
		this.baseUrl = options.baseUrl ?? "https://anoboy.be"
		this.fetchImpl = options.fetchImpl ?? fetch
	}

	async listAnime(page: number): Promise<ProviderPage> {
		const url = new URL("/anime/", this.baseUrl)
		if (page > 1) url.searchParams.set("page", String(page))
		url.searchParams.set("status", "")
		url.searchParams.set("type", "")
		url.searchParams.set("order", "update")
		return parseAnoboyList(await this.getHtml(url.toString()))
	}

	async getAnime(url: string): Promise<ProviderAnime> {
		return parseAnoboyAnime(await this.getHtml(url), url)
	}

	async searchAnime(query: string): Promise<ProviderAnimeSummary[]> {
		const found = new Map<string, ProviderAnimeSummary>()
		const search = query.trim()
		if (!search) return []
		for (let page = 1; page <= 3; page++) {
			const url = new URL(page === 1 ? "/" : `/page/${page}/`, this.baseUrl)
			url.searchParams.set("s", search)
			const listing = parseAnoboyList(await this.getHtml(url.toString()))
			for (const item of listing.items) found.set(item.id, item)
			if (!listing.hasNext || found.size >= 24) break
		}
		return [...found.values()].slice(0, 24)
	}

	async resolveEpisodeMedia(url: string): Promise<ProviderMediaSource> {
		const source = parseAnoboyEpisodeMedia(await this.getHtml(url))
		if (!source)
			throw badRequest("Anoboy episode has no supported media source")
		return source
	}

	private async getHtml(url: string): Promise<string> {
		const res = await this.fetchImpl(url, {
			headers: { "user-agent": USER_AGENT, accept: "text/html" },
			redirect: "follow",
			signal: AbortSignal.timeout(30_000),
		})
		if (!res.ok) throw new Error(`Anoboy request failed (${res.status})`)
		return res.text()
	}
}

export function parseAnoboyList(html: string): ProviderPage {
	const items: ProviderAnimeSummary[] = []
	const seen = new Set<string>()
	for (const match of html.matchAll(
		/<article\b[^>]*class="[^"]*\bbs\b[^"]*"[^>]*>([\s\S]*?)<\/article>/gi,
	)) {
		const block = match[1]
		const anchor = block.match(
			/<a\b[^>]*href="([^"]*\/anime\/[^"]+)"[^>]*title="([^"]+)"/i,
		)
		if (!anchor) continue
		const url = absoluteUrl(anchor[1], "https://anoboy.be")
		const id = sourceIdFromUrl(url)
		if (!id || seen.has(id)) continue
		seen.add(id)
		items.push({
			id,
			url,
			title: decodeHtml(anchor[2]).trim(),
			coverImageUrl: block.match(/<img\b[^>]*src="([^"]+)"/i)?.[1] ?? null,
			status:
				textContent(
					block.match(
						/<span\b[^>]*class="epx"[^>]*>([\s\S]*?)<\/span>/i,
					)?.[1] ?? "",
				) || null,
			type:
				textContent(
					block.match(
						/<div\b[^>]*class="[^"]*typez[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
					)?.[1] ?? "",
				) || null,
		})
	}
	return {
		items,
		hasNext:
			/<link\b[^>]*rel="next"/i.test(html) ||
			/<a\b[^>]*class="[^"]*next\s+page-numbers/i.test(html),
	}
}

function infoValue(html: string, label: string): string | null {
	const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
	const match = html.match(
		new RegExp(
			`<span[^>]*>[\\s\\S]*?<b>${escaped}:<\\/b>([\\s\\S]*?)<\\/span>`,
			"i",
		),
	)
	return match ? textContent(match[1]) || null : null
}

export function parseAnoboyAnime(html: string, url: string): ProviderAnime {
	const main =
		html.match(
			/<div\b[^>]*class="[^"]*animefull[^"]*"[^>]*>([\s\S]*?)(?:<div\b[^>]*class="bixbox synp"|<div\b[^>]*class="eplister")/i,
		)?.[1] ?? html
	const episodesBlock =
		html.match(/<div\b[^>]*class="eplister"[^>]*>([\s\S]*?)<\/ul>/i)?.[1] ?? ""
	const episodes: ProviderEpisode[] = []
	for (const match of episodesBlock.matchAll(
		/<li\b[^>]*>[\s\S]*?<a\b[^>]*href="([^"]+)"[^>]*>[\s\S]*?<div\b[^>]*class="epl-num"[^>]*>([\s\S]*?)<\/div>[\s\S]*?<div\b[^>]*class="epl-title"[^>]*>([\s\S]*?)<\/div>[\s\S]*?<div\b[^>]*class="epl-date"[^>]*>([\s\S]*?)<\/div>/gi,
	)) {
		const episodeUrl = absoluteUrl(match[1], url)
		const number = Number.parseFloat(textContent(match[2]))
		if (!Number.isFinite(number)) continue
		episodes.push({
			id: sourceIdFromUrl(episodeUrl),
			url: episodeUrl,
			number,
			title: textContent(match[3]),
			releasedAt: textContent(match[4]) || null,
		})
	}
	const genreBlock =
		html.match(/<div\b[^>]*class="genxed"[^>]*>([\s\S]*?)<\/div>/i)?.[1] ?? ""
	const genres = [...genreBlock.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/gi)]
		.map((m) => textContent(m[1]))
		.filter(Boolean)
	const description = html.match(
		/<div\b[^>]*class="entry-content"[^>]*itemprop="description"[^>]*>([\s\S]*?)<\/div>/i,
	)?.[1]
	const title = textContent(
		html.match(/<h1\b[^>]*class="entry-title"[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ??
			"",
	)
	if (!title) throw new Error("Anoboy anime page is missing a title")
	const released = infoValue(main, "Released")
	return {
		id: sourceIdFromUrl(url),
		url,
		title,
		coverImageUrl:
			main.match(
				/<div\b[^>]*class="thumb"[\s\S]*?<img\b[^>]*src="([^"]+)"/i,
			)?.[1] ?? null,
		status: infoValue(main, "Status"),
		type: infoValue(main, "Type"),
		description: description ? textContent(description) : null,
		studioName: infoValue(main, "Studio"),
		releaseYear: released?.match(/\b(19|20)\d{2}\b/)
			? Number(released.match(/\b(?:19|20)\d{2}\b/)?.[0])
			: null,
		genres,
		episodes,
	}
}

export function parseAnoboyEpisodeMedia(
	html: string,
): ProviderMediaSource | null {
	const urls: string[] = []
	const addUrl = (value: string) => {
		const url = decodeHtml(value).trim()
		if (/^https?:\/\//i.test(url) && !urls.includes(url)) urls.push(url)
	}
	// Legacy pages expose the 720p mirrors inside soraurlx. Do not fall back to
	// scanning the whole document: that turns menus, related anime and genre
	// links into hundreds of bogus download candidates.
	for (const block of html.matchAll(
		/<div\b[^>]*class="[^"]*soraurlx[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
	)) {
		for (const anchor of block[1].matchAll(/<a\b[^>]*href="([^"]+)"/gi))
			addUrl(anchor[1])
	}
	// Current pages use a single icon/button link instead of soraurlx.
	for (const anchor of html.matchAll(
		/<a\b([^>]*)href="([^"]+)"([^>]*)>([\s\S]*?)<\/a>/gi,
	)) {
		const attributes = `${anchor[1]} ${anchor[3]}`
		if (/aria-label\s*=\s*["']Download["']/i.test(attributes)) addUrl(anchor[2])
	}
	const downloads: ProviderMediaSource[] = []
	for (const url of urls) {
		if (/\.(?:mp4|mkv|webm|mov|m4v)(?:[?#].*)?$/i.test(url))
			downloads.push({ type: "url", url })
		else if (/^https?:\/\/(?:drive|docs)\.google\.com\//i.test(url))
			downloads.push({ type: "drive", url })
		else if (/^https?:\/\/(?:www\.)?gofile\.io\/(?:d|download)\//i.test(url))
			downloads.push({ type: "gofile", url })
		else downloads.push({ type: "url", url })
	}
	const iframe = html.match(
		/<iframe\b[^>]*(?:src|data-litespeed-src)="([^"]+)"/i,
	)?.[1]
	if (iframe) {
		return {
			type: "player",
			url: absoluteUrl(decodeHtml(iframe).trim(), "https://anoboy.be"),
			alternatives: downloads,
		}
	}
	// Other authorized vendors sometimes expose a direct response without a
	// file extension. Let the generic downloader follow it; HTML landing pages
	// fail the video scan safely and are reported to the episode as failed.
	const [first, ...alternatives] = downloads
	if (!first) return null
	return alternatives.length ? { ...first, alternatives } : first
}
