import { Link } from "@tanstack/react-router"
import { X } from "lucide-react"
import {
	type WatchEntry,
	removeWatch,
	useContinueWatching,
} from "#/libs/continue-watching"
import { CoverImage } from "./cover-image.tsx"

/** Home rail of resume points, newest first. Hidden when empty. */
export function ContinueWatchingRow() {
	const entries = useContinueWatching()
	if (entries.length === 0) return null

	return (
		<section className="space-y-3">
			<h2 className="display-title px-4 text-xl font-bold text-anv-text lg:px-10 lg:text-2xl">
				Lanjut Nonton
			</h2>
			<div className="no-scrollbar flex gap-4 overflow-x-auto px-4 pb-3 pt-1 lg:px-10">
				{entries.map((entry) => (
					<ContinueCard key={entry.animeSlug} entry={entry} />
				))}
			</div>
		</section>
	)
}

function ContinueCard({ entry }: { entry: WatchEntry }) {
	const label = entry.episodeCode ?? entry.episodeTitle ?? "Lanjutkan"
	return (
		<div className="group relative w-[180px] shrink-0 sm:w-[220px] lg:w-[280px]">
			<Link
				to="/watch/$slug"
				params={{ slug: entry.episodeSlug }}
				search={{ anime: entry.animeSlug }}
				data-focusable
				className="block rounded-xl outline-none transition-transform duration-200 hover:scale-[1.04] focus-visible:scale-[1.06]"
			>
				<div className="relative aspect-video overflow-hidden rounded-xl border-2 border-transparent bg-anv-surface shadow-lg transition-all duration-200 group-hover:border-anv-red/60 group-focus-visible:border-anv-red">
					<CoverImage
						src={entry.coverImageUrl}
						title={entry.animeTitle ?? ""}
						fallback="/cover.png"
					/>
					{entry.progress > 0 ? (
						<div className="absolute inset-x-0 bottom-0 h-1 bg-black/50">
							<div
								className="h-full bg-anv-red"
								style={{
									width: `${Math.min(100, Math.round(entry.progress * 100))}%`,
								}}
							/>
						</div>
					) : null}
				</div>
				<p className="mt-2 truncate text-sm font-semibold text-anv-text">
					{entry.animeTitle ?? entry.episodeSlug}
				</p>
				<p className="truncate text-xs text-anv-muted">{label}</p>
			</Link>
			<button
				type="button"
				aria-label="Hapus dari Lanjut Nonton"
				onClick={() => removeWatch(entry.animeSlug)}
				className="absolute right-2 top-2 hidden rounded-full bg-black/70 p-1 text-white outline-none transition hover:bg-black/90 focus-visible:block group-hover:block"
			>
				<X className="size-4" />
			</button>
		</div>
	)
}
