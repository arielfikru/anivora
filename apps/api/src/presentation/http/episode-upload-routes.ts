import type { Hono } from "hono"

import type { UseCases } from "#/application/use-cases.ts"
import type { AuthService } from "#/domain/ports/auth-service.ts"

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024 * 1024

export interface EpisodeUploadRoutesDeps {
	auth: AuthService
	useCases: UseCases
}

async function readUploadFile(file: File): Promise<Uint8Array> {
	return new Uint8Array(await file.arrayBuffer())
}

/**
 * Server-side episode upload: the browser POSTs the raw video file here, the
 * server transcodes to mp4 and stores it in R2. (Note: this passes through the
 * origin, so it's bound by any reverse-proxy request-body cap — large files
 * should use remote upload from a URL/Drive instead.)
 */
export function registerEpisodeUploadRoutes(
	app: Hono,
	deps: EpisodeUploadRoutesDeps,
): void {
	app.post("/api/admin/episodes/:id/upload", async (c) => {
		const session = await deps.auth.getSession(c.req.raw.headers)
		if (!session) return c.json({ error: "Unauthorized" }, 401)
		if (session.user.role !== "admin")
			return c.json({ error: "Forbidden" }, 403)
		const body = await c.req.parseBody()
		const file = body.file
		if (!(file instanceof File)) return c.json({ error: "Missing file" }, 400)
		if (!file.type.startsWith("video/"))
			return c.json({ error: "File must be a video" }, 400)
		if (file.size > MAX_UPLOAD_BYTES)
			return c.json({ error: "File too large" }, 413)
		const result = await deps.useCases.episode.uploadVideo(
			{
				episodeId: c.req.param("id"),
				filename: file.name,
				file: await readUploadFile(file),
			},
			{ session, headers: c.req.raw.headers },
		)
		return c.json(result.episode)
	})
}
