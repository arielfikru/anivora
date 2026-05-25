import { describe, expect, it, vi } from "vitest"

import type { ActivityRepository } from "#/domain/activity/activity-repository.ts"
import type { AuthService } from "#/domain/ports/auth-service.ts"
import type { Session } from "#/domain/session/session.ts"
import type { AuthedContext } from "../shared/context.ts"
import { makeCreateUser } from "./create-user.ts"

const makeSession = (): Session => ({
	user: {
		id: "caller",
		email: "caller@x",
		name: "Caller",
		role: "admin",
		banned: false,
		emailVerified: true,
		createdAt: new Date(),
		updatedAt: new Date(),
	},
	session: {
		id: "s1",
		token: "t",
		userId: "caller",
		expiresAt: new Date(Date.now() + 3600_000),
	},
})

const makeCtx = (): AuthedContext => ({
	session: makeSession(),
	headers: new Headers(),
})

const makeDeps = () => {
	const auth: Pick<AuthService, "createUser"> = {
		createUser: vi.fn().mockResolvedValue({ id: "new-user", email: "n@x" }),
	}
	const activityRepo: ActivityRepository = { insert: vi.fn(), list: vi.fn() }
	return { auth, activityRepo }
}

describe("makeCreateUser", () => {
	it("creates a user and logs the activity", async () => {
		const deps = makeDeps()
		const createUser = makeCreateUser(deps as never)
		const result = await createUser(
			{
				name: "Jane",
				email: "jane@x",
				password: "pw",
				role: "user",
			},
			makeCtx(),
		)

		expect(result.user.id).toBe("new-user")
		expect(deps.auth.createUser).toHaveBeenCalledWith(
			expect.objectContaining({ email: "jane@x", role: "user" }),
			expect.objectContaining({ headers: expect.any(Headers) }),
		)
		expect(deps.activityRepo.insert).toHaveBeenCalledWith(
			expect.objectContaining({
				action: "create",
				resource: "user",
				resourceId: "new-user",
			}),
		)
	})
})
