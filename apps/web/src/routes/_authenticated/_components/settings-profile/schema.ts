import { z } from "zod"

export const settingsProfileSchema = z.object({
	name: z.string().min(1, "Name is required").max(100, "Name too long"),
})

export interface SettingsProfileProps {
	name: string
	email: string
	role: string
	createdAt: Date
}
