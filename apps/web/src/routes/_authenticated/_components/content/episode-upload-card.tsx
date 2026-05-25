import { useMutation, useQueryClient } from "@tanstack/react-query"
import * as React from "react"
import { toast } from "sonner"

import { Button } from "#/components/ui/button"
import { extractErrorMessage } from "#/libs/errors/extract-message"
import { orpc } from "#/libs/orpc/client"
import type { EpisodeRow } from "./episode-types"
import { StatusBadge } from "./shared"
import { useVideoUpload } from "./use-video-upload"

function formatSize(bytes: number): string {
	const mb = bytes / (1024 * 1024)
	return mb >= 1024 ? `${(mb / 1024).toFixed(2)} GB` : `${mb.toFixed(1)} MB`
}

interface Props {
	episode: EpisodeRow
	seasonId: string
}

export function EpisodeUploadCard({ episode, seasonId }: Props) {
	const queryClient = useQueryClient()
	const inputRef = React.useRef<HTMLInputElement>(null)
	const invalidate = () =>
		queryClient.invalidateQueries({
			queryKey: orpc.admin.listEpisodes.key({ input: { seasonId } }),
		})

	const { state, upload, reset } = useVideoUpload(invalidate)

	const sync = useMutation({
		...orpc.admin.syncEpisodeStatus.mutationOptions(),
		onSuccess: () => {
			invalidate()
			toast.success("Status synced")
		},
		onError: (e) => toast.error(extractErrorMessage(e)),
	})
	const publish = useMutation({
		...orpc.admin.updateEpisode.mutationOptions(),
		onSuccess: () => {
			invalidate()
			toast.success("Episode updated")
		},
		onError: (e) => toast.error(extractErrorMessage(e)),
	})

	const canPublish =
		episode.status === "ready" || episode.status === "published"
	const isPublished = episode.status === "published"

	return (
		<div className="flex flex-col gap-3 rounded-md border p-4">
			<div className="flex items-center justify-between gap-2">
				<div>
					<p className="font-medium">
						<span className="font-mono text-xs text-muted-foreground">
							{episode.episodeCode}
						</span>{" "}
						{episode.title ?? "Untitled"}
					</p>
				</div>
				<StatusBadge status={episode.status} />
			</div>

			<input
				ref={inputRef}
				type="file"
				accept="video/*"
				className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-primary-foreground"
				disabled={state.phase === "uploading"}
				onChange={(e) => {
					const file = e.target.files?.[0]
					if (file) upload(episode.id, file)
				}}
			/>

			{state.phase !== "idle" && (
				<div className="flex flex-col gap-1.5">
					<div className="flex justify-between text-xs text-muted-foreground">
						<span>
							{state.filename} · {formatSize(state.size)}
						</span>
						<span>
							{state.phase === "uploading" && `${state.progress}%`}
							{state.phase === "processing" && "Processing on Bunny…"}
							{state.phase === "failed" && (
								<span className="text-destructive">{state.error}</span>
							)}
						</span>
					</div>
					<div className="h-2 w-full overflow-hidden rounded-full bg-muted">
						<div
							className="h-full bg-primary transition-all"
							style={{ width: `${state.progress}%` }}
						/>
					</div>
					{state.phase === "failed" && (
						<Button variant="outline" size="sm" onClick={reset}>
							Dismiss
						</Button>
					)}
				</div>
			)}

			<div className="flex flex-wrap gap-2">
				<Button
					variant="outline"
					size="sm"
					disabled={sync.isPending}
					onClick={() => sync.mutate({ episodeId: episode.id })}
				>
					Sync status
				</Button>
				<Button
					variant={isPublished ? "outline" : "default"}
					size="sm"
					disabled={!canPublish || publish.isPending}
					onClick={() =>
						publish.mutate({
							id: episode.id,
							data: { status: isPublished ? "ready" : "published" },
						})
					}
				>
					{isPublished ? "Unpublish" : "Publish"}
				</Button>
			</div>
		</div>
	)
}
