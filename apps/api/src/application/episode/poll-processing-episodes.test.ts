import { describe, expect, it, vi } from "vitest"

import type { Episode } from "#/domain/catalog/episode.ts"
import { makePollProcessingEpisodes } from "./poll-processing-episodes.ts"

const makeEpisode = (over: Partial<Episode>): Episode => ({
	id: "ep",
	animeId: "an",
	seasonId: "se",
	episodeNumber: 1,
	episodeCode: "S01E01",
	title: null,
	slug: "x",
	description: null,
	durationSeconds: null,
	thumbnailUrl: null,
	bunnyVideoId: "vid",
	bunnyLibraryId: "lib",
	playbackUrl: null,
	embedUrl: null,
	status: "processing",
	publishedAt: null,
	createdAt: new Date(),
	updatedAt: new Date(),
	...over,
})

const seasonRepoWith = (autoPublish: boolean) => ({
	findById: vi.fn().mockResolvedValue({ id: "se", autoPublish }),
})

describe("makePollProcessingEpisodes", () => {
	it("syncs changed episodes and counts updates", async () => {
		const episodes = [
			makeEpisode({ id: "a", bunnyVideoId: "va", status: "processing" }),
			makeEpisode({ id: "b", bunnyVideoId: "vb", status: "processing" }),
		]
		const episodeRepo = {
			listByStatus: vi.fn().mockResolvedValue(episodes),
			setStatus: vi.fn(),
		}
		const bunny = {
			getVideoStatus: vi.fn(async (v: string) => (v === "va" ? 4 : 2)),
		}
		const poll = makePollProcessingEpisodes({
			episodeRepo,
			seasonRepo: seasonRepoWith(false),
			bunny,
		} as never)

		const result = await poll()

		expect(result).toEqual({ updated: 1 })
		expect(episodeRepo.setStatus).toHaveBeenCalledTimes(1)
		expect(episodeRepo.setStatus).toHaveBeenCalledWith("a", "ready", undefined)
	})

	it("auto-publishes ready episodes when the season opts in", async () => {
		const episodeRepo = {
			listByStatus: vi
				.fn()
				.mockResolvedValue([makeEpisode({ id: "a", status: "processing" })]),
			setStatus: vi.fn(),
		}
		const bunny = { getVideoStatus: vi.fn(async () => 4) }
		const poll = makePollProcessingEpisodes({
			episodeRepo,
			seasonRepo: seasonRepoWith(true),
			bunny,
		} as never)

		const result = await poll()

		expect(result).toEqual({ updated: 1 })
		const [id, status, publishedAt] = episodeRepo.setStatus.mock.calls[0]
		expect(id).toBe("a")
		expect(status).toBe("published")
		expect(publishedAt).toBeInstanceOf(Date)
	})

	it("skips episodes without a bunny video", async () => {
		const episodeRepo = {
			listByStatus: vi
				.fn()
				.mockResolvedValue([makeEpisode({ bunnyVideoId: null })]),
			setStatus: vi.fn(),
		}
		const bunny = { getVideoStatus: vi.fn() }
		const poll = makePollProcessingEpisodes({
			episodeRepo,
			seasonRepo: seasonRepoWith(false),
			bunny,
		} as never)

		const result = await poll()

		expect(result).toEqual({ updated: 0 })
		expect(bunny.getVideoStatus).not.toHaveBeenCalled()
	})
})
