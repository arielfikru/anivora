import { redirect, useRouter } from "@tanstack/react-router"
import { useState } from "react"

import { authClient } from "#/libs/auth/client"
import { useForm } from "#/libs/tanstack-form"
import { registerSchema } from "./schema"

export function useRegisterForm() {
	const router = useRouter()
	const [formError, setFormError] = useState<string | null>(null)

	const form = useForm({
		defaultValues: { name: "", email: "", password: "" },
		validators: { onChange: registerSchema },
		onSubmit: async ({ value }) => {
			const { error } = await authClient.signUp.email(value)
			if (error) {
				setFormError(error.message ?? "Registration failed")
				return
			}
			await router.invalidate()
			throw redirect({ to: "/" })
		},
	})

	return { form, formError }
}
