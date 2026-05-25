import { describe, expect, it } from "vitest"

import { createUserSchema, editUserSchema } from "./user-form-helpers.ts"

describe("createUserSchema", () => {
	it("accepts a valid payload", () => {
		const result = createUserSchema.safeParse({
			name: "Jane",
			email: "jane@example.com",
			password: "longenough",
			role: "user",
		})
		expect(result.success).toBe(true)
	})

	it("restricts role to the app-role enum", () => {
		const result = createUserSchema.safeParse({
			name: "Jane",
			email: "jane@example.com",
			password: "longenough",
			role: "super-admin",
		})
		expect(result.success).toBe(false)
	})

	it("rejects an invalid email", () => {
		const result = createUserSchema.safeParse({
			name: "Jane",
			email: "not-email",
			password: "longenough",
			role: "user",
		})
		expect(result.success).toBe(false)
	})

	it("enforces password minimum length", () => {
		const result = createUserSchema.safeParse({
			name: "Jane",
			email: "jane@example.com",
			password: "short",
			role: "user",
		})
		expect(result.success).toBe(false)
	})
})

describe("editUserSchema", () => {
	it("accepts a name+email update", () => {
		const result = editUserSchema.safeParse({
			name: "Jane",
			email: "jane@example.com",
		})
		expect(result.success).toBe(true)
	})

	it("requires name and email to be present", () => {
		expect(editUserSchema.safeParse({ name: "Jane" }).success).toBe(false)
		expect(
			editUserSchema.safeParse({ email: "jane@example.com" }).success,
		).toBe(false)
	})
})
