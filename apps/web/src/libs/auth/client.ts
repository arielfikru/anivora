import { adminClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"

const API_BASE =
	import.meta.env.VITE_API_URL ||
	(typeof window !== "undefined" ? window.location.origin : "")

export const authClient = createAuthClient({
	baseURL: `${API_BASE}/api/auth`,
	fetchOptions: {
		credentials: "include",
	},
	plugins: [adminClient()],
})

export type AuthSession = typeof authClient.$Infer.Session
