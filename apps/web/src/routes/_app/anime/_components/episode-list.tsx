import type { PublicEpisode } from "@anivora/api"
import { Link } from "@tanstack/react-router"
import { Play } from "lucide-react"
import { CoverImage } from "#/components/catalog/cover-image.tsx"
import { formatDuration, metaLine } from "#/components/catalog/format.ts"

interface IEpisodeListProps {
	episodes: PublicEpisode[]
	animeSlug: string
}

/** Vertical list of focusable episode cards linking to the watch page. */
export function EpisodeList({ episodes, animeSlug }: IEpisodeListProps) {
	if (episodes.length === 0) {
		return <p className="py-6 text-anv-muted">Belum ada episode.</p>
	}

	return (
		<ul className="space-y-3">
			{episodes.map((ep) => (
				<li key={ep.id}>
					<EpisodeRow episode={ep} animeSlug={animeSlug} />
				</li>
			))}
		</ul>
	)
}

function EpisodeRow({
	episode,
	animeSlug,
}: {
	episode: PublicEpisode
	animeSlug: string
}) {
	const meta = metaLine([
		episode.episodeCode,
		formatDuration(episode.durationSeconds),
	])
	return (
		<Link
			to="/watch/$slug"
			params={{ slug: episode.slug }}
			search={{ anime: animeSlug }}
			data-focusable
			className="group flex flex-col gap-3 rounded-xl border border-white/10 bg-anv-surface p-3 outline-none transition hover:border-anv-red/60 focus-visible:border-anv-red focus-visible:scale-[1.01] sm:flex-row sm:items-center sm:gap-4"
		>
			<div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-lg sm:w-40">
				<CoverImage
					src={episode.thumbnailUrl}
					title={episode.title ?? episode.episodeCode}
					fallback="/banner.png"
				/>
				<span className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
					<Play className="size-8 fill-white text-white" />
				</span>
			</div>
			<div className="min-w-0 flex-1">
				<div className="flex items-center justify-between gap-3">
					<p className="truncate font-semibold text-anv-text">
						{episode.title ?? `Episode ${episode.episodeNumber}`}
					</p>
					<EpisodeReadyBadge ready={episode.isReady} status={episode.status} />
				</div>
				<p className="truncate text-sm text-anv-muted">{meta}</p>
			</div>
		</Link>
	)
}

function EpisodeReadyBadge({
	ready,
	status,
}: {
	ready: boolean
	status?: string
}) {
	const processing = !ready && status === "processing"
	return (
		<span
			className={
				ready
					? "shrink-0 rounded-full border border-emerald-400/40 bg-emerald-400/15 px-2.5 py-1 text-xs font-bold text-emerald-300"
					: processing
						? "shrink-0 rounded-full border border-amber-400/40 bg-amber-400/15 px-2.5 py-1 text-xs font-bold text-amber-300"
						: "shrink-0 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-bold text-anv-muted"
			}
		>
			{ready ? "Ready" : processing ? "Processing" : "Not Ready"}
		</span>
	)
}
