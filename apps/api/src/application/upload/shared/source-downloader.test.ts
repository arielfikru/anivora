import { describe, expect, it } from "vitest"

import { extractDriveId, extractGofileId } from "./source-downloader.ts"

describe("extractDriveId", () => {
	it("parses the /file/d/<id>/view shape", () => {
		expect(
			extractDriveId(
				"https://drive.google.com/file/d/1AbC_def-123/view?usp=sharing",
			),
		).toBe("1AbC_def-123")
	})

	it("parses the open?id= shape", () => {
		expect(extractDriveId("https://drive.google.com/open?id=9XyZ-09")).toBe(
			"9XyZ-09",
		)
	})

	it("parses the uc?export=download&id= shape", () => {
		expect(
			extractDriveId("https://drive.google.com/uc?export=download&id=abc123"),
		).toBe("abc123")
	})

	it("returns null when no id is present", () => {
		expect(extractDriveId("https://example.com/video.mp4")).toBeNull()
	})
})

describe("extractGofileId", () => {
	it("extracts ids from public folder links", () => {
		expect(extractGofileId("https://gofile.io/d/Bfsm1Y")).toBe("Bfsm1Y")
	})
})
