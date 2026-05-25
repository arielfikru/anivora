import type { Session } from "../session/session.ts"
import type { UserRole } from "../user/user.ts"

export interface AdminContext {
	headers: Headers
}

export interface CreateUserInput {
	name: string
	email: string
	password: string
	role: UserRole
}

export interface CreatedUser {
	id: string
	email: string
}

export interface AuthService {
	getSession(headers: Headers): Promise<Session | null>

	createUser(input: CreateUserInput, ctx: AdminContext): Promise<CreatedUser>
	banUser(
		userId: string,
		reason: string | undefined,
		ctx: AdminContext,
	): Promise<void>
	unbanUser(userId: string, ctx: AdminContext): Promise<void>
	updateUser(
		userId: string,
		data: { name?: string; email?: string },
		ctx: AdminContext,
	): Promise<void>
	setRole(userId: string, role: UserRole, ctx: AdminContext): Promise<void>
	removeUser(userId: string, ctx: AdminContext): Promise<void>

	handler(request: Request): Promise<Response>
}
