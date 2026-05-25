import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import * as React from "react"
import { toast } from "sonner"

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
import {
	type AnimeFormValues,
	animeFormSchema,
	type AnimeRow,
	emptyAnimeForm,
	toAnimePayload,
} from "./anime-form-helpers"
import { AreaField, SelectField, SwitchField, TextField } from "./form-fields"
import { CATALOG_STATUSES, CONTENT_RATINGS } from "./shared"

interface Props {
	mode: "create" | "edit"
	anime?: AnimeRow
	open: boolean
	onOpenChange: (open: boolean) => void
}

function useAnimeForm({ mode, anime, onOpenChange }: Omit<Props, "open">) {
	const queryClient = useQueryClient()
	const invalidate = () =>
		queryClient.invalidateQueries({ queryKey: orpc.admin.listAllAnime.key() })

	const detail = useQuery({
		...orpc.admin.getAnimeAdmin.queryOptions({
			input: { id: anime?.id ?? "" },
		}),
		enabled: mode === "edit" && Boolean(anime?.id),
	})

	const createAnime = useMutation({
		...orpc.admin.createAnime.mutationOptions(),
		onSuccess: () => {
			invalidate()
			onOpenChange(false)
			toast.success("Anime created")
		},
		onError: (e) => toast.error(extractErrorMessage(e)),
	})
	const updateAnime = useMutation({
		...orpc.admin.updateAnime.mutationOptions(),
		onSuccess: () => {
			invalidate()
			onOpenChange(false)
			toast.success("Anime updated")
		},
		onError: (e) => toast.error(extractErrorMessage(e)),
	})

	const form = useForm({
		defaultValues: emptyAnimeForm as AnimeFormValues,
		validators: { onChange: animeFormSchema },
		onSubmit: async ({ value }) => {
			const data = toAnimePayload(value)
			if (mode === "create") await createAnime.mutateAsync(data)
			else if (anime) await updateAnime.mutateAsync({ id: anime.id, data })
		},
	})

	const loaded = detail.data?.anime
	React.useEffect(() => {
		if (mode === "edit" && loaded) {
			form.reset({
				title: loaded.title,
				description: loaded.description ?? "",
				status: loaded.status,
				contentRating: loaded.contentRating,
				releaseYear: loaded.releaseYear ? String(loaded.releaseYear) : "",
				studioName: loaded.studioName ?? "",
				creatorName: loaded.creatorName ?? "",
				coverImageUrl: loaded.coverImageUrl ?? "",
				bannerImageUrl: loaded.bannerImageUrl ?? "",
				rightsOwnerName: loaded.rightsOwnerName ?? "",
				licenseType: loaded.licenseType ?? "",
				attributionText: loaded.attributionText ?? "",
				isFanmade: loaded.isFanmade,
				isOriginalContent: loaded.isOriginalContent,
			})
		}
	}, [loaded?.id])

	return { form, pending: createAnime.isPending || updateAnime.isPending }
}

export function AnimeFormSheet({ mode, anime, open, onOpenChange }: Props) {
	const { form, pending } = useAnimeForm({ mode, anime, onOpenChange })
	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent side="right" className="overflow-y-auto sm:max-w-lg">
				<SheetHeader>
					<SheetTitle>
						{mode === "create" ? "New Anime" : "Edit Anime"}
					</SheetTitle>
				</SheetHeader>
				<form
					className="flex flex-col gap-4 px-4 py-4"
					onSubmit={(e) => {
						e.preventDefault()
						form.handleSubmit()
					}}
				>
					<TextField form={form} name="title" label="Title" />
					<AreaField form={form} name="description" label="Description" />
					<div className="grid grid-cols-2 gap-3">
						<SelectField
							form={form}
							name="status"
							label="Status"
							options={CATALOG_STATUSES}
						/>
						<SelectField
							form={form}
							name="contentRating"
							label="Content rating"
							options={CONTENT_RATINGS}
						/>
					</div>
					<TextField form={form} name="releaseYear" label="Release year" />
					<TextField form={form} name="studioName" label="Studio" />
					<TextField form={form} name="creatorName" label="Creator" />
					<TextField form={form} name="coverImageUrl" label="Cover image URL" />
					<TextField
						form={form}
						name="bannerImageUrl"
						label="Banner image URL"
					/>
					<TextField form={form} name="rightsOwnerName" label="Rights owner" />
					<TextField form={form} name="licenseType" label="License type" />
					<AreaField
						form={form}
						name="attributionText"
						label="Attribution text"
					/>
					<SwitchField form={form} name="isFanmade" label="Is fanmade" />
					<SwitchField
						form={form}
						name="isOriginalContent"
						label="Original content"
					/>
					<SheetFooter className="px-0">
						<Button
							variant="outline"
							type="button"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={pending}>
							{pending ? "Saving…" : "Save"}
						</Button>
					</SheetFooter>
				</form>
			</SheetContent>
		</Sheet>
	)
}
