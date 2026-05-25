import type { ActivityRepository } from "#/domain/activity/activity-repository.ts"
import type { SeasonRepository } from "#/domain/catalog/season-repository.ts"
import type { AuthedContext } from "../shared/context.ts"
import { notFound } from "../shared/errors.ts"

export interface DeleteSeasonInput {
	id: string
}

export interface DeleteSeasonDeps {
	seasonRepo: SeasonRepository
	activityRepo: ActivityRepository
}

export function makeDeleteSeason(deps: DeleteSeasonDeps) {
	return async (input: DeleteSeasonInput, ctx: AuthedContext) => {
		const deleted = await deps.seasonRepo.delete(input.id)
		if (!deleted) throw notFound("Season not found")
		await deps.activityRepo.insert({
			userId: ctx.session.user.id,
			action: "delete",
			resource: "season",
			resourceId: input.id,
		})
		return { success: true as const }
	}
}
