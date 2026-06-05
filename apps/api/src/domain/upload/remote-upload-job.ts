export type RemoteUploadSourceType = "url" | "drive"

export type RemoteUploadStatus =
	| "pending"
	| "downloading"
	| "extracting"
	| "scanned"
	| "uploading"
	| "completed"
	| "failed"
	| "canceled"

export type RemoteUploadFileStatus =
	| "pending"
	| "uploading"
	| "done"
	| "failed"
	| "skipped"

export interface RemoteUploadFile {
	relPath: string
	sizeBytes: number
	suggestedNumber: number | null
	episodeNumber: number | null
	episodeId: string | null
	uploadStatus: RemoteUploadFileStatus
	bytesSent: number
	bunnyVideoId: string | null
	error: string | null
}

export interface RemoteUploadJob {
	id: string
	seasonId: string
	animeId: string
	sourceType: RemoteUploadSourceType
	sourceUrl: string
	isArchive: boolean
	status: RemoteUploadStatus
	error: string | null
	workDir: string | null
	bytesDownloaded: number
	bytesTotal: number
	files: RemoteUploadFile[]
	createdBy: string | null
	createdAt: Date
	updatedAt: Date
}

export interface NewRemoteUploadJob {
	seasonId: string
	animeId: string
	sourceType: RemoteUploadSourceType
	sourceUrl: string
	isArchive: boolean
	createdBy?: string | null
}

export interface RemoteUploadJobUpdate {
	status?: RemoteUploadStatus
	error?: string | null
	workDir?: string | null
	bytesDownloaded?: number
	bytesTotal?: number
	files?: RemoteUploadFile[]
}
