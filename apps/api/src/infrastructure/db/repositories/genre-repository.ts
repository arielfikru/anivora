import { asc, eq } from "drizzle-orm"

import type { GenreRepository } from "#/domain/catalog/genre-repository.ts"
import type { Db } from "../client.ts"
import * as schema from "../schema.ts"

export function createGenreRepository(db: Db): GenreRepository {
	return {
		async list() {
			return db.select().from(schema.genre).orderBy(asc(schema.genre.name))
		},

		async findById(id) {
			const row = await db
				.select()
				.from(schema.genre)
				.where(eq(schema.genre.id, id))
				.limit(1)
				.then((r) => r[0])
			return row ?? null
		},

		async findOrCreate(name, slug) {
			const inserted = await db
				.insert(schema.genre)
				.values({ id: crypto.randomUUID(), name, slug })
				.onConflictDoNothing({ target: schema.genre.slug })
				.returning()
				.then((rows) => rows[0])
			if (inserted) return inserted
			const existing = await db
				.select()
				.from(schema.genre)
				.where(eq(schema.genre.slug, slug))
				.limit(1)
				.then((rows) => rows[0])
			if (!existing) throw new Error(`Could not create genre: ${slug}`)
			return existing
		},

		async setForAnime(animeId, genreIds) {
			await db
				.delete(schema.animeGenre)
				.where(eq(schema.animeGenre.animeId, animeId))
			if (genreIds.length === 0) return
			await db
				.insert(schema.animeGenre)
				.values(genreIds.map((genreId) => ({ animeId, genreId })))
				.onConflictDoNothing()
		},

		async slugExists(slug) {
			const row = await db
				.select({ id: schema.genre.id })
				.from(schema.genre)
				.where(eq(schema.genre.slug, slug))
				.limit(1)
				.then((r) => r[0])
			return Boolean(row)
		},

		async create(data) {
			const row = await db
				.insert(schema.genre)
				.values({ id: crypto.randomUUID(), ...data })
				.returning()
				.then((r) => r[0])
			return row
		},

		async delete(id) {
			const rows = await db
				.delete(schema.genre)
				.where(eq(schema.genre.id, id))
				.returning({ id: schema.genre.id })
			return rows.length > 0
		},
	}
}
