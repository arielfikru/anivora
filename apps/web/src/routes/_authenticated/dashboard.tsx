import { Link, createFileRoute } from "@tanstack/react-router"
import {
	IconActivity,
	IconDeviceTv,
	IconMovie,
	IconUpload,
	IconUsers,
	IconVideo,
} from "@tabler/icons-react"

import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card"
import { SidebarInset, SidebarProvider } from "#/components/ui/sidebar"

import { AppSidebar } from "./_components/app-sidebar"
import { SiteHeader } from "./_components/site-header"

export const Route = createFileRoute("/_authenticated/dashboard")({
	component: DashboardPage,
})

const shortcuts = [
	{
		title: "Anime",
		description: "Kelola judul anime",
		url: "/content/anime",
		icon: IconMovie,
	},
	{
		title: "Seasons",
		description: "Kelola season",
		url: "/content/seasons",
		icon: IconDeviceTv,
	},
	{
		title: "Episodes",
		description: "Kelola episode",
		url: "/content/episodes",
		icon: IconVideo,
	},
	{
		title: "Uploads",
		description: "Upload video ke Bunny Stream",
		url: "/content/uploads",
		icon: IconUpload,
	},
	{
		title: "Users",
		description: "Kelola pengguna",
		url: "/users",
		icon: IconUsers,
	},
	{
		title: "Activity Log",
		description: "Audit aktivitas admin",
		url: "/activity",
		icon: IconActivity,
	},
] as const

function DashboardPage() {
	return (
		<SidebarProvider
			style={
				{
					"--sidebar-width": "calc(var(--spacing) * 72)",
					"--header-height": "calc(var(--spacing) * 12)",
				} as React.CSSProperties
			}
		>
			<AppSidebar variant="inset" />
			<SidebarInset>
				<SiteHeader />
				<div className="flex flex-1 flex-col">
					<div className="@container/main flex flex-1 flex-col gap-2">
						<div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
							<div>
								<h1 className="text-2xl font-semibold tracking-tight">
									Dashboard
								</h1>
								<p className="text-muted-foreground text-sm">
									Pusat kontrol konten Anivora.
								</p>
							</div>
							<div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
								{shortcuts.map((item) => (
									<Link key={item.url} to={item.url}>
										<Card className="@container/card transition hover:border-primary/50">
											<CardHeader>
												<item.icon className="size-6 text-muted-foreground" />
												<CardTitle className="mt-2 text-lg">
													{item.title}
												</CardTitle>
												<CardDescription>{item.description}</CardDescription>
											</CardHeader>
										</Card>
									</Link>
								))}
							</div>
						</div>
					</div>
				</div>
			</SidebarInset>
		</SidebarProvider>
	)
}
