import { createFileRoute, redirect } from "@tanstack/react-router"

import { AdminPageShell } from "../_components/admin-page-shell"
import { UploadsManager } from "../_components/content/uploads-manager"

export const Route = createFileRoute("/_authenticated/content/uploads")({
	beforeLoad: ({ context }) => {
		if (context.session?.user.role !== "admin") {
			throw redirect({ to: "/dashboard" })
		}
	},
	component: UploadsPage,
})

function UploadsPage() {
	return (
		<AdminPageShell
			title="Uploads"
			description="Upload episode videos to Cloudflare R2."
		>
			<UploadsManager />
		</AdminPageShell>
	)
}
