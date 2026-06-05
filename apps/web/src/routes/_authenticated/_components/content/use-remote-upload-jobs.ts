import { useQuery, useQueryClient } from "@tanstack/react-query"

import { orpc } from "#/libs/orpc/client"

export const ACTIVE_JOB_STATUSES = [
	"pending",
	"downloading",
	"extracting",
	"uploading",
] as const

export function isJobActive(status: string): boolean {
	return (ACTIVE_JOB_STATUSES as readonly string[]).includes(status)
}

/**
 * Polls the season's remote-upload jobs, fast (3s) while any job is still
 * working and idle otherwise — mirrors the Bunny "processing" poll cadence.
 */
export function useRemoteUploadJobs(seasonId: string) {
	const { data } = useQuery({
		...orpc.admin.listRemoteUploads.queryOptions({ input: { seasonId } }),
		enabled: Boolean(seasonId),
		refetchInterval: (query) => {
			const jobs = query.state.data?.jobs ?? []
			return jobs.some((j) => isJobActive(j.status)) ? 3000 : false
		},
	})
	return data?.jobs ?? []
}

export function useInvalidateRemoteUploads(seasonId: string) {
	const queryClient = useQueryClient()
	return () =>
		queryClient.invalidateQueries({
			queryKey: orpc.admin.listRemoteUploads.key({ input: { seasonId } }),
		})
}
