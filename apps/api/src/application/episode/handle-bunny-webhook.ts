import type { ActivityRepository } from "#/domain/activity/activity-repository.ts"
import type { EpisodeRepository } from "#/domain/catalog/episode-repository.ts"
import type { SeasonRepository } from "#/domain/catalog/season-repository.ts"
import { bunnyStatusToEpisodeStatus } from "#/infrastructure/bunny/status.ts"
import { resolveReadyStatus } from "./resolve-ready-status.ts"

export interface HandleBunnyWebhookInput {
	videoGuid: string
	status: number
}

export interface HandleBunnyWebhookDeps {
	episodeRepo: EpisodeRepository
	seasonRepo: SeasonRepository
	activityRepo: ActivityRepository
}

export function makeHandleBunnyWebhook(deps: HandleBunnyWebhookDeps) {
	return async (input: HandleBunnyWebhookInput) => {
		const existing = await deps.episodeRepo.findByBunnyVideoId(input.videoGuid)
		if (!existing) return { updated: false as const }
		const { status, publishedAt } = await resolveReadyStatus(
			deps.seasonRepo,
			existing.seasonId,
			bunnyStatusToEpisodeStatus(input.status),
		)
		if (status === existing.status) return { updated: false as const }
		await deps.episodeRepo.setStatus(existing.id, status, publishedAt)
		await deps.activityRepo.insert({
			userId: null,
			action: "webhook-status",
			resource: "episode",
			resourceId: existing.id,
			metadata: {
				from: existing.status,
				to: status,
				bunnyStatus: input.status,
			},
		})
		return { updated: true as const }
	}
}
