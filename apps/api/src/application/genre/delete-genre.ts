import type { ActivityRepository } from "#/domain/activity/activity-repository.ts"
import type { GenreRepository } from "#/domain/catalog/genre-repository.ts"
import type { AuthedContext } from "../shared/context.ts"
import { notFound } from "../shared/errors.ts"

export interface DeleteGenreInput {
	id: string
}

export interface DeleteGenreDeps {
	genreRepo: GenreRepository
	activityRepo: ActivityRepository
}

export function makeDeleteGenre(deps: DeleteGenreDeps) {
	return async (input: DeleteGenreInput, ctx: AuthedContext) => {
		const deleted = await deps.genreRepo.delete(input.id)
		if (!deleted) throw notFound("Genre not found")
		await deps.activityRepo.insert({
			userId: ctx.session.user.id,
			action: "delete",
			resource: "genre",
			resourceId: input.id,
		})
		return { success: true as const }
	}
}
