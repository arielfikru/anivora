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
import { createBunnyService } from "#/infrastructure/bunny/bunny-service.ts"
import { buildAuth } from "#/infrastructure/auth/better-auth.ts"
import { createRedisCache } from "#/infrastructure/cache/redis.ts"
import { env } from "#/infrastructure/config/env.ts"
import { createDb } from "#/infrastructure/db/client.ts"
import { logger } from "#/infrastructure/observability/logger.ts"
import { createActivityRepository } from "#/infrastructure/db/repositories/activity-repository.ts"
import { createAnimeRepository } from "#/infrastructure/db/repositories/anime-repository.ts"
import { createEpisodeRepository } from "#/infrastructure/db/repositories/episode-repository.ts"
import { createGenreRepository } from "#/infrastructure/db/repositories/genre-repository.ts"
import { createSeasonRepository } from "#/infrastructure/db/repositories/season-repository.ts"
import { createUserRepository } from "#/infrastructure/db/repositories/user-repository.ts"
import { registerBunnyRoutes } from "#/presentation/http/bunny-routes.ts"
import { startEpisodePoller } from "#/presentation/http/episode-poller.ts"
import { buildRouter } from "#/presentation/routers/index.ts"

const db = createDb(env.DATABASE_URL)

const activityRepo = createActivityRepository(db)
const userRepo = createUserRepository(db)
const animeRepo = createAnimeRepository(db)
const seasonRepo = createSeasonRepository(db)
const episodeRepo = createEpisodeRepository(db)
const genreRepo = createGenreRepository(db)

const cache = createRedisCache(env.REDIS_URL)

const betterAuthInstance = buildAuth({ db, activityRepo })
const auth = createAuthService(betterAuthInstance)

const bunny = createBunnyService({
	libraryId: env.BUNNY_STREAM_LIBRARY_ID,
	apiKey: env.BUNNY_STREAM_API_KEY,
	baseUrl: env.BUNNY_STREAM_BASE_URL,
	cdnHostname: env.BUNNY_STREAM_CDN_HOSTNAME,
})

const useCases = buildUseCases({
	userRepo,
	activityRepo,
	animeRepo,
	seasonRepo,
	episodeRepo,
	genreRepo,
	cache,
	auth,
	bunny,
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

registerBunnyRoutes(app, {
	auth,
	useCases,
	webhookSecret: env.WEBHOOK_SECRET,
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
					title: "SaaS Boilerplate API",
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
	app.use("/assets/*", serveStatic({ root: absDist }))
	app.use("/*", serveStatic({ root: absDist }))
	app.get("*", async (c) => {
		try {
			const html = await readFile(indexHtmlPath, "utf8")
			return c.html(html)
		} catch {
			return c.notFound()
		}
	})
}

const port = env.PORT

serve({ fetch: app.fetch, port }, () => {
	logger.info({ port, webOrigin: WEB_ORIGIN }, "api listening")
})

if (env.NODE_ENV !== "test") {
	startEpisodePoller(useCases)
}
