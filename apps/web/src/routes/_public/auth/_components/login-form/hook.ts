import { redirect, useRouter } from "@tanstack/react-router"
import { useState } from "react"

import { authClient } from "#/libs/auth/client"
import { useForm } from "#/libs/tanstack-form"
import { loginSchema } from "./schema"

export function useLoginForm() {
	const router = useRouter()
	const [formError, setFormError] = useState<string | null>(null)

	const form = useForm({
		defaultValues: { email: "", password: "" },
		validators: { onChange: loginSchema },
		onSubmit: async ({ value }) => {
			const { error } = await authClient.signIn.email(value)
			if (error) {
				setFormError(error.message ?? "Sign in failed")
				return
			}
			await router.invalidate()
			throw redirect({ to: "/" })
		},
	})

	return { form, formError }
}
