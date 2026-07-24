import type { Anime } from "#/domain/catalog/anime.ts"
import type { AnimeRepository } from "#/domain/catalog/anime-repository.ts"
import type { EpisodeRepository } from "#/domain/catalog/episode-repository.ts"
import type { GenreRepository } from "#/domain/catalog/genre-repository.ts"
import type { SeasonRepository } from "#/domain/catalog/season-repository.ts"
import type { ObjectStorage } from "#/domain/ports/object-storage.ts"
import type {
	ContentProvider,
	ContentProviderRegistry,
	ProviderAnime,
	ProviderAnimeSummary,
	ProviderPage,
} from "#/infrastructure/content/providers/provider.ts"
import { logger } from "#/infrastructure/observability/logger.ts"
import type { ContentSyncStateStore } from "#/infrastructure/content/sync-state.ts"
import { slugify } from "../shared/slug.ts"
import { makeMirrorAnimeCover } from "./mirror-anime-cover.ts"

export interface ContentSyncOptions {
	initialPages: number
	dailyPages: number
	rightsOwnerName: string
	licenseType: string
	permissionDocumentUrl?: string
}

export interface SyncContentProvidersDeps {
	animeRepo: AnimeRepository
	seasonRepo: SeasonRepository
	episodeRepo: EpisodeRepository
	genreRepo: GenreRepository
	providers: ContentProviderRegistry
	syncState: ContentSyncStateStore
	objectStorage: ObjectStorage
	options: ContentSyncOptions
}

export interface ContentSyncResult {
	providers: number
	pages: number
	animeCreated: number
	episodesCreated: number
	coversMirrored: number
}

export interface ContentSyncInput {
	mode: "startup" | "daily"
}

const pad = (value: number) => String(value).padStart(2, "0")

export function makeSyncContentProviders(deps: SyncContentProvidersDeps) {
	const mirrorCover = makeMirrorAnimeCover(deps)
	async function uniqueAnimeSlug(
		title: string,
		provider: string,
	): Promise<string> {
		const base = slugify(title) || `${provider}-anime`
		if (!(await deps.animeRepo.slugExists(base))) return base
		const sourced = `${base}-${provider}`
		if (!(await deps.animeRepo.slugExists(sourced))) return sourced
		return `${sourced}-${crypto.randomUUID().slice(0, 8)}`
	}

	async function ensureAnime(
		providerId: string,
		item: ProviderAnime,
	): Promise<{ anime: Anime; created: boolean }> {
		const existing = await deps.animeRepo.findBySource(providerId, item.id)
		if (existing) {
			const updated = await deps.animeRepo.update(existing.id, {
				title: item.title,
				description: item.description,
				coverImageUrl: existing.coverImageUrl?.startsWith("/i/")
					? existing.coverImageUrl
					: item.coverImageUrl,
				studioName: item.studioName,
				releaseYear: item.releaseYear,
				sourceUrl: item.url,
			})
			return { anime: updated ?? existing, created: false }
		}
		const anime = await deps.animeRepo.create({
			title: item.title,
			slug: await uniqueAnimeSlug(item.title, providerId),
			description: item.description,
			coverImageUrl: item.coverImageUrl,
			status: "published",
			contentRating: "teen",
			studioName: item.studioName,
			releaseYear: item.releaseYear,
			rightsOwnerName: deps.options.rightsOwnerName,
			licenseType: deps.options.licenseType,
			permissionDocumentUrl: deps.options.permissionDocumentUrl ?? null,
			requiresAttribution: true,
			attributionText: `Sumber katalog dan media: ${providerId}`,
			sourceProvider: providerId,
			sourceId: item.id,
			sourceUrl: item.url,
		})
		return { anime, created: true }
	}

	async function syncSummary(
		provider: ContentProvider,
		summary: ProviderAnimeSummary,
		result: ContentSyncResult,
		sourceUpdatedAt: Date,
	): Promise<void> {
		try {
			const detail = await provider.getAnime(summary.url)
			const ensured = await ensureAnime(provider.id, detail)
			if (ensured.created) result.animeCreated++
			const genres = await Promise.all(
				detail.genres.map((name) =>
					deps.genreRepo.findOrCreate(name, slugify(name)),
				),
			)
			await deps.genreRepo.setForAnime(
				ensured.anime.id,
				genres.map((genre) => genre.id),
			)
			let season = (await deps.seasonRepo.listByAnime(ensured.anime.id))[0]
			if (!season) {
				season = await deps.seasonRepo.create({
					animeId: ensured.anime.id,
					seasonNumber: 1,
					status: "published",
					autoPublish: true,
					releaseYear: detail.releaseYear,
				})
			}
			for (const sourceEpisode of detail.episodes) {
				if (!Number.isInteger(sourceEpisode.number)) continue
				if (await deps.episodeRepo.findBySource(provider.id, sourceEpisode.id))
					continue
				const code = `S${pad(season.seasonNumber)}E${pad(sourceEpisode.number)}`
				let slug = `${ensured.anime.slug}-${code.toLowerCase()}`
				if (await deps.episodeRepo.slugExists(slug))
					slug = `${slug}-${provider.id}`
				await deps.episodeRepo.create({
					animeId: ensured.anime.id,
					seasonId: season.id,
					episodeNumber: sourceEpisode.number,
					episodeCode: code,
					title: sourceEpisode.title,
					slug,
					status: "published",
					sourceProvider: provider.id,
					sourceId: sourceEpisode.id,
					sourceUrl: sourceEpisode.url,
				})
				result.episodesCreated++
			}
			// Preserve the provider's exact newest-first listing order even though
			// detail pages are fetched concurrently.
			await deps.animeRepo.setUpdatedAt(ensured.anime.id, sourceUpdatedAt)
		} catch (err) {
			logger.warn(
				{ err, provider: provider.id, sourceUrl: summary.url },
				"content item sync failed",
			)
		}
	}

	return async (input: ContentSyncInput): Promise<ContentSyncResult> => {
		const result: ContentSyncResult = {
			providers: 0,
			pages: 0,
			animeCreated: 0,
			episodesCreated: 0,
			coversMirrored: 0,
		}
		for (const provider of deps.providers.list()) {
			result.providers++
			const initialCompleted = await deps.syncState.hasCompletedInitial(
				provider.id,
			)
			const maxPages =
				input.mode === "startup" && !initialCompleted
					? deps.options.initialPages
					: deps.options.dailyPages
			const listings: ProviderPage[] = []
			const syncStartedAt = Date.now()
			let page = 1
			while (maxPages === 0 || page <= maxPages) {
				const listing = await provider.listAnime(page)
				result.pages++
				listings.push(listing)
				if (!listing.hasNext || listing.items.length === 0) break
				page++
			}

			const sourceUpdatedAt = new Map<string, Date>()
			let sourceRank = 0
			for (const listing of listings) {
				for (const item of listing.items) {
					if (!sourceUpdatedAt.has(item.id))
						sourceUpdatedAt.set(item.id, new Date(syncStartedAt - sourceRank++))
				}
			}

			// Providers list newest updates first. Persist older pages/items first;
			// explicit timestamps retain the exact order within concurrent batches.
			for (const listing of listings.reverse()) {
				const items = [...listing.items].reverse()
				// Four concurrent detail requests keep the initial five-page crawl fast
				// without flooding a provider or the local database.
				for (let offset = 0; offset < items.length; offset += 4) {
					await Promise.all(
						items
							.slice(offset, offset + 4)
							.map((summary) =>
								syncSummary(
									provider,
									summary,
									result,
									sourceUpdatedAt.get(summary.id) ?? new Date(syncStartedAt),
								),
							),
					)
				}
			}
			if (input.mode === "startup" && !initialCompleted)
				await deps.syncState.markInitialCompleted(provider.id)
			else await deps.syncState.markSynced(provider.id)
		}

		const sourcedAnime = await deps.animeRepo.listSourced()
		for (let offset = 0; offset < sourcedAnime.length; offset += 4) {
			await Promise.all(
				sourcedAnime.slice(offset, offset + 4).map(async (anime) => {
					try {
						if (await mirrorCover(anime)) result.coversMirrored++
					} catch (err) {
						logger.warn(
							{ err, animeId: anime.id, sourceUrl: anime.coverImageUrl },
							"anime cover mirror failed",
						)
					}
				}),
			)
		}
		return result
	}
}
