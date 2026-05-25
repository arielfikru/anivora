import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { z } from "zod"

import { Button } from "#/components/ui/button"
import {
	Sheet,
	SheetContent,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "#/components/ui/sheet"
import { extractErrorMessage } from "#/libs/errors/extract-message"
import { orpc } from "#/libs/orpc/client"
import { useForm } from "#/libs/tanstack-form"
import type { EpisodeRow } from "./episode-types"
import { AreaField, SelectField, TextField } from "./form-fields"
import { EPISODE_STATUSES } from "./shared"

const schema = z.object({
	episodeNumber: z.string().min(1, "Required"),
	title: z.string().max(200),
	description: z.string().max(5000),
	durationSeconds: z.string(),
	status: z.enum(EPISODE_STATUSES),
})

interface Props {
	mode: "create" | "edit"
	seasonId: string
	episode?: EpisodeRow
	open: boolean
	onOpenChange: (open: boolean) => void
}

const orNull = (s: string) => (s.trim() === "" ? null : s.trim())
const numOrNull = (s: string) => (s.trim() === "" ? null : Number(s))

export function EpisodeFormSheet({
	mode,
	seasonId,
	episode,
	open,
	onOpenChange,
}: Props) {
	const queryClient = useQueryClient()
	const invalidate = () =>
		queryClient.invalidateQueries({
			queryKey: orpc.admin.listEpisodes.key({ input: { seasonId } }),
		})

	const create = useMutation({
		...orpc.admin.createEpisode.mutationOptions(),
		onSuccess: () => {
			invalidate()
			onOpenChange(false)
			toast.success("Episode created")
		},
		onError: (e) => toast.error(extractErrorMessage(e)),
	})
	const update = useMutation({
		...orpc.admin.updateEpisode.mutationOptions(),
		onSuccess: () => {
			invalidate()
			onOpenChange(false)
			toast.success("Episode updated")
		},
		onError: (e) => toast.error(extractErrorMessage(e)),
	})

	const form = useForm({
		defaultValues: {
			episodeNumber: episode ? String(episode.episodeNumber) : "1",
			title: episode?.title ?? "",
			description: episode?.description ?? "",
			durationSeconds: episode?.durationSeconds
				? String(episode.durationSeconds)
				: "",
			status: (episode?.status ?? "draft") as (typeof EPISODE_STATUSES)[number],
		},
		validators: { onChange: schema },
		onSubmit: async ({ value }) => {
			if (mode === "create") {
				await create.mutateAsync({
					seasonId,
					episodeNumber: Number(value.episodeNumber),
					title: orNull(value.title),
					description: orNull(value.description),
					durationSeconds: numOrNull(value.durationSeconds),
				})
			} else if (episode) {
				await update.mutateAsync({
					id: episode.id,
					data: {
						episodeNumber: Number(value.episodeNumber),
						title: orNull(value.title),
						description: orNull(value.description),
						durationSeconds: numOrNull(value.durationSeconds),
						status: value.status,
					},
				})
			}
		},
	})

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent side="right" className="overflow-y-auto">
				<SheetHeader>
					<SheetTitle>
						{mode === "create" ? "New Episode" : "Edit Episode"}
					</SheetTitle>
				</SheetHeader>
				<form
					className="flex flex-col gap-4 px-4 py-4"
					onSubmit={(e) => {
						e.preventDefault()
						form.handleSubmit()
					}}
				>
					<TextField form={form} name="episodeNumber" label="Episode number" />
					<TextField form={form} name="title" label="Title" />
					<AreaField form={form} name="description" label="Description" />
					<TextField
						form={form}
						name="durationSeconds"
						label="Duration (seconds)"
					/>
					{mode === "edit" && (
						<SelectField
							form={form}
							name="status"
							label="Status"
							options={EPISODE_STATUSES}
						/>
					)}
					<SheetFooter className="px-0">
						<Button
							variant="outline"
							type="button"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={create.isPending || update.isPending}
						>
							Save
						</Button>
					</SheetFooter>
				</form>
			</SheetContent>
		</Sheet>
	)
}
