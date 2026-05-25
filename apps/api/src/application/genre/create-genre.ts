import type { ActivityRepository } from "#/domain/activity/activity-repository.ts"
import type { GenreRepository } from "#/domain/catalog/genre-repository.ts"
import type { AuthedContext } from "../shared/context.ts"
import { conflict } from "../shared/errors.ts"
import { slugify } from "../shared/slug.ts"

export interface CreateGenreInput {
	name: string
}

export interface CreateGenreDeps {
	genreRepo: GenreRepository
	activityRepo: ActivityRepository
}

export function makeCreateGenre(deps: CreateGenreDeps) {
	return async (input: CreateGenreInput, ctx: AuthedContext) => {
		const slug = slugify(input.name)
		if (await deps.genreRepo.slugExists(slug)) {
			throw conflict(`Genre slug "${slug}" is already taken`)
		}
		const genre = await deps.genreRepo.create({ name: input.name, slug })
		await deps.activityRepo.insert({
			userId: ctx.session.user.id,
			action: "create",
			resource: "genre",
			resourceId: genre.id,
			metadata: { name: genre.name, slug },
		})
		return { genre }
	}
}
