import type { RemoteUploadJobRepository } from "#/domain/upload/remote-upload-job-repository.ts"
import type { AuthedContext } from "../shared/context.ts"

export interface ListRemoteUploadJobsInput {
	seasonId: string
}

export interface ListRemoteUploadJobsDeps {
	jobRepo: RemoteUploadJobRepository
}

export function makeListRemoteUploadJobs(deps: ListRemoteUploadJobsDeps) {
	return async (input: ListRemoteUploadJobsInput, _ctx: AuthedContext) => {
		const jobs = await deps.jobRepo.listBySeason(input.seasonId)
		return { jobs }
	}
}
