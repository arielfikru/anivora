import type { Anime } from "#/domain/catalog/anime.ts"
import type { AnimeRepository } from "#/domain/catalog/anime-repository.ts"
import type { EpisodeRepository } from "#/domain/catalog/episode-repository.ts"
import type { GenreRepository } from "#/domain/catalog/genre-repository.ts"
import type { SeasonRepository } from "#/domain/catalog/season-repository.ts"
import type { ObjectStorage } from "#/domain/ports/object-storage.ts"
import type { ContentProviderRegistry } from "#/infrastructure/content/providers/provider.ts"
import { slugify } from "../shared/slug.ts"
import { makeMirrorAnimeCover } from "./mirror-anime-cover.ts"

export interface HydrateProviderAnimeDeps {
	animeRepo: AnimeRepository
	seasonRepo: SeasonRepository
	episodeRepo: EpisodeRepository
	genreRepo: GenreRepository
	providers: ContentProviderRegistry
	objectStorage: ObjectStorage
}

const pad = (value: number) => String(value).padStart(2, "0")

export function makeHydrateProviderAnime(deps: HydrateProviderAnimeDeps) {
	const mirrorCover = makeMirrorAnimeCover(deps)
	return async (anime: Anime): Promise<Anime> => {
		if (!anime.sourceProvider || !anime.sourceUrl) return anime
		const existingSeasons = await deps.seasonRepo.listByAnime(anime.id)
		if (existingSeasons.length > 0) return anime
		const provider = deps.providers.get(anime.sourceProvider)
		if (!provider) return anime
		const detail = await provider.getAnime(anime.sourceUrl)
		const updated =
			(await deps.animeRepo.update(anime.id, {
				title: detail.title,
				description: detail.description,
				coverImageUrl: anime.coverImageUrl?.startsWith("/i/")
					? anime.coverImageUrl
					: detail.coverImageUrl,
				studioName: detail.studioName,
				releaseYear: detail.releaseYear,
				sourceUrl: detail.url,
			})) ?? anime
		const genres = await Promise.all(
			detail.genres.map((name) =>
				deps.genreRepo.findOrCreate(name, slugify(name)),
			),
		)
		await deps.genreRepo.setForAnime(
			anime.id,
			genres.map((genre) => genre.id),
		)
		const season = await deps.seasonRepo.create({
			animeId: anime.id,
			seasonNumber: 1,
			status: "published",
			autoPublish: true,
			releaseYear: detail.releaseYear,
		})
		for (const sourceEpisode of detail.episodes) {
			if (!Number.isInteger(sourceEpisode.number)) continue
			if (
				await deps.episodeRepo.findBySource(
					anime.sourceProvider,
					sourceEpisode.id,
				)
			)
				continue
			const code = `S${pad(season.seasonNumber)}E${pad(sourceEpisode.number)}`
			let slug = `${updated.slug}-${code.toLowerCase()}`
			if (await deps.episodeRepo.slugExists(slug))
				slug = `${slug}-${anime.sourceProvider}`
			await deps.episodeRepo.create({
				animeId: anime.id,
				seasonId: season.id,
				episodeNumber: sourceEpisode.number,
				episodeCode: code,
				title: sourceEpisode.title,
				slug,
				status: "published",
				sourceProvider: anime.sourceProvider,
				sourceId: sourceEpisode.id,
				sourceUrl: sourceEpisode.url,
			})
		}
		await mirrorCover(updated).catch(() => undefined)
		return (await deps.animeRepo.findById(updated.id)) ?? updated
	}
}
