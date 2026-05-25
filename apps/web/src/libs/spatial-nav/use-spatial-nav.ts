import { useEffect } from "react"

type TDirection = "up" | "down" | "left" | "right"

const ARROW_MAP: Record<string, TDirection> = {
	ArrowUp: "up",
	ArrowDown: "down",
	ArrowLeft: "left",
	ArrowRight: "right",
}

const SELECTOR = "[data-focusable]:not([disabled]):not([aria-disabled='true'])"

interface ICenter {
	x: number
	y: number
}

const centerOf = (el: Element): ICenter => {
	const r = el.getBoundingClientRect()
	return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
}

const isVisible = (el: Element): boolean => {
	const r = el.getBoundingClientRect()
	return r.width > 0 && r.height > 0
}

/** Returns true when `to` sits in `dir` relative to `from`. */
const inDirection = (from: ICenter, to: ICenter, dir: TDirection): boolean => {
	const dx = to.x - from.x
	const dy = to.y - from.y
	if (dir === "left") return dx < -1
	if (dir === "right") return dx > 1
	if (dir === "up") return dy < -1
	return dy > 1
}

/** Weighted distance: cheap to move along the axis, costly off-axis. */
const score = (from: ICenter, to: ICenter, dir: TDirection): number => {
	const dx = to.x - from.x
	const dy = to.y - from.y
	const along = dir === "left" || dir === "right" ? Math.abs(dx) : Math.abs(dy)
	const cross = dir === "left" || dir === "right" ? Math.abs(dy) : Math.abs(dx)
	return along + cross * 2.5
}

const findNext = (current: Element, dir: TDirection): HTMLElement | null => {
	const from = centerOf(current)
	let best: HTMLElement | null = null
	let bestScore = Number.POSITIVE_INFINITY
	const candidates = document.querySelectorAll<HTMLElement>(SELECTOR)
	for (const el of candidates) {
		if (el === current || !isVisible(el)) continue
		const to = centerOf(el)
		if (!inDirection(from, to, dir)) continue
		const s = score(from, to, dir)
		if (s < bestScore) {
			bestScore = s
			best = el
		}
	}
	return best
}

const firstFocusable = (): HTMLElement | null => {
	for (const el of document.querySelectorAll<HTMLElement>(SELECTOR)) {
		if (isVisible(el)) return el
	}
	return null
}

const isTypingTarget = (el: Element | null): boolean => {
	if (!el) return false
	const tag = el.tagName
	return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT"
}

/**
 * Lightweight D-pad / arrow-key spatial navigation.
 * Mount once at the shell level. Native Tab order keeps working.
 */
export function useSpatialNav(): void {
	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			const active = document.activeElement
			const dir = ARROW_MAP[e.key]

			if (dir) {
				// Let arrow keys edit text inside fields.
				if (isTypingTarget(active)) return
				const origin =
					active && active !== document.body ? active : firstFocusable()
				if (!origin) return
				const next = findNext(origin, dir)
				if (next) {
					e.preventDefault()
					next.focus()
					next.scrollIntoView({
						block: "nearest",
						inline: "center",
						behavior: "smooth",
					})
				}
				return
			}

			if (e.key === "Backspace" && !isTypingTarget(active)) {
				e.preventDefault()
				window.history.back()
			}
		}

		window.addEventListener("keydown", onKeyDown)
		return () => window.removeEventListener("keydown", onKeyDown)
	}, [])
}
