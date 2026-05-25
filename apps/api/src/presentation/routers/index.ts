import type { UseCases } from "#/application/use-cases.ts"
import { protectedProcedure, publicProcedure } from "../orpc/middleware.ts"
import { buildActivityRouter } from "./activity.ts"
import { buildAuthRouter } from "./auth.ts"
import { buildUserRouter } from "./user.ts"

export function buildRouter(useCases: UseCases) {
	return {
		health: publicProcedure.handler(() => ({ status: "ok" as const })),

		me: protectedProcedure.handler(({ context }) => ({
			user: context.session.user,
		})),

		auth: buildAuthRouter(useCases.auth),

		admin: {
			...buildUserRouter(useCases.user),
			...buildActivityRouter(useCases.activity),
		},
	}
}

export type AppRouter = ReturnType<typeof buildRouter>
