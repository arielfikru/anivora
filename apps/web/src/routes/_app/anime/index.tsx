import { createFileRoute } from "@tanstack/react-router"
import { useSuspenseQuery } from "@tanstack/react-query"
import { Suspense } from "react"
import { ErrorMessage, GridSkeleton } from "#/components/catalog/feedback.tsx"
import { MediaGrid } from "#/components/catalog/media-grid.tsx"
import { orpc } from "#/libs/orpc/client"
import { useSeo } from "#/libs/seo"

export const Route = createFileRoute("/_app/anime/")({
	component: CatalogPage,
	errorComponent: () => <ErrorMessage message="Gagal memuat katalog." />,
})

function CatalogPage() {
	useSeo({
		title: "Jelajah Anime",
		description: "Katalog lengkap anime di Anivora.",
	})
	return (
		<div className="space-y-4 pt-8">
			<h1 className="display-title px-4 text-3xl font-bold text-anv-text lg:px-10">
				Jelajah Anime
			</h1>
			<Suspense fallback={<GridSkeleton />}>
				<CatalogGrid />
			</Suspense>
		</div>
	)
}

function CatalogGrid() {
	const { data } = useSuspenseQuery(
		orpc.catalog.listAnime.queryOptions({ input: { limit: 100, offset: 0 } }),
	)
	return (
		<MediaGrid items={data.anime} emptyMessage="Belum ada anime tersedia." />
	)
}
