import { Link } from "@tanstack/react-router"
import { cn } from "#/libs/clsx"
import { CoverImage } from "./cover-image.tsx"

export interface IMediaCardProps {
	to: string
	params?: Record<string, string>
	title: string
	imageUrl: string | null
	meta?: string
	isNew?: boolean
	/** 0..1 — renders a bottom red progress bar when > 0. */
	progress?: number
}

/**
 * Landscape (~16:9) focusable media card. Focus = red ring + scale + glow.
 * Renders as a TanStack Router Link and a spatial-nav target.
 */
export function MediaCard({
	to,
	params,
	title,
	imageUrl,
	meta,
	isNew,
	progress = 0,
}: IMediaCardProps) {
	return (
		<Link
			to={to}
			params={params}
			data-focusable
			className={cn(
				"group block w-[180px] shrink-0 outline-none sm:w-[220px] lg:w-[280px]",
				"rounded-xl transition-transform duration-200",
				"focus-visible:scale-[1.06] hover:scale-[1.04]",
				"focus-within:scale-[1.06] focus-visible:z-10 hover:z-10",
			)}
		>
			<div
				className={cn(
					"relative aspect-video overflow-hidden rounded-xl bg-anv-surface",
					"border-2 border-transparent shadow-lg transition-all duration-200",
					"group-hover:border-anv-red/60",
					"group-focus-visible:border-anv-red group-focus-visible:shadow-[0_0_0_3px_rgba(226,54,54,0.35),0_18px_40px_rgba(0,0,0,0.6)]",
				)}
			>
				<CoverImage src={imageUrl} title={title} />
				{isNew ? (
					<span className="absolute left-2 top-2 rounded-md bg-anv-red px-2 py-0.5 text-[11px] font-bold tracking-wide text-white shadow">
						BARU
					</span>
				) : null}
				{progress > 0 ? (
					<div className="absolute inset-x-0 bottom-0 h-1 bg-black/50">
						<div
							className="h-full bg-anv-red"
							style={{ width: `${Math.min(100, Math.round(progress * 100))}%` }}
						/>
					</div>
				) : null}
			</div>
			<p className="mt-2 truncate text-sm font-semibold text-anv-text">
				{title}
			</p>
			{meta ? <p className="truncate text-xs text-anv-muted">{meta}</p> : null}
		</Link>
	)
}
