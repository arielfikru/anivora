import type { ActivityRepository } from "#/domain/activity/activity-repository.ts"
import type { AuthService } from "#/domain/ports/auth-service.ts"
import { assertNotSelf } from "../shared/authorization.ts"
import type { AuthedContext } from "../shared/context.ts"

export interface DeleteUserInput {
	userId: string
}

export interface DeleteUserDeps {
	auth: AuthService
	activityRepo: ActivityRepository
}

export function makeDeleteUser(deps: DeleteUserDeps) {
	return async (input: DeleteUserInput, ctx: AuthedContext) => {
		assertNotSelf(ctx.session.user.id, input.userId, "delete")
		await deps.auth.removeUser(input.userId, { headers: ctx.headers })
		await deps.activityRepo.insert({
			userId: ctx.session.user.id,
			action: "delete",
			resource: "user",
			resourceId: input.userId,
		})
		return { success: true as const }
	}
}
