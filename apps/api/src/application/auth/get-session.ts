import type { AuthService } from "#/domain/ports/auth-service.ts"

export interface GetSessionDeps {
	auth: AuthService
}

export function makeGetSession(deps: GetSessionDeps) {
	return (headers: Headers) => deps.auth.getSession(headers)
}
