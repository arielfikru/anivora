import { createORPCClient } from "@orpc/client"
import { RPCLink } from "@orpc/client/fetch"
import { createTanstackQueryUtils } from "@orpc/tanstack-query"

import type { AppRouterClient } from "@anivora/api"

const API_BASE =
	import.meta.env.VITE_API_URL ||
	(typeof window !== "undefined" ? window.location.origin : "")

const link = new RPCLink({
	url: `${API_BASE}/rpc`,
	fetch: (input, init) => fetch(input, { ...init, credentials: "include" }),
})

export const client: AppRouterClient = createORPCClient(link)

export const orpc = createTanstackQueryUtils(client)
