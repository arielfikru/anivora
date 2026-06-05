import { execFile } from "node:child_process"
import { open } from "node:fs/promises"
import { promisify } from "node:util"

import { badRequest } from "../../shared/errors.ts"

const exec = promisify(execFile)

export type ArchiveType = "zip" | "rar" | null

/** Detect an archive by its magic bytes (extension is not trusted). */
export async function detectArchiveType(path: string): Promise<ArchiveType> {
	const fh = await open(path, "r")
	try {
		const buf = Buffer.alloc(8)
		await fh.read(buf, 0, 8, 0)
		// PK\x03\x04 / PK\x05\x06 / PK\x07\x08
		if (buf[0] === 0x50 && buf[1] === 0x4b) return "zip"
		// "Rar!\x1A\x07"
		if (
			buf[0] === 0x52 &&
			buf[1] === 0x61 &&
			buf[2] === 0x72 &&
			buf[3] === 0x21
		)
			return "rar"
		return null
	} finally {
		await fh.close()
	}
}

/**
 * Extract `archivePath` into `destDir` using `bsdtar` (libarchive) shipped in
 * the runtime image. libarchive reads both zip and rar (incl. RAR5) — Alpine's
 * `7zip`/`p7zip` builds carry no rar codec, so they cannot. Returns the type.
 */
export async function extractArchive(
	archivePath: string,
	destDir: string,
): Promise<ArchiveType> {
	const type = await detectArchiveType(archivePath)
	if (!type) throw badRequest("Unsupported archive format (only zip and rar)")
	await exec("bsdtar", ["-x", "-f", archivePath, "-C", destDir], {
		maxBuffer: 16 * 1024 * 1024,
	})
	return type
}
