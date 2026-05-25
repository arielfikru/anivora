export type UserRole = "admin" | "user"

export interface User {
	id: string
	name: string
	email: string
	role: UserRole
	banned: boolean
	createdAt: Date
}

export interface UserListing {
	id: string
	name: string
	email: string
	role: string
	banned: boolean
	createdAt: Date
}
