import type { UseCases } from "#/application/use-cases.ts"
import { adminProcedure, toAuthedContext } from "../orpc/middleware.ts"
import {
	createAnimeSchema,
	deleteAnimeSchema,
	updateAnimeSchema,
} from "../orpc/schemas.ts"

export function buildAnimeRouter(useCases: UseCases["anime"]) {
	return {
		createAnime: adminProcedure
			.input(createAnimeSchema)
			.handler(({ input, context }) =>
				useCases.create(input, toAuthedContext(context)),
			),

		updateAnime: adminProcedure
			.input(updateAnimeSchema)
			.handler(({ input, context }) =>
				useCases.update(input, toAuthedContext(context)),
			),

		deleteAnime: adminProcedure
			.input(deleteAnimeSchema)
			.handler(({ input, context }) =>
				useCases.delete(input, toAuthedContext(context)),
			),
	}
}
