import { describe, expect, it } from "vitest"

import { slugify } from "./slug.ts"

describe("slugify", () => {
	it("lowercases and hyphenates spaces", () => {
		expect(slugify("Attack on Titan")).toBe("attack-on-titan")
	})

	it("strips punctuation", () => {
		expect(slugify("Re:Zero - Starting Life!")).toBe("re-zero-starting-life")
	})

	it("collapses repeated separators", () => {
		expect(slugify("  Hello   World  ")).toBe("hello-world")
	})

	it("removes accents", () => {
		expect(slugify("Pokémon")).toBe("pokemon")
	})

	it("returns empty string for non-alphanumeric input", () => {
		expect(slugify("!!!")).toBe("")
	})
})
