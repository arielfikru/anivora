import { and, asc, eq, inArray } from "drizzle-orm"

import type { EpisodeRepository } from "#/domain/catalog/episode-repository.ts"
import type { PublicEpisode } from "#/domain/catalog/episode.ts"
import type { Db } from "../client.ts"
import * as schema from "../schema.ts"
import { toEpisode } from "./episode-mapper.ts"

const PUBLIC_STATUSES = ["ready", "published"]

export function createEpisodeRepository(db: Db): EpisodeRepository {
	return {
		async listBySeason(seasonId) {
			const rows = await db
				.select()
				.from(schema.episode)
				.where(eq(schema.episode.seasonId, seasonId))
				.orderBy(asc(schema.episode.episodeNumber))
			return rows.map(toEpisode)
		},

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

		async attachVideo(id, data) {
			const set: Record<string, unknown> = {
				storageProvider: data.storageProvider,
				mp4Url: data.mp4Url ?? null,
				hlsUrl: data.hlsUrl ?? null,
				status: data.status,
				updatedAt: new Date(),
			}
			if (data.thumbnailUrl !== undefined) set.thumbnailUrl = data.thumbnailUrl
			if (data.publishedAt !== undefined) set.publishedAt = data.publishedAt
			const row = await db
				.update(schema.episode)
				.set(set)
				.where(eq(schema.episode.id, id))
				.returning()
				.then((r) => r[0])
			return row ? toEpisode(row) : null
		},

		async setStatus(id, status, publishedAt) {
			const set: Record<string, unknown> = { status, updatedAt: new Date() }
			if (publishedAt !== undefined) set.publishedAt = publishedAt
			const row = await db
				.update(schema.episode)
				.set(set)
				.where(eq(schema.episode.id, id))
				.returning()
				.then((r) => r[0])
			return row ? toEpisode(row) : null
		},

		async listByStatus(statuses) {
			const rows = await db
				.select()
				.from(schema.episode)
				.where(inArray(schema.episode.status, statuses))
			return rows.map(toEpisode)
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
