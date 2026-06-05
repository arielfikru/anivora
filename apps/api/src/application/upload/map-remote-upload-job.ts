import type { ActivityRepository } from "#/domain/activity/activity-repository.ts"
import type { AnimeRepository } from "#/domain/catalog/anime-repository.ts"
import type { Episode } from "#/domain/catalog/episode.ts"
import type { EpisodeRepository } from "#/domain/catalog/episode-repository.ts"
import type { SeasonRepository } from "#/domain/catalog/season-repository.ts"
import type { RemoteUploadJobRepository } from "#/domain/upload/remote-upload-job-repository.ts"
import type { RemoteUploadFile } from "#/domain/upload/remote-upload-job.ts"
import type { AuthedContext } from "../shared/context.ts"
import { badRequest, notFound } from "../shared/errors.ts"

export interface RemoteUploadMapping {
	relPath: string
	episodeNumber: number
}

export interface MapRemoteUploadJobInput {
	jobId: string
	mappings: RemoteUploadMapping[]
}

export interface MapRemoteUploadJobDeps {
	jobRepo: RemoteUploadJobRepository
	episodeRepo: EpisodeRepository
	seasonRepo: SeasonRepository
	animeRepo: AnimeRepository
	activityRepo: ActivityRepository
}

const pad = (n: number) => String(n).padStart(2, "0")

export function makeMapRemoteUploadJob(deps: MapRemoteUploadJobDeps) {
	return async (input: MapRemoteUploadJobInput, ctx: AuthedContext) => {
		const job = await deps.jobRepo.findById(input.jobId)
		if (!job) throw notFound("Upload job not found")
		if (job.status !== "scanned")
			throw badRequest(`Job is not ready for mapping (status: ${job.status})`)

		const season = await deps.seasonRepo.findById(job.seasonId)
		if (!season) throw notFound("Season not found")
		const anime = await deps.animeRepo.findById(season.animeId)
		if (!anime) throw notFound("Anime not found")

		const existing = await deps.episodeRepo.listBySeason(season.id)
		const byNumber = new Map<number, Episode>(
			existing.map((e) => [e.episodeNumber, e]),
		)
		const wanted = new Map(
			input.mappings.map((m) => [m.relPath, m.episodeNumber]),
		)

		const files: RemoteUploadFile[] = []
		for (const file of job.files) {
			const number = wanted.get(file.relPath)
			if (number == null) {
				files.push({
					...file,
					episodeNumber: null,
					episodeId: null,
					uploadStatus: "skipped",
				})
				continue
			}

			let episode = byNumber.get(number)
			if (!episode) {
				const code = `S${pad(season.seasonNumber)}E${pad(number)}`
				episode = await deps.episodeRepo.create({
					animeId: anime.id,
					seasonId: season.id,
					episodeNumber: number,
					episodeCode: code,
					slug: `${anime.slug}-${code.toLowerCase()}`,
				})
				byNumber.set(number, episode)
			}

			files.push({
				...file,
				episodeNumber: number,
				episodeId: episode.id,
				uploadStatus: "pending",
			})
		}

		if (!files.some((f) => f.episodeId))
			throw badRequest("Assign at least one file to an episode")

		const updated = await deps.jobRepo.update(job.id, {
			status: "uploading",
			files,
			error: null,
		})

		await deps.activityRepo.insert({
			userId: ctx.session.user.id,
			action: "update",
			resource: "remote_upload",
			resourceId: job.id,
			metadata: { mapped: files.filter((f) => f.episodeId).length },
		})

		return { job: updated }
	}
}
