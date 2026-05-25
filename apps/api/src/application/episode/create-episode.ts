import type { ActivityRepository } from "#/domain/activity/activity-repository.ts"
import type { EpisodeRepository } from "#/domain/catalog/episode-repository.ts"
import type { SeasonRepository } from "#/domain/catalog/season-repository.ts"
import type { AnimeRepository } from "#/domain/catalog/anime-repository.ts"
import type { AuthedContext } from "../shared/context.ts"
import { conflict, notFound } from "../shared/errors.ts"

export interface CreateEpisodeInput {
	seasonId: string
	episodeNumber: number
	title?: string | null
	description?: string | null
	durationSeconds?: number | null
	thumbnailUrl?: string | null
}

export interface CreateEpisodeDeps {
	episodeRepo: EpisodeRepository
	seasonRepo: SeasonRepository
	animeRepo: AnimeRepository
	activityRepo: ActivityRepository
}

const pad = (n: number) => String(n).padStart(2, "0")

export function makeCreateEpisode(deps: CreateEpisodeDeps) {
	return async (input: CreateEpisodeInput, ctx: AuthedContext) => {
		const season = await deps.seasonRepo.findById(input.seasonId)
		if (!season) throw notFound("Season not found")
		const anime = await deps.animeRepo.findById(season.animeId)
		if (!anime) throw notFound("Anime not found")
		const code = `S${pad(season.seasonNumber)}E${pad(input.episodeNumber)}`
		const slug = `${anime.slug}-${code.toLowerCase()}`
		if (await deps.episodeRepo.slugExists(slug)) {
			throw conflict(`Episode slug "${slug}" is already taken`)
		}
		const episode = await deps.episodeRepo.create({
			animeId: anime.id,
			seasonId: season.id,
			episodeNumber: input.episodeNumber,
			episodeCode: code,
			slug,
			title: input.title,
			description: input.description,
			durationSeconds: input.durationSeconds,
			thumbnailUrl: input.thumbnailUrl,
		})
		await deps.activityRepo.insert({
			userId: ctx.session.user.id,
			action: "create",
			resource: "episode",
			resourceId: episode.id,
			metadata: { code, slug },
		})
		return { episode }
	}
}
