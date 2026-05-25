import type { ActivityRepository } from "#/domain/activity/activity-repository.ts"
import type { EpisodeRepository } from "#/domain/catalog/episode-repository.ts"
import type { BunnyService, DirectUploadTicket } from "#/domain/ports/bunny.ts"
import type { AuthedContext } from "../shared/context.ts"
import { notFound } from "../shared/errors.ts"
import { buildBunnyUrls } from "./bunny-urls.ts"

export interface CreateUploadTicketInput {
	episodeId: string
}

export interface CreateUploadTicketDeps {
	episodeRepo: EpisodeRepository
	activityRepo: ActivityRepository
	bunny: BunnyService
}

export function makeCreateUploadTicket(deps: CreateUploadTicketDeps) {
	return async (
		input: CreateUploadTicketInput,
		ctx: AuthedContext,
	): Promise<DirectUploadTicket> => {
		const existing = await deps.episodeRepo.findById(input.episodeId)
		if (!existing) throw notFound("Episode not found")
		const title = existing.title ?? existing.episodeCode
		const ticket = await deps.bunny.createDirectUpload(title)
		const episode = await deps.episodeRepo.attachBunny(input.episodeId, {
			bunnyVideoId: ticket.videoId,
			bunnyLibraryId: ticket.libraryId,
			...buildBunnyUrls(deps.bunny, ticket.videoId),
			status: "processing",
		})
		if (!episode) throw notFound("Episode not found")
		await deps.activityRepo.insert({
			userId: ctx.session.user.id,
			action: "upload",
			resource: "episode",
			resourceId: episode.id,
			metadata: { videoId: ticket.videoId, mode: "direct" },
		})
		return ticket
	}
}
