import { desc } from "drizzle-orm"

import type { UserRepository } from "#/domain/user/user-repository.ts"
import type { Db } from "../client.ts"
import * as schema from "../schema.ts"

export function createUserRepository(db: Db): UserRepository {
	return {
		async list() {
			const rows = await db
				.select({
					id: schema.user.id,
					name: schema.user.name,
					email: schema.user.email,
					role: schema.user.role,
					banned: schema.user.banned,
					createdAt: schema.user.createdAt,
				})
				.from(schema.user)
				.orderBy(desc(schema.user.createdAt))
			return rows
		},
	}
}
