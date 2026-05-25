import type { ActivityRepository } from "#/domain/activity/activity-repository.ts"
import type { AuthService } from "#/domain/ports/auth-service.ts"
import type { UserRole } from "#/domain/user/user.ts"
import type { AuthedContext } from "../shared/context.ts"

export interface CreateUserInput {
	name: string
	email: string
	password: string
	role: UserRole
}

export interface CreateUserDeps {
	auth: AuthService
	activityRepo: ActivityRepository
}

export function makeCreateUser(deps: CreateUserDeps) {
	return async (input: CreateUserInput, ctx: AuthedContext) => {
		const created = await deps.auth.createUser(
			{
				name: input.name,
				email: input.email,
				password: input.password,
				role: input.role,
			},
			{ headers: ctx.headers },
		)

		await deps.activityRepo.insert({
			userId: ctx.session.user.id,
			action: "create",
			resource: "user",
			resourceId: created.id,
			metadata: { email: input.email, role: input.role },
		})

		return { user: { id: created.id, email: created.email } }
	}
}
