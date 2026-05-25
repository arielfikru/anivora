import { and, asc, eq } from "drizzle-orm"

import type { CatalogStatus } from "#/domain/catalog/anime.ts"
import type { Season } from "#/domain/catalog/season.ts"
import type { SeasonRepository } from "#/domain/catalog/season-repository.ts"
import type { Db } from "../client.ts"
import * as schema from "../schema.ts"

type SeasonRow = typeof schema.season.$inferSelect

function toSeason(row: SeasonRow): Season {
	return {
		id: row.id,
		animeId: row.animeId,
		seasonNumber: row.seasonNumber,
		title: row.title,
		description: row.description,
		releaseYear: row.releaseYear,
		status: row.status as CatalogStatus,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
	}
}

export function createSeasonRepository(db: Db): SeasonRepository {
	return {
		async listPublishedByAnime(animeId) {
			const rows = await db
				.select()
				.from(schema.season)
				.where(
					and(
						eq(schema.season.animeId, animeId),
						eq(schema.season.status, "published"),
					),
				)
				.orderBy(asc(schema.season.seasonNumber))
			return rows.map(toSeason)
		},

		async findById(id) {
			const row = await db
				.select()
				.from(schema.season)
				.where(eq(schema.season.id, id))
				.limit(1)
				.then((r) => r[0])
			return row ? toSeason(row) : null
		},

		async create(data) {
			const row = await db
				.insert(schema.season)
				.values({ id: crypto.randomUUID(), ...data })
				.returning()
				.then((r) => r[0])
			return toSeason(row)
		},

		async update(id, data) {
			const row = await db
				.update(schema.season)
				.set({ ...data, updatedAt: new Date() })
				.where(eq(schema.season.id, id))
				.returning()
				.then((r) => r[0])
			return row ? toSeason(row) : null
		},

		async delete(id) {
			const rows = await db
				.delete(schema.season)
				.where(eq(schema.season.id, id))
				.returning({ id: schema.season.id })
			return rows.length > 0
		},
	}
}
