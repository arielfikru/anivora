import type { AnimeRepository } from "#/domain/catalog/anime-repository.ts"
import type { ObjectStorage } from "#/domain/ports/object-storage.ts"
import type { ContentProviderRegistry } from "#/infrastructure/content/providers/provider.ts"
import type { ContentSyncOptions } from "./sync-content-providers.ts"
import { slugify } from "../shared/slug.ts"
import { makeMirrorAnimeCover } from "./mirror-anime-cover.ts"

export interface DiscoverProviderAnimeDeps {
	animeRepo: AnimeRepository
	providers: ContentProviderRegistry
	objectStorage: ObjectStorage
	options: ContentSyncOptions
}

export function makeDiscoverProviderAnime(deps: DiscoverProviderAnimeDeps) {
	const mirrorCover = makeMirrorAnimeCover(deps)
	return async (query: string): Promise<number> => {
		let created = 0
		for (const provider of deps.providers.list()) {
			if (!provider.searchAnime) continue
			for (const item of await provider.searchAnime(query)) {
				if (await deps.animeRepo.findBySource(provider.id, item.id)) continue
				const base = slugify(item.title) || `${provider.id}-anime`
				let slug = base
				if (await deps.animeRepo.slugExists(slug))
					slug = `${base}-${provider.id}`
				const anime = await deps.animeRepo.create({
					title: item.title,
					slug,
					coverImageUrl: item.coverImageUrl,
					status: "published",
					contentRating: "teen",
					rightsOwnerName: deps.options.rightsOwnerName,
					licenseType: deps.options.licenseType,
					permissionDocumentUrl: deps.options.permissionDocumentUrl ?? null,
					requiresAttribution: true,
					attributionText: `Sumber katalog dan media: ${provider.id}`,
					sourceProvider: provider.id,
					sourceId: item.id,
					sourceUrl: item.url,
				})
				await mirrorCover(anime).catch(() => undefined)
				created++
			}
		}
		return created
	}
}
