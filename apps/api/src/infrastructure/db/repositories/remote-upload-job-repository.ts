import { and, asc, eq, inArray } from "drizzle-orm"

import type { RemoteUploadJobRepository } from "#/domain/upload/remote-upload-job-repository.ts"
import type {
	RemoteUploadFile,
	RemoteUploadJob,
	RemoteUploadSourceType,
	RemoteUploadStatus,
} from "#/domain/upload/remote-upload-job.ts"
import type { Db } from "../client.ts"
import * as schema from "../schema.ts"

type Row = typeof schema.remoteUploadJob.$inferSelect

function toJob(row: Row): RemoteUploadJob {
	return {
		id: row.id,
		seasonId: row.seasonId,
		animeId: row.animeId,
		sourceType: row.sourceType as RemoteUploadSourceType,
		sourceProvider: row.sourceProvider,
		sourceUrl: row.sourceUrl,
		targetEpisodeId: row.targetEpisodeId,
		isArchive: row.isArchive,
		status: row.status as RemoteUploadStatus,
		error: row.error,
		workDir: row.workDir,
		bytesDownloaded: row.bytesDownloaded,
		bytesTotal: row.bytesTotal,
		files: JSON.parse(row.files) as RemoteUploadFile[],
		createdBy: row.createdBy,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
	}
}

export function createRemoteUploadJobRepository(
	db: Db,
): RemoteUploadJobRepository {
	return {
		async create(data) {
			const row = await db
				.insert(schema.remoteUploadJob)
				.values({
					id: crypto.randomUUID(),
					seasonId: data.seasonId,
					animeId: data.animeId,
					sourceType: data.sourceType,
					sourceProvider: data.sourceProvider ?? null,
					sourceUrl: data.sourceUrl,
					targetEpisodeId: data.targetEpisodeId ?? null,
					isArchive: data.isArchive,
					createdBy: data.createdBy ?? null,
				})
				.returning()
				.then((r) => r[0])
			return toJob(row)
		},

		async findById(id) {
			const row = await db
				.select()
				.from(schema.remoteUploadJob)
				.where(eq(schema.remoteUploadJob.id, id))
				.limit(1)
				.then((r) => r[0])
			return row ? toJob(row) : null
		},

		async listBySeason(seasonId) {
			const rows = await db
				.select()
				.from(schema.remoteUploadJob)
				.where(eq(schema.remoteUploadJob.seasonId, seasonId))
				.orderBy(asc(schema.remoteUploadJob.createdAt))
			return rows.map(toJob)
		},

		async findActiveByTargetEpisode(episodeId) {
			const row = await db
				.select()
				.from(schema.remoteUploadJob)
				.where(
					and(
						eq(schema.remoteUploadJob.targetEpisodeId, episodeId),
						inArray(schema.remoteUploadJob.status, [
							"pending",
							"downloading",
							"extracting",
							"scanned",
							"uploading",
						]),
					),
				)
				.orderBy(asc(schema.remoteUploadJob.createdAt))
				.limit(1)
				.then((r) => r[0])
			return row ? toJob(row) : null
		},

		async update(id, data) {
			const set: Record<string, unknown> = { updatedAt: new Date() }
			if (data.status !== undefined) set.status = data.status
			if (data.error !== undefined) set.error = data.error
			if (data.workDir !== undefined) set.workDir = data.workDir
			if (data.bytesDownloaded !== undefined)
				set.bytesDownloaded = data.bytesDownloaded
			if (data.bytesTotal !== undefined) set.bytesTotal = data.bytesTotal
			if (data.files !== undefined) set.files = JSON.stringify(data.files)
			const row = await db
				.update(schema.remoteUploadJob)
				.set(set)
				.where(eq(schema.remoteUploadJob.id, id))
				.returning()
				.then((r) => r[0])
			return row ? toJob(row) : null
		},

		async claimNext(statuses) {
			if (statuses.length === 0) return null
			const row = await db
				.select()
				.from(schema.remoteUploadJob)
				.where(inArray(schema.remoteUploadJob.status, statuses))
				.orderBy(asc(schema.remoteUploadJob.updatedAt))
				.limit(1)
				.then((r) => r[0])
			return row ? toJob(row) : null
		},

		async delete(id) {
			const rows = await db
				.delete(schema.remoteUploadJob)
				.where(eq(schema.remoteUploadJob.id, id))
				.returning({ id: schema.remoteUploadJob.id })
			return rows.length > 0
		},
	}
}
