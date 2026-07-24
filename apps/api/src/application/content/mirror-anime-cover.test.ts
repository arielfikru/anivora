import { describe, expect, it, vi } from "vitest"
import type { AnimeRepository } from "#/domain/catalog/anime-repository.ts"
import type { Anime } from "#/domain/catalog/anime.ts"
import type { ObjectStorage } from "#/domain/ports/object-storage.ts"
import {
	animeCoverKey,
	animeCoverPath,
	makeMirrorAnimeCover,
} from "./mirror-anime-cover.ts"

const anime: Anime = {
	id: "0f172acd-1f23-4c12-aade-123456789abc",
	title: "Mirror Test",
	slug: "mirror-test",
	description: null,
	coverImageUrl: "https://provider.example/poster.jpg",
	bannerImageUrl: null,
	status: "published",
	contentRating: "teen",
	studioName: null,
	creatorName: null,
	releaseYear: null,
	rightsOwnerName: null,
	licenseType: null,
	permissionDocumentUrl: null,
	isOriginalContent: false,
	isFanmade: false,
	requiresAttribution: true,
	attributionText: null,
	sourceProvider: "anoboy",
	sourceId: "mirror-test",
	sourceUrl: "https://provider.example/anime/mirror-test/",
	createdAt: new Date(0),
	updatedAt: new Date(0),
}

describe("anime cover mirror", () => {
	it("downloads artwork once and stores a same-origin path", async () => {
		const setCoverImageUrl = vi.fn().mockResolvedValue(undefined)
		const putBytes = vi.fn().mockResolvedValue(undefined)
		const fetcher = vi.fn().mockResolvedValue(
			new Response(new Uint8Array([1, 2, 3]), {
				status: 200,
				headers: { "content-type": "image/jpeg" },
			}),
		)
		const mirror = makeMirrorAnimeCover({
			animeRepo: { setCoverImageUrl } as unknown as AnimeRepository,
			objectStorage: { putBytes } as unknown as ObjectStorage,
			fetcher,
		})

		await expect(mirror(anime)).resolves.toBe(true)
		expect(putBytes).toHaveBeenCalledWith(
			animeCoverKey(anime.id),
			expect.any(Uint8Array),
			"image/jpeg",
		)
		expect(setCoverImageUrl).toHaveBeenCalledWith(
			anime.id,
			animeCoverPath(anime.id),
		)
	})

	it("does not redownload an already mirrored cover", async () => {
		const fetcher = vi.fn()
		const mirror = makeMirrorAnimeCover({
			animeRepo: {} as AnimeRepository,
			objectStorage: {} as ObjectStorage,
			fetcher,
		})
		await expect(
			mirror({ ...anime, coverImageUrl: animeCoverPath(anime.id) }),
		).resolves.toBe(false)
		expect(fetcher).not.toHaveBeenCalled()
	})
})
