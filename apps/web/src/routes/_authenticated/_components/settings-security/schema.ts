import { z } from "zod"

const password = z
	.string()
	.min(8, "Password must be at least 8 characters")
	.max(72, "Password too long")

export const changePasswordSchema = z
	.object({
		currentPassword: password,
		newPassword: password,
		confirmPassword: password,
	})
	.refine((data) => data.newPassword === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	})
