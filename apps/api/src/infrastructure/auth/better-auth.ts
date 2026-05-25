import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { admin } from "better-auth/plugins/admin"

import type { ActivityRepository } from "#/domain/activity/activity-repository.ts"
import { env } from "../config/env.ts"
import type { Db } from "../db/client.ts"

export interface BuildAuthDeps {
	db: Db
	activityRepo: ActivityRepository
}

export function buildAuth({ db, activityRepo }: BuildAuthDeps) {
	const googleConfigured =
		env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
			? {
					google: {
						clientId: env.GOOGLE_CLIENT_ID,
						clientSecret: env.GOOGLE_CLIENT_SECRET,
					},
				}
			: undefined
	return betterAuth({
		database: drizzleAdapter(db, { provider: "pg" }),
		emailAndPassword: {
			enabled: true,
		},
		...(googleConfigured ? { socialProviders: googleConfigured } : {}),
		databaseHooks: {
			user: {
				create: {
					after: async (user) => {
						await activityRepo
							.insert({
								userId: user.id,
								action: "sign-up",
								resource: "user",
								resourceId: user.id,
								metadata: { email: user.email, name: user.name },
							})
							.catch(() => {})
					},
				},
			},
			session: {
				create: {
					after: async (session) => {
						await activityRepo
							.insert({
								userId: session.userId,
								action: "sign-in",
								resource: "session",
								resourceId: session.id,
							})
							.catch(() => {})
					},
				},
				delete: {
					after: async (session) => {
						await activityRepo
							.insert({
								userId: session.userId,
								action: "sign-out",
								resource: "session",
								resourceId: session.id,
							})
							.catch(() => {})
					},
				},
			},
		},
		plugins: [
			admin({
				defaultRole: "user",
				adminRoles: ["admin"],
			}),
		],
	})
}

export type BetterAuth = ReturnType<typeof buildAuth>
