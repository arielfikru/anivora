import { readdir, stat } from "node:fs/promises"
import { join, relative } from "node:path"

const VIDEO_EXT = new Set([
	".mp4",
	".mkv",
	".mov",
	".webm",
	".avi",
	".m4v",
	".ts",
])

export interface ScannedFile {
	relPath: string
	sizeBytes: number
	suggestedNumber: number | null
}

/**
 * Detect an episode number from a filename. Ported from the Colab notebook
 * (`tools/anivora_bulk_upload.ipynb`, cell 7): first try an explicit
 * "Ep/Episode NN" marker, then fall back to the last standalone 1–3 digit run.
 */
export function episodeNumber(name: string): number | null {
	// Drop the file extension so its digits (e.g. "mp4") never leak in.
	const base = name.replace(/\.[^.]+$/, "")
	const marker = base.match(/[Ee]p?(?:isode)?[ ._-]?(\d{1,3})/)
	if (marker) return Number.parseInt(marker[1], 10)
	const loose = base.match(/(?<!\d)(\d{1,3})(?!\d)/)
	return loose ? Number.parseInt(loose[1], 10) : null
}

function hasVideoExt(name: string): boolean {
	const dot = name.lastIndexOf(".")
	if (dot < 0) return false
	return VIDEO_EXT.has(name.slice(dot).toLowerCase())
}

/** Natural sort key so "E2" sorts before "E10". */
function naturalKey(s: string): Array<string | number> {
	return s
		.split(/(\d+)/)
		.map((t) => (/^\d+$/.test(t) ? Number.parseInt(t, 10) : t.toLowerCase()))
}

function compareNatural(a: string, b: string): number {
	const ka = naturalKey(a)
	const kb = naturalKey(b)
	for (let i = 0; i < Math.min(ka.length, kb.length); i++) {
		const x = ka[i]
		const y = kb[i]
		if (x === y) continue
		if (typeof x === "number" && typeof y === "number") return x - y
		return String(x) < String(y) ? -1 : 1
	}
	return ka.length - kb.length
}

async function walk(dir: string): Promise<string[]> {
	const out: string[] = []
	const entries = await readdir(dir, { withFileTypes: true })
	for (const entry of entries) {
		const full = join(dir, entry.name)
		if (entry.isDirectory()) out.push(...(await walk(full)))
		else if (entry.isFile() && hasVideoExt(entry.name)) out.push(full)
	}
	return out
}

/**
 * Recursively find video files under `root`, sorted naturally. Each result's
 * `suggestedNumber` is the filename-detected episode number, or the 1-based
 * ordinal when none is detected (same fallback as the notebook).
 */
export async function scanVideoFiles(root: string): Promise<ScannedFile[]> {
	const paths = (await walk(root)).sort(compareNatural)
	const files: ScannedFile[] = []
	for (let i = 0; i < paths.length; i++) {
		const relPath = relative(root, paths[i])
		const size = (await stat(paths[i])).size
		const detected = episodeNumber(relPath.split("/").pop() ?? relPath)
		files.push({
			relPath,
			sizeBytes: size,
			suggestedNumber: detected ?? i + 1,
		})
	}
	return files
}
