import { ORPCError, os } from "@orpc/server"
import type {
	AuthedContext,
	OptionalAuthContext,
} from "#/application/shared/context.ts"
import { AppError } from "#/application/shared/errors.ts"
import type { UserRole } from "#/domain/user/user.ts"
import type { ORPCContext } from "./context.ts"

export const publicProcedure = os
	.$context<ORPCContext>()
	.use(async (options) => {
		try {
			return await options.next({ context: options.context })
		} catch (err) {
			if (!(err instanceof AppError)) throw err
			throw new ORPCError(err.code, { message: err.message })
		}
	})

export const protectedProcedure = publicProcedure.use((options) => {
	if (!options.context.session) {
		throw new ORPCError("UNAUTHORIZED", { message: "You must be signed in" })
	}
	return options.next({
		context: {
			...options.context,
			session: options.context.session,
		},
	})
})

export const requireRole = (...allowedRoles: UserRole[]) =>
	protectedProcedure.use((options) => {
		const role = options.context.session.user.role
		if (!allowedRoles.includes(role)) {
			throw new ORPCError("FORBIDDEN", {
				message: `Required role: ${allowedRoles.join(" or ")}`,
			})
		}
		return options.next({ context: options.context })
	})

export const adminProcedure = requireRole("admin")

export function toAuthedContext(ctx: ORPCContext): AuthedContext {
	if (!ctx.session)
		throw new ORPCError("UNAUTHORIZED", { message: "Not authenticated" })
	return { session: ctx.session, headers: ctx.headers }
}

export function toOptionalAuthContext(ctx: ORPCContext): OptionalAuthContext {
	return { session: ctx.session, headers: ctx.headers }
}
