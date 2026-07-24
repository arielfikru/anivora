import type { Episode } from "#/domain/catalog/episode.ts"
import type { EpisodeRepository } from "#/domain/catalog/episode-repository.ts"
import type { RemoteUploadJobRepository } from "#/domain/upload/remote-upload-job-repository.ts"
import type { ContentProviderRegistry } from "#/infrastructure/content/providers/provider.ts"

export interface EnsureEpisodeMirrorDeps {
	episodeRepo: EpisodeRepository
	jobRepo: RemoteUploadJobRepository
	providers: ContentProviderRegistry
}

export function makeEnsureEpisodeMirror(deps: EnsureEpisodeMirrorDeps) {
	return async (episode: Episode): Promise<Episode> => {
		if (episode.mp4Url || episode.playbackUrl) return episode
		if (!episode.sourceProvider || !episode.sourceUrl) return episode
		if (episode.status === "failed") return episode
		if (episode.status === "processing") return episode
		if (!deps.providers.get(episode.sourceProvider)) {
			return (await deps.episodeRepo.setStatus(episode.id, "failed")) ?? episode
		}
		if (episode.status !== "published") return episode
		const active = await deps.jobRepo.findActiveByTargetEpisode(episode.id)
		if (active)
			return (
				(await deps.episodeRepo.setStatus(episode.id, "processing")) ?? episode
			)
		const claimed = await deps.episodeRepo.claimForMirror(episode.id)
		if (!claimed)
			return (await deps.episodeRepo.findById(episode.id)) ?? episode
		try {
			await deps.jobRepo.create({
				seasonId: episode.seasonId,
				animeId: episode.animeId,
				sourceType: "mirror",
				sourceProvider: episode.sourceProvider,
				sourceUrl: episode.sourceUrl,
				targetEpisodeId: episode.id,
				isArchive: false,
			})
			return claimed
		} catch (err) {
			await deps.episodeRepo.setStatus(episode.id, "failed")
			throw err
		}
	}
}
