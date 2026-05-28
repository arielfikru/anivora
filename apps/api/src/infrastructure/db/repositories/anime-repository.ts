import { and, desc, eq, ilike, inArray, ne, sql } from "drizzle-orm"

import type { AnimeListFilters, AnimeListItem } from "#/domain/catalog/anime.ts"
import type { AnimeRepository } from "#/domain/catalog/anime-repository.ts"
import type { Db } from "../client.ts"
import * as schema from "../schema.ts"
import { toAnime } from "./anime-mapper.ts"

// Thumbnail of the lowest-numbered episode that has one — used as a fallback
// cover/banner when the anime has no artwork of its own.
const firstEpisodeThumb = sql<string | null>`(
	select ${schema.episode.thumbnailUrl}
	from ${schema.episode}
	where ${schema.episode.animeId} = ${schema.anime.id}
		and ${schema.episode.thumbnailUrl} is not null
	order by ${schema.episode.episodeNumber} asc
	limit 1
)`

const listColumns = {
	id: schema.anime.id,
	title: schema.anime.title,
	slug: schema.anime.slug,
	coverImageUrl: sql<
		string | null
	>`coalesce(${schema.anime.coverImageUrl}, ${firstEpisodeThumb})`.as(
		"coverImageUrl",
	),
	bannerImageUrl: sql<
		string | null
	>`coalesce(${schema.anime.bannerImageUrl}, ${firstEpisodeThumb})`.as(
		"bannerImageUrl",
	),
	status: schema.anime.status,
	releaseYear: schema.anime.releaseYear,
	contentRating: schema.anime.contentRating,
}

function publishedListQuery(db: Db, filters: AnimeListFilters) {
	const conditions = [eq(schema.anime.status, "published")]
	if (filters.search) {
		conditions.push(ilike(schema.anime.title, `%${filters.search}%`))
	}
	const base = db.select(listColumns).from(schema.anime)
	if (filters.genreSlug) {
		return base
			.innerJoin(
				schema.animeGenre,
				eq(schema.animeGenre.animeId, schema.anime.id),
			)
			.innerJoin(schema.genre, eq(schema.genre.id, schema.animeGenre.genreId))
			.where(and(...conditions, eq(schema.genre.slug, filters.genreSlug)))
	}
	return base.where(and(...conditions))
}

export function createAnimeRepository(db: Db): AnimeRepository {
	return {
		async listAll(): Promise<AnimeListItem[]> {
			return db
				.select(listColumns)
				.from(schema.anime)
				.orderBy(desc(schema.anime.createdAt))
		},

		async listPublished(filters): Promise<AnimeListItem[]> {
			return publishedListQuery(db, filters)
				.orderBy(desc(schema.anime.createdAt))
				.limit(filters.limit)
				.offset(filters.offset)
		},

		async listRelated(animeId, limit): Promise<AnimeListItem[]> {
			// Genres of the target anime.
			const targetGenres = db
				.select({ genreId: schema.animeGenre.genreId })
				.from(schema.animeGenre)
				.where(eq(schema.animeGenre.animeId, animeId))
			// Other published anime that share at least one of those genres,
			// ranked by how many genres they share, then recency.
			const sharedGenres = sql<number>`count(${schema.animeGenre.genreId})`
			return db
				.select(listColumns)
				.from(schema.anime)
				.innerJoin(
					schema.animeGenre,
					eq(schema.animeGenre.animeId, schema.anime.id),
				)
				.where(
					and(
						eq(schema.anime.status, "published"),
						ne(schema.anime.id, animeId),
						inArray(schema.animeGenre.genreId, targetGenres),
					),
				)
				.groupBy(schema.anime.id)
				.orderBy(desc(sharedGenres), desc(schema.anime.createdAt))
				.limit(limit)
		},

		async searchPublished(query, limit): Promise<AnimeListItem[]> {
			return db
				.select(listColumns)
				.from(schema.anime)
				.where(
					and(
						eq(schema.anime.status, "published"),
						ilike(schema.anime.title, `%${query}%`),
					),
				)
				.orderBy(desc(schema.anime.createdAt))
				.limit(limit)
		},

		async findBySlug(slug) {
			const row = await db
				.select()
				.from(schema.anime)
				.where(eq(schema.anime.slug, slug))
				.limit(1)
				.then((r) => r[0])
			return row ? toAnime(row) : null
		},

		async findById(id) {
			const row = await db
				.select()
				.from(schema.anime)
				.where(eq(schema.anime.id, id))
				.limit(1)
				.then((r) => r[0])
			return row ? toAnime(row) : null
		},

		async slugExists(slug) {
			const row = await db
				.select({ id: schema.anime.id })
				.from(schema.anime)
				.where(eq(schema.anime.slug, slug))
				.limit(1)
				.then((r) => r[0])
			return Boolean(row)
		},

		async create(data) {
			const row = await db
				.insert(schema.anime)
				.values({ id: crypto.randomUUID(), ...data })
				.returning()
				.then((r) => r[0])
			return toAnime(row)
		},

		async update(id, data) {
			const row = await db
				.update(schema.anime)
				.set({ ...data, updatedAt: new Date() })
				.where(eq(schema.anime.id, id))
				.returning()
				.then((r) => r[0])
			return row ? toAnime(row) : null
		},

		async delete(id) {
			const rows = await db
				.delete(schema.anime)
				.where(eq(schema.anime.id, id))
				.returning({ id: schema.anime.id })
			return rows.length > 0
		},
	}
}
