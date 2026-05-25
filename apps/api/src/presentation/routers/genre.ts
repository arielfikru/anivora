import type { UseCases } from "#/application/use-cases.ts"
import { adminProcedure, toAuthedContext } from "../orpc/middleware.ts"
import { createGenreSchema, deleteGenreSchema } from "../orpc/schemas.ts"

export function buildGenreRouter(useCases: UseCases["genre"]) {
	return {
		createGenre: adminProcedure
			.input(createGenreSchema)
			.handler(({ input, context }) =>
				useCases.create(input, toAuthedContext(context)),
			),

		deleteGenre: adminProcedure
			.input(deleteGenreSchema)
			.handler(({ input, context }) =>
				useCases.delete(input, toAuthedContext(context)),
			),
	}
}
