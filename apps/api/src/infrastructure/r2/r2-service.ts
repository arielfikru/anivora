import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { Upload } from "@aws-sdk/lib-storage"

import type { ObjectStorage } from "#/domain/ports/object-storage.ts"

export interface R2Config {
	accountId: string
	accessKeyId: string
	secretAccessKey: string
	bucket: string
	/** Public CDN base URL, no trailing slash. */
	publicUrl: string
}

export function createR2Storage(config: R2Config): ObjectStorage {
	const client = new S3Client({
		region: "auto",
		endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
		credentials: {
			accessKeyId: config.accessKeyId,
			secretAccessKey: config.secretAccessKey,
		},
	})
	const base = config.publicUrl.replace(/\/+$/, "")

	return {
		// `size` is part of the port contract (single-PUT impls need it) but
		// lib-storage derives part sizing from the stream itself, so it's unused
		// here.
		async putStream(key, body, _size, contentType) {
			const upload = new Upload({
				client,
				params: {
					Bucket: config.bucket,
					Key: key,
					Body: body,
					ContentType: contentType,
				},
			})
			await upload.done()
		},

		async putBytes(key, body, contentType) {
			await client.send(
				new PutObjectCommand({
					Bucket: config.bucket,
					Key: key,
					Body: body,
					ContentType: contentType,
				}),
			)
		},

		publicUrl(key) {
			return `${base}/${key.replace(/^\/+/, "")}`
		},
	}
}
