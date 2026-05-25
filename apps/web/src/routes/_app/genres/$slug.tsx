import { createFileRoute } from "@tanstack/react-router"
import { useSuspenseQuery } from "@tanstack/react-query"
import { Suspense } from "react"
import { ErrorMessage, GridSkeleton } from "#/components/catalog/feedback.tsx"
import { GenrePills } from "#/components/catalog/genre-pills.tsx"
import { MediaGrid } from "#/components/catalog/media-grid.tsx"
import { orpc } from "#/libs/orpc/client"

export const Route = createFileRoute("/_app/genres/$slug")({
	component: GenrePage,
	errorComponent: () => <ErrorMessage message="Gagal memuat genre." />,
})

function GenrePage() {
	const { slug } = Route.useParams()
	return (
		<div className="space-y-4 pt-8">
			<Suspense fallback={<GridSkeleton />}>
				<GenreContent slug={slug} />
			</Suspense>
		</div>
	)
}

function GenreContent({ slug }: { slug: string }) {
	const { data } = useSuspenseQuery(
		orpc.catalog.listAnime.queryOptions({
			input: { genreSlug: slug, limit: 100, offset: 0 },
		}),
	)
	const { data: genreData } = useSuspenseQuery(
		orpc.catalog.listGenres.queryOptions(),
	)
	const active = genreData.genres.find((g) => g.slug === slug)

	return (
		<>
			<h1 className="display-title px-4 text-3xl font-bold text-anv-text lg:px-10">
				{active?.name ?? "Genre"}
			</h1>
			<GenrePills genres={genreData.genres} activeSlug={slug} />
			<MediaGrid
				items={data.anime}
				emptyMessage="Belum ada anime di genre ini."
			/>
		</>
	)
}
