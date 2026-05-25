import { describe, expect, it } from "vitest"

import { bunnyStatusToEpisodeStatus } from "./status.ts"

describe("bunnyStatusToEpisodeStatus", () => {
	it("maps 0 and 1 to uploaded", () => {
		expect(bunnyStatusToEpisodeStatus(0)).toBe("uploaded")
		expect(bunnyStatusToEpisodeStatus(1)).toBe("uploaded")
	})

	it("maps 2 and 3 to processing", () => {
		expect(bunnyStatusToEpisodeStatus(2)).toBe("processing")
		expect(bunnyStatusToEpisodeStatus(3)).toBe("processing")
	})

	it("maps 4 to ready", () => {
		expect(bunnyStatusToEpisodeStatus(4)).toBe("ready")
	})

	it("maps 5 and 6 to failed", () => {
		expect(bunnyStatusToEpisodeStatus(5)).toBe("failed")
		expect(bunnyStatusToEpisodeStatus(6)).toBe("failed")
	})

	it("maps unknown values to failed", () => {
		expect(bunnyStatusToEpisodeStatus(99)).toBe("failed")
	})
})
