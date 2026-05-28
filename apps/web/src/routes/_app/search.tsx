import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { Search as SearchIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { MediaGrid } from "#/components/catalog/media-grid.tsx"
import { Input } from "#/components/ui/input"
import { orpc } from "#/libs/orpc/client"
import { useSeo } from "#/libs/seo"

export const Route = createFileRoute("/_app/search")({
	component: SearchPage,
})

function useDebounced<T>(value: T, delay: number): T {
	const [debounced, setDebounced] = useState(value)
	useEffect(() => {
		const id = window.setTimeout(() => setDebounced(value), delay)
		return () => window.clearTimeout(id)
	}, [value, delay])
	return debounced
}

function SearchPage() {
	useSeo({ title: "Cari Anime", description: "Cari anime di Anivora." })
	const [query, setQuery] = useState("")
	const debounced = useDebounced(query.trim(), 350)

	const { data, isFetching } = useQuery({
		...orpc.catalog.searchAnime.queryOptions({
			input: { query: debounced || "_", limit: 50 },
		}),
		enabled: debounced.length > 0,
	})

	return (
		<div className="space-y-6 pt-8">
			<div className="px-4 lg:px-10">
				<div className="relative max-w-2xl">
					<SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-anv-muted" />
					<Input
						data-focusable
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="Cari anime..."
						className="h-14 rounded-xl bg-anv-surface pl-12 text-lg"
					/>
				</div>
			</div>

			{debounced.length === 0 ? (
				<p className="px-4 text-anv-muted lg:px-10">
					Ketik untuk mencari anime.
				</p>
			) : isFetching ? (
				<p className="px-4 text-anv-muted lg:px-10">Mencari...</p>
			) : (
				<MediaGrid
					items={data?.anime ?? []}
					emptyMessage={`Tidak ada hasil untuk "${debounced}".`}
				/>
			)}
		</div>
	)
}
