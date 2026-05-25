import type { UseCases } from "#/application/use-cases.ts"
import { adminProcedure, toAuthedContext } from "../orpc/middleware.ts"
import {
	banUserSchema,
	createUserSchema,
	deleteUserSchema,
	setRoleSchema,
	unbanUserSchema,
	updateUserSchema,
} from "../orpc/schemas.ts"

export function buildUserRouter(useCases: UseCases["user"]) {
	return {
		listUsers: adminProcedure.handler(({ context }) =>
			useCases.list(toAuthedContext(context)),
		),

		banUser: adminProcedure
			.input(banUserSchema)
			.handler(({ input, context }) =>
				useCases.ban(input, toAuthedContext(context)),
			),

		unbanUser: adminProcedure
			.input(unbanUserSchema)
			.handler(({ input, context }) =>
				useCases.unban(input, toAuthedContext(context)),
			),

		setRole: adminProcedure
			.input(setRoleSchema)
			.handler(({ input, context }) =>
				useCases.setRole(input, toAuthedContext(context)),
			),

		createUser: adminProcedure
			.input(createUserSchema)
			.handler(({ input, context }) =>
				useCases.create(input, toAuthedContext(context)),
			),

		updateUser: adminProcedure
			.input(updateUserSchema)
			.handler(({ input, context }) =>
				useCases.update(input, toAuthedContext(context)),
			),

		deleteUser: adminProcedure
			.input(deleteUserSchema)
			.handler(({ input, context }) =>
				useCases.delete(input, toAuthedContext(context)),
			),
	}
}
