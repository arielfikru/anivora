import type { UserRole } from "../user/user.ts"

export interface SessionUser {
	id: string
	email: string
	name: string
	image?: string | null
	role: UserRole
	banned: boolean | null
	banReason?: string | null
	banExpires?: Date | null
	emailVerified: boolean
	createdAt: Date
	updatedAt: Date
}

export interface SessionRecord {
	id: string
	token: string
	userId: string
	expiresAt: Date
	ipAddress?: string | null
	userAgent?: string | null
	impersonatedBy?: string | null
}

export interface Session {
	user: SessionUser
	session: SessionRecord
}
