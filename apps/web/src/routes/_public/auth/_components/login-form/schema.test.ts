import { describe, expect, it } from "vitest"

import { loginSchema } from "./schema.ts"

describe("loginSchema", () => {
	it("accepts a valid email + password", () => {
		const result = loginSchema.safeParse({
			email: "user@example.com",
			password: "secret",
		})
		expect(result.success).toBe(true)
	})

	it("rejects an invalid email", () => {
		const result = loginSchema.safeParse({ email: "nope", password: "x" })
		expect(result.success).toBe(false)
		expect(result.error?.issues[0]?.message).toMatch(/email/i)
	})

	it("rejects an empty password", () => {
		const result = loginSchema.safeParse({ email: "u@x.com", password: "" })
		expect(result.success).toBe(false)
		expect(result.error?.issues[0]?.message).toMatch(/password/i)
	})
})
