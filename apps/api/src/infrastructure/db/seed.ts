import { eq } from "drizzle-orm"

import { buildAuth } from "#/infrastructure/auth/better-auth.ts"
import { env } from "#/infrastructure/config/env.ts"
import type { Db } from "./client.ts"
import { createDb } from "./client.ts"
import { createActivityRepository } from "./repositories/activity-repository.ts"
import * as schema from "./schema.ts"

const ADMIN_EMAIL = "admin@example.com"
const ADMIN_PASSWORD = "Password123!"
const DEMO_SLUG = "anivora-origins"

async function seedDemoCatalog(db: Db) {
	const existing = await db
		.select({ id: schema.anime.id })
		.from(schema.anime)
		.where(eq(schema.anime.slug, DEMO_SLUG))
		.limit(1)
		.then((r) => r[0])
	if (existing) {
		console.log("✓ Demo anime already exists:", DEMO_SLUG)
		return
	}
	const animeId = crypto.randomUUID()
	const seasonId = crypto.randomUUID()
	await db.insert(schema.anime).values({
		id: animeId,
		title: "Anivora Origins",
		slug: DEMO_SLUG,
		description: "A demo series seeded for the catalog.",
		status: "published",
		contentRating: "general",
		releaseYear: 2026,
		isOriginalContent: true,
	})
	await db.insert(schema.season).values({
		id: seasonId,
		animeId,
		seasonNumber: 1,
		title: "Season 1",
		status: "published",
		releaseYear: 2026,
	})
	await db.insert(schema.episode).values([
		{
			id: crypto.randomUUID(),
			animeId,
			seasonId,
			episodeNumber: 1,
			episodeCode: "S01E01",
			slug: `${DEMO_SLUG}-s01e01`,
			title: "Pilot",
			durationSeconds: 1440,
			status: "published",
			publishedAt: new Date(),
		},
		{
			id: crypto.randomUUID(),
			animeId,
			seasonId,
			episodeNumber: 2,
			episodeCode: "S01E02",
			slug: `${DEMO_SLUG}-s01e02`,
			title: "The Catalog",
			durationSeconds: 1500,
			status: "ready",
		},
	])
	console.log("✓ Demo anime seeded:", DEMO_SLUG)
}

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

	console.log("\nSeeding demo catalog...")
	await seedDemoCatalog(db)

	console.log("\nCredentials:")
	console.log(`  Admin : ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`)
}

seed()
	.catch(console.error)
	.finally(() => process.exit(0))
