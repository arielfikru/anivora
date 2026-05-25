import type { ActivityRepository } from "#/domain/activity/activity-repository.ts"
import type { AuthService } from "#/domain/ports/auth-service.ts"
import type { UserRole } from "#/domain/user/user.ts"
import { assertNotSelf } from "../shared/authorization.ts"
import type { AuthedContext } from "../shared/context.ts"

export interface SetRoleInput {
	userId: string
	role: UserRole
}

export interface SetRoleDeps {
	auth: AuthService
	activityRepo: ActivityRepository
}

export function makeSetRole(deps: SetRoleDeps) {
	return async (input: SetRoleInput, ctx: AuthedContext) => {
		assertNotSelf(ctx.session.user.id, input.userId, "change the role of")

		await deps.auth.setRole(input.userId, input.role, { headers: ctx.headers })
		await deps.activityRepo.insert({
			userId: ctx.session.user.id,
			action: "set-role",
			resource: "user",
			resourceId: input.userId,
			metadata: { role: input.role },
		})
		return { success: true as const }
	}
}
