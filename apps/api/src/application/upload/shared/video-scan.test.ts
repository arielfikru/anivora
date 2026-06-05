import { describe, expect, it } from "vitest"

import { episodeNumber } from "./video-scan.ts"

describe("episodeNumber", () => {
	it("reads an explicit Ep marker", () => {
		expect(episodeNumber("SAO Ep 02 [720p].mkv")).toBe(2)
		expect(episodeNumber("show-E03_1080p.mp4")).toBe(3)
		expect(episodeNumber("Episode 12.mp4")).toBe(12)
	})

	it("falls back to a standalone number", () => {
		expect(episodeNumber("Alicization 07.mp4")).toBe(7)
	})

	it("ignores resolution digits glued to other digits", () => {
		// 720 is 3 digits but flanked, "05" is the standalone run.
		expect(episodeNumber("anime_05_720p.mp4")).toBe(5)
	})

	it("returns null when no number is present", () => {
		expect(episodeNumber("movie.mp4")).toBeNull()
	})
})
