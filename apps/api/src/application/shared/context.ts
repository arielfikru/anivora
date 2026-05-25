import type { Session } from "#/domain/session/session.ts"

export interface AuthedContext {
	session: Session
	headers: Headers
}

export interface OptionalAuthContext {
	session: Session | null
	headers: Headers
}
