import { IconLanguage } from "@tabler/icons-react"
import { useNavigate, useSearch } from "@tanstack/react-router"

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu"
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "#/components/ui/sidebar"

const LOCALES = [
	{ value: "en", label: "English" },
	{ value: "id", label: "Bahasa Indonesia" },
] as const

export function LangSwitcher() {
	const { isMobile } = useSidebar()
	const navigate = useNavigate({ from: "/" })
	const search = useSearch({ strict: false }) as { lang?: string }
	const current = search.lang ?? "en"

	const currentLabel =
		LOCALES.find((l) => l.value === current)?.label ?? "English"

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton size="sm">
							<IconLanguage className="size-4" />
							<span>{currentLabel}</span>
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						side={isMobile ? "bottom" : "right"}
						align="end"
						sideOffset={4}
					>
						{LOCALES.map((locale) => (
							<DropdownMenuItem
								key={locale.value}
								onClick={() =>
									navigate({
										search: (prev) => ({ ...prev, lang: locale.value }),
									})
								}
								className={current === locale.value ? "font-medium" : ""}
							>
								{locale.label}
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	)
}
