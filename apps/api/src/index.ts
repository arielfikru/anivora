import type { RouterClient } from "@orpc/server"
import type { AppRouter as AppRouterType } from "./presentation/routers/index.ts"

export type { User, UserListing, UserRole } from "./domain/user/user.ts"
export type {
	Session,
	SessionRecord,
	SessionUser,
} from "./domain/session/session.ts"
export type { AppRouter } from "./presentation/routers/index.ts"

export type AppRouterClient = RouterClient<AppRouterType>
