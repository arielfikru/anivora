import type { Hono } from "hono"

import type { UseCases } from "#/application/use-cases.ts"
import type { AuthService } from "#/domain/ports/auth-service.ts"
import { logger } from "#/infrastructure/observability/logger.ts"

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024 * 1024

export interface BunnyRoutesDeps {
	auth: AuthService
	useCases: UseCases
	webhookSecret?: string
}

async function readUploadFile(file: File): Promise<Uint8Array> {
	return new Uint8Array(await file.arrayBuffer())
}

export function registerBunnyRoutes(app: Hono, deps: BunnyRoutesDeps): void {
	registerUploadRoute(app, deps)
	registerWebhookRoute(app, deps)
}

function registerUploadRoute(app: Hono, deps: BunnyRoutesDeps): void {
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

function registerWebhookRoute(app: Hono, deps: BunnyRoutesDeps): void {
	app.post("/api/webhooks/bunny", async (c) => {
		if (!isWebhookAuthorized(c.req.raw, deps.webhookSecret))
			return c.json({ error: "Forbidden" }, 403)
		try {
			const body = (await c.req.json()) as { VideoGuid: string; Status: number }
			await deps.useCases.episode.handleWebhook({
				videoGuid: body.VideoGuid,
				status: body.Status,
			})
		} catch (err) {
			logger.error({ err }, "bunny webhook handling failed")
		}
		return c.json({ ok: true })
	})
}

function isWebhookAuthorized(req: Request, secret?: string): boolean {
	if (!secret) return true
	const url = new URL(req.url)
	const provided =
		url.searchParams.get("secret") ?? req.headers.get("x-webhook-secret")
	return provided === secret
}
