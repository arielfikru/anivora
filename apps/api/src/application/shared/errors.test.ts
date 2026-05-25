import { describe, expect, it } from "vitest"

import {
	AppError,
	badRequest,
	conflict,
	forbidden,
	notFound,
	unauthorized,
} from "./errors.ts"

describe("AppError", () => {
	it("stores code and message", () => {
		const err = new AppError("NOT_FOUND", "gone")
		expect(err.code).toBe("NOT_FOUND")
		expect(err.message).toBe("gone")
		expect(err.name).toBe("AppError")
	})

	it("is an instanceof Error", () => {
		const err = new AppError("FORBIDDEN", "nope")
		expect(err).toBeInstanceOf(Error)
		expect(err).toBeInstanceOf(AppError)
	})
})

describe("factory helpers", () => {
	it.each([
		["unauthorized", unauthorized, "UNAUTHORIZED"],
		["forbidden", forbidden, "FORBIDDEN"],
		["notFound", notFound, "NOT_FOUND"],
		["badRequest", badRequest, "BAD_REQUEST"],
		["conflict", conflict, "CONFLICT"],
	] as const)("%s produces an AppError with the right code", (_name, fn, code) => {
		const err = fn("hi")
		expect(err).toBeInstanceOf(AppError)
		expect(err.code).toBe(code)
		expect(err.message).toBe("hi")
	})
})
