import type { UseCases } from "#/application/use-cases.ts"
import { protectedProcedure, publicProcedure } from "../orpc/middleware.ts"
import { buildActivityRouter } from "./activity.ts"
import { buildAnimeRouter } from "./anime.ts"
import { buildAuthRouter } from "./auth.ts"
import { buildCatalogRouter } from "./catalog.ts"
import { buildEpisodeRouter } from "./episode.ts"
import { buildGenreRouter } from "./genre.ts"
import { buildSeasonRouter } from "./season.ts"
import { buildUserRouter } from "./user.ts"

export function buildRouter(useCases: UseCases) {
	return {
		health: publicProcedure.handler(() => ({ status: "ok" as const })),

		me: protectedProcedure.handler(({ context }) => ({
			user: context.session.user,
		})),

		auth: buildAuthRouter(useCases.auth),

		catalog: buildCatalogRouter(useCases.catalog),

		admin: {
			...buildUserRouter(useCases.user),
			...buildActivityRouter(useCases.activity),
			...buildAnimeRouter(useCases.anime),
			...buildSeasonRouter(useCases.season),
			...buildEpisodeRouter(useCases.episode),
			...buildGenreRouter(useCases.genre),
		},
	}
}

export type AppRouter = ReturnType<typeof buildRouter>
