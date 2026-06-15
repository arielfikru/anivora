import type { UseCases } from "#/application/use-cases.ts"
import { adminProcedure, toAuthedContext } from "../orpc/middleware.ts"
import {
	bulkCreateEpisodesSchema,
	createEpisodeSchema,
	deleteEpisodeSchema,
	listEpisodesSchema,
	setSeasonEpisodesStatusSchema,
	updateEpisodeSchema,
} from "../orpc/schemas.ts"

export function buildEpisodeRouter(useCases: UseCases["episode"]) {
	return {
		listEpisodes: adminProcedure
			.input(listEpisodesSchema)
			.handler(({ input, context }) =>
				useCases.list(input, toAuthedContext(context)),
			),

		createEpisode: adminProcedure
			.input(createEpisodeSchema)
			.handler(({ input, context }) =>
				useCases.create(input, toAuthedContext(context)),
			),

		bulkCreateEpisodes: adminProcedure
			.input(bulkCreateEpisodesSchema)
			.handler(({ input, context }) =>
				useCases.bulkCreate(input, toAuthedContext(context)),
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

		setSeasonEpisodesStatus: adminProcedure
			.input(setSeasonEpisodesStatusSchema)
			.handler(({ input, context }) =>
				useCases.setSeasonStatus(input, toAuthedContext(context)),
			),
	}
}
