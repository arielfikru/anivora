import { createFileRoute } from "@tanstack/react-router"
import { Heart } from "lucide-react"

export const Route = createFileRoute("/_app/favorites")({
	component: FavoritesPage,
})

function FavoritesPage() {
	return (
		<div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
			<Heart className="size-12 text-anv-muted" />
			<h1 className="display-title text-2xl font-bold text-anv-text">
				Daftar Saya
			</h1>
			<p className="text-sm text-anv-muted">Fitur favorit akan segera hadir.</p>
		</div>
	)
}
