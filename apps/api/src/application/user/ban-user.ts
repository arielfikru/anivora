import type { ActivityRepository } from "#/domain/activity/activity-repository.ts"
import type { AuthService } from "#/domain/ports/auth-service.ts"
import { assertNotSelf } from "../shared/authorization.ts"
import type { AuthedContext } from "../shared/context.ts"

export interface BanUserInput {
	userId: string
	banReason?: string
}

export interface BanUserDeps {
	auth: AuthService
	activityRepo: ActivityRepository
}

export function makeBanUser(deps: BanUserDeps) {
	return async (input: BanUserInput, ctx: AuthedContext) => {
		assertNotSelf(ctx.session.user.id, input.userId, "ban")

		await deps.auth.banUser(input.userId, input.banReason, {
			headers: ctx.headers,
		})
		await deps.activityRepo.insert({
			userId: ctx.session.user.id,
			action: "ban",
			resource: "user",
			resourceId: input.userId,
			metadata: { banReason: input.banReason },
		})
		return { success: true as const }
	}
}
