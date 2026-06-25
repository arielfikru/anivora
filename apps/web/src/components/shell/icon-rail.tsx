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
		<nav className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-center justify-between border-t border-white/10 bg-[var(--sidebar)] px-2 md:inset-y-0 md:left-0 md:right-auto md:h-auto md:w-[72px] md:flex-col md:border-r md:border-t-0 md:px-0 md:py-5">
			<Link
				to="/"
				data-focusable
				aria-label="Anivora beranda"
				className="hidden size-11 items-center justify-center rounded-xl bg-anv-red text-white shadow-lg outline-none transition focus-visible:scale-110 md:flex"
			>
				<Play className="size-6 fill-current" />
			</Link>

			<ul className="grid flex-1 grid-cols-5 items-center gap-1 md:flex md:flex-col md:justify-center md:gap-3">
				{NAV_ITEMS.map((item) => (
					<li key={item.to} className="flex justify-center">
						<RailLink {...item} />
					</li>
				))}
			</ul>

			<div className="flex items-center justify-center md:flex-col md:gap-3">
				<a
					href="/?pick=1"
					data-focusable
					aria-label="Ganti mode tampilan"
					className="group relative flex size-12 items-center justify-center rounded-xl text-anv-muted outline-none transition hover:bg-anv-surface-2 hover:text-anv-text focus-visible:bg-anv-surface-2 focus-visible:text-anv-text"
				>
					<Tv className="size-6" />
					<span className="pointer-events-none absolute bottom-[58px] z-40 hidden whitespace-nowrap rounded-md bg-anv-surface-2 px-2 py-1 text-xs font-semibold text-anv-text opacity-0 shadow-lg transition group-hover:opacity-100 group-focus-visible:opacity-100 md:bottom-auto md:left-[58px] md:block">
						Ganti mode
					</span>
				</a>
				<div className="hidden md:block">
					<RailClock />
				</div>
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
					"pointer-events-none absolute bottom-[58px] z-40 hidden whitespace-nowrap rounded-md bg-anv-surface-2 px-2 py-1 text-xs font-semibold text-anv-text opacity-0 shadow-lg transition md:bottom-auto md:left-[58px] md:block",
					"group-hover:opacity-100 group-focus-visible:opacity-100",
				)}
			>
				{label}
			</span>
		</Link>
	)
}
