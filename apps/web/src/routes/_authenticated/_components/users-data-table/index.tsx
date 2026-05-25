import { IconPlus } from "@tabler/icons-react"
import { flexRender } from "@tanstack/react-table"

import { Button } from "#/components/ui/button"
import { Input } from "#/components/ui/input"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table"
import { UserFormSheet } from "../user-form-sheet"
import { useUsersDataTable } from "./hook"
import type { UserRow } from "./schema"

export type { UserRow }

export function UsersDataTable({ users }: { users: UserRow[] }) {
	const { table, columns, sheet, setSheet } = useUsersDataTable(users)

	return (
		<>
			<div className="flex flex-col gap-4">
				<div className="flex items-center justify-between gap-2">
					<Input
						placeholder="Filter by name…"
						value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
						onChange={(e) =>
							table.getColumn("name")?.setFilterValue(e.target.value)
						}
						className="max-w-sm"
					/>
					<Button
						size="sm"
						onClick={() => setSheet({ open: true, mode: "create" })}
					>
						<IconPlus className="size-4" />
						New User
					</Button>
				</div>

				<div className="rounded-md border">
					<Table>
						<TableHeader>
							{table.getHeaderGroups().map((headerGroup) => (
								<TableRow key={headerGroup.id}>
									{headerGroup.headers.map((header) => (
										<TableHead key={header.id}>
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
										</TableHead>
									))}
								</TableRow>
							))}
						</TableHeader>
						<TableBody>
							{table.getRowModel().rows.length ? (
								table.getRowModel().rows.map((row) => (
									<TableRow key={row.id}>
										{row.getVisibleCells().map((cell) => (
											<TableCell key={cell.id}>
												{flexRender(
													cell.column.columnDef.cell,
													cell.getContext(),
												)}
											</TableCell>
										))}
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell
										colSpan={columns.length}
										className="h-24 text-center"
									>
										No users found.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>

				<div className="flex items-center justify-between">
					<p className="text-muted-foreground text-sm">
						{table.getFilteredRowModel().rows.length} user(s)
					</p>
					<div className="flex items-center gap-2">
						<Select
							value={String(table.getState().pagination.pageSize)}
							onValueChange={(v) => table.setPageSize(Number(v))}
						>
							<SelectTrigger className="w-24">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{[10, 20, 50].map((size) => (
									<SelectItem key={size} value={String(size)}>
										{size} / page
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Button
							variant="outline"
							size="sm"
							onClick={() => table.previousPage()}
							disabled={!table.getCanPreviousPage()}
						>
							Previous
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => table.nextPage()}
							disabled={!table.getCanNextPage()}
						>
							Next
						</Button>
					</div>
				</div>
			</div>

			{sheet.open && sheet.mode === "create" && (
				<UserFormSheet
					mode="create"
					open
					onOpenChange={(open) => !open && setSheet({ open: false })}
				/>
			)}
			{sheet.open && sheet.mode === "edit" && (
				<UserFormSheet
					mode="edit"
					user={sheet.user}
					open
					onOpenChange={(open) => !open && setSheet({ open: false })}
				/>
			)}
			{sheet.open && sheet.mode === "delete" && (
				<UserFormSheet
					mode="delete"
					user={sheet.user}
					open
					onOpenChange={(open) => !open && setSheet({ open: false })}
				/>
			)}
		</>
	)
}
