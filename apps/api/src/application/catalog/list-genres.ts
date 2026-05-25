import type { GenreRepository } from "#/domain/catalog/genre-repository.ts"
import type { OptionalAuthContext } from "../shared/context.ts"

export interface ListGenresDeps {
	genreRepo: GenreRepository
}

export function makeListGenres(deps: ListGenresDeps) {
	return async (_ctx: OptionalAuthContext) => {
		const genres = await deps.genreRepo.list()
		return { genres }
	}
}
