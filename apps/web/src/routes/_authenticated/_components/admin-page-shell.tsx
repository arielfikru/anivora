import type * as React from "react"

import { SidebarInset, SidebarProvider } from "#/components/ui/sidebar"
import { AppSidebar } from "./app-sidebar"
import { SiteHeader } from "./site-header"

interface AdminPageShellProps {
	title: string
	description: string
	children: React.ReactNode
}

export function AdminPageShell({
	title,
	description,
	children,
}: AdminPageShellProps) {
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
					<div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
						<div>
							<h1 className="text-2xl font-semibold">{title}</h1>
							<p className="text-muted-foreground text-sm">{description}</p>
						</div>
						{children}
					</div>
				</div>
			</SidebarInset>
		</SidebarProvider>
	)
}
