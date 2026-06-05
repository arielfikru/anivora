import type { ActivityRepository } from "#/domain/activity/activity-repository.ts"
import type { SeasonRepository } from "#/domain/catalog/season-repository.ts"
import type { RemoteUploadJobRepository } from "#/domain/upload/remote-upload-job-repository.ts"
import type { RemoteUploadSourceType } from "#/domain/upload/remote-upload-job.ts"
import type { AuthedContext } from "../shared/context.ts"
import { notFound } from "../shared/errors.ts"

export interface CreateRemoteUploadJobInput {
	seasonId: string
	sourceType: RemoteUploadSourceType
	sourceUrl: string
	isArchive: boolean
}

export interface CreateRemoteUploadJobDeps {
	jobRepo: RemoteUploadJobRepository
	seasonRepo: SeasonRepository
	activityRepo: ActivityRepository
}

export function makeCreateRemoteUploadJob(deps: CreateRemoteUploadJobDeps) {
	return async (input: CreateRemoteUploadJobInput, ctx: AuthedContext) => {
		const season = await deps.seasonRepo.findById(input.seasonId)
		if (!season) throw notFound("Season not found")

		const job = await deps.jobRepo.create({
			seasonId: season.id,
			animeId: season.animeId,
			sourceType: input.sourceType,
			sourceUrl: input.sourceUrl,
			isArchive: input.isArchive,
			createdBy: ctx.session.user.id,
		})

		await deps.activityRepo.insert({
			userId: ctx.session.user.id,
			action: "upload",
			resource: "remote_upload",
			resourceId: job.id,
			metadata: { sourceType: input.sourceType, isArchive: input.isArchive },
		})

		return { job }
	}
}
