import type { UseCases } from "#/application/use-cases.ts"
import { adminProcedure, toAuthedContext } from "../orpc/middleware.ts"
import {
	createSeasonSchema,
	deleteSeasonSchema,
	listSeasonsSchema,
	updateSeasonSchema,
} from "../orpc/schemas.ts"

export function buildSeasonRouter(useCases: UseCases["season"]) {
	return {
		listSeasons: adminProcedure
			.input(listSeasonsSchema)
			.handler(({ input, context }) =>
				useCases.list(input, toAuthedContext(context)),
			),

		createSeason: adminProcedure
			.input(createSeasonSchema)
			.handler(({ input, context }) =>
				useCases.create(input, toAuthedContext(context)),
			),

		updateSeason: adminProcedure
			.input(updateSeasonSchema)
			.handler(({ input, context }) =>
				useCases.update(input, toAuthedContext(context)),
			),

		deleteSeason: adminProcedure
			.input(deleteSeasonSchema)
			.handler(({ input, context }) =>
				useCases.delete(input, toAuthedContext(context)),
			),
	}
}
