import { createFileRoute, redirect } from "@tanstack/react-router"

import { AdminPageShell } from "../_components/admin-page-shell"
import { SeasonManager } from "../_components/content/season-manager"

export const Route = createFileRoute("/_authenticated/content/seasons")({
	beforeLoad: ({ context }) => {
		if (context.session?.user.role !== "admin") {
			throw redirect({ to: "/dashboard" })
		}
	},
	component: SeasonsPage,
})

function SeasonsPage() {
	return (
		<AdminPageShell
			title="Seasons"
			description="Manage seasons for each anime."
		>
			<SeasonManager />
		</AdminPageShell>
	)
}
