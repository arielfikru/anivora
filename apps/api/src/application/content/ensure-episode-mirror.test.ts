import { describe, expect, it, vi } from "vitest"
import type { Episode } from "#/domain/catalog/episode.ts"
import type { EpisodeRepository } from "#/domain/catalog/episode-repository.ts"
import type { RemoteUploadJobRepository } from "#/domain/upload/remote-upload-job-repository.ts"
import { ContentProviderRegistry } from "#/infrastructure/content/providers/provider.ts"
import { makeEnsureEpisodeMirror } from "./ensure-episode-mirror.ts"

const episode: Episode = {
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

describe("ensure episode mirror", () => {
	it("atomically claims and queues a first-watch episode", async () => {
		const create = vi.fn().mockResolvedValue({})
		const episodeRepo = {
			claimForMirror: vi
				.fn()
				.mockResolvedValue({ ...episode, status: "processing" }),
			setStatus: vi.fn(),
			findById: vi.fn(),
		} as unknown as EpisodeRepository
		const jobRepo = {
			findActiveByTargetEpisode: vi.fn().mockResolvedValue(null),
			create,
		} as unknown as RemoteUploadJobRepository
		const providers = new ContentProviderRegistry([
			{
				id: "anoboy",
				listAnime: vi.fn(),
				getAnime: vi.fn(),
				resolveEpisodeMedia: vi.fn(),
			},
		])
		const ensure = makeEnsureEpisodeMirror({
			episodeRepo,
			jobRepo,
			providers,
		})
		const result = await ensure(episode)
		expect(result.status).toBe("processing")
		expect(create).toHaveBeenCalledWith(
			expect.objectContaining({
				sourceType: "mirror",
				sourceProvider: "anoboy",
				targetEpisodeId: "episode-1",
			}),
		)
	})

	it("does not queue another job while processing", async () => {
		const create = vi.fn()
		const ensure = makeEnsureEpisodeMirror({
			episodeRepo: {} as EpisodeRepository,
			jobRepo: { create } as unknown as RemoteUploadJobRepository,
			providers: new ContentProviderRegistry([]),
		})
		await ensure({ ...episode, status: "processing" })
		expect(create).not.toHaveBeenCalled()
	})
})
