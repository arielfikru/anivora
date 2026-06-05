import { useMutation } from "@tanstack/react-query"
import * as React from "react"
import { toast } from "sonner"

import { Button } from "#/components/ui/button"
import { Checkbox } from "#/components/ui/checkbox"
import { Input } from "#/components/ui/input"
import { Label } from "#/components/ui/label"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select"
import { extractErrorMessage } from "#/libs/errors/extract-message"
import { orpc } from "#/libs/orpc/client"
import { RemoteUploadJobCard } from "./remote-upload-job-card"
import {
	useInvalidateRemoteUploads,
	useRemoteUploadJobs,
} from "./use-remote-upload-jobs"

interface Props {
	seasonId: string
}

export function RemoteUploadPanel({ seasonId }: Props) {
	const [sourceType, setSourceType] = React.useState<"url" | "drive">("url")
	const [sourceUrl, setSourceUrl] = React.useState("")
	const [isArchive, setIsArchive] = React.useState(false)

	const jobs = useRemoteUploadJobs(seasonId)
	const invalidate = useInvalidateRemoteUploads(seasonId)

	const create = useMutation({
		...orpc.admin.createRemoteUpload.mutationOptions(),
		onSuccess: () => {
			setSourceUrl("")
			setIsArchive(false)
			invalidate()
			toast.success("Remote upload started")
		},
		onError: (e) => toast.error(extractErrorMessage(e)),
	})

	return (
		<div className="flex flex-col gap-4 rounded-md border p-4">
			<div>
				<h3 className="font-medium text-sm">Remote upload</h3>
				<p className="text-muted-foreground text-xs">
					Fetch a direct video URL, a Google Drive link, or a zip/rar archive on
					the server and push it to Bunny — no local file needed.
				</p>
			</div>

			<div className="flex flex-wrap items-end gap-3">
				<div className="flex flex-col gap-1.5">
					<Label>Source</Label>
					<Select
						value={sourceType}
						onValueChange={(v) => setSourceType(v as "url" | "drive")}
					>
						<SelectTrigger className="w-36">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="url">Direct URL</SelectItem>
							<SelectItem value="drive">Google Drive</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<div className="flex min-w-64 flex-1 flex-col gap-1.5">
					<Label>
						{sourceType === "drive"
							? "Google Drive share link"
							: "Video / archive URL"}
					</Label>
					<Input
						type="url"
						placeholder={
							sourceType === "drive"
								? "https://drive.google.com/file/d/…/view"
								: "https://example.com/episode.mp4"
						}
						value={sourceUrl}
						onChange={(e) => setSourceUrl(e.target.value)}
					/>
				</div>

				<div className="flex items-center gap-2 pb-2 text-sm">
					<Checkbox
						id="remote-upload-archive"
						checked={isArchive}
						onCheckedChange={(c) => setIsArchive(c === true)}
					/>
					<Label htmlFor="remote-upload-archive">Archive (zip/rar)</Label>
				</div>

				<Button
					className="mb-0.5"
					disabled={!sourceUrl.trim() || create.isPending}
					onClick={() =>
						create.mutate({
							seasonId,
							sourceType,
							sourceUrl: sourceUrl.trim(),
							isArchive,
						})
					}
				>
					Start
				</Button>
			</div>

			{jobs.length > 0 && (
				<div className="flex flex-col gap-3">
					{jobs.map((job) => (
						<RemoteUploadJobCard key={job.id} job={job} onChange={invalidate} />
					))}
				</div>
			)}
		</div>
	)
}
