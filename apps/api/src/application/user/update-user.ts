import type { ActivityRepository } from "#/domain/activity/activity-repository.ts"
import type { AuthService } from "#/domain/ports/auth-service.ts"
import { assertNotSelf } from "../shared/authorization.ts"
import type { AuthedContext } from "../shared/context.ts"

export interface UpdateUserInput {
	userId: string
	name?: string
	email?: string
}

export interface UpdateUserDeps {
	auth: AuthService
	activityRepo: ActivityRepository
}

export function makeUpdateUser(deps: UpdateUserDeps) {
	return async (input: UpdateUserInput, ctx: AuthedContext) => {
		assertNotSelf(
			ctx.session.user.id,
			input.userId,
			"update via admin panel — use your profile page instead",
		)

		const { userId, ...data } = input
		await deps.auth.updateUser(userId, data, { headers: ctx.headers })
		await deps.activityRepo.insert({
			userId: ctx.session.user.id,
			action: "update",
			resource: "user",
			resourceId: userId,
			metadata: data,
		})
		return { success: true as const }
	}
}
