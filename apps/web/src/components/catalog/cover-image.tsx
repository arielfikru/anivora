import { cn } from "#/libs/clsx"
import { titleInitials } from "./format.ts"

interface ICoverImageProps {
	src: string | null
	title: string
	className?: string
	/** Default art used when `src` is empty (e.g. "/cover.png", "/banner.png"). */
	fallback?: string
}

/**
 * Image with a default placeholder, then a gradient + initials fallback when
 * neither `src` nor `fallback` is set. Used by cards, hero and detail art.
 */
export function CoverImage({
	src,
	title,
	className,
	fallback,
}: ICoverImageProps) {
	const resolved = src || fallback
	if (resolved) {
		return (
			<img
				src={resolved}
				alt={title}
				loading="lazy"
				className={cn("h-full w-full object-cover", className)}
			/>
		)
	}

	return (
		<div
			className={cn(
				"flex h-full w-full items-center justify-center",
				"bg-gradient-to-br from-anv-surface-2 via-anv-surface to-anv-bg",
				className,
			)}
		>
			<span className="display-title text-4xl font-bold text-anv-muted/70">
				{titleInitials(title)}
			</span>
		</div>
	)
}
