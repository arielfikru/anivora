import type { ActivityRepository } from "#/domain/activity/activity-repository.ts"
import type { AnimeRepository } from "#/domain/catalog/anime-repository.ts"
import type { Episode } from "#/domain/catalog/episode.ts"
import type { EpisodeRepository } from "#/domain/catalog/episode-repository.ts"
import type { SeasonRepository } from "#/domain/catalog/season-repository.ts"
import type { AuthedContext } from "../shared/context.ts"
import { notFound } from "../shared/errors.ts"

export interface BulkCreateEpisodesInput {
	seasonId: string
	count: number
	startNumber?: number | null
}

export interface BulkCreateEpisodesDeps {
	episodeRepo: EpisodeRepository
	seasonRepo: SeasonRepository
	animeRepo: AnimeRepository
	activityRepo: ActivityRepository
}

const pad = (n: number) => String(n).padStart(2, "0")

export function makeBulkCreateEpisodes(deps: BulkCreateEpisodesDeps) {
	return async (input: BulkCreateEpisodesInput, ctx: AuthedContext) => {
		const season = await deps.seasonRepo.findById(input.seasonId)
		if (!season) throw notFound("Season not found")
		const anime = await deps.animeRepo.findById(season.animeId)
		if (!anime) throw notFound("Anime not found")

		const existing = await deps.episodeRepo.listBySeason(season.id)
		const maxNumber = existing.reduce((m, e) => Math.max(m, e.episodeNumber), 0)
		const start = input.startNumber ?? maxNumber + 1

		const created: Episode[] = []
		let skipped = 0
		for (let i = 0; i < input.count; i++) {
			const number = start + i
			const code = `S${pad(season.seasonNumber)}E${pad(number)}`
			const slug = `${anime.slug}-${code.toLowerCase()}`
			if (await deps.episodeRepo.slugExists(slug)) {
				skipped++
				continue
			}
			created.push(
				await deps.episodeRepo.create({
					animeId: anime.id,
					seasonId: season.id,
					episodeNumber: number,
					episodeCode: code,
					slug,
				}),
			)
		}

		await deps.activityRepo.insert({
			userId: ctx.session.user.id,
			action: "create",
			resource: "episode",
			resourceId: season.id,
			metadata: { bulk: true, created: created.length, skipped, start },
		})
		return { episodes: created, created: created.length, skipped }
	}
}
