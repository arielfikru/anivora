import { createFileRoute } from "@tanstack/react-router"
import { Suspense } from "react"
import { useSuspenseQuery } from "@tanstack/react-query"
import { ContentRow } from "#/components/catalog/content-row.tsx"
import { ContinueWatchingRow } from "#/components/catalog/continue-watching-row.tsx"
import { GenrePills } from "#/components/catalog/genre-pills.tsx"
import { HeroBanner } from "#/components/catalog/hero-banner.tsx"
import { ErrorMessage, PageSkeleton } from "#/components/catalog/feedback.tsx"
import { orpc } from "#/libs/orpc/client"
import { useSeo } from "#/libs/seo"

export const Route = createFileRoute("/_app/")({
	component: HomePage,
	errorComponent: () => <ErrorMessage message="Gagal memuat katalog." />,
})

function HomePage() {
	return (
		<Suspense fallback={<PageSkeleton />}>
			<HomeContent />
		</Suspense>
	)
}

function HomeContent() {
	const { data } = useSuspenseQuery(
		orpc.catalog.listAnime.queryOptions({ input: { limit: 24, offset: 0 } }),
	)
	const { data: genreData } = useSuspenseQuery(
		orpc.catalog.listGenres.queryOptions(),
	)

	const anime = data.anime
	const featured = anime[0]

	useSeo({ image: featured?.bannerImageUrl ?? featured?.coverImageUrl })

	return (
		<div className="space-y-10">
			{featured ? (
				<HeroBanner anime={featured} isNew />
			) : (
				<div className="flex h-[40vh] items-center justify-center">
					<p className="display-title text-3xl text-anv-muted">Anivora</p>
				</div>
			)}

			<GenrePills genres={genreData.genres} />

			<ContinueWatchingRow />

			<ContentRow title="Terbaru" items={anime} newCount={3} />
			<ContentRow title="Populer di Anivora" items={[...anime].reverse()} />
		</div>
	)
}
