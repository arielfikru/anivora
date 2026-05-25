import Redis from "ioredis"

import type { Cache } from "#/domain/ports/cache.ts"
import { logger } from "#/infrastructure/observability/logger.ts"

export function createRedisCache(url: string): Cache {
	let _redis: Redis | null = null

	const getClient = (): Redis => {
		if (!_redis) {
			_redis = new Redis(url, {
				maxRetriesPerRequest: 2,
				enableOfflineQueue: false,
				lazyConnect: true,
			})
			_redis.on("error", (err) => {
				logger.warn({ err: err.message }, "redis error")
			})
		}
		return _redis
	}

	return {
		async get<T>(key: string) {
			try {
				const val = await getClient().get(key)
				return val ? (JSON.parse(val) as T) : null
			} catch {
				return null
			}
		},

		async set(key, value, ttlSeconds) {
			try {
				await getClient().set(key, JSON.stringify(value), "EX", ttlSeconds)
			} catch {}
		},

		async del(...keys) {
			try {
				if (keys.length) await getClient().del(...keys)
			} catch {}
		},

		async delPattern(pattern) {
			try {
				const redis = getClient()
				let cursor = "0"
				do {
					const [next, keys] = await redis.scan(
						cursor,
						"MATCH",
						pattern,
						"COUNT",
						100,
					)
					cursor = next
					if (keys.length) await redis.del(...keys)
				} while (cursor !== "0")
			} catch {}
		},

		async ping() {
			try {
				const result = await getClient().ping()
				return result === "PONG"
			} catch {
				return false
			}
		},
	}
}
