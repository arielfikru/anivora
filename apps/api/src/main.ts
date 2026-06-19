import "#/polyfill"

import { readFile } from "node:fs/promises"
import { resolve } from "node:path"

import { serve } from "@hono/node-server"
import { serveStatic } from "@hono/node-server/serve-static"
import { SmartCoercionPlugin } from "@orpc/json-schema"
import { OpenAPIHandler } from "@orpc/openapi/fetch"
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins"
import { onError } from "@orpc/server"
import { RPCHandler } from "@orpc/server/fetch"
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4"
import { sql } from "drizzle-orm"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { requestId } from "hono/request-id"
import { buildUseCases } from "#/application/use-cases.ts"
import { createAuthService } from "#/infrastructure/auth/auth-service.ts"
import { buildAuth } from "#/infrastructure/auth/better-auth.ts"
import { createRedisCache } from "#/infrastructure/cache/redis.ts"
import { createR2Storage } from "#/infrastructure/r2/r2-service.ts"
import { env } from "#/infrastructure/config/env.ts"
import { createDb } from "#/infrastructure/db/client.ts"
import { logger } from "#/infrastructure/observability/logger.ts"
import { createActivityRepository } from "#/infrastructure/db/repositories/activity-repository.ts"
import { createAnimeRepository } from "#/infrastructure/db/repositories/anime-repository.ts"
import { createEpisodeRepository } from "#/infrastructure/db/repositories/episode-repository.ts"
import { createGenreRepository } from "#/infrastructure/db/repositories/genre-repository.ts"
import { createRemoteUploadJobRepository } from "#/infrastructure/db/repositories/remote-upload-job-repository.ts"
import { createSeasonRepository } from "#/infrastructure/db/repositories/season-repository.ts"
import { createUserRepository } from "#/infrastructure/db/repositories/user-repository.ts"
import { registerEpisodeUploadRoutes } from "#/presentation/http/episode-upload-routes.ts"
import { registerImageRoutes } from "#/presentation/http/image-routes.ts"
import { registerSitemapRoutes } from "#/presentation/http/sitemap-routes.ts"
import { startRemoteUploadWorker } from "#/presentation/http/remote-upload-worker.ts"
import { buildRouter } from "#/presentation/routers/index.ts"

const db = createDb(env.DATABASE_URL)

const activityRepo = createActivityRepository(db)
const userRepo = createUserRepository(db)
const animeRepo = createAnimeRepository(db)
const seasonRepo = createSeasonRepository(db)
const episodeRepo = createEpisodeRepository(db)
const genreRepo = createGenreRepository(db)
const remoteJobRepo = createRemoteUploadJobRepository(db)

const cache = createRedisCache(env.REDIS_URL)

const betterAuthInstance = buildAuth({ db, activityRepo })
const auth = createAuthService(betterAuthInstance)

const objectStorage = createR2Storage({
	accountId: env.R2_ACCOUNT_ID,
	accessKeyId: env.R2_ACCESS_KEY_ID,
	secretAccessKey: env.R2_SECRET_ACCESS_KEY,
	bucket: env.R2_BUCKET,
	publicUrl: env.R2_PUBLIC_URL,
})

const useCases = buildUseCases({
	userRepo,
	activityRepo,
	animeRepo,
	seasonRepo,
	episodeRepo,
	genreRepo,
	remoteJobRepo,
	cache,
	auth,
	objectStorage,
	uploadWorkDir: env.UPLOAD_WORK_DIR,
	remoteUploadMaxBytes: env.REMOTE_UPLOAD_MAX_BYTES,
})

const router = buildRouter(useCases)

const app = new Hono()

const WEB_ORIGIN = env.WEB_ORIGIN

app.use("*", requestId())

app.use("*", async (c, next) => {
	const reqId = c.get("requestId")
	const start = Date.now()
	await next()
	logger.info(
		{
			reqId,
			method: c.req.method,
			path: c.req.path,
			status: c.res.status,
			durMs: Date.now() - start,
		},
		"request",
	)
})

app.use(
	"*",
	cors({
		origin: WEB_ORIGIN,
		credentials: true,
		allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
		allowHeaders: ["Content-Type", "Authorization"],
	}),
)

app.get("/healthz", (c) => c.text("ok"))

app.get("/ready", async (c) => {
	const dbCheck = await db
		.execute(sql`select 1`)
		.then(() => true)
		.catch(() => false)
	const redisCheck = await cache.ping()
	const ok = dbCheck && redisCheck
	return c.json(
		{
			status: ok ? "ready" : "unready",
			checks: { db: dbCheck, redis: redisCheck },
		},
		ok ? 200 : 503,
	)
})

app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw))

registerEpisodeUploadRoutes(app, { auth, useCases })

registerImageRoutes(app, { auth, uploadDir: env.UPLOAD_DIR })

registerSitemapRoutes(app, { animeRepo, webOrigin: WEB_ORIGIN })

// Same-origin video proxy for legacy smart-TV browsers. Old TV WebKit loads the
// site fine but its dated TLS stack often can't reach the cross-origin R2 public
// host (pub-*.r2.dev) directly, so the <video> stays black at 0:00. Streaming the
// episode mp4 through our own origin sidesteps that. Range is forwarded so the TV
// can seek and start playing mid-download.
app.on(["GET", "HEAD"], "/v/:slug", async (c) => {
	const slug = c.req.param("slug")
	const episode = await episodeRepo.findPublicBySlug(slug)
	const src = episode?.mp4Url ?? episode?.playbackUrl
	if (!src) return c.notFound()
	const range = c.req.header("range")
	const upstream = await fetch(src, {
		method: c.req.method,
		headers: range ? { range } : {},
	})
	const headers = new Headers()
	for (const h of [
		"content-type",
		"content-length",
		"content-range",
		"accept-ranges",
		"etag",
		"last-modified",
	]) {
		const v = upstream.headers.get(h)
		if (v) headers.set(h, v)
	}
	if (!headers.has("content-type")) headers.set("content-type", "video/mp4")
	if (!headers.has("accept-ranges")) headers.set("accept-ranges", "bytes")
	headers.set("cache-control", "public, max-age=3600")
	return new Response(c.req.method === "HEAD" ? null : upstream.body, {
		status: upstream.status,
		headers,
	})
})

const buildContext = async (headers: Headers) => {
	const session = await auth.getSession(headers)
	return { headers, session, useCases }
}

const rpcHandler = new RPCHandler(router)
app.all("/rpc/*", async (c) => {
	const { matched, response } = await rpcHandler.handle(c.req.raw, {
		prefix: "/rpc",
		context: await buildContext(c.req.raw.headers),
	})
	return matched && response ? response : c.notFound()
})

const openApiHandler = new OpenAPIHandler(router, {
	interceptors: [
		onError((error) => {
			logger.error({ err: error }, "orpc openapi error")
		}),
	],
	plugins: [
		new SmartCoercionPlugin({
			schemaConverters: [new ZodToJsonSchemaConverter()],
		}),
		new OpenAPIReferencePlugin({
			schemaConverters: [new ZodToJsonSchemaConverter()],
			specGenerateOptions: {
				info: {
					title: "Anivora API",
					version: "1.0.0",
				},
				security: [{ bearerAuth: [] }],
				components: {
					securitySchemes: {
						bearerAuth: {
							type: "http",
							scheme: "bearer",
						},
					},
				},
			},
			docsConfig: {
				authentication: {
					securitySchemes: {
						bearerAuth: {
							token: "default-token",
						},
					},
				},
			},
		}),
	],
})

app.all("/api/*", async (c) => {
	const { matched, response } = await openApiHandler.handle(c.req.raw, {
		prefix: "/api",
		context: await buildContext(c.req.raw.headers),
	})
	return matched && response ? response : c.notFound()
})

const webDistPath = env.WEB_DIST_PATH
if (webDistPath) {
	const absDist = resolve(webDistPath)
	const indexHtmlPath = resolve(absDist, "index.html")
	const chooserHtmlPath = resolve(absDist, "choose.html")
	// SPA assets are built with vite base "/app/" → strip it back to disk paths.
	const stripApp = (p: string) => {
		const rest = p.replace(/^\/app/, "")
		return rest === "" ? "/" : rest
	}

	// Bare root serves the static device chooser (modern vs TV/legacy).
	app.get("/", async (c) => {
		try {
			return c.html(await readFile(chooserHtmlPath, "utf8"))
		} catch {
			return c.notFound()
		}
	})

	// Modern SPA lives under /app: assets first, then the shell for deep links.
	app.use(
		"/app/*",
		serveStatic({ root: absDist, rewriteRequestPath: stripApp }),
	)
	app.get("/app", (c) => c.redirect("/app/"))
	app.get("/app/*", async (c) => {
		try {
			return c.html(await readFile(indexHtmlPath, "utf8"))
		} catch {
			return c.notFound()
		}
	})

	// Root-level static files: tv.html, choose assets, images, robots, etc.
	app.use("/*", serveStatic({ root: absDist }))

	// Unknown paths fall back to the chooser.
	app.get("*", (c) => c.redirect("/"))
}

const port = env.PORT

serve({ fetch: app.fetch, port }, () => {
	logger.info({ port, webOrigin: WEB_ORIGIN }, "api listening")
})

if (env.NODE_ENV !== "test") {
	startRemoteUploadWorker(useCases)
}
