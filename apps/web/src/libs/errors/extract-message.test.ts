import { describe, expect, it } from "vitest"

import { extractErrorMessage } from "./extract-message.ts"

describe("extractErrorMessage", () => {
	it("uses Error.message", () => {
		expect(extractErrorMessage(new Error("boom"))).toBe("boom")
	})

	it("uses subclass Error.message", () => {
		class MyErr extends Error {
			constructor() {
				super("nested")
			}
		}
		expect(extractErrorMessage(new MyErr())).toBe("nested")
	})

	it("passes through strings", () => {
		expect(extractErrorMessage("plain")).toBe("plain")
	})

	it("falls back for unknown shapes", () => {
		expect(extractErrorMessage(null)).toBe("An unexpected error occurred")
		expect(extractErrorMessage(42)).toBe("An unexpected error occurred")
		expect(extractErrorMessage({ foo: "bar" })).toBe(
			"An unexpected error occurred",
		)
		expect(extractErrorMessage(undefined)).toBe("An unexpected error occurred")
	})
})
