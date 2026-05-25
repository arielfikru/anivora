import { createFileRoute, redirect } from "@tanstack/react-router"

import { AdminPageShell } from "../_components/admin-page-shell"
import { EpisodeManager } from "../_components/content/episode-manager"

export const Route = createFileRoute("/_authenticated/content/episodes")({
	beforeLoad: ({ context }) => {
		if (context.session?.user.role !== "admin") {
			throw redirect({ to: "/dashboard" })
		}
	},
	component: EpisodesPage,
})

function EpisodesPage() {
	return (
		<AdminPageShell
			title="Episodes"
			description="Manage episodes within a season."
		>
			<EpisodeManager />
		</AdminPageShell>
	)
}
