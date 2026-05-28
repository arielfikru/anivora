import type { Anime, PublicEpisode, Season } from "@anivora/api"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery, useSuspenseQuery } from "@tanstack/react-query"
import { Play } from "lucide-react"
import { Suspense, useState } from "react"
import { ContentRow } from "#/components/catalog/content-row.tsx"
import { CoverImage } from "#/components/catalog/cover-image.tsx"
import { FavoriteButton } from "#/components/catalog/favorite-button.tsx"
import { ErrorMessage, PageSkeleton } from "#/components/catalog/feedback.tsx"
import { metaLine, ratingLabel } from "#/components/catalog/format.ts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs"
import { orpc } from "#/libs/orpc/client"
import { EpisodeList } from "./_components/episode-list.tsx"

type TSeasonWithEpisodes = Season & { episodes: PublicEpisode[] }

function truncate(text: string, max: number): string {
	return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text
}

export const Route = createFileRoute("/_app/anime/$slug")({
	component: DetailPage,
	errorComponent: () => <ErrorMessage message="Anime tidak ditemukan." />,
})

function DetailPage() {
	const { slug } = Route.useParams()
	return (
		<Suspense fallback={<PageSkeleton />}>
			<DetailContent slug={slug} />
		</Suspense>
	)
}

function DetailContent({ slug }: { slug: string }) {
	const { data } = useSuspenseQuery(
		orpc.catalog.getAnime.queryOptions({ input: { slug } }),
	)
	const { anime, seasons } = data
	const firstEpisode = seasons.flatMap((s) => s.episodes)[0]

	return (
		<div>
			<DetailHero anime={anime} firstEpisodeSlug={firstEpisode?.slug ?? null} />
			<div className="px-4 py-8 lg:px-10">
				<DetailTabs anime={anime} seasons={seasons} animeSlug={anime.slug} />
			</div>
			<RelatedAnime slug={anime.slug} />
		</div>
	)
}

function RelatedAnime({ slug }: { slug: string }) {
	const { data } = useQuery(
		orpc.catalog.getRelatedAnime.queryOptions({ input: { slug, limit: 12 } }),
	)
	const related = data?.anime ?? []
	if (related.length === 0) return null
	return (
		<div className="pb-10">
			<ContentRow title="Anime Serupa" items={related} />
		</div>
	)
}

function DetailHero({
	anime,
	firstEpisodeSlug,
}: {
	anime: Anime
	firstEpisodeSlug: string | null
}) {
	const meta = metaLine([
		anime.releaseYear,
		ratingLabel(anime.contentRating),
		anime.studioName,
	])
	return (
		<section className="relative min-h-[50vh] w-full overflow-hidden">
			<div className="absolute inset-0">
				<CoverImage
					src={anime.bannerImageUrl ?? anime.coverImageUrl}
					title={anime.title}
					fallback="/banner.png"
				/>
			</div>
			<div className="absolute inset-0 bg-gradient-to-r from-anv-bg via-anv-bg/75 to-transparent" />
			<div className="absolute inset-0 bg-gradient-to-t from-anv-bg via-transparent to-transparent" />
			<div className="relative flex flex-col gap-5 p-6 pt-16 lg:p-12 lg:pt-24">
				<div className="max-w-2xl space-y-3">
					{anime.isFanmade ? (
						<span className="inline-block rounded-md bg-anv-surface-2 px-2 py-0.5 text-xs font-semibold text-anv-muted">
							Fanmade
						</span>
					) : null}
					<h1 className="display-title text-3xl font-bold text-anv-text lg:text-5xl">
						{anime.title}
					</h1>
					{meta ? (
						<p className="text-sm text-anv-muted lg:text-base">{meta}</p>
					) : null}
					{anime.description ? (
						<p className="text-sm leading-relaxed text-anv-text/80 lg:text-base">
							{truncate(anime.description, 100)}
						</p>
					) : null}
				</div>
				<div className="flex flex-wrap gap-3">
					{firstEpisodeSlug ? (
						<Link
							to="/watch/$slug"
							params={{ slug: firstEpisodeSlug }}
							search={{ anime: anime.slug }}
							data-focusable
							className="inline-flex h-12 items-center gap-2 rounded-lg bg-anv-red px-7 font-semibold text-white outline-none transition hover:bg-anv-red-hover focus-visible:scale-105"
						>
							<Play className="size-5 fill-current" /> Putar Episode 1
						</Link>
					) : null}
					<FavoriteButton anime={anime} />
				</div>
			</div>
		</section>
	)
}

function DetailTabs({
	anime,
	seasons,
	animeSlug,
}: {
	anime: Anime
	seasons: TSeasonWithEpisodes[]
	animeSlug: string
}) {
	return (
		<Tabs defaultValue="episodes" className="w-full">
			<TabsList variant="line">
				<TabsTrigger value="episodes" data-focusable>
					Episode
				</TabsTrigger>
				<TabsTrigger value="about" data-focusable>
					Tentang
				</TabsTrigger>
				<TabsTrigger value="details" data-focusable>
					Detail
				</TabsTrigger>
			</TabsList>

			<TabsContent value="episodes" className="pt-4">
				<SeasonEpisodes seasons={seasons} animeSlug={animeSlug} />
			</TabsContent>

			<TabsContent value="about" className="max-w-3xl pt-4">
				<p className="leading-relaxed text-anv-text/85">
					{anime.description ?? "Belum ada sinopsis."}
				</p>
			</TabsContent>

			<TabsContent value="details" className="max-w-3xl pt-4">
				<DetailFacts anime={anime} />
			</TabsContent>
		</Tabs>
	)
}

function SeasonEpisodes({
	seasons,
	animeSlug,
}: {
	seasons: TSeasonWithEpisodes[]
	animeSlug: string
}) {
	const [active, setActive] = useState(0)
	if (seasons.length === 0) {
		return <p className="text-anv-muted">Belum ada episode.</p>
	}
	const current = seasons[active] ?? seasons[0]

	return (
		<div className="space-y-4">
			{seasons.length > 1 ? (
				<div className="flex flex-wrap gap-2">
					{seasons.map((season, i) => (
						<button
							key={season.id}
							type="button"
							data-focusable
							onClick={() => setActive(i)}
							className={
								i === active
									? "rounded-full bg-anv-red px-4 py-1.5 text-sm font-semibold text-white outline-none"
									: "rounded-full border border-white/15 bg-anv-surface px-4 py-1.5 text-sm text-anv-text outline-none hover:border-anv-red/60"
							}
						>
							{season.title ?? `Season ${season.seasonNumber}`}
						</button>
					))}
				</div>
			) : null}
			<EpisodeList episodes={current.episodes} animeSlug={animeSlug} />
		</div>
	)
}

function DetailFacts({ anime }: { anime: Anime }) {
	const facts: Array<[string, string | null]> = [
		["Studio", anime.studioName],
		["Kreator", anime.creatorName],
		["Tahun Rilis", anime.releaseYear ? String(anime.releaseYear) : null],
		["Rating", ratingLabel(anime.contentRating)],
		["Konten Asli", anime.isOriginalContent ? "Ya" : "Tidak"],
		["Atribusi", anime.attributionText],
	]
	return (
		<dl className="grid gap-3 sm:grid-cols-2">
			{facts
				.filter(([, v]) => v)
				.map(([label, value]) => (
					<div key={label} className="rounded-lg bg-anv-surface p-3">
						<dt className="text-xs uppercase tracking-wide text-anv-muted">
							{label}
						</dt>
						<dd className="mt-0.5 text-sm text-anv-text">{value}</dd>
					</div>
				))}
		</dl>
	)
}
