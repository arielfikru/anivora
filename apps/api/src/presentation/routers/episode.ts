import type { UseCases } from "#/application/use-cases.ts"
import { adminProcedure, toAuthedContext } from "../orpc/middleware.ts"
import {
	attachBunnyVideoSchema,
	createEpisodeSchema,
	deleteEpisodeSchema,
	listEpisodesSchema,
	syncEpisodeStatusSchema,
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

		attachBunnyVideo: adminProcedure
			.input(attachBunnyVideoSchema)
			.handler(({ input, context }) =>
				useCases.attachBunny(input, toAuthedContext(context)),
			),

		syncEpisodeStatus: adminProcedure
			.input(syncEpisodeStatusSchema)
			.handler(({ input, context }) =>
				useCases.syncStatus(input, toAuthedContext(context)),
			),
	}
}
