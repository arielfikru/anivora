import { describe, expect, it, vi } from "vitest"
import type { EpisodeRepository } from "#/domain/catalog/episode-repository.ts"
import type { Episode, PublicEpisode } from "#/domain/catalog/episode.ts"
import type { SeasonRepository } from "#/domain/catalog/season-repository.ts"
import { makePreloadNextEpisode } from "./preload-next-episode.ts"

const current: Episode = {
	id: "episode-1",
	animeId: "anime-1",
	seasonId: "season-1",
	episodeNumber: 1,
	episodeCode: "S01E01",
	title: "Episode 1",
	slug: "show-s01e01",
	description: null,
	durationSeconds: null,
	thumbnailUrl: null,
	playbackUrl: null,
	mp4Url: null,
	hlsUrl: null,
	storageProvider: null,
	sourceProvider: "anoboy",
	sourceId: "show-episode-1",
	sourceUrl: "https://anoboy.be/show-episode-1/",
	status: "published",
	publishedAt: null,
	createdAt: new Date(0),
	updatedAt: new Date(0),
}

const next: Episode = {
	...current,
	id: "episode-2",
	episodeNumber: 2,
	episodeCode: "S01E02",
	slug: "show-s01e02",
	sourceId: "show-episode-2",
	sourceUrl: "https://anoboy.be/show-episode-2/",
}

function publicEpisode(episode: Episode, isReady = false): PublicEpisode {
	return {
		id: episode.id,
		episodeNumber: episode.episodeNumber,
		episodeCode: episode.episodeCode,
		title: episode.title,
		slug: episode.slug,
		durationSeconds: episode.durationSeconds,
		thumbnailUrl: episode.thumbnailUrl,
		status: episode.status,
		isReady,
	}
}

function setup() {
	const ensureMirror = vi.fn().mockResolvedValue({
		...next,
		status: "processing",
	})
	const seasonRepo = {
		listPublishedByAnime: vi.fn().mockResolvedValue([
			{
				id: "season-1",
				animeId: "anime-1",
				seasonNumber: 1,
				status: "published",
			},
		]),
	} as unknown as SeasonRepository
	const episodeRepo = {
		listPublicBySeason: vi
			.fn()
			.mockResolvedValue([publicEpisode(current, true), publicEpisode(next)]),
		findById: vi.fn().mockResolvedValue(next),
	} as unknown as EpisodeRepository
	return {
		preload: makePreloadNextEpisode({
			seasonRepo,
			episodeRepo,
			ensureMirror,
		}),
		ensureMirror,
		seasonRepo,
		episodeRepo,
	}
}

describe("preload next episode", () => {
	it("does nothing while the current episode is not playable", async () => {
		const { preload, ensureMirror, seasonRepo } = setup()
		await preload(current)
		expect(seasonRepo.listPublishedByAnime).not.toHaveBeenCalled()
		expect(ensureMirror).not.toHaveBeenCalled()
	})

	it("queues the next not-ready episode after the current one is playable", async () => {
		const { preload, ensureMirror } = setup()
		await preload({ ...current, mp4Url: "https://cdn.example/episode-1.mp4" })
		expect(ensureMirror).toHaveBeenCalledOnce()
		expect(ensureMirror).toHaveBeenCalledWith(next)
	})

	it("does not enqueue a next episode that is already ready", async () => {
		const { preload, ensureMirror, episodeRepo } = setup()
		vi.mocked(episodeRepo.listPublicBySeason).mockResolvedValue([
			publicEpisode(current, true),
			publicEpisode(next, true),
		])
		await preload({
			...current,
			playbackUrl: "https://cdn.example/legacy.m3u8",
		})
		expect(ensureMirror).not.toHaveBeenCalled()
	})

	it("stops quietly when the current episode is the last one", async () => {
		const { preload, ensureMirror, episodeRepo } = setup()
		vi.mocked(episodeRepo.listPublicBySeason).mockResolvedValue([
			publicEpisode(current, true),
		])
		await preload({ ...current, mp4Url: "https://cdn.example/episode-1.mp4" })
		expect(ensureMirror).not.toHaveBeenCalled()
	})
})
