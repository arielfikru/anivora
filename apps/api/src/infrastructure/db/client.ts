import { drizzle } from "drizzle-orm/node-postgres"

import * as schema from "./schema.ts"

export type Db = ReturnType<typeof createDb>

export function createDb(url: string) {
	return drizzle(url, { schema })
}
