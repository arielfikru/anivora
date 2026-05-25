import * as React from "react"
import { toast } from "sonner"

import { authClient } from "#/libs/auth/client"
import { useForm } from "#/libs/tanstack-form"
import { changePasswordSchema } from "./schema"

export function useSettingsSecurity() {
	const [submitError, setSubmitError] = React.useState<string | null>(null)

	const form = useForm({
		defaultValues: {
			currentPassword: "",
			newPassword: "",
			confirmPassword: "",
		},
		validators: { onChange: changePasswordSchema },
		onSubmit: async ({ value }) => {
			setSubmitError(null)
			try {
				const result = await authClient.changePassword({
					currentPassword: value.currentPassword,
					newPassword: value.newPassword,
					revokeOtherSessions: false,
				})
				if (result.error) {
					const msg = result.error.message ?? "Failed to change password"
					setSubmitError(msg)
					toast.error(msg)
					return
				}
				toast.success("Password changed")
				form.reset()
			} catch (err) {
				const msg =
					err instanceof Error ? err.message : "Failed to change password"
				setSubmitError(msg)
				toast.error(msg)
			}
		},
	})

	return { form, submitError }
}
