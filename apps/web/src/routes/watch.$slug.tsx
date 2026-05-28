import type { Episode, PublicEpisode } from "@anivora/api"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useQuery, useSuspenseQuery } from "@tanstack/react-query"
import {
	ArrowLeft,
	ChevronLeft,
	ChevronRight,
	Film,
	Maximize,
} from "lucide-react"
import { Suspense, useCallback, useEffect, useRef } from "react"
import { z } from "zod"
import { CoverImage } from "#/components/catalog/cover-image.tsx"
import { ErrorMessage } from "#/components/catalog/feedback.tsx"
import { metaLine } from "#/components/catalog/format.ts"
import {
	getWatchEntry,
	recordProgress,
	removeWatch,
} from "#/libs/continue-watching"
import { orpc } from "#/libs/orpc/client"
import { useSeo } from "#/libs/seo"

export const Route = createFileRoute("/watch/$slug")({
	validateSearch: z.object({ anime: z.string().optional() }),
	component: WatchPage,
	errorComponent: () => <ErrorMessage message="Episode tidak ditemukan." />,
})

function WatchPage() {
	const { slug } = Route.useParams()
	const { anime } = Route.useSearch()
	return (
		<div className="min-h-screen bg-black text-anv-text">
			<Suspense fallback={<WatchSkeleton />}>
				<WatchContent slug={slug} animeSlug={anime} />
			</Suspense>
		</div>
	)
}

function WatchSkeleton() {
	return (
		<div className="flex h-screen items-center justify-center text-anv-muted">
			Memuat...
		</div>
	)
}

function WatchContent({
	slug,
	animeSlug,
}: {
	slug: string
	animeSlug?: string
}) {
	const { data } = useSuspenseQuery(
		orpc.catalog.getEpisode.queryOptions({ input: { slug } }),
	)
	const episode = data.episode
	const nav = useEpisodeNav(animeSlug, slug)
	const navigate = useNavigate()
	const playerRef = useRef<HTMLDivElement>(null)
	const cover = nav.animeCover ?? episode.thumbnailUrl ?? null

	// Record this episode as the resume point for the anime. Re-runs when the
	// anime metadata (title/cover) resolves; preserves stored progress if we
	// re-open the same episode.
	useEffect(() => {
		if (!animeSlug) return
		const existing = getWatchEntry(animeSlug)
		recordProgress({
			animeSlug,
			animeTitle: nav.animeTitle,
			coverImageUrl: cover,
			episodeSlug: slug,
			episodeCode: episode.episodeCode ?? null,
			episodeTitle: episode.title ?? null,
			progress:
				existing && existing.episodeSlug === slug ? existing.progress : 0,
		})
	}, [
		animeSlug,
		slug,
		nav.animeTitle,
		cover,
		episode.episodeCode,
		episode.title,
	])

	const lastWrite = useRef(0)
	const onProgress = useCallback(
		(seconds: number, duration: number) => {
			if (!animeSlug || duration <= 0) return
			const now = Date.now()
			if (now - lastWrite.current < 4000) return
			lastWrite.current = now
			recordProgress({
				animeSlug,
				animeTitle: nav.animeTitle,
				coverImageUrl: cover,
				episodeSlug: slug,
				episodeCode: episode.episodeCode ?? null,
				episodeTitle: episode.title ?? null,
				progress: Math.min(1, seconds / duration),
			})
		},
		[
			animeSlug,
			slug,
			nav.animeTitle,
			cover,
			episode.episodeCode,
			episode.title,
		],
	)

	useSeo({
		title:
			metaLine([nav.animeTitle, episode.episodeCode, episode.title]) ||
			"Menonton",
		description: episode.description,
		image: episode.thumbnailUrl,
	})

	const goNext = useCallback(() => {
		if (!nav.next) return
		navigate({
			to: "/watch/$slug",
			params: { slug: nav.next.slug },
			search: { anime: animeSlug },
		})
	}, [nav.next, animeSlug, navigate])

	// On finish: advance to the next episode (which becomes the new resume
	// point), or drop the anime from Continue Watching when the series ends.
	const onEnded = useCallback(() => {
		if (nav.next) goNext()
		else if (animeSlug) removeWatch(animeSlug)
	}, [nav.next, goNext, animeSlug])

	const goFullscreen = useCallback(() => {
		playerRef.current?.requestFullscreen?.().catch(() => {})
	}, [])

	return (
		<div className="flex min-h-screen flex-col">
			<WatchHeader
				episode={episode}
				animeSlug={animeSlug}
				title={nav.animeTitle}
			/>
			<div className="flex flex-1 items-center justify-center px-4 py-2 lg:px-10">
				<Player
					episode={episode}
					onEnded={onEnded}
					onProgress={onProgress}
					containerRef={playerRef}
				/>
			</div>
			<WatchFooter
				animeSlug={animeSlug}
				prev={nav.prev}
				next={nav.next}
				onFullscreen={goFullscreen}
			/>
		</div>
	)
}

function useEpisodeNav(animeSlug: string | undefined, currentSlug: string) {
	const { data } = useQuery({
		...orpc.catalog.getAnime.queryOptions({ input: { slug: animeSlug ?? "" } }),
		enabled: Boolean(animeSlug),
	})
	const episodes: PublicEpisode[] = data
		? data.seasons.flatMap((s) => s.episodes)
		: []
	const idx = episodes.findIndex((e) => e.slug === currentSlug)
	return {
		animeTitle: data?.anime.title ?? null,
		animeCover: data?.anime.coverImageUrl ?? null,
		prev: idx > 0 ? episodes[idx - 1] : null,
		next: idx >= 0 && idx < episodes.length - 1 ? episodes[idx + 1] : null,
	}
}

function WatchHeader({
	episode,
	animeSlug,
	title,
}: {
	episode: Episode
	animeSlug?: string
	title: string | null
}) {
	const line = metaLine([title, episode.episodeCode, episode.title])
	return (
		<header className="flex items-center gap-4 p-4 lg:px-10">
			<BackButton animeSlug={animeSlug} />
			<p className="truncate font-semibold">{line}</p>
		</header>
	)
}

function BackButton({ animeSlug }: { animeSlug?: string }) {
	const className =
		"inline-flex h-11 items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 font-semibold outline-none transition hover:bg-white/15 focus-visible:scale-105"
	if (animeSlug) {
		return (
			<Link
				to="/anime/$slug"
				params={{ slug: animeSlug }}
				data-focusable
				className={className}
			>
				<ArrowLeft className="size-5" /> Kembali
			</Link>
		)
	}
	return (
		<Link to="/" data-focusable className={className}>
			<ArrowLeft className="size-5" /> Beranda
		</Link>
	)
}

/**
 * Bunny's embed implements the player.js protocol over postMessage. Register
 * `ended` + `timeupdate` listeners on load; advance on finish and report
 * playback fraction for the resume bar. Payload shape is read defensively
 * because player.js implementations vary (value vs data).
 */
function useBunnyPlayer(
	ref: React.RefObject<HTMLIFrameElement | null>,
	onEnded: () => void,
	onProgress: (seconds: number, duration: number) => void,
) {
	useEffect(() => {
		const win = ref.current?.contentWindow
		const register = () => {
			for (const value of ["ended", "timeupdate"]) {
				win?.postMessage(
					JSON.stringify({
						context: "player.js",
						version: "1.0",
						method: "addEventListener",
						value,
						listener: `anv-${value}`,
					}),
					"*",
				)
			}
		}
		const onMessage = (e: MessageEvent) => {
			if (typeof e.data !== "string") return
			try {
				const msg = JSON.parse(e.data) as {
					context?: string
					event?: string
					value?: { seconds?: number; duration?: number }
					data?: { seconds?: number; duration?: number }
				}
				if (msg.context !== "player.js") return
				if (msg.event === "ended") {
					onEnded()
				} else if (msg.event === "timeupdate") {
					const p = msg.value ?? msg.data
					if (
						typeof p?.seconds === "number" &&
						typeof p?.duration === "number"
					) {
						onProgress(p.seconds, p.duration)
					}
				}
			} catch {}
		}
		window.addEventListener("message", onMessage)
		const timer = setTimeout(register, 1000)
		return () => {
			window.removeEventListener("message", onMessage)
			clearTimeout(timer)
		}
	}, [ref, onEnded, onProgress])
}

function withAutoplay(src: string): string {
	return src.includes("?") ? `${src}&autoplay=true` : `${src}?autoplay=true`
}

function Player({
	episode,
	onEnded,
	onProgress,
	containerRef,
}: {
	episode: Episode
	onEnded: () => void
	onProgress: (seconds: number, duration: number) => void
	containerRef: React.RefObject<HTMLDivElement | null>
}) {
	const iframeRef = useRef<HTMLIFrameElement>(null)
	useBunnyPlayer(iframeRef, onEnded, onProgress)
	const src = episode.embedUrl ?? episode.playbackUrl
	if (src) {
		return (
			<div
				ref={containerRef}
				className="aspect-video w-full max-w-6xl overflow-hidden rounded-xl bg-black"
			>
				<iframe
					ref={iframeRef}
					src={withAutoplay(src)}
					title={episode.title ?? episode.episodeCode}
					allow="autoplay; fullscreen; picture-in-picture"
					allowFullScreen
					className="h-full w-full border-0"
				/>
			</div>
		)
	}
	return (
		<div
			ref={containerRef}
			className="relative aspect-video w-full max-w-6xl overflow-hidden rounded-xl bg-anv-surface"
		>
			<CoverImage
				src={episode.thumbnailUrl}
				title={episode.title ?? episode.episodeCode}
				fallback="/banner.png"
			/>
			<div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60">
				<Film className="size-12 text-anv-muted" />
				<p className="text-lg font-semibold">Video belum tersedia</p>
				<p className="text-sm text-anv-muted">Episode ini masih diproses.</p>
			</div>
		</div>
	)
}

function WatchFooter({
	animeSlug,
	prev,
	next,
	onFullscreen,
}: {
	animeSlug?: string
	prev: PublicEpisode | null
	next: PublicEpisode | null
	onFullscreen: () => void
}) {
	return (
		<footer className="flex items-center justify-between gap-3 p-4 lg:px-10">
			<NavLink episode={prev} animeSlug={animeSlug} dir="prev" />
			<FullscreenButton onClick={onFullscreen} />
			<NavLink episode={next} animeSlug={animeSlug} dir="next" />
		</footer>
	)
}

function FullscreenButton({ onClick }: { onClick: () => void }) {
	return (
		<button
			type="button"
			onClick={onClick}
			data-focusable
			className="inline-flex h-14 items-center gap-3 rounded-xl bg-anv-red px-8 text-lg font-bold text-white outline-none transition hover:bg-anv-red-hover focus-visible:scale-105 focus-visible:ring-2 focus-visible:ring-white"
		>
			<Maximize className="size-6" />
			Layar Penuh
		</button>
	)
}

function NavLink({
	episode,
	animeSlug,
	dir,
}: {
	episode: PublicEpisode | null
	animeSlug?: string
	dir: "prev" | "next"
}) {
	const className =
		"inline-flex h-12 items-center gap-2 rounded-lg bg-anv-surface px-6 font-semibold outline-none transition hover:bg-anv-surface-2 focus-visible:scale-105 disabled:opacity-40"
	if (!episode) {
		return (
			<span
				className={`${className} cursor-not-allowed opacity-40`}
				aria-disabled="true"
			>
				{dir === "prev" ? <ChevronLeft className="size-5" /> : null}
				{dir === "prev" ? "Sebelumnya" : "Berikutnya"}
				{dir === "next" ? <ChevronRight className="size-5" /> : null}
			</span>
		)
	}
	return (
		<Link
			to="/watch/$slug"
			params={{ slug: episode.slug }}
			search={{ anime: animeSlug }}
			data-focusable
			className={className}
		>
			{dir === "prev" ? <ChevronLeft className="size-5" /> : null}
			{dir === "prev" ? "Episode Sebelumnya" : "Episode Berikutnya"}
			{dir === "next" ? <ChevronRight className="size-5" /> : null}
		</Link>
	)
}
