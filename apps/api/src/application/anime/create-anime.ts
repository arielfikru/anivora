import type { ActivityRepository } from "#/domain/activity/activity-repository.ts"
import type {
	CatalogStatus,
	ContentRating,
	NewAnime,
} from "#/domain/catalog/anime.ts"
import type { AnimeRepository } from "#/domain/catalog/anime-repository.ts"
import type { SeasonRepository } from "#/domain/catalog/season-repository.ts"
import type { AuthedContext } from "../shared/context.ts"
import { conflict } from "../shared/errors.ts"
import { slugify } from "../shared/slug.ts"

export interface CreateAnimeInput extends Omit<NewAnime, "slug"> {
	status?: CatalogStatus
	contentRating?: ContentRating
}

export interface CreateAnimeDeps {
	animeRepo: AnimeRepository
	seasonRepo: SeasonRepository
	activityRepo: ActivityRepository
}

export function makeCreateAnime(deps: CreateAnimeDeps) {
	return async (input: CreateAnimeInput, ctx: AuthedContext) => {
		const slug = slugify(input.title)
		if (await deps.animeRepo.slugExists(slug)) {
			throw conflict(`Anime slug "${slug}" is already taken`)
		}
		const anime = await deps.animeRepo.create({ ...input, slug })
		// Start every anime with a ready-to-use Season 1 so episodes can be
		// added immediately. Published so its episodes surface once they exist.
		const season = await deps.seasonRepo.create({
			animeId: anime.id,
			seasonNumber: 1,
			status: "published",
		})
		await deps.activityRepo.insert({
			userId: ctx.session.user.id,
			action: "create",
			resource: "anime",
			resourceId: anime.id,
			metadata: { title: anime.title, slug, seasonId: season.id },
		})
		return { anime }
	}
}
