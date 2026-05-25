import type { ActivityRepository } from "#/domain/activity/activity-repository.ts"
import type { AuthService } from "#/domain/ports/auth-service.ts"
import type { AuthedContext } from "../shared/context.ts"

export interface UnbanUserInput {
	userId: string
}

export interface UnbanUserDeps {
	auth: AuthService
	activityRepo: ActivityRepository
}

export function makeUnbanUser(deps: UnbanUserDeps) {
	return async (input: UnbanUserInput, ctx: AuthedContext) => {
		await deps.auth.unbanUser(input.userId, { headers: ctx.headers })
		await deps.activityRepo.insert({
			userId: ctx.session.user.id,
			action: "unban",
			resource: "user",
			resourceId: input.userId,
		})
		return { success: true as const }
	}
}
