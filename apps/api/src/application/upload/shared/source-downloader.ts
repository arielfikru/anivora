import { execFile } from "node:child_process"
import { createWriteStream } from "node:fs"
import { stat } from "node:fs/promises"
import { Readable } from "node:stream"
import { pipeline } from "node:stream/promises"
import { promisify } from "node:util"

import type { RemoteUploadSourceType } from "#/domain/upload/remote-upload-job.ts"
import type { ProviderMediaSource } from "#/infrastructure/content/providers/provider.ts"
import { badRequest } from "../../shared/errors.ts"
import { resolveDynamicPlayerUrl } from "./dynamic-player-resolver.ts"

const BROWSER_UA =
	"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
const exec = promisify(execFile)
const FETCH_TIMEOUT_MS = 30_000
// Signed player media can be hundreds of megabytes and some Blogger CDN
// edges are deliberately slow. Keep a finite ceiling, but do not abort a
// healthy episode after the short timeout used for metadata/probe requests.
const PLAYER_DOWNLOAD_TIMEOUT_MS = 30 * 60_000

export interface DownloadResult {
	bytesTotal: number
	contentDisposition: string | null
	finalUrl: string
}

export interface DownloadOptions {
	maxBytes?: number
	onProgress?: (bytesDownloaded: number, bytesTotal: number) => void
	sourceProvider?: string | null
	resolveMirror?: (
		provider: string,
		episodeUrl: string,
	) => Promise<ProviderMediaSource>
	gofileApiToken?: string
}

/** Pull a Google Drive file id out of any of its public share URL shapes. */
export function extractDriveId(url: string): string | null {
	const patterns = [/\/file\/d\/([\w-]+)/, /[?&]id=([\w-]+)/, /\/d\/([\w-]+)/]
	for (const re of patterns) {
		const m = url.match(re)
		if (m) return m[1]
	}
	return null
}

function assertHttpUrl(url: string): void {
	let parsed: URL
	try {
		parsed = new URL(url)
	} catch {
		throw badRequest("Invalid URL")
	}
	if (parsed.protocol !== "http:" && parsed.protocol !== "https:")
		throw badRequest("Only http(s) URLs are allowed")
}

/**
 * Resolve a Google Drive public link to a streamable Response, transparently
 * clearing the large-file "can't scan for viruses" interstitial by replaying
 * its confirm form (id/export/confirm/uuid) with the returned cookies.
 */
async function fetchDrive(url: string): Promise<Response> {
	const id = extractDriveId(url)
	if (!id) throw badRequest("Could not parse a Google Drive file id from URL")
	const direct = `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`
	const res = await fetch(direct, { headers: { "user-agent": BROWSER_UA } })
	const type = res.headers.get("content-type") ?? ""
	if (!type.includes("text/html")) return res

	// Interstitial page: rebuild the confirm form action + inputs, carry cookies.
	const html = await res.text()
	const cookie = res.headers.get("set-cookie")?.split(";")[0] ?? ""
	const action =
		html.match(/action="([^"]+)"/)?.[1]?.replace(/&amp;/g, "&") ??
		"https://drive.usercontent.google.com/download"
	const params = new URLSearchParams()
	for (const m of html.matchAll(/name="([^"]+)"\s+value="([^"]*)"/g))
		params.set(m[1], m[2])
	if (!params.has("id")) params.set("id", id)
	if (!params.has("export")) params.set("export", "download")
	if (!params.has("confirm")) params.set("confirm", "t")
	const confirmed = await fetch(`${action}?${params.toString()}`, {
		headers: { "user-agent": BROWSER_UA, ...(cookie ? { cookie } : {}) },
	})
	// Still HTML after the confirm replay = not a file but an error/quota page
	// (e.g. "Quota exceeded"). Surface Drive's own message instead of silently
	// saving the page and later failing with a misleading "no video files".
	if ((confirmed.headers.get("content-type") ?? "").includes("text/html")) {
		const page = await confirmed.text()
		const caption = page
			.match(/uc-(?:error|warning)-(?:caption|subcaption)">([^<]+)</)?.[1]
			?.replace(/&#39;/g, "'")
		throw badRequest(
			`Google Drive did not return a file${caption ? `: ${caption}` : " (quota exceeded, restricted, or the link is not a public file)"}`,
		)
	}
	return confirmed
}

export function extractGofileId(url: string): string | null {
	try {
		const parts = new URL(url).pathname.split("/").filter(Boolean)
		return parts.at(-1) ?? null
	} catch {
		return null
	}
}

interface GofileFile {
	type?: string
	name?: string
	mimetype?: string
	link?: string
	directLink?: string
	children?: unknown
}

function findGofileVideo(value: unknown): GofileFile | null {
	if (!value || typeof value !== "object") return null
	if (Array.isArray(value)) {
		for (const child of value) {
			const found = findGofileVideo(child)
			if (found) return found
		}
		return null
	}
	const item = value as GofileFile
	const link = item.link ?? item.directLink
	const isVideo =
		item.type === "file" &&
		(Boolean(item.mimetype?.startsWith("video/")) ||
			/\.(?:mp4|mkv|webm|mov|m4v)$/i.test(item.name ?? ""))
	if (link && isVideo) return item
	for (const child of Object.values(item)) {
		const found = findGofileVideo(child)
		if (found) return found
	}
	return null
}

async function fetchGofile(
	url: string,
	token: string | undefined,
): Promise<Response> {
	if (!token)
		throw badRequest("GOFILE_API_TOKEN is required for Gofile mirror sources")
	const id = extractGofileId(url)
	if (!id) throw badRequest("Could not parse a Gofile content id from URL")
	const authHeaders = {
		"user-agent": BROWSER_UA,
		authorization: `Bearer ${token}`,
		cookie: `accountToken=${token}`,
	}
	const metadata = await fetch(`https://api.gofile.io/contents/${id}`, {
		headers: authHeaders,
	})
	if (!metadata.ok)
		throw badRequest(`Gofile metadata failed (${metadata.status})`)
	const payload = (await metadata.json()) as unknown
	const file = findGofileVideo(payload)
	const link = file?.link ?? file?.directLink
	if (!link) throw badRequest("Gofile folder contains no supported video file")
	return fetch(link, { headers: authHeaders, redirect: "follow" })
}

async function downloadPlayer(
	url: string,
	dest: string,
	opts: DownloadOptions,
): Promise<DownloadResult> {
	const args = [
		"--no-playlist",
		"--no-progress",
		"--force-overwrites",
		"--format",
		"bestvideo[height<=720]+bestaudio/best[height<=720]/best",
		"--merge-output-format",
		"mp4",
		"--remux-video",
		"mp4",
		"--output",
		dest,
	]
	if (opts.maxBytes) args.push("--max-filesize", String(opts.maxBytes))
	let resolvedUrl = url
	args.push(resolvedUrl)
	try {
		await exec("yt-dlp", args, { maxBuffer: 16 * 1024 * 1024 })
	} catch {
		try {
			const media = await resolveDynamicPlayerUrl(url)
			resolvedUrl = media.url
			args[args.length - 1] = resolvedUrl
			const forwardedHeaders: Record<string, string> = {}
			for (const name of [
				"accept",
				"accept-language",
				"cookie",
				"origin",
				"referer",
				"user-agent",
			]) {
				const value = media.headers[name]
				if (value) {
					forwardedHeaders[name] = value
					args.splice(args.length - 1, 0, "--add-header", `${name}:${value}`)
				}
			}
			// Validate the signed URL with the captured player headers and determine
			// its total size using a one-byte range request before spawning yt-dlp.
			const probe = await fetch(resolvedUrl, {
				headers: { ...forwardedHeaders, range: "bytes=0-0" },
				signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
			})
			await probe.body?.cancel()
			if (probe.status !== 206 && !probe.ok)
				throw new Error(`captured media rejected (${probe.status})`)
			const total = Number(
				probe.headers.get("content-range")?.match(/\/(\d+)$/)?.[1] ??
					probe.headers.get("content-length") ??
					0,
			)
			if (opts.maxBytes && total > opts.maxBytes)
				throw badRequest("Source exceeds the maximum allowed size")
			await exec("yt-dlp", args, {
				maxBuffer: 16 * 1024 * 1024,
				timeout: PLAYER_DOWNLOAD_TIMEOUT_MS,
			})
		} catch (browserError) {
			const browserMessage =
				browserError instanceof Error
					? browserError.message
					: "unknown browser error"
			if (browserMessage.includes("Source exceeds the maximum allowed size"))
				throw browserError
			// Do not persist yt-dlp's full command: it contains the short-lived
			// signed player token and can make job errors excessively large.
			throw badRequest(`Dynamic player extraction failed: ${browserMessage}`)
		}
	}
	const size = (await stat(dest)).size
	if (opts.maxBytes && size > opts.maxBytes)
		throw badRequest("Source exceeds the maximum allowed size")
	opts.onProgress?.(size, size)
	return {
		bytesTotal: size,
		contentDisposition: 'attachment; filename="player-source.mp4"',
		finalUrl: resolvedUrl,
	}
}

/**
 * Stream a remote source to `dest`, never buffering the whole body in memory.
 * Throws if the declared or observed size exceeds `maxBytes`.
 */
export async function downloadToFile(
	sourceType: RemoteUploadSourceType,
	url: string,
	dest: string,
	opts: DownloadOptions = {},
): Promise<DownloadResult> {
	assertHttpUrl(url)
	let sources: ProviderMediaSource[] =
		sourceType === "mirror" ? [] : [{ type: sourceType, url }]
	if (sourceType === "mirror") {
		if (!opts.sourceProvider || !opts.resolveMirror)
			throw badRequest("Mirror source is missing a provider resolver")
		const source = await opts.resolveMirror(opts.sourceProvider, url)
		sources = [source, ...(source.alternatives ?? [])]
	}
	let res: Response | null = null
	let resolvedUrl = url
	let lastError: unknown = null
	for (const [index, source] of sources.entries()) {
		try {
			if (source.type === "player")
				return await downloadPlayer(source.url, dest, opts)
			const candidate =
				source.type === "drive"
					? await fetchDrive(source.url)
					: source.type === "gofile"
						? await fetchGofile(source.url, opts.gofileApiToken)
						: await fetch(source.url, {
								redirect: "follow",
								headers: { "user-agent": BROWSER_UA },
							})
			if (!candidate.ok || !candidate.body)
				throw badRequest(
					`Download failed (${candidate.status} ${candidate.statusText})`,
				)
			const contentType = candidate.headers.get("content-type") ?? ""
			if (
				source.type === "url" &&
				contentType.includes("text/html") &&
				index < sources.length - 1
			) {
				await candidate.body.cancel()
				continue
			}
			res = candidate
			resolvedUrl = source.url
			break
		} catch (err) {
			if (
				err instanceof Error &&
				err.message.includes("Source exceeds the maximum allowed size")
			)
				throw err
			lastError = err
		}
	}
	if (!res) {
		if (lastError) throw lastError
		throw badRequest("No supported mirror source was available")
	}
	if (!res.ok || !res.body)
		throw badRequest(`Download failed (${res.status} ${res.statusText})`)

	const declared = Number(res.headers.get("content-length") ?? 0)
	if (opts.maxBytes && declared > opts.maxBytes)
		throw badRequest("Source exceeds the maximum allowed size")

	let downloaded = 0
	const monitor = new TransformStream<Uint8Array, Uint8Array>({
		transform(chunk, controller) {
			downloaded += chunk.byteLength
			if (opts.maxBytes && downloaded > opts.maxBytes)
				throw badRequest("Source exceeds the maximum allowed size")
			opts.onProgress?.(downloaded, declared)
			controller.enqueue(chunk)
		},
	})

	const stream = res.body.pipeThrough(monitor)
	await pipeline(
		Readable.fromWeb(
			stream as unknown as import("node:stream/web").ReadableStream,
		),
		createWriteStream(dest),
	)
	return {
		bytesTotal: declared || downloaded,
		contentDisposition: res.headers.get("content-disposition"),
		finalUrl: res.url || resolvedUrl,
	}
}
