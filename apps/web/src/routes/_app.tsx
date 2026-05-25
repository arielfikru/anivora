import { createFileRoute, Outlet } from "@tanstack/react-router"
import { StreamShell } from "#/components/shell/stream-shell.tsx"

export const Route = createFileRoute("/_app")({
	component: AppLayout,
})

function AppLayout() {
	return (
		<StreamShell>
			<Outlet />
		</StreamShell>
	)
}
