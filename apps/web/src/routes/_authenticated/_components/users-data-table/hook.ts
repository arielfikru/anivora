import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
	type ColumnFiltersState,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type SortingState,
	useReactTable,
} from "@tanstack/react-table"
import * as React from "react"
import { toast } from "sonner"
import { orpc } from "#/libs/orpc/client"
import { useIsAdmin } from "#/routes/_public/auth/_hooks/use-is-admin"
import { getUserColumns } from "../user-table-columns"
import type { SheetState, UserRow } from "./schema"

export function useUsersDataTable(users: UserRow[]) {
	const [sorting, setSorting] = React.useState<SortingState>([])
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
		[],
	)
	const [sheet, setSheet] = React.useState<SheetState>({ open: false })

	const isAdmin = useIsAdmin()
	const canSetRole = isAdmin
	const canDelete = isAdmin
	const queryClient = useQueryClient()

	const invalidateUsers = () =>
		queryClient.invalidateQueries({ queryKey: orpc.admin.listUsers.key() })

	const banUser = useMutation({
		...orpc.admin.banUser.mutationOptions(),
		onSuccess: () => {
			invalidateUsers()
			toast.success("User banned")
		},
		onError: (err) =>
			toast.error(err instanceof Error ? err.message : "Failed to ban user"),
	})
	const unbanUser = useMutation({
		...orpc.admin.unbanUser.mutationOptions(),
		onSuccess: () => {
			invalidateUsers()
			toast.success("User unbanned")
		},
		onError: (err) =>
			toast.error(err instanceof Error ? err.message : "Failed to unban user"),
	})
	const setRole = useMutation({
		...orpc.admin.setRole.mutationOptions(),
		onSuccess: () => {
			invalidateUsers()
			toast.success("Role updated")
		},
		onError: (err) =>
			toast.error(err instanceof Error ? err.message : "Failed to update role"),
	})

	const columns = getUserColumns({
		canSetRole,
		canDelete,
		onEdit: (user) => setSheet({ open: true, mode: "edit", user }),
		onDelete: (user) => setSheet({ open: true, mode: "delete", user }),
		onBan: (userId) => banUser.mutate({ userId }),
		onUnban: (userId) => unbanUser.mutate({ userId }),
		onSetRole: (userId, role) => setRole.mutate({ userId, role }),
	})

	const table = useReactTable({
		data: users,
		columns,
		state: { sorting, columnFilters },
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
	})

	return { table, columns, sheet, setSheet }
}
