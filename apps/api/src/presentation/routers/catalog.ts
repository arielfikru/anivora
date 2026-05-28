import type { UseCases } from "#/application/use-cases.ts"
import { publicProcedure, toOptionalAuthContext } from "../orpc/middleware.ts"
import {
	animeSlugSchema,
	episodeSlugSchema,
	listAnimeSchema,
	relatedAnimeSchema,
	searchAnimeSchema,
} from "../orpc/schemas.ts"

export function buildCatalogRouter(useCases: UseCases["catalog"]) {
	return {
		listAnime: publicProcedure
			.input(listAnimeSchema)
			.handler(({ input, context }) =>
				useCases.listAnime(input, toOptionalAuthContext(context)),
			),

		searchAnime: publicProcedure
			.input(searchAnimeSchema)
			.handler(({ input, context }) =>
				useCases.searchAnime(input, toOptionalAuthContext(context)),
			),

		getAnime: publicProcedure
			.input(animeSlugSchema)
			.handler(({ input, context }) =>
				useCases.getAnime(input, toOptionalAuthContext(context)),
			),

		getRelatedAnime: publicProcedure
			.input(relatedAnimeSchema)
			.handler(({ input, context }) =>
				useCases.getRelatedAnime(input, toOptionalAuthContext(context)),
			),

		getEpisode: publicProcedure
			.input(episodeSlugSchema)
			.handler(({ input, context }) =>
				useCases.getEpisode(input, toOptionalAuthContext(context)),
			),

		listGenres: publicProcedure.handler(({ context }) =>
			useCases.listGenres(toOptionalAuthContext(context)),
		),
	}
}
