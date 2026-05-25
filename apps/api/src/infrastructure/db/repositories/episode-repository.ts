import { and, asc, eq, inArray } from "drizzle-orm"

import type { EpisodeRepository } from "#/domain/catalog/episode-repository.ts"
import type { PublicEpisode } from "#/domain/catalog/episode.ts"
import type { Db } from "../client.ts"
import * as schema from "../schema.ts"
import { toEpisode } from "./episode-mapper.ts"

const PUBLIC_STATUSES = ["ready", "published"]

export function createEpisodeRepository(db: Db): EpisodeRepository {
	return {
		async listPublicBySeason(seasonId): Promise<PublicEpisode[]> {
			return db
				.select({
					id: schema.episode.id,
					episodeNumber: schema.episode.episodeNumber,
					episodeCode: schema.episode.episodeCode,
					title: schema.episode.title,
					slug: schema.episode.slug,
					durationSeconds: schema.episode.durationSeconds,
					thumbnailUrl: schema.episode.thumbnailUrl,
					status: schema.episode.status,
				})
				.from(schema.episode)
				.where(
					and(
						eq(schema.episode.seasonId, seasonId),
						inArray(schema.episode.status, PUBLIC_STATUSES),
					),
				)
				.orderBy(asc(schema.episode.episodeNumber))
		},

		async findPublicBySlug(slug) {
			const row = await db
				.select()
				.from(schema.episode)
				.where(
					and(
						eq(schema.episode.slug, slug),
						inArray(schema.episode.status, PUBLIC_STATUSES),
					),
				)
				.limit(1)
				.then((r) => r[0])
			return row ? toEpisode(row) : null
		},

		async findById(id) {
			const row = await db
				.select()
				.from(schema.episode)
				.where(eq(schema.episode.id, id))
				.limit(1)
				.then((r) => r[0])
			return row ? toEpisode(row) : null
		},

		async slugExists(slug) {
			const row = await db
				.select({ id: schema.episode.id })
				.from(schema.episode)
				.where(eq(schema.episode.slug, slug))
				.limit(1)
				.then((r) => r[0])
			return Boolean(row)
		},

		async create(data) {
			const row = await db
				.insert(schema.episode)
				.values({ id: crypto.randomUUID(), ...data })
				.returning()
				.then((r) => r[0])
			return toEpisode(row)
		},

		async update(id, data) {
			const row = await db
				.update(schema.episode)
				.set({ ...data, updatedAt: new Date() })
				.where(eq(schema.episode.id, id))
				.returning()
				.then((r) => r[0])
			return row ? toEpisode(row) : null
		},

		async delete(id) {
			const rows = await db
				.delete(schema.episode)
				.where(eq(schema.episode.id, id))
				.returning({ id: schema.episode.id })
			return rows.length > 0
		},
	}
}
