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
			bunny,
		} as never)

		const result = await poll()

		expect(result).toEqual({ updated: 1 })
		expect(episodeRepo.setStatus).toHaveBeenCalledTimes(1)
		expect(episodeRepo.setStatus).toHaveBeenCalledWith("a", "ready")
	})

	it("skips episodes without a bunny video", async () => {
		const episodeRepo = {
			listByStatus: vi
				.fn()
				.mockResolvedValue([makeEpisode({ bunnyVideoId: null })]),
			setStatus: vi.fn(),
		}
		const bunny = { getVideoStatus: vi.fn() }
		const poll = makePollProcessingEpisodes({ episodeRepo, bunny } as never)

		const result = await poll()

		expect(result).toEqual({ updated: 0 })
		expect(bunny.getVideoStatus).not.toHaveBeenCalled()
	})
})
