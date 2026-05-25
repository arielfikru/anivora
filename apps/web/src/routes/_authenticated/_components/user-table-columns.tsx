import { IconDotsVertical } from "@tabler/icons-react"
import type { ColumnDef } from "@tanstack/react-table"

import { Badge } from "#/components/ui/badge"
import { Button } from "#/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu"
import type { UserRow } from "./users-data-table"

interface UserColumnCallbacks {
	canSetRole: boolean
	canDelete: boolean
	onEdit: (user: UserRow) => void
	onDelete: (user: UserRow) => void
	onBan: (userId: string) => void
	onUnban: (userId: string) => void
	onSetRole: (userId: string, role: "admin" | "user") => void
}

export function getUserColumns({
	canSetRole,
	canDelete,
	onEdit,
	onDelete,
	onBan,
	onUnban,
	onSetRole,
}: UserColumnCallbacks): ColumnDef<UserRow>[] {
	return [
		{ accessorKey: "name", header: "Name" },
		{ accessorKey: "email", header: "Email" },
		{
			accessorKey: "role",
			header: "Role",
			cell: ({ row }) => (
				<Badge variant="outline">{row.original.role ?? "user"}</Badge>
			),
		},
		{
			id: "status",
			header: "Status",
			cell: ({ row }) =>
				row.original.banned ? (
					<Badge variant="destructive">Banned</Badge>
				) : (
					<Badge variant="secondary">Active</Badge>
				),
		},
		{
			accessorKey: "createdAt",
			header: "Created",
			cell: ({ row }) =>
				new Date(row.original.createdAt).toLocaleDateString(undefined, {
					year: "numeric",
					month: "short",
					day: "numeric",
				}),
		},
		{
			id: "actions",
			header: "",
			cell: ({ row }) => {
				const user = row.original
				return (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="icon" className="size-8">
								<IconDotsVertical className="size-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onClick={() => onEdit(user)}>
								Edit
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							{user.banned ? (
								<DropdownMenuItem onClick={() => onUnban(user.id)}>
									Unban
								</DropdownMenuItem>
							) : (
								<DropdownMenuItem onClick={() => onBan(user.id)}>
									Ban
								</DropdownMenuItem>
							)}
							{canSetRole && (
								<>
									<DropdownMenuSeparator />
									<DropdownMenuItem onClick={() => onSetRole(user.id, "user")}>
										Set role: user
									</DropdownMenuItem>
									<DropdownMenuItem onClick={() => onSetRole(user.id, "admin")}>
										Set role: admin
									</DropdownMenuItem>
								</>
							)}
							{canDelete && (
								<>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										className="text-destructive focus:text-destructive"
										onClick={() => onDelete(user)}
									>
										Delete
									</DropdownMenuItem>
								</>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				)
			},
		},
	]
}
