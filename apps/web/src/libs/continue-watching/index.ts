import { useSyncExternalStore } from "react"

/** One resume point per anime — the last episode the user was watching. */
export interface WatchEntry {
	animeSlug: string
	animeTitle: string | null
	coverImageUrl: string | null
	episodeSlug: string
	episodeCode: string | null
	episodeTitle: string | null
	/** 0..1 playback fraction; 0 when unknown. */
	progress: number
	updatedAt: number
}

const KEY = "anivora_continue_watching"
const MAX = 20
const listeners = new Set<() => void>()

// Cached parse so getSnapshot is referentially stable for useSyncExternalStore.
let cacheRaw: string | null = null
let cache: WatchEntry[] = []

function read(): WatchEntry[] {
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
		cache = Array.isArray(parsed) ? (parsed as WatchEntry[]) : []
	} catch {
		cache = []
	}
	return cache
}

function write(next: WatchEntry[]): void {
	cache = next
	try {
		const raw = JSON.stringify(next)
		window.localStorage.setItem(KEY, raw)
		cacheRaw = raw
	} catch {
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

/** Upsert the resume point for an anime, moving it to the front of the list. */
export function recordProgress(entry: Omit<WatchEntry, "updatedAt">): void {
	const rest = read().filter((e) => e.animeSlug !== entry.animeSlug)
	write([{ ...entry, updatedAt: Date.now() }, ...rest].slice(0, MAX))
}

export function removeWatch(animeSlug: string): void {
	const current = read()
	const next = current.filter((e) => e.animeSlug !== animeSlug)
	if (next.length !== current.length) write(next)
}

/** Stored resume point for an anime, if any. */
export function getWatchEntry(animeSlug: string): WatchEntry | undefined {
	return read().find((e) => e.animeSlug === animeSlug)
}

/** Reactive list of resume points, newest first. */
export function useContinueWatching(): WatchEntry[] {
	return useSyncExternalStore(subscribe, read, () => cache)
}
