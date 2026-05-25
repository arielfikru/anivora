import type { UseCases } from "#/application/use-cases.ts"
import { adminProcedure, toAuthedContext } from "../orpc/middleware.ts"
import {
	createEpisodeSchema,
	deleteEpisodeSchema,
	updateEpisodeSchema,
} from "../orpc/schemas.ts"

export function buildEpisodeRouter(useCases: UseCases["episode"]) {
	return {
		createEpisode: adminProcedure
			.input(createEpisodeSchema)
			.handler(({ input, context }) =>
				useCases.create(input, toAuthedContext(context)),
			),

		updateEpisode: adminProcedure
			.input(updateEpisodeSchema)
			.handler(({ input, context }) =>
				useCases.update(input, toAuthedContext(context)),
			),

		deleteEpisode: adminProcedure
			.input(deleteEpisodeSchema)
			.handler(({ input, context }) =>
				useCases.delete(input, toAuthedContext(context)),
			),
	}
}
