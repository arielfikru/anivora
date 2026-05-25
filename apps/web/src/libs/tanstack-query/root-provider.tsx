import { QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { getQueryClient } from "#/libs/tanstack-query"

const TanStackQueryProvider = ({ children }: { children: ReactNode }) => (
	<QueryClientProvider client={getQueryClient()}>
		{children}
	</QueryClientProvider>
)

export default TanStackQueryProvider
