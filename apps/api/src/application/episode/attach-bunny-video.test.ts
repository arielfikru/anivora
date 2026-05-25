import { describe, expect, it, vi } from "vitest"

import type { Episode } from "#/domain/catalog/episode.ts"
import type { Session } from "#/domain/session/session.ts"
import type { AuthedContext } from "../shared/context.ts"
import { AppError } from "../shared/errors.ts"
import { makeAttachBunnyVideo } from "./attach-bunny-video.ts"

const makeSession = (): Session => ({
	user: {
		id: "admin-1",
		email: "a@x",
		name: "Admin",
		role: "admin",
		banned: false,
		emailVerified: true,
		createdAt: new Date(),
		updatedAt: new Date(),
	},
	session: {
		id: "s1",
		token: "t",
		userId: "admin-1",
		expiresAt: new Date(Date.now() + 3600_000),
	},
})

const makeCtx = (): AuthedContext => ({
	session: makeSession(),
	headers: new Headers(),
})

const makeEpisode = (): Episode => ({
	id: "ep-1",
	animeId: "an-1",
	seasonId: "se-1",
	episodeNumber: 1,
	episodeCode: "S01E01",
	title: null,
	slug: "x-s01e01",
	description: null,
	durationSeconds: null,
	thumbnailUrl: null,
	bunnyVideoId: "vid-1",
	bunnyLibraryId: "lib-1",
	playbackUrl: null,
	embedUrl: null,
	status: "processing",
	publishedAt: null,
	createdAt: new Date(),
	updatedAt: new Date(),
})

const makeDeps = () => {
	const bunny = {
		buildEmbedUrl: vi.fn((v: string) => `embed/${v}`),
		buildPlaybackUrl: vi.fn((v: string) => `play/${v}`),
		buildThumbnailUrl: vi.fn((v: string) => `thumb/${v}`),
	}
	const episodeRepo = { attachBunny: vi.fn().mockResolvedValue(makeEpisode()) }
	const activityRepo = { insert: vi.fn(), list: vi.fn() }
	return { bunny, episodeRepo, activityRepo }
}

describe("makeAttachBunnyVideo", () => {
	it("attaches computed urls and audits", async () => {
		const deps = makeDeps()
		const attach = makeAttachBunnyVideo(deps as never)
		const result = await attach(
			{ episodeId: "ep-1", bunnyVideoId: "vid-1", bunnyLibraryId: "lib-1" },
			makeCtx(),
		)

		expect(result.episode.id).toBe("ep-1")
		expect(deps.episodeRepo.attachBunny).toHaveBeenCalledWith("ep-1", {
			bunnyVideoId: "vid-1",
			bunnyLibraryId: "lib-1",
			embedUrl: "embed/vid-1",
			playbackUrl: "play/vid-1",
			thumbnailUrl: "thumb/vid-1",
			status: "processing",
		})
		expect(deps.activityRepo.insert).toHaveBeenCalledWith(
			expect.objectContaining({ action: "attach-bunny", resourceId: "ep-1" }),
		)
	})

	it("throws when episode is missing", async () => {
		const deps = makeDeps()
		deps.episodeRepo.attachBunny.mockResolvedValue(null)
		const attach = makeAttachBunnyVideo(deps as never)

		await expect(
			attach(
				{ episodeId: "missing", bunnyVideoId: "v", bunnyLibraryId: "l" },
				makeCtx(),
			),
		).rejects.toBeInstanceOf(AppError)
		expect(deps.activityRepo.insert).not.toHaveBeenCalled()
	})
})
