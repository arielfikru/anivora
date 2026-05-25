import type { UseCases } from "#/application/use-cases.ts"
import { publicProcedure } from "../orpc/middleware.ts"

export function buildAuthRouter(useCases: UseCases["auth"]) {
	return {
		getSession: publicProcedure.handler(({ context }) =>
			useCases.getSession(context.headers),
		),
	}
}
