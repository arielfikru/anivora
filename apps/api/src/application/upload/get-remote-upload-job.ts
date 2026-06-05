import type { RemoteUploadJobRepository } from "#/domain/upload/remote-upload-job-repository.ts"
import type { AuthedContext } from "../shared/context.ts"
import { notFound } from "../shared/errors.ts"

export interface GetRemoteUploadJobInput {
	jobId: string
}

export interface GetRemoteUploadJobDeps {
	jobRepo: RemoteUploadJobRepository
}

export function makeGetRemoteUploadJob(deps: GetRemoteUploadJobDeps) {
	return async (input: GetRemoteUploadJobInput, _ctx: AuthedContext) => {
		const job = await deps.jobRepo.findById(input.jobId)
		if (!job) throw notFound("Upload job not found")
		return { job }
	}
}
