import type { EpisodeStatus } from "#/domain/catalog/episode.ts"
import type { SeasonRepository } from "#/domain/catalog/season-repository.ts"

export interface ResolvedStatus {
	status: EpisodeStatus
	publishedAt?: Date
}

/**
 * When an episode finishes encoding ("ready") and its season has
 * `autoPublish` enabled, promote it straight to "published". Otherwise the
 * status passes through unchanged.
 */
export async function resolveReadyStatus(
	seasonRepo: SeasonRepository,
	seasonId: string,
	status: EpisodeStatus,
): Promise<ResolvedStatus> {
	if (status !== "ready") return { status }
	const season = await seasonRepo.findById(seasonId)
	if (!season?.autoPublish) return { status }
	return { status: "published", publishedAt: new Date() }
}
