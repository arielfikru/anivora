import { mkdir, writeFile } from "node:fs/promises"
import { extname, join, resolve } from "node:path"

import type { Hono } from "hono"
import { serveStatic } from "@hono/node-server/serve-static"

import type { AuthService } from "#/domain/ports/auth-service.ts"
import { logger } from "#/infrastructure/observability/logger.ts"

const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const ALLOWED_EXT: Record<string, string> = {
	"image/jpeg": ".jpg",
	"image/png": ".png",
	"image/webp": ".webp",
	"image/gif": ".gif",
	"image/avif": ".avif",
}

export interface ImageRoutesDeps {
	auth: AuthService
	uploadDir: string
}

export function registerImageRoutes(app: Hono, deps: ImageRoutesDeps): void {
	const dir = resolve(deps.uploadDir)
	registerUploadRoute(app, deps, dir)
	app.use("/uploads/*", serveStatic({ root: dir, rewriteRequestPath: strip }))
}

function strip(path: string): string {
	return path.replace(/^\/uploads/, "")
}

function registerUploadRoute(app: Hono, deps: ImageRoutesDeps, dir: string) {
	app.post("/api/admin/uploads/image", async (c) => {
		const session = await deps.auth.getSession(c.req.raw.headers)
		if (!session) return c.json({ error: "Unauthorized" }, 401)
		if (session.user.role !== "admin")
			return c.json({ error: "Forbidden" }, 403)
		const file = (await c.req.parseBody()).file
		if (!(file instanceof File)) return c.json({ error: "Missing file" }, 400)
		const ext = ALLOWED_EXT[file.type]
		if (!ext) return c.json({ error: "File must be an image" }, 400)
		if (file.size > MAX_IMAGE_BYTES)
			return c.json({ error: "Image too large (max 10MB)" }, 413)
		return c.json({ url: await store(dir, file, ext) })
	})
}

async function store(dir: string, file: File, ext: string): Promise<string> {
	await mkdir(dir, { recursive: true })
	const name = `${crypto.randomUUID()}${ext || extname(file.name)}`
	const bytes = new Uint8Array(await file.arrayBuffer())
	await writeFile(join(dir, name), bytes)
	logger.info({ name, size: bytes.byteLength }, "image uploaded")
	return `/uploads/${name}`
}
