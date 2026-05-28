import {
	IconActivity,
	IconDashboard,
	IconDeviceTv,
	IconHelp,
	IconMovie,
	IconSearch,
	IconSettings,
	IconUpload,
	IconUsers,
	IconVideo,
} from "@tabler/icons-react"
import type * as React from "react"

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
} from "#/components/ui/sidebar"
import { useIsAdmin } from "#/routes/_public/auth/_hooks/use-is-admin"
import { useSession } from "#/routes/_public/auth/_hooks/use-session"
import { LangSwitcher } from "./lang-switcher"
import { NavMain } from "./nav-main"
import { NavSecondary } from "./nav-secondary"
import { NavUser } from "./nav-user"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const session = useSession()
	const isAdmin = useIsAdmin()

	const user = {
		name: session.data?.user?.name ?? "",
		email: session.data?.user?.email ?? "",
		avatar: session.data?.user?.image ?? "",
	}

	const navMain = [
		{ title: "Dashboard", url: "/dashboard", icon: IconDashboard },
		...(isAdmin
			? [
					{ title: "Anime", url: "/content/anime", icon: IconMovie },
					{ title: "Seasons", url: "/content/seasons", icon: IconDeviceTv },
					{ title: "Episodes", url: "/content/episodes", icon: IconVideo },
					{ title: "Uploads", url: "/content/uploads", icon: IconUpload },
					{ title: "Users", url: "/users", icon: IconUsers },
					{ title: "Activity Log", url: "/activity", icon: IconActivity },
				]
			: []),
	]

	const navSecondary = [
		{ title: "Settings", url: "/settings", icon: IconSettings },
		{ title: "Get Help", url: "#", icon: IconHelp },
		{ title: "Search", url: "#", icon: IconSearch },
	]

	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader />
			<SidebarContent>
				<NavMain items={navMain} />
				<NavSecondary items={navSecondary} className="mt-auto" />
			</SidebarContent>
			<SidebarFooter>
				<LangSwitcher />
				<NavUser user={user} />
			</SidebarFooter>
		</Sidebar>
	)
}
