import { eq } from "drizzle-orm"
import type { Db } from "#/infrastructure/db/client.ts"
import * as schema from "#/infrastructure/db/schema.ts"

export interface ContentSyncStateStore {
	hasCompletedInitial(provider: string): Promise<boolean>
	markInitialCompleted(provider: string): Promise<void>
	markSynced(provider: string): Promise<void>
}

export function createContentSyncStateStore(db: Db): ContentSyncStateStore {
	return {
		async hasCompletedInitial(provider) {
			const row = await db
				.select({ completed: schema.contentSyncState.initialSyncCompleted })
				.from(schema.contentSyncState)
				.where(eq(schema.contentSyncState.provider, provider))
				.limit(1)
				.then((rows) => rows[0])
			return row?.completed ?? false
		},

		async markInitialCompleted(provider) {
			const now = new Date()
			await db
				.insert(schema.contentSyncState)
				.values({
					provider,
					initialSyncCompleted: true,
					lastSyncedAt: now,
					updatedAt: now,
				})
				.onConflictDoUpdate({
					target: schema.contentSyncState.provider,
					set: {
						initialSyncCompleted: true,
						lastSyncedAt: now,
						updatedAt: now,
					},
				})
		},

		async markSynced(provider) {
			const now = new Date()
			await db
				.insert(schema.contentSyncState)
				.values({ provider, lastSyncedAt: now, updatedAt: now })
				.onConflictDoUpdate({
					target: schema.contentSyncState.provider,
					set: { lastSyncedAt: now, updatedAt: now },
				})
		},
	}
}
