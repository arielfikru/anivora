import { z } from "zod"

const userId = z.string().min(1, "User ID is required")
const userName = z
	.string()
	.min(1, "Name is required")
	.max(100, "Name too long")
	.trim()
const userEmail = z
	.string()
	.email("Invalid email address")
	.max(254, "Email too long")
	.trim()
	.toLowerCase()
const userPassword = z
	.string()
	.min(8, "Password must be at least 8 characters")
	.max(72, "Password too long")
const userRole = z.enum(["admin", "user"])

export const banUserSchema = z.object({
	userId,
	banReason: z.string().max(500, "Reason too long").trim().optional(),
})

export const unbanUserSchema = z.object({ userId })

export const setRoleSchema = z.object({
	userId,
	role: userRole,
})

export const createUserSchema = z.object({
	name: userName,
	email: userEmail,
	password: userPassword,
	role: userRole.default("user"),
})

export const updateUserSchema = z
	.object({
		userId,
		name: userName.optional(),
		email: userEmail.optional(),
	})
	.refine((data) => data.name !== undefined || data.email !== undefined, {
		message: "At least one field (name or email) must be provided",
	})

export const deleteUserSchema = z.object({ userId })

export const listActivityLogsSchema = z.object({
	limit: z.number().int().min(1).max(200).default(50),
	offset: z.number().int().min(0).default(0),
	userId: z.string().optional(),
	resource: z.string().optional(),
	action: z.string().optional(),
})
