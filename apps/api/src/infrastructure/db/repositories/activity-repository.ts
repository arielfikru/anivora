import { and, desc, eq, sql } from "drizzle-orm"

import type { ActivityRepository } from "#/domain/activity/activity-repository.ts"
import type { Db } from "../client.ts"
import * as schema from "../schema.ts"

export function createActivityRepository(db: Db): ActivityRepository {
	return {
		async insert(entry) {
			await db.insert(schema.activityLog).values({
				id: crypto.randomUUID(),
				userId: entry.userId ?? null,
				action: entry.action,
				resource: entry.resource,
				resourceId: entry.resourceId ?? null,
				metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
				ipAddress: entry.ipAddress ?? null,
				userAgent: entry.userAgent ?? null,
			})
		},

		async list(filters) {
			const conditions = [
				filters.userId
					? eq(schema.activityLog.userId, filters.userId)
					: undefined,
				filters.resource
					? eq(schema.activityLog.resource, filters.resource)
					: undefined,
				filters.action
					? eq(schema.activityLog.action, filters.action)
					: undefined,
			].filter(Boolean)

			const where = conditions.length > 0 ? and(...conditions) : undefined

			const [logs, [{ count }]] = await Promise.all([
				db
					.select({
						id: schema.activityLog.id,
						userId: schema.activityLog.userId,
						action: schema.activityLog.action,
						resource: schema.activityLog.resource,
						resourceId: schema.activityLog.resourceId,
						metadata: schema.activityLog.metadata,
						ipAddress: schema.activityLog.ipAddress,
						userAgent: schema.activityLog.userAgent,
						createdAt: schema.activityLog.createdAt,
						userName: schema.user.name,
						userEmail: schema.user.email,
					})
					.from(schema.activityLog)
					.leftJoin(schema.user, eq(schema.activityLog.userId, schema.user.id))
					.where(where)
					.orderBy(desc(schema.activityLog.createdAt))
					.limit(filters.limit)
					.offset(filters.offset),
				db
					.select({ count: sql<number>`count(*)::int` })
					.from(schema.activityLog)
					.where(where),
			])

			return { logs, total: count }
		},
	}
}
