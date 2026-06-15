import { useMutation } from "@tanstack/react-query"
import * as React from "react"
import { toast } from "sonner"

import { Badge } from "#/components/ui/badge"
import { Button } from "#/components/ui/button"
import { Input } from "#/components/ui/input"
import { extractErrorMessage } from "#/libs/errors/extract-message"
import { type client, orpc } from "#/libs/orpc/client"
import { StatusBadge } from "./shared"
import { isJobActive } from "./use-remote-upload-jobs"

type Job = Awaited<
	ReturnType<typeof client.admin.listRemoteUploads>
>["jobs"][number]
type JobFile = Job["files"][number]

interface Props {
	job: Job
	onChange: () => void
}

function formatSize(bytes: number): string {
	const mb = bytes / (1024 * 1024)
	return mb >= 1024 ? `${(mb / 1024).toFixed(2)} GB` : `${mb.toFixed(1)} MB`
}

function fileStatusBadge(status: JobFile["uploadStatus"]) {
	const variant =
		status === "done"
			? ("default" as const)
			: status === "failed"
				? ("destructive" as const)
				: status === "skipped"
					? ("outline" as const)
					: ("secondary" as const)
	return <Badge variant={variant}>{status}</Badge>
}

export function RemoteUploadJobCard({ job, onChange }: Props) {
	const [assign, setAssign] = React.useState<Record<string, string>>({})

	// Seed the per-file episode-number inputs from the scan's suggestions.
	React.useEffect(() => {
		if (job.status !== "scanned") return
		setAssign((prev) => {
			if (Object.keys(prev).length) return prev
			const seed: Record<string, string> = {}
			for (const f of job.files)
				seed[f.relPath] =
					f.suggestedNumber != null ? String(f.suggestedNumber) : ""
			return seed
		})
	}, [job.status, job.files])

	const map = useMutation({
		...orpc.admin.mapRemoteUpload.mutationOptions(),
		onSuccess: () => {
			onChange()
			toast.success("Upload started")
		},
		onError: (e) => toast.error(extractErrorMessage(e)),
	})
	const cancel = useMutation({
		...orpc.admin.cancelRemoteUpload.mutationOptions(),
		onSuccess: () => {
			onChange()
			toast.success("Job canceled")
		},
		onError: (e) => toast.error(extractErrorMessage(e)),
	})

	const pct =
		job.bytesTotal > 0
			? Math.round((job.bytesDownloaded / job.bytesTotal) * 100)
			: 0
	const canCancel = [
		"pending",
		"downloading",
		"extracting",
		"scanned",
	].includes(job.status)

	const startUpload = () => {
		const mappings = job.files
			.map((f) => ({ relPath: f.relPath, value: assign[f.relPath]?.trim() }))
			.filter((m) => m.value)
			.map((m) => ({ relPath: m.relPath, episodeNumber: Number(m.value) }))
		if (!mappings.length) {
			toast.error("Assign at least one file to an episode")
			return
		}
		map.mutate({ jobId: job.id, mappings })
	}

	return (
		<div className="flex flex-col gap-2 rounded-md border bg-muted/30 p-3">
			<div className="flex items-center justify-between gap-2">
				<span className="truncate font-mono text-xs text-muted-foreground">
					{job.sourceType}: {job.sourceUrl}
				</span>
				<div className="flex items-center gap-2">
					<StatusBadge status={job.status} />
					{canCancel && (
						<Button
							variant="ghost"
							size="sm"
							disabled={cancel.isPending}
							onClick={() => cancel.mutate({ jobId: job.id })}
						>
							Cancel
						</Button>
					)}
				</div>
			</div>

			{(job.status === "downloading" || job.status === "extracting") && (
				<div className="flex flex-col gap-1">
					<div className="flex justify-between text-muted-foreground text-xs">
						<span>
							{job.status === "extracting" ? "Extracting…" : "Downloading…"}
						</span>
						{job.bytesTotal > 0 && (
							<span>
								{formatSize(job.bytesDownloaded)} / {formatSize(job.bytesTotal)}
							</span>
						)}
					</div>
					<div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
						<div
							className="h-full bg-primary transition-all"
							style={{ width: `${job.status === "extracting" ? 100 : pct}%` }}
						/>
					</div>
				</div>
			)}

			{job.error && <p className="text-destructive text-xs">{job.error}</p>}

			{job.status === "scanned" && (
				<div className="flex flex-col gap-2">
					<p className="text-muted-foreground text-xs">
						{job.files.length} video file(s) found. Set an episode number per
						file (leave blank to skip).
					</p>
					<div className="flex flex-col gap-1.5">
						{job.files.map((f) => (
							<div key={f.relPath} className="flex items-center gap-2">
								<Input
									type="number"
									min={0}
									className="h-8 w-20"
									value={assign[f.relPath] ?? ""}
									onChange={(e) =>
										setAssign((p) => ({ ...p, [f.relPath]: e.target.value }))
									}
								/>
								<span className="truncate text-xs" title={f.relPath}>
									{f.relPath}
								</span>
								<span className="ml-auto shrink-0 text-muted-foreground text-xs">
									{formatSize(f.sizeBytes)}
								</span>
							</div>
						))}
					</div>
					<Button
						size="sm"
						className="self-start"
						disabled={map.isPending}
						onClick={startUpload}
					>
						Start upload
					</Button>
				</div>
			)}

			{(job.status === "uploading" ||
				job.status === "completed" ||
				job.status === "failed") &&
				job.files.some((f) => f.episodeId) && (
					<div className="flex flex-col gap-1">
						{job.files
							.filter((f) => f.episodeId)
							.map((f) => (
								<div
									key={f.relPath}
									className="flex items-center gap-2 text-xs"
								>
									<span className="w-12 shrink-0 text-muted-foreground">
										E{f.episodeNumber}
									</span>
									<span className="truncate" title={f.relPath}>
										{f.relPath}
									</span>
									<span className="ml-auto shrink-0">
										{fileStatusBadge(f.uploadStatus)}
									</span>
								</div>
							))}
					</div>
				)}

			{isJobActive(job.status) && job.status === "uploading" && (
				<p className="text-muted-foreground text-xs">
					Transcoding and uploading to R2… episodes flip to “ready”
					automatically once each file finishes.
				</p>
			)}
		</div>
	)
}
