import { Check, Plus } from "lucide-react"
import { cn } from "#/libs/clsx"
import {
	type FavoriteAnime,
	toggleFavorite,
	useIsFavorite,
} from "#/libs/favorites"

interface IFavoriteButtonProps {
	/** Any object carrying the FavoriteAnime fields (AnimeListItem or Anime). */
	anime: FavoriteAnime
	className?: string
}

const BASE =
	"inline-flex h-12 items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-7 font-semibold text-anv-text outline-none backdrop-blur transition hover:bg-white/20 focus-visible:scale-105"

/** Toggles an anime in the local "Daftar Saya" (favorites) list. */
export function FavoriteButton({ anime, className }: IFavoriteButtonProps) {
	const saved = useIsFavorite(anime.slug)
	return (
		<button
			type="button"
			data-focusable
			aria-pressed={saved}
			onClick={() => toggleFavorite(anime)}
			className={cn(
				BASE,
				saved && "border-anv-red/60 bg-anv-red/15 hover:bg-anv-red/25",
				className,
			)}
		>
			{saved ? <Check className="size-5" /> : <Plus className="size-5" />}
			{saved ? "Tersimpan" : "Daftar Saya"}
		</button>
	)
}
