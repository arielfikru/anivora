import type { ActivityRepository } from "#/domain/activity/activity-repository.ts"
import type { AnimeRepository } from "#/domain/catalog/anime-repository.ts"
import type { EpisodeRepository } from "#/domain/catalog/episode-repository.ts"
import type { GenreRepository } from "#/domain/catalog/genre-repository.ts"
import type { SeasonRepository } from "#/domain/catalog/season-repository.ts"
import type { AuthService } from "#/domain/ports/auth-service.ts"
import type { Cache } from "#/domain/ports/cache.ts"
import type { ObjectStorage } from "#/domain/ports/object-storage.ts"
import type { RemoteUploadJobRepository } from "#/domain/upload/remote-upload-job-repository.ts"
import type { UserRepository } from "#/domain/user/user-repository.ts"

import { makeListActivityLogs } from "./activity/list-activity-logs.ts"
import { makeCreateAnime } from "./anime/create-anime.ts"
import { makeDeleteAnime } from "./anime/delete-anime.ts"
import { makeUpdateAnime } from "./anime/update-anime.ts"
import { makeGetSession } from "./auth/get-session.ts"
import { makeGetAnime } from "./catalog/get-anime.ts"
import { makeGetAnimeAdmin } from "./catalog/get-anime-admin.ts"
import { makeGetEpisode } from "./catalog/get-episode.ts"
import { makeGetRelatedAnime } from "./catalog/get-related-anime.ts"
import { makeListAllAnime } from "./catalog/list-all-anime.ts"
import { makeListAnime } from "./catalog/list-anime.ts"
import { makeListGenres } from "./catalog/list-genres.ts"
import { makeSearchAnime } from "./catalog/search-anime.ts"
import { makeBulkCreateEpisodes } from "./episode/bulk-create-episodes.ts"
import { makeCreateEpisode } from "./episode/create-episode.ts"
import { makeDeleteEpisode } from "./episode/delete-episode.ts"
import { makeListEpisodes } from "./episode/list-episodes.ts"
import { makeSetSeasonEpisodesStatus } from "./episode/set-season-episodes-status.ts"
import { makeUpdateEpisode } from "./episode/update-episode.ts"
import { makeUploadEpisodeVideo } from "./episode/upload-episode-video.ts"
import { makeCreateGenre } from "./genre/create-genre.ts"
import { makeDeleteGenre } from "./genre/delete-genre.ts"
import { makeCreateSeason } from "./season/create-season.ts"
import { makeDeleteSeason } from "./season/delete-season.ts"
import { makeListSeasons } from "./season/list-seasons.ts"
import { makeUpdateSeason } from "./season/update-season.ts"
import { makeCancelRemoteUploadJob } from "./upload/cancel-remote-upload-job.ts"
import { makeCleanupWorkDirs } from "./upload/cleanup-work-dirs.ts"
import { makeCreateRemoteUploadJob } from "./upload/create-remote-upload-job.ts"
import { makeGetRemoteUploadJob } from "./upload/get-remote-upload-job.ts"
import { makeListRemoteUploadJobs } from "./upload/list-remote-upload-jobs.ts"
import { makeMapRemoteUploadJob } from "./upload/map-remote-upload-job.ts"
import { makeProcessRemoteUploadJobs } from "./upload/process-remote-upload-jobs.ts"
import { makeBanUser } from "./user/ban-user.ts"
import { makeCreateUser } from "./user/create-user.ts"
import { makeDeleteUser } from "./user/delete-user.ts"
import { makeListUsers } from "./user/list-users.ts"
import { makeSetRole } from "./user/set-role.ts"
import { makeUnbanUser } from "./user/unban-user.ts"
import { makeUpdateUser } from "./user/update-user.ts"

export interface Dependencies {
	userRepo: UserRepository
	activityRepo: ActivityRepository
	animeRepo: AnimeRepository
	seasonRepo: SeasonRepository
	episodeRepo: EpisodeRepository
	genreRepo: GenreRepository
	remoteJobRepo: RemoteUploadJobRepository
	cache: Cache
	auth: AuthService
	objectStorage: ObjectStorage
	uploadWorkDir: string
	remoteUploadMaxBytes?: number
}

function buildCatalog(deps: Dependencies) {
	return {
		listAnime: makeListAnime({ animeRepo: deps.animeRepo }),
		searchAnime: makeSearchAnime({ animeRepo: deps.animeRepo }),
		getAnime: makeGetAnime({
			animeRepo: deps.animeRepo,
			seasonRepo: deps.seasonRepo,
			episodeRepo: deps.episodeRepo,
		}),
		getRelatedAnime: makeGetRelatedAnime({ animeRepo: deps.animeRepo }),
		getEpisode: makeGetEpisode({ episodeRepo: deps.episodeRepo }),
		listGenres: makeListGenres({ genreRepo: deps.genreRepo }),
	}
}

function buildAnime(deps: Dependencies) {
	const shared = { animeRepo: deps.animeRepo, activityRepo: deps.activityRepo }
	return {
		list: makeListAllAnime({ animeRepo: deps.animeRepo }),
		get: makeGetAnimeAdmin({ animeRepo: deps.animeRepo }),
		create: makeCreateAnime({ ...shared, seasonRepo: deps.seasonRepo }),
		update: makeUpdateAnime(shared),
		delete: makeDeleteAnime(shared),
	}
}

function buildSeason(deps: Dependencies) {
	const shared = {
		seasonRepo: deps.seasonRepo,
		activityRepo: deps.activityRepo,
	}
	return {
		list: makeListSeasons({ seasonRepo: deps.seasonRepo }),
		create: makeCreateSeason({ ...shared, animeRepo: deps.animeRepo }),
		update: makeUpdateSeason(shared),
		delete: makeDeleteSeason(shared),
	}
}

function buildEpisode(deps: Dependencies) {
	const shared = {
		episodeRepo: deps.episodeRepo,
		activityRepo: deps.activityRepo,
	}
	return {
		list: makeListEpisodes({ episodeRepo: deps.episodeRepo }),
		create: makeCreateEpisode({
			...shared,
			seasonRepo: deps.seasonRepo,
			animeRepo: deps.animeRepo,
		}),
		bulkCreate: makeBulkCreateEpisodes({
			...shared,
			seasonRepo: deps.seasonRepo,
			animeRepo: deps.animeRepo,
		}),
		update: makeUpdateEpisode(shared),
		delete: makeDeleteEpisode(shared),
		uploadVideo: makeUploadEpisodeVideo({
			...shared,
			seasonRepo: deps.seasonRepo,
			objectStorage: deps.objectStorage,
			workRoot: deps.uploadWorkDir,
		}),
		setSeasonStatus: makeSetSeasonEpisodesStatus(shared),
	}
}

function buildUpload(deps: Dependencies) {
	const shared = {
		jobRepo: deps.remoteJobRepo,
		activityRepo: deps.activityRepo,
	}
	return {
		create: makeCreateRemoteUploadJob({
			...shared,
			seasonRepo: deps.seasonRepo,
		}),
		list: makeListRemoteUploadJobs({ jobRepo: deps.remoteJobRepo }),
		get: makeGetRemoteUploadJob({ jobRepo: deps.remoteJobRepo }),
		map: makeMapRemoteUploadJob({
			...shared,
			episodeRepo: deps.episodeRepo,
			seasonRepo: deps.seasonRepo,
			animeRepo: deps.animeRepo,
		}),
		cancel: makeCancelRemoteUploadJob(shared),
		process: makeProcessRemoteUploadJobs({
			jobRepo: deps.remoteJobRepo,
			episodeRepo: deps.episodeRepo,
			seasonRepo: deps.seasonRepo,
			objectStorage: deps.objectStorage,
			workRoot: deps.uploadWorkDir,
			maxBytes: deps.remoteUploadMaxBytes,
		}),
		cleanupWorkDirs: makeCleanupWorkDirs({
			jobRepo: deps.remoteJobRepo,
			workRoot: deps.uploadWorkDir,
		}),
	}
}

function buildGenre(deps: Dependencies) {
	const shared = { genreRepo: deps.genreRepo, activityRepo: deps.activityRepo }
	return {
		create: makeCreateGenre(shared),
		delete: makeDeleteGenre(shared),
	}
}

function buildUser(deps: Dependencies) {
	const shared = { auth: deps.auth, activityRepo: deps.activityRepo }
	return {
		list: makeListUsers({ userRepo: deps.userRepo }),
		ban: makeBanUser(shared),
		unban: makeUnbanUser(shared),
		setRole: makeSetRole(shared),
		create: makeCreateUser(shared),
		update: makeUpdateUser(shared),
		delete: makeDeleteUser(shared),
	}
}

export function buildUseCases(deps: Dependencies) {
	return {
		auth: { getSession: makeGetSession({ auth: deps.auth }) },
		user: buildUser(deps),
		activity: {
			list: makeListActivityLogs({ activityRepo: deps.activityRepo }),
		},
		catalog: buildCatalog(deps),
		anime: buildAnime(deps),
		season: buildSeason(deps),
		episode: buildEpisode(deps),
		genre: buildGenre(deps),
		upload: buildUpload(deps),
	}
}

export type UseCases = ReturnType<typeof buildUseCases>
