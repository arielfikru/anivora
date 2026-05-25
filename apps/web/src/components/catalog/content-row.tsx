import type { AnimeListItem } from "@anivora/api"
import { metaLine, ratingLabel } from "./format.ts"
import { MediaCard } from "./media-card.tsx"

interface IContentRowProps {
	title: string
	items: AnimeListItem[]
	/** Marks the first N items with a "BARU" badge. */
	newCount?: number
}

/** A titled, horizontally-scrolling track of media cards. */
export function ContentRow({ title, items, newCount = 0 }: IContentRowProps) {
	if (items.length === 0) return null

	return (
		<section className="space-y-3">
			<h2 className="display-title px-4 text-xl font-bold text-anv-text lg:px-10 lg:text-2xl">
				{title}
			</h2>
			<div className="no-scrollbar flex gap-4 overflow-x-auto px-4 pb-3 pt-1 lg:px-10">
				{items.map((item, i) => (
					<MediaCard
						key={item.id}
						to="/anime/$slug"
						params={{ slug: item.slug }}
						title={item.title}
						imageUrl={item.coverImageUrl ?? item.bannerImageUrl}
						meta={metaLine([item.releaseYear, ratingLabel(item.contentRating)])}
						isNew={i < newCount}
					/>
				))}
			</div>
		</section>
	)
}
