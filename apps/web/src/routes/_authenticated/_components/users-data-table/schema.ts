export interface UserRow {
	id: string
	name: string
	email: string
	role?: string | null
	banned: boolean | null
	createdAt: string | Date
}

export type SheetState =
	| { open: false }
	| { open: true; mode: "create" }
	| { open: true; mode: "edit" | "delete"; user: UserRow }
