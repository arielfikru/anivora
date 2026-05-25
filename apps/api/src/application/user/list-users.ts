import type { UserRepository } from "#/domain/user/user-repository.ts"
import type { AuthedContext } from "../shared/context.ts"

export interface ListUsersDeps {
	userRepo: UserRepository
}

export function makeListUsers(deps: ListUsersDeps) {
	return async (_ctx: AuthedContext) => {
		const users = await deps.userRepo.list()
		return { users }
	}
}
