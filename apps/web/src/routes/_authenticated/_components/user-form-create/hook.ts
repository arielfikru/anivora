import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { orpc } from "#/libs/orpc/client"
import { useForm } from "#/libs/tanstack-form"
import { useIsAdmin } from "#/routes/_public/auth/_hooks/use-is-admin"
import {
	createUserSchema,
	extractErrorMessage,
	type UserFormSheetProps,
} from "../user-form-helpers"

export function useUserFormCreate({
	defaultRole = "user",
	onOpenChange,
}: Pick<UserFormSheetProps, "defaultRole" | "onOpenChange">) {
	const queryClient = useQueryClient()
	const canSetRole = useIsAdmin()

	const invalidate = () =>
		queryClient.invalidateQueries({ queryKey: orpc.admin.listUsers.key() })

	const createUser = useMutation({
		...orpc.admin.createUser.mutationOptions(),
		onSuccess: () => {
			invalidate()
			onOpenChange(false)
			toast.success("User created")
		},
		onError: (err) => toast.error(extractErrorMessage(err)),
	})

	const createForm = useForm({
		defaultValues: {
			name: "",
			email: "",
			password: "",
			role: defaultRole,
		},
		validators: { onChange: createUserSchema },
		onSubmit: async ({ value }) => {
			await createUser.mutateAsync({
				name: value.name.trim(),
				email: value.email.trim().toLowerCase(),
				password: value.password,
				role: value.role,
			})
		},
	})

	return { createForm, createUser, canSetRole }
}
