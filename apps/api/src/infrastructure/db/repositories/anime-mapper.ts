import type {
	Anime,
	CatalogStatus,
	ContentRating,
} from "#/domain/catalog/anime.ts"
import type * as schema from "../schema.ts"

type AnimeRow = typeof schema.anime.$inferSelect

export function toAnime(row: AnimeRow): Anime {
	return {
		id: row.id,
		title: row.title,
		slug: row.slug,
		description: row.description,
		coverImageUrl: row.coverImageUrl,
		bannerImageUrl: row.bannerImageUrl,
		status: row.status as CatalogStatus,
		contentRating: row.contentRating as ContentRating,
		studioName: row.studioName,
		creatorName: row.creatorName,
		releaseYear: row.releaseYear,
		rightsOwnerName: row.rightsOwnerName,
		licenseType: row.licenseType,
		permissionDocumentUrl: row.permissionDocumentUrl,
		isOriginalContent: row.isOriginalContent,
		isFanmade: row.isFanmade,
		requiresAttribution: row.requiresAttribution,
		attributionText: row.attributionText,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
	}
}
