import type { AnimeListItem } from "@anivora/api"
import { metaLine, ratingLabel } from "./format.ts"
import { MediaCard } from "./media-card.tsx"

interface IMediaGridProps {
	items: AnimeListItem[]
	emptyMessage?: string
}

/** Responsive grid of focusable media cards for catalog/genre/search pages. */
export function MediaGrid({
	items,
	emptyMessage = "Tidak ada anime.",
}: IMediaGridProps) {
	if (items.length === 0) {
		return (
			<p className="px-4 py-16 text-center text-anv-muted lg:px-10">
				{emptyMessage}
			</p>
		)
	}

	return (
		<div className="grid grid-cols-2 gap-x-3 gap-y-5 px-4 py-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:px-10 xl:grid-cols-5 2xl:grid-cols-6">
			{items.map((item) => (
				<MediaCard
					key={item.id}
					to="/anime/$slug"
					params={{ slug: item.slug }}
					title={item.title}
					imageUrl={item.coverImageUrl ?? item.bannerImageUrl}
					meta={metaLine([item.releaseYear, ratingLabel(item.contentRating)])}
					variant="grid"
				/>
			))}
		</div>
	)
}
