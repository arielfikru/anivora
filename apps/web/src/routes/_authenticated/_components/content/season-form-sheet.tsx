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
import { AreaField, SelectField, TextField } from "./form-fields"
import { CATALOG_STATUSES } from "./shared"

export interface SeasonRow {
	id: string
	animeId: string
	seasonNumber: number
	title: string | null
	description: string | null
	releaseYear: number | null
	status: string
}

const schema = z.object({
	seasonNumber: z.string().min(1, "Required"),
	title: z.string().max(200),
	description: z.string().max(5000),
	releaseYear: z.string(),
	status: z.enum(CATALOG_STATUSES),
})

interface Props {
	mode: "create" | "edit"
	animeId: string
	season?: SeasonRow
	open: boolean
	onOpenChange: (open: boolean) => void
}

const orNull = (s: string) => (s.trim() === "" ? null : s.trim())
const numOrNull = (s: string) => (s.trim() === "" ? null : Number(s))

export function SeasonFormSheet({
	mode,
	animeId,
	season,
	open,
	onOpenChange,
}: Props) {
	const queryClient = useQueryClient()
	const invalidate = () =>
		queryClient.invalidateQueries({
			queryKey: orpc.admin.listSeasons.key({ input: { animeId } }),
		})

	const create = useMutation({
		...orpc.admin.createSeason.mutationOptions(),
		onSuccess: () => {
			invalidate()
			onOpenChange(false)
			toast.success("Season created")
		},
		onError: (e) => toast.error(extractErrorMessage(e)),
	})
	const update = useMutation({
		...orpc.admin.updateSeason.mutationOptions(),
		onSuccess: () => {
			invalidate()
			onOpenChange(false)
			toast.success("Season updated")
		},
		onError: (e) => toast.error(extractErrorMessage(e)),
	})

	const form = useForm({
		defaultValues: {
			seasonNumber: season ? String(season.seasonNumber) : "1",
			title: season?.title ?? "",
			description: season?.description ?? "",
			releaseYear: season?.releaseYear ? String(season.releaseYear) : "",
			status: (season?.status ?? "draft") as (typeof CATALOG_STATUSES)[number],
		},
		validators: { onChange: schema },
		onSubmit: async ({ value }) => {
			const data = {
				seasonNumber: Number(value.seasonNumber),
				title: orNull(value.title),
				description: orNull(value.description),
				releaseYear: numOrNull(value.releaseYear),
				status: value.status,
			}
			if (mode === "create") await create.mutateAsync({ animeId, ...data })
			else if (season) await update.mutateAsync({ id: season.id, data })
		},
	})

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent side="right" className="overflow-y-auto">
				<SheetHeader>
					<SheetTitle>
						{mode === "create" ? "New Season" : "Edit Season"}
					</SheetTitle>
				</SheetHeader>
				<form
					className="flex flex-col gap-4 px-4 py-4"
					onSubmit={(e) => {
						e.preventDefault()
						form.handleSubmit()
					}}
				>
					<TextField form={form} name="seasonNumber" label="Season number" />
					<TextField form={form} name="title" label="Title" />
					<AreaField form={form} name="description" label="Description" />
					<TextField form={form} name="releaseYear" label="Release year" />
					<SelectField
						form={form}
						name="status"
						label="Status"
						options={CATALOG_STATUSES}
					/>
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
