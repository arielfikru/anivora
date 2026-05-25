import type { ActivityRepository } from "#/domain/activity/activity-repository.ts"
import type { AuthService } from "#/domain/ports/auth-service.ts"
import type { Cache } from "#/domain/ports/cache.ts"
import type { UserRepository } from "#/domain/user/user-repository.ts"

import { makeListActivityLogs } from "./activity/list-activity-logs.ts"
import { makeGetSession } from "./auth/get-session.ts"
import { makeBanUser } from "./user/ban-user.ts"
import { makeCreateUser } from "./user/create-user.ts"
import { makeDeleteUser } from "./user/delete-user.ts"
import { makeListUsers } from "./user/list-users.ts"
import { makeSetRole } from "./user/set-role.ts"
import { makeUnbanUser } from "./user/unban-user.ts"
import { makeUpdateUser } from "./user/update-user.ts"

export interface Dependencies {
	userRepo: UserRepository
	activityRepo: ActivityRepository
	cache: Cache
	auth: AuthService
}

export function buildUseCases(deps: Dependencies) {
	return {
		auth: {
			getSession: makeGetSession({ auth: deps.auth }),
		},
		user: {
			list: makeListUsers({ userRepo: deps.userRepo }),
			ban: makeBanUser({
				auth: deps.auth,
				activityRepo: deps.activityRepo,
			}),
			unban: makeUnbanUser({
				auth: deps.auth,
				activityRepo: deps.activityRepo,
			}),
			setRole: makeSetRole({
				auth: deps.auth,
				activityRepo: deps.activityRepo,
			}),
			create: makeCreateUser({
				auth: deps.auth,
				activityRepo: deps.activityRepo,
			}),
			update: makeUpdateUser({
				auth: deps.auth,
				activityRepo: deps.activityRepo,
			}),
			delete: makeDeleteUser({
				auth: deps.auth,
				activityRepo: deps.activityRepo,
			}),
		},
		activity: {
			list: makeListActivityLogs({ activityRepo: deps.activityRepo }),
		},
	}
}

export type UseCases = ReturnType<typeof buildUseCases>
