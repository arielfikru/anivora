import type { ActivityRepository } from "#/domain/activity/activity-repository.ts"
import type { SeasonUpdate } from "#/domain/catalog/season.ts"
import type { SeasonRepository } from "#/domain/catalog/season-repository.ts"
import type { AuthedContext } from "../shared/context.ts"
import { notFound } from "../shared/errors.ts"

export interface UpdateSeasonInput {
	id: string
	data: SeasonUpdate
}

export interface UpdateSeasonDeps {
	seasonRepo: SeasonRepository
	activityRepo: ActivityRepository
}

export function makeUpdateSeason(deps: UpdateSeasonDeps) {
	return async (input: UpdateSeasonInput, ctx: AuthedContext) => {
		const season = await deps.seasonRepo.update(input.id, input.data)
		if (!season) throw notFound("Season not found")
		await deps.activityRepo.insert({
			userId: ctx.session.user.id,
			action: "update",
			resource: "season",
			resourceId: season.id,
			metadata: { fields: Object.keys(input.data) },
		})
		return { season }
	}
}
