import { createFileRoute } from "@tanstack/react-router"
import { Heart } from "lucide-react"
import { MediaGrid } from "#/components/catalog/media-grid.tsx"
import { useFavorites } from "#/libs/favorites"
import { useSeo } from "#/libs/seo"

export const Route = createFileRoute("/_app/favorites")({
	component: FavoritesPage,
})

function FavoritesPage() {
	useSeo({ title: "Daftar Saya", description: "Anime tersimpan kamu." })
	const favorites = useFavorites()

	return (
		<div className="py-8">
			<h1 className="display-title mb-2 px-4 text-2xl font-bold text-anv-text lg:px-10 lg:text-3xl">
				Daftar Saya
			</h1>
			{favorites.length === 0 ? (
				<div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-4 text-center">
					<Heart className="size-12 text-anv-muted" />
					<p className="max-w-sm text-sm text-anv-muted">
						Belum ada anime tersimpan. Tekan tombol{" "}
						<span className="font-semibold text-anv-text">Daftar Saya</span> di
						halaman anime untuk menambahkannya.
					</p>
				</div>
			) : (
				<MediaGrid
					items={favorites.map((f) => ({ ...f, status: "published" }))}
				/>
			)}
		</div>
	)
}
