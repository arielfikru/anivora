import type { Genre } from "@anivora/api"
import { Link } from "@tanstack/react-router"
import { Tag } from "lucide-react"
import { cn } from "#/libs/clsx"

interface IGenrePillsProps {
	genres: Genre[]
	/** Slug of the currently active genre, if any. */
	activeSlug?: string
}

/** Horizontal row of genre pill links. Active/focused = red filled. */
export function GenrePills({ genres, activeSlug }: IGenrePillsProps) {
	if (genres.length === 0) return null

	return (
		<div className="no-scrollbar flex gap-3 overflow-x-auto px-4 py-1 lg:px-10">
			{genres.map((genre) => {
				const active = genre.slug === activeSlug
				return (
					<Link
						key={genre.id}
						to="/genres/$slug"
						params={{ slug: genre.slug }}
						data-focusable
						className={cn(
							"inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-5 text-sm font-semibold outline-none transition focus-visible:scale-105",
							active
								? "bg-anv-red text-white"
								: "border border-white/15 bg-anv-surface text-anv-text hover:border-anv-red/60 hover:bg-anv-surface-2",
						)}
					>
						<Tag className="size-4" />
						{genre.name}
					</Link>
				)
			})}
		</div>
	)
}
