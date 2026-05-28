import { useEffect } from "react"

const SITE = "Anivora"
const DEFAULT_DESCRIPTION =
	"Anivora — streaming anime fanmade, doujin, dan kreator lokal."

export interface Seo {
	/** Page title; site name is appended automatically. Omit for the home page. */
	title?: string
	description?: string | null
	/** Absolute URL or server-relative path; resolved to absolute for OG. */
	image?: string | null
}

function upsertMeta(attr: "name" | "property", key: string, content: string) {
	let el = document.head.querySelector<HTMLMetaElement>(
		`meta[${attr}="${key}"]`,
	)
	if (!el) {
		el = document.createElement("meta")
		el.setAttribute(attr, key)
		document.head.appendChild(el)
	}
	el.setAttribute("content", content)
}

function absolute(path: string): string {
	const origin = window.location.origin
	return path.startsWith("/") ? `${origin}${path}` : path
}

/**
 * Imperatively manage the document head for the current page. Client-side only
 * (this is a CSR SPA) — good enough for tab titles and social-share previews.
 * Every page should call this so head tags stay deterministic across nav.
 */
export function useSeo({ title, description, image }: Seo) {
	useEffect(() => {
		if (typeof document === "undefined") return
		const fullTitle = title ? `${title} — ${SITE}` : SITE
		const desc = description || DEFAULT_DESCRIPTION
		const ogImage = absolute(image || "/banner.png")

		document.title = fullTitle
		upsertMeta("name", "description", desc)
		upsertMeta("property", "og:site_name", SITE)
		upsertMeta("property", "og:type", "website")
		upsertMeta("property", "og:title", title ?? SITE)
		upsertMeta("property", "og:description", desc)
		upsertMeta("property", "og:image", ogImage)
		upsertMeta("property", "og:url", window.location.href)
		upsertMeta("name", "twitter:card", "summary_large_image")
		upsertMeta("name", "twitter:title", title ?? SITE)
		upsertMeta("name", "twitter:description", desc)
		upsertMeta("name", "twitter:image", ogImage)
	}, [title, description, image])
}
