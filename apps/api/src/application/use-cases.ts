import type { ActivityRepository } from "#/domain/activity/activity-repository.ts"
import type { AnimeRepository } from "#/domain/catalog/anime-repository.ts"
import type { EpisodeRepository } from "#/domain/catalog/episode-repository.ts"
import type { GenreRepository } from "#/domain/catalog/genre-repository.ts"
import type { SeasonRepository } from "#/domain/catalog/season-repository.ts"
import type { AuthService } from "#/domain/ports/auth-service.ts"
import type { BunnyService } from "#/domain/ports/bunny.ts"
import type { Cache } from "#/domain/ports/cache.ts"
import type { UserRepository } from "#/domain/user/user-repository.ts"

import { makeListActivityLogs } from "./activity/list-activity-logs.ts"
import { makeCreateAnime } from "./anime/create-anime.ts"
import { makeDeleteAnime } from "./anime/delete-anime.ts"
import { makeUpdateAnime } from "./anime/update-anime.ts"
import { makeGetSession } from "./auth/get-session.ts"
import { makeGetAnime } from "./catalog/get-anime.ts"
import { makeGetAnimeAdmin } from "./catalog/get-anime-admin.ts"
import { makeGetEpisode } from "./catalog/get-episode.ts"
import { makeListAllAnime } from "./catalog/list-all-anime.ts"
import { makeListAnime } from "./catalog/list-anime.ts"
import { makeListGenres } from "./catalog/list-genres.ts"
import { makeSearchAnime } from "./catalog/search-anime.ts"
import { makeAttachBunnyVideo } from "./episode/attach-bunny-video.ts"
import { makeBulkCreateEpisodes } from "./episode/bulk-create-episodes.ts"
import { makeCreateEpisode } from "./episode/create-episode.ts"
import { makeCreateUploadTicket } from "./episode/create-upload-ticket.ts"
import { makeDeleteEpisode } from "./episode/delete-episode.ts"
import { makeHandleBunnyWebhook } from "./episode/handle-bunny-webhook.ts"
import { makeListEpisodes } from "./episode/list-episodes.ts"
import { makePollProcessingEpisodes } from "./episode/poll-processing-episodes.ts"
import { makeSetSeasonEpisodesStatus } from "./episode/set-season-episodes-status.ts"
import { makeSyncEpisodeStatus } from "./episode/sync-episode-status.ts"
import { makeUpdateEpisode } from "./episode/update-episode.ts"
import { makeUploadEpisodeVideo } from "./episode/upload-episode-video.ts"
import { makeCreateGenre } from "./genre/create-genre.ts"
import { makeDeleteGenre } from "./genre/delete-genre.ts"
import { makeCreateSeason } from "./season/create-season.ts"
import { makeDeleteSeason } from "./season/delete-season.ts"
import { makeListSeasons } from "./season/list-seasons.ts"
import { makeUpdateSeason } from "./season/update-season.ts"
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
	cache: Cache
	auth: AuthService
	bunny: BunnyService
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
		getEpisode: makeGetEpisode({ episodeRepo: deps.episodeRepo }),
		listGenres: makeListGenres({ genreRepo: deps.genreRepo }),
	}
}

function buildAnime(deps: Dependencies) {
	const shared = { animeRepo: deps.animeRepo, activityRepo: deps.activityRepo }
	return {
		list: makeListAllAnime({ animeRepo: deps.animeRepo }),
		get: makeGetAnimeAdmin({ animeRepo: deps.animeRepo }),
		create: makeCreateAnime(shared),
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
	const withBunny = { ...shared, bunny: deps.bunny }
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
		uploadVideo: makeUploadEpisodeVideo(withBunny),
		createUpload: makeCreateUploadTicket(withBunny),
		attachBunny: makeAttachBunnyVideo(withBunny),
		syncStatus: makeSyncEpisodeStatus(withBunny),
		setSeasonStatus: makeSetSeasonEpisodesStatus(shared),
		handleWebhook: makeHandleBunnyWebhook(shared),
		pollProcessing: makePollProcessingEpisodes({
			episodeRepo: deps.episodeRepo,
			bunny: deps.bunny,
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
	}
}

export type UseCases = ReturnType<typeof buildUseCases>
