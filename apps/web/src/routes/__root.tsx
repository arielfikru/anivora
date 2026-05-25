import type { Session } from "@anivora/api"
import type { QueryClient } from "@tanstack/react-query"
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router"
import { lazy, Suspense } from "react"
import { Toaster } from "sonner"
import { z } from "zod"
import { client } from "#/libs/orpc/client"
import { setLocale } from "#/libs/paraglide"
import TanStackQueryProvider from "#/libs/tanstack-query/root-provider"

const PostHogProvider = lazy(() => import("#/libs/posthog/provider"))

const TanStackDevtools = import.meta.env.DEV
	? lazy(() =>
			Promise.all([
				import("@tanstack/react-devtools"),
				import("@tanstack/react-router-devtools"),
				import("#/libs/tanstack-query/devtools"),
			]).then(
				([
					{ TanStackDevtools },
					{ TanStackRouterDevtoolsPanel },
					TanStackQueryDevtools,
				]) => ({
					default: () => (
						<TanStackDevtools
							config={{ position: "bottom-right" }}
							plugins={[
								{
									name: "Tanstack Router",
									render: <TanStackRouterDevtoolsPanel />,
								},
								TanStackQueryDevtools.default,
							]}
						/>
					),
				}),
			),
		)
	: () => null

interface MyRouterContext {
	queryClient: QueryClient
	session: Session | null
}

const RootLayout = () => (
	<Suspense>
		<PostHogProvider>
			<TanStackQueryProvider>
				<Outlet />
				<Suspense>
					<TanStackDevtools />
				</Suspense>
			</TanStackQueryProvider>
		</PostHogProvider>
		<Toaster />
	</Suspense>
)

export const Route = createRootRouteWithContext<MyRouterContext>()({
	validateSearch: z.object({
		lang: z.enum(["en", "id"]).optional(),
	}),
	beforeLoad: async ({ search }) => {
		const locale = search.lang ?? "en"
		setLocale(locale as "en" | "id")
		if (typeof document !== "undefined") {
			document.documentElement.setAttribute("lang", locale)
		}
		const session = await client.auth.getSession()
		return { session }
	},
	component: RootLayout,
})
