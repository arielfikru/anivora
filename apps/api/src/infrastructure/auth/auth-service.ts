import type { AuthService } from "#/domain/ports/auth-service.ts"
import type { Session } from "#/domain/session/session.ts"
import type { BetterAuth } from "./better-auth.ts"

export function createAuthService(auth: BetterAuth): AuthService {
	return {
		async getSession(headers) {
			const raw = await auth.api.getSession({ headers })
			return (raw as Session | null) ?? null
		},

		async createUser(input, ctx) {
			const result = await auth.api.createUser({
				body: {
					name: input.name,
					email: input.email,
					password: input.password,
					role: input.role,
				},
				headers: ctx.headers,
			})
			const user = (result as { user?: { id?: string; email?: string } })?.user
			return {
				id: user?.id ?? "",
				email: user?.email ?? input.email,
			}
		},

		async banUser(userId, reason, ctx) {
			await auth.api.banUser({
				body: { userId, banReason: reason },
				headers: ctx.headers,
			})
		},

		async unbanUser(userId, ctx) {
			await auth.api.unbanUser({
				body: { userId },
				headers: ctx.headers,
			})
		},

		async updateUser(userId, data, ctx) {
			await auth.api.adminUpdateUser({
				body: { userId, data },
				headers: ctx.headers,
			})
		},

		async setRole(userId, role, ctx) {
			await auth.api.setRole({
				body: { userId, role },
				headers: ctx.headers,
			})
		},

		async removeUser(userId, ctx) {
			await auth.api.removeUser({
				body: { userId },
				headers: ctx.headers,
			})
		},

		handler(request) {
			return auth.handler(request)
		},
	}
}
