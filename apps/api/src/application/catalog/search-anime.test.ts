import { describe, expect, it, vi } from "vitest"
import type { AnimeRepository } from "#/domain/catalog/anime-repository.ts"
import type { AnimeListItem } from "#/domain/catalog/anime.ts"
import { makeSearchAnime } from "./search-anime.ts"

const context = { session: null, headers: new Headers() }
const local: AnimeListItem = {
	id: "local",
	title: "Mushoku Tensei Local",
	slug: "mushoku-tensei-local",
	coverImageUrl: null,
	bannerImageUrl: null,
	status: "published",
	releaseYear: null,
	contentRating: "teen",
}
const remote: AnimeListItem = {
	...local,
	id: "remote",
	title: "Mushoku Tensei",
	slug: "mushoku-tensei-anoboy",
}

describe("catalog anime search", () => {
	it("combines local results with newly ingested provider results", async () => {
		const searchPublished = vi
			.fn()
			.mockResolvedValueOnce([local])
			.mockResolvedValueOnce([remote, local])
		const discover = vi.fn().mockResolvedValue(1)
		const search = makeSearchAnime({
			animeRepo: { searchPublished } as unknown as AnimeRepository,
			discover,
		})

		await expect(
			search({ query: "mushoku", limit: 24 }, context),
		).resolves.toEqual({ anime: [remote, local] })
		expect(discover).toHaveBeenCalledWith("mushoku")
		expect(searchPublished).toHaveBeenCalledTimes(2)
	})

	it("keeps local results when provider discovery fails", async () => {
		const searchPublished = vi.fn().mockResolvedValue([local])
		const discover = vi
			.fn()
			.mockRejectedValue(new Error("provider unavailable"))
		const search = makeSearchAnime({
			animeRepo: { searchPublished } as unknown as AnimeRepository,
			discover,
		})

		await expect(
			search({ query: "mushoku", limit: 24 }, context),
		).resolves.toEqual({ anime: [local] })
	})

	it("does not call a provider for a one-character query", async () => {
		const discover = vi.fn()
		const search = makeSearchAnime({
			animeRepo: {
				searchPublished: vi.fn().mockResolvedValue([]),
			} as unknown as AnimeRepository,
			discover,
		})
		await search({ query: "m", limit: 24 }, context)
		expect(discover).not.toHaveBeenCalled()
	})
})
