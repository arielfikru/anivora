import type { UserListing } from "./user.ts"

export interface UserRepository {
	list(): Promise<UserListing[]>
}
