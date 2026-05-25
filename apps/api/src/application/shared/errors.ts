export type AppErrorCode =
	| "UNAUTHORIZED"
	| "FORBIDDEN"
	| "NOT_FOUND"
	| "BAD_REQUEST"
	| "CONFLICT"
	| "INTERNAL_ERROR"

export class AppError extends Error {
	readonly code: AppErrorCode
	constructor(code: AppErrorCode, message: string) {
		super(message)
		this.code = code
		this.name = "AppError"
	}
}

export const unauthorized = (message: string) =>
	new AppError("UNAUTHORIZED", message)
export const forbidden = (message: string) => new AppError("FORBIDDEN", message)
export const notFound = (message: string) => new AppError("NOT_FOUND", message)
export const badRequest = (message: string) =>
	new AppError("BAD_REQUEST", message)
export const conflict = (message: string) => new AppError("CONFLICT", message)
