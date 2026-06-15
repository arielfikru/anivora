import type { Readable } from "node:stream"

/**
 * S3-compatible object storage (Cloudflare R2). The bucket is fronted by a
 * public CDN domain, so `publicUrl(key)` is the playable URL handed to the
 * browser — no signing in Phase 1.
 */
export interface ObjectStorage {
	/**
	 * Streams a body of known size to `key` using multipart upload, so GB-scale
	 * videos never buffer fully in memory. `body` is consumed once.
	 */
	putStream(
		key: string,
		body: Readable,
		size: number,
		contentType: string,
	): Promise<void>
	/** Uploads in-memory bytes to `key` (small files, e.g. direct admin upload). */
	putBytes(key: string, body: Uint8Array, contentType: string): Promise<void>
	/** Public, CDN-served URL for an object key. */
	publicUrl(key: string): string
}
