import { Link } from "@tanstack/react-router"
import {
	Clapperboard,
	Heart,
	House,
	type LucideIcon,
	Play,
	Search,
	Settings,
	Tv,
} from "lucide-react"
import { cn } from "#/libs/clsx"
import { RailClock } from "./rail-clock.tsx"

interface INavItem {
	to: string
	label: string
	icon: LucideIcon
}

const NAV_ITEMS: INavItem[] = [
	{ to: "/", label: "Beranda", icon: House },
	{ to: "/search", label: "Cari", icon: Search },
	{ to: "/anime", label: "Jelajah", icon: Clapperboard },
	{ to: "/favorites", label: "Favorit", icon: Heart },
	{ to: "/settings", label: "Pengaturan", icon: Settings },
]

/** Fixed left vertical icon rail: logo, nav, clock. */
export function IconRail() {
	return (
		<nav className="fixed inset-y-0 left-0 z-30 flex w-[72px] flex-col items-center justify-between border-r border-white/10 bg-[var(--sidebar)] py-5">
			<Link
				to="/"
				data-focusable
				aria-label="Anivora beranda"
				className="flex size-11 items-center justify-center rounded-xl bg-anv-red text-white shadow-lg outline-none transition focus-visible:scale-110"
			>
				<Play className="size-6 fill-current" />
			</Link>

			<ul className="flex flex-1 flex-col items-center justify-center gap-3">
				{NAV_ITEMS.map((item) => (
					<li key={item.to}>
						<RailLink {...item} />
					</li>
				))}
			</ul>

			<div className="flex flex-col items-center gap-3">
				<a
					href="/?pick=1"
					data-focusable
					aria-label="Ganti mode tampilan"
					className="group relative flex size-12 items-center justify-center rounded-xl text-anv-muted outline-none transition hover:bg-anv-surface-2 hover:text-anv-text focus-visible:bg-anv-surface-2 focus-visible:text-anv-text"
				>
					<Tv className="size-6" />
					<span className="pointer-events-none absolute left-[58px] z-40 whitespace-nowrap rounded-md bg-anv-surface-2 px-2 py-1 text-xs font-semibold text-anv-text opacity-0 shadow-lg transition group-hover:opacity-100 group-focus-visible:opacity-100">
						Ganti mode
					</span>
				</a>
				<RailClock />
			</div>
		</nav>
	)
}

function RailLink({ to, label, icon: Icon }: INavItem) {
	return (
		<Link
			to={to}
			data-focusable
			aria-label={label}
			activeOptions={{ exact: to === "/" }}
			className="group relative flex size-12 items-center justify-center rounded-xl text-anv-muted outline-none transition hover:bg-anv-surface-2 hover:text-anv-text focus-visible:bg-anv-surface-2 focus-visible:text-anv-text data-[status=active]:bg-anv-red/15 data-[status=active]:text-anv-red"
		>
			<Icon className="size-6" />
			<span
				className={cn(
					"pointer-events-none absolute left-[58px] z-40 whitespace-nowrap rounded-md bg-anv-surface-2 px-2 py-1 text-xs font-semibold text-anv-text opacity-0 shadow-lg transition",
					"group-hover:opacity-100 group-focus-visible:opacity-100",
				)}
			>
				{label}
			</span>
		</Link>
	)
}
