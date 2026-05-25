import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { drizzle } from "drizzle-orm/node-postgres"
import { migrate } from "drizzle-orm/node-postgres/migrator"

const url = process.env.DATABASE_URL
if (!url) {
	console.error("DATABASE_URL is not set")
	process.exit(1)
}

const here = dirname(fileURLToPath(import.meta.url))
const migrationsFolder =
	process.env.DRIZZLE_MIGRATIONS_FOLDER ?? resolve(here, "drizzle")

console.log(`[migrate] applying migrations from ${migrationsFolder}`)

const db = drizzle(url)
await migrate(db, { migrationsFolder })

console.log("[migrate] done")
process.exit(0)
