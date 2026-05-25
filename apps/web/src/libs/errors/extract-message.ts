import { match, P } from "ts-pattern"

export const extractErrorMessage = (error: unknown): string =>
	match(error)
		.with(P.instanceOf(Error), (e) => e.message)
		.with(P.string, (s) => s)
		.otherwise(() => "An unexpected error occurred")
