import { useMutation, useQueryClient } from "@tanstack/react-query"
import * as React from "react"
import { toast } from "sonner"

import { orpc } from "#/libs/orpc/client"
import { useForm } from "#/libs/tanstack-form"
import {
	editUserSchema,
	extractErrorMessage,
	type UserFormSheetProps,
} from "../user-form-helpers"

export function useUserFormSheet({
	mode,
	user,
	onOpenChange,
}: Pick<UserFormSheetProps, "mode" | "user" | "onOpenChange">) {
	const queryClient = useQueryClient()

	const invalidate = () =>
		queryClient.invalidateQueries({ queryKey: orpc.admin.listUsers.key() })

	const updateUser = useMutation({
		...orpc.admin.updateUser.mutationOptions(),
		onSuccess: () => {
			invalidate()
			onOpenChange(false)
			toast.success("User updated")
		},
		onError: (err) => toast.error(extractErrorMessage(err)),
	})

	const deleteUser = useMutation({
		...orpc.admin.deleteUser.mutationOptions(),
		onSuccess: () => {
			invalidate()
			onOpenChange(false)
			toast.success("User deleted")
		},
		onError: (err) => toast.error(extractErrorMessage(err)),
	})

	const editForm = useForm({
		defaultValues: {
			name: user?.name ?? "",
			email: user?.email ?? "",
		},
		validators: { onChange: editUserSchema },
		onSubmit: async ({ value }) => {
			if (!user) return
			await updateUser.mutateAsync({
				userId: user.id,
				name: value.name.trim(),
				email: value.email.trim().toLowerCase(),
			})
		},
	})

	React.useEffect(() => {
		if (mode === "edit" && user) {
			editForm.reset({ name: user.name, email: user.email })
		}
	}, [user?.id, mode])

	return { editForm, updateUser, deleteUser }
}
