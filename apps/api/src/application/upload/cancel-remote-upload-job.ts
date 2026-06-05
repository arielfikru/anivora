import type { ActivityRepository } from "#/domain/activity/activity-repository.ts"
import type { RemoteUploadJobRepository } from "#/domain/upload/remote-upload-job-repository.ts"
import type { AuthedContext } from "../shared/context.ts"
import { badRequest, notFound } from "../shared/errors.ts"

export interface CancelRemoteUploadJobInput {
	jobId: string
}

export interface CancelRemoteUploadJobDeps {
	jobRepo: RemoteUploadJobRepository
	activityRepo: ActivityRepository
}

// Terminal states can't be canceled; an actively-uploading job is left to the
// worker (it checks for "canceled" between files).
const CANCELABLE = new Set(["pending", "downloading", "extracting", "scanned"])

export function makeCancelRemoteUploadJob(deps: CancelRemoteUploadJobDeps) {
	return async (input: CancelRemoteUploadJobInput, ctx: AuthedContext) => {
		const job = await deps.jobRepo.findById(input.jobId)
		if (!job) throw notFound("Upload job not found")
		if (!CANCELABLE.has(job.status))
			throw badRequest(`Cannot cancel a ${job.status} job`)

		const updated = await deps.jobRepo.update(job.id, { status: "canceled" })
		await deps.activityRepo.insert({
			userId: ctx.session.user.id,
			action: "cancel",
			resource: "remote_upload",
			resourceId: job.id,
		})
		return { job: updated }
	}
}
