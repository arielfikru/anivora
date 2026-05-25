import { describe, expect, it } from "vitest"

import { registerSchema } from "./schema.ts"

describe("registerSchema", () => {
	it("accepts a full valid payload", () => {
		const result = registerSchema.safeParse({
			name: "Jane",
			email: "jane@example.com",
			password: "longenough",
		})
		expect(result.success).toBe(true)
	})

	it("requires name", () => {
		const result = registerSchema.safeParse({
			name: "",
			email: "a@b.com",
			password: "longenough",
		})
		expect(result.success).toBe(false)
	})

	it("enforces min password length", () => {
		const result = registerSchema.safeParse({
			name: "Jane",
			email: "jane@example.com",
			password: "short",
		})
		expect(result.success).toBe(false)
		expect(result.error?.issues[0]?.message).toMatch(/8 characters/)
	})
})
