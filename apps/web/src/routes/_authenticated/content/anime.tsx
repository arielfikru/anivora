import { createFileRoute, redirect } from "@tanstack/react-router"

import { AdminPageShell } from "../_components/admin-page-shell"
import { AnimeManager } from "../_components/content/anime-manager"

export const Route = createFileRoute("/_authenticated/content/anime")({
	beforeLoad: ({ context }) => {
		if (context.session?.user.role !== "admin") {
			throw redirect({ to: "/dashboard" })
		}
	},
	component: AnimeManagePage,
})

function AnimeManagePage() {
	return (
		<AdminPageShell title="Anime" description="Create and manage anime titles.">
			<AnimeManager />
		</AdminPageShell>
	)
}
