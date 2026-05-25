import { useRouter } from "@tanstack/react-router"
import * as React from "react"
import { toast } from "sonner"

import { authClient } from "#/libs/auth/client"
import { useForm } from "#/libs/tanstack-form"
import { settingsProfileSchema } from "./schema"

export function useSettingsProfile({ name }: { name: string }) {
	const router = useRouter()
	const [submitError, setSubmitError] = React.useState<string | null>(null)

	const form = useForm({
		defaultValues: { name },
		validators: { onChange: settingsProfileSchema },
		onSubmit: async ({ value }) => {
			setSubmitError(null)
			try {
				await authClient.updateUser({ name: value.name.trim() })
				await router.invalidate()
				toast.success("Profile updated")
			} catch (err) {
				const msg =
					err instanceof Error ? err.message : "Failed to update profile"
				setSubmitError(msg)
				toast.error(msg)
			}
		},
	})

	return { form, submitError }
}
