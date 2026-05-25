import type { EpisodeStatus } from "#/domain/catalog/episode.ts"

export function bunnyStatusToEpisodeStatus(n: number): EpisodeStatus {
	if (n === 0 || n === 1) return "uploaded"
	if (n === 2 || n === 3) return "processing"
	if (n === 4) return "ready"
	return "failed"
}
