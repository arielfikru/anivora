import { createRouter as createTanStackRouter } from "@tanstack/react-router"
import { getQueryClient } from "#/libs/tanstack-query"
import { routeTree } from "./routeTree.gen"

export const getRouter = () => {
	const router = createTanStackRouter({
		routeTree,
		basepath: "/app",
		context: {
			queryClient: getQueryClient(),
			session: null,
		},
		scrollRestoration: true,
		defaultPreload: "intent",
		defaultPreloadStaleTime: 0,
	})

	return router
}

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>
	}
}
