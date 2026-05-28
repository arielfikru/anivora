import { useSyncExternalStore } from "react"

/** Minimal anime shape persisted locally — enough to render a media card. */
export interface FavoriteAnime {
	id: string
	title: string
	slug: string
	coverImageUrl: string | null
	bannerImageUrl: string | null
	releaseYear: number | null
	contentRating: string
}

const KEY = "anivora_favorites"
const listeners = new Set<() => void>()

// Cache the parsed list so getSnapshot stays referentially stable (required by
// useSyncExternalStore — re-parsing every read would loop forever).
let cacheRaw: string | null = null
let cache: FavoriteAnime[] = []

function read(): FavoriteAnime[] {
	if (typeof window === "undefined") return cache
	let raw: string | null
	try {
		raw = window.localStorage.getItem(KEY)
	} catch {
		return cache
	}
	if (raw === cacheRaw) return cache
	cacheRaw = raw
	try {
		const parsed = raw ? JSON.parse(raw) : []
		cache = Array.isArray(parsed) ? (parsed as FavoriteAnime[]) : []
	} catch {
		cache = []
	}
	return cache
}

function write(next: FavoriteAnime[]): void {
	cache = next
	try {
		const raw = JSON.stringify(next)
		window.localStorage.setItem(KEY, raw)
		cacheRaw = raw
	} catch {
		// Storage unavailable/full — keep the in-memory cache so the UI still
		// reflects the change for this session.
		cacheRaw = null
	}
	for (const notify of listeners) notify()
}

function subscribe(onChange: () => void): () => void {
	listeners.add(onChange)
	const onStorage = (e: StorageEvent) => {
		if (e.key === KEY) onChange()
	}
	window.addEventListener("storage", onStorage)
	return () => {
		listeners.delete(onChange)
		window.removeEventListener("storage", onStorage)
	}
}

export function isFavorite(slug: string): boolean {
	return read().some((f) => f.slug === slug)
}

export function addFavorite(anime: FavoriteAnime): void {
	const current = read()
	if (current.some((f) => f.slug === anime.slug)) return
	write([anime, ...current])
}

export function removeFavorite(slug: string): void {
	const current = read()
	const next = current.filter((f) => f.slug !== slug)
	if (next.length !== current.length) write(next)
}

export function toggleFavorite(anime: FavoriteAnime): void {
	if (isFavorite(anime.slug)) removeFavorite(anime.slug)
	else addFavorite(anime)
}

/** Reactive list of saved anime, newest first. */
export function useFavorites(): FavoriteAnime[] {
	return useSyncExternalStore(subscribe, read, () => cache)
}

/** Reactive boolean for whether a given anime slug is saved. */
export function useIsFavorite(slug: string): boolean {
	return useSyncExternalStore(
		subscribe,
		() => isFavorite(slug),
		() => false,
	)
}
