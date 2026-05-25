import type { ActivityRepository } from "#/domain/activity/activity-repository.ts"
import type { AuthedContext } from "../shared/context.ts"

export interface ListActivityLogsInput {
	limit: number
	offset: number
	userId?: string
	resource?: string
	action?: string
}

export interface ListActivityLogsDeps {
	activityRepo: ActivityRepository
}

export function makeListActivityLogs(deps: ListActivityLogsDeps) {
	return async (input: ListActivityLogsInput, _ctx: AuthedContext) => {
		return deps.activityRepo.list({
			userId: input.userId,
			resource: input.resource,
			action: input.action,
			limit: input.limit,
			offset: input.offset,
		})
	}
}
