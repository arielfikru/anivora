import type { Anime } from "#/domain/catalog/anime.ts"
import type { AnimeRepository } from "#/domain/catalog/anime-repository.ts"
import type { ObjectStorage } from "#/domain/ports/object-storage.ts"

const MAX_COVER_BYTES = 10 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set([
	"image/avif",
	"image/gif",
	"image/jpeg",
	"image/png",
	"image/webp",
])

export const animeCoverPath = (animeId: string) => `/i/${animeId}`
export const animeCoverKey = (animeId: string) =>
	`images/anime/${animeId}/cover`

export interface MirrorAnimeCoverDeps {
	animeRepo: AnimeRepository
	objectStorage: ObjectStorage
	fetcher?: typeof fetch
}

export function makeMirrorAnimeCover(deps: MirrorAnimeCoverDeps) {
	const fetcher = deps.fetcher ?? fetch
	return async (anime: Anime): Promise<boolean> => {
		const sourceUrl = anime.coverImageUrl
		const publicPath = animeCoverPath(anime.id)
		if (!sourceUrl || sourceUrl === publicPath) return false

		const url = new URL(sourceUrl)
		if (url.protocol !== "http:" && url.protocol !== "https:") return false
		const response = await fetcher(url, {
			headers: {
				accept: "image/avif,image/webp,image/png,image/jpeg,image/gif",
				referer: `${url.origin}/`,
				"user-agent": "Mozilla/5.0 (compatible; AnivoraArtworkMirror/1.0)",
			},
			signal: AbortSignal.timeout(20_000),
		})
		if (!response.ok)
			throw new Error(`Cover download returned ${response.status}`)

		const contentType = response.headers.get("content-type")?.split(";", 1)[0]
		if (!contentType || !ALLOWED_IMAGE_TYPES.has(contentType))
			throw new Error(
				`Unsupported cover content type: ${contentType ?? "unknown"}`,
			)
		const declaredSize = Number(response.headers.get("content-length") ?? 0)
		if (declaredSize > MAX_COVER_BYTES) throw new Error("Cover exceeds 10 MB")
		const bytes = new Uint8Array(await response.arrayBuffer())
		if (bytes.byteLength > MAX_COVER_BYTES)
			throw new Error("Cover exceeds 10 MB")

		await deps.objectStorage.putBytes(
			animeCoverKey(anime.id),
			bytes,
			contentType,
		)
		await deps.animeRepo.setCoverImageUrl(anime.id, publicPath)
		return true
	}
}
