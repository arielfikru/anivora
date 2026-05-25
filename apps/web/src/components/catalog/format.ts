/** "24m" / "1h 04m" from a duration in seconds. */
export function formatDuration(seconds: number | null): string {
	if (!seconds || seconds <= 0) return ""
	const total = Math.round(seconds / 60)
	if (total < 60) return `${total}m`
	const h = Math.floor(total / 60)
	const m = total % 60
	return `${h}h ${String(m).padStart(2, "0")}m`
}

const RATING_LABEL: Record<string, string> = {
	general: "SU",
	teen: "13+",
	mature: "17+",
	adult: "21+",
}

export function ratingLabel(rating: string): string {
	return RATING_LABEL[rating] ?? rating.toUpperCase()
}

/** Up to two uppercase initials from a title, for placeholder art. */
export function titleInitials(title: string): string {
	const words = title.trim().split(/\s+/).filter(Boolean)
	if (words.length === 0) return "?"
	if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
	return (words[0][0] + words[1][0]).toUpperCase()
}

/** Join truthy meta parts with a middle dot. */
export function metaLine(
	parts: Array<string | number | null | undefined>,
): string {
	return parts
		.filter((p) => p !== null && p !== undefined && p !== "")
		.join(" · ")
}
