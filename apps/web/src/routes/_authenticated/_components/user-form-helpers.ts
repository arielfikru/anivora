import type { UserRole } from "@anivora/api"
import { z } from "zod"

export { extractErrorMessage } from "#/libs/errors/extract-message"

const nameSchema = z
	.string()
	.min(1, "Name is required")
	.max(100, "Name too long")
const emailSchema = z
	.string()
	.min(1, "Email is required")
	.email("Invalid email address")
	.max(254, "Email too long")
const passwordSchema = z
	.string()
	.min(8, "Password must be at least 8 characters")
	.max(72, "Password too long")
const roleSchema = z.enum(["admin", "user"])

export const editUserSchema = z.object({
	name: nameSchema,
	email: emailSchema,
})

export const createUserSchema = z.object({
	name: nameSchema,
	email: emailSchema,
	password: passwordSchema,
	role: roleSchema,
})

export interface UserFormSheetProps {
	mode: "create" | "edit" | "delete"
	user?: {
		id: string
		name: string
		email: string
		role?: string | null
	}
	defaultRole?: UserRole
	open: boolean
	onOpenChange: (open: boolean) => void
}
