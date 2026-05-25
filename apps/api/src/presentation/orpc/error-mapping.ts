import { ORPCError } from "@orpc/server"

import { AppError } from "#/application/shared/errors.ts"

export function toORPCError(err: unknown): never {
	if (err instanceof AppError) {
		throw new ORPCError(err.code, { message: err.message })
	}
	throw err
}
