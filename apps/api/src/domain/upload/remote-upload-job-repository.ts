import type {
	NewRemoteUploadJob,
	RemoteUploadJob,
	RemoteUploadJobUpdate,
	RemoteUploadStatus,
} from "./remote-upload-job.ts"

export interface RemoteUploadJobRepository {
	create(data: NewRemoteUploadJob): Promise<RemoteUploadJob>
	findById(id: string): Promise<RemoteUploadJob | null>
	listBySeason(seasonId: string): Promise<RemoteUploadJob[]>
	update(
		id: string,
		data: RemoteUploadJobUpdate,
	): Promise<RemoteUploadJob | null>
	/** Oldest job in any of the given statuses — the worker's pickup queue. */
	claimNext(statuses: RemoteUploadStatus[]): Promise<RemoteUploadJob | null>
	delete(id: string): Promise<boolean>
}
