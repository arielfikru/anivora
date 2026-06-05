import { createWriteStream } from "node:fs"
import { Readable } from "node:stream"
import { pipeline } from "node:stream/promises"

import type { RemoteUploadSourceType } from "#/domain/upload/remote-upload-job.ts"
import { badRequest } from "../../shared/errors.ts"

const BROWSER_UA =
	"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"

export interface DownloadResult {
	bytesTotal: number
	contentDisposition: string | null
}

export interface DownloadOptions {
	maxBytes?: number
	onProgress?: (bytesDownloaded: number, bytesTotal: number) => void
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
	return confirmed
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
	const res =
		sourceType === "drive"
			? await fetchDrive(url)
			: await fetch(url, {
					redirect: "follow",
					headers: { "user-agent": BROWSER_UA },
				})
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
	}
}
