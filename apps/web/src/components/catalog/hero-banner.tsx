import type { AnimeListItem } from "@anivora/api"
import { Link } from "@tanstack/react-router"
import { Play, Plus } from "lucide-react"
import { CoverImage } from "./cover-image.tsx"
import { metaLine, ratingLabel } from "./format.ts"

interface IHeroBannerProps {
	anime: AnimeListItem
	description?: string | null
	isNew?: boolean
}

/** Full-width featured hero with gradient overlays and large CTAs. */
export function HeroBanner({ anime, description, isNew }: IHeroBannerProps) {
	const meta = metaLine([anime.releaseYear, ratingLabel(anime.contentRating)])

	return (
		<section className="relative h-[58vh] min-h-[420px] w-full overflow-hidden">
			<div className="absolute inset-0">
				<CoverImage
					src={anime.bannerImageUrl ?? anime.coverImageUrl}
					title={anime.title}
					fallback="/banner.png"
				/>
			</div>
			<div className="absolute inset-0 bg-gradient-to-r from-anv-bg via-anv-bg/70 to-transparent" />
			<div className="absolute inset-0 bg-gradient-to-t from-anv-bg via-anv-bg/30 to-transparent" />

			<div className="absolute bottom-0 left-0 max-w-2xl space-y-4 p-6 lg:p-12">
				{isNew ? (
					<span className="inline-block rounded-md bg-anv-red px-2.5 py-1 text-xs font-bold tracking-wide text-white">
						BARU
					</span>
				) : null}
				<h1 className="display-title text-3xl font-bold text-anv-text drop-shadow lg:text-5xl">
					{anime.title}
				</h1>
				{meta ? (
					<p className="text-sm text-anv-muted lg:text-base">{meta}</p>
				) : null}
				{description ? (
					<p className="line-clamp-2 max-w-xl text-sm text-anv-text/85 lg:text-base">
						{description}
					</p>
				) : null}
				<div className="flex flex-wrap gap-3 pt-1">
					<Link
						to="/anime/$slug"
						params={{ slug: anime.slug }}
						data-focusable
						className="inline-flex h-12 items-center gap-2 rounded-lg bg-anv-red px-7 text-base font-semibold text-white shadow-lg outline-none transition hover:bg-anv-red-hover focus-visible:scale-105"
					>
						<Play className="size-5 fill-current" /> Putar Sekarang
					</Link>
					<Link
						to="/anime/$slug"
						params={{ slug: anime.slug }}
						data-focusable
						className="inline-flex h-12 items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-7 text-base font-semibold text-anv-text outline-none backdrop-blur transition hover:bg-white/20 focus-visible:scale-105"
					>
						<Plus className="size-5" /> Daftar Saya
					</Link>
				</div>
			</div>
		</section>
	)
}
