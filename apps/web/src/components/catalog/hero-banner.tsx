import type { AnimeListItem } from "@anivora/api"
import { Link } from "@tanstack/react-router"
import { Play } from "lucide-react"
import { CoverImage } from "./cover-image.tsx"
import { FavoriteButton } from "./favorite-button.tsx"
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
		<section className="relative h-[64svh] min-h-[430px] w-full overflow-hidden sm:h-[58vh]">
			<div className="absolute inset-0">
				<CoverImage
					src={anime.bannerImageUrl ?? anime.coverImageUrl}
					title={anime.title}
					fallback="/banner.png"
				/>
			</div>
			<div className="absolute inset-0 bg-gradient-to-r from-anv-bg via-anv-bg/70 to-transparent" />
			<div className="absolute inset-0 bg-gradient-to-t from-anv-bg via-anv-bg/30 to-transparent" />

			<div className="absolute bottom-0 left-0 max-w-2xl space-y-3 p-4 pb-7 sm:space-y-4 sm:p-6 lg:p-12">
				{isNew ? (
					<span className="inline-block rounded-md bg-anv-red px-2.5 py-1 text-xs font-bold tracking-wide text-white">
						BARU
					</span>
				) : null}
				<h1 className="display-title text-3xl font-bold leading-tight text-anv-text drop-shadow sm:text-4xl lg:text-5xl">
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
				<div className="flex flex-col gap-3 pt-1 sm:flex-row sm:flex-wrap">
					<Link
						to="/anime/$slug"
						params={{ slug: anime.slug }}
						data-focusable
						className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-anv-red px-6 text-base font-semibold text-white shadow-lg outline-none transition hover:bg-anv-red-hover focus-visible:scale-105 sm:px-7"
					>
						<Play className="size-5 fill-current" /> Putar Sekarang
					</Link>
					<FavoriteButton
						anime={anime}
						className="justify-center text-base sm:justify-start"
					/>
				</div>
			</div>
		</section>
	)
}
