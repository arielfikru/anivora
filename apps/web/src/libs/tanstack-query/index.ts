import { QueryClient } from "@tanstack/react-query"

let client: QueryClient | undefined

export const getQueryClient = (): QueryClient => {
	if (!client) {
		client = new QueryClient()
	}
	return client
}

export { QueryClient }
export type {
	InfiniteQueryObserverOptions,
	MutationOptions,
	QueryKey,
	QueryOptions,
	UseInfiniteQueryResult,
	UseMutationResult,
	UseQueryResult,
	UseSuspenseQueryResult,
} from "@tanstack/react-query"
export {
	infiniteQueryOptions,
	mutationOptions,
	queryOptions,
	useInfiniteQuery,
	useMutation,
	useQuery,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query"
