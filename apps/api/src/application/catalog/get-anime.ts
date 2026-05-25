import type { AnimeRepository } from "#/domain/catalog/anime-repository.ts"
import type { EpisodeRepository } from "#/domain/catalog/episode-repository.ts"
import type { PublicEpisode } from "#/domain/catalog/episode.ts"
import type { Season } from "#/domain/catalog/season.ts"
import type { SeasonRepository } from "#/domain/catalog/season-repository.ts"
import type { OptionalAuthContext } from "../shared/context.ts"
import { notFound } from "../shared/errors.ts"

export interface GetAnimeInput {
	slug: string
}

export interface GetAnimeDeps {
	animeRepo: AnimeRepository
	seasonRepo: SeasonRepository
	episodeRepo: EpisodeRepository
}

type SeasonWithEpisodes = Season & { episodes: PublicEpisode[] }

export function makeGetAnime(deps: GetAnimeDeps) {
	return async (input: GetAnimeInput, _ctx: OptionalAuthContext) => {
		const anime = await deps.animeRepo.findBySlug(input.slug)
		if (!anime || anime.status !== "published") {
			throw notFound("Anime not found")
		}
		const seasons = await loadSeasons(deps, anime.id)
		// Fall back to the first episode thumbnail when artwork is missing.
		const thumb = firstEpisodeThumbnail(seasons)
		const resolved = {
			...anime,
			coverImageUrl: anime.coverImageUrl ?? thumb,
			bannerImageUrl: anime.bannerImageUrl ?? thumb,
		}
		return { anime: resolved, seasons }
	}
}

function firstEpisodeThumbnail(seasons: SeasonWithEpisodes[]): string | null {
	for (const season of seasons) {
		for (const episode of season.episodes) {
			if (episode.thumbnailUrl) return episode.thumbnailUrl
		}
	}
	return null
}

async function loadSeasons(
	deps: GetAnimeDeps,
	animeId: string,
): Promise<SeasonWithEpisodes[]> {
	const seasons = await deps.seasonRepo.listPublishedByAnime(animeId)
	return Promise.all(
		seasons.map(async (s) => ({
			...s,
			episodes: await deps.episodeRepo.listPublicBySeason(s.id),
		})),
	)
}
