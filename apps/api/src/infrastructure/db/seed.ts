import { eq } from "drizzle-orm"

import { buildAuth } from "#/infrastructure/auth/better-auth.ts"
import { env } from "#/infrastructure/config/env.ts"
import { createDb } from "./client.ts"
import { createActivityRepository } from "./repositories/activity-repository.ts"
import * as schema from "./schema.ts"

const ADMIN_EMAIL = "admin@example.com"
const ADMIN_PASSWORD = "Password123!"

async function seed() {
	const db = createDb(env.DATABASE_URL)
	const activityRepo = createActivityRepository(db)
	const auth = buildAuth({ db, activityRepo })

	console.log("Seeding admin user...")

	const existing = await db
		.select({ id: schema.user.id })
		.from(schema.user)
		.where(eq(schema.user.email, ADMIN_EMAIL))
		.limit(1)
		.then((r) => r[0])

	if (existing) {
		console.log("✓ Admin already exists:", ADMIN_EMAIL)
	} else {
		const admin = await auth.api.createUser({
			body: {
				name: "Admin",
				email: ADMIN_EMAIL,
				password: ADMIN_PASSWORD,
				role: "admin",
			},
		})
		console.log("✓ Admin:", admin.user.email)
	}

	console.log("\nCredentials:")
	console.log(`  Admin : ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`)
}

seed()
	.catch(console.error)
	.finally(() => process.exit(0))
