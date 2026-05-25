import { IconPlus } from "@tabler/icons-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import * as React from "react"
import { toast } from "sonner"

import { Button } from "#/components/ui/button"
import { Label } from "#/components/ui/label"
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "#/components/ui/sheet"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table"
import { extractErrorMessage } from "#/libs/errors/extract-message"
import { orpc } from "#/libs/orpc/client"
import { ConfirmDelete } from "./confirm-delete"
import { EpisodeFormSheet } from "./episode-form-sheet"
import { EpisodeUploadCard } from "./episode-upload-card"
import type { EpisodeRow } from "./episode-types"
import { AnimePicker, StatusBadge } from "./shared"
import { SeasonPicker } from "./season-picker"

type SheetState =
	| { kind: "none" }
	| { kind: "create" }
	| { kind: "edit"; episode: EpisodeRow }
	| { kind: "upload"; episode: EpisodeRow }
	| { kind: "delete"; episode: EpisodeRow }

export function EpisodeManager() {
	const [animeId, setAnimeId] = React.useState("")
	const [seasonId, setSeasonId] = React.useState("")
	const [sheet, setSheet] = React.useState<SheetState>({ kind: "none" })
	const queryClient = useQueryClient()

	const { data } = useQuery({
		...orpc.admin.listEpisodes.queryOptions({ input: { seasonId } }),
		enabled: Boolean(seasonId),
	})
	const episodes = (data?.episodes ?? []) as EpisodeRow[]

	const deleteEpisode = useMutation({
		...orpc.admin.deleteEpisode.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: orpc.admin.listEpisodes.key({ input: { seasonId } }),
			})
			setSheet({ kind: "none" })
			toast.success("Episode deleted")
		},
		onError: (e) => toast.error(extractErrorMessage(e)),
	})

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-wrap items-end gap-4">
				<div className="flex flex-col gap-1.5">
					<Label>Anime</Label>
					<AnimePicker
						value={animeId}
						onChange={(id) => {
							setAnimeId(id)
							setSeasonId("")
						}}
					/>
				</div>
				<div className="flex flex-col gap-1.5">
					<Label>Season</Label>
					<SeasonPicker
						animeId={animeId}
						value={seasonId}
						onChange={setSeasonId}
					/>
				</div>
				<Button
					size="sm"
					disabled={!seasonId}
					onClick={() => setSheet({ kind: "create" })}
				>
					<IconPlus className="size-4" />
					New Episode
				</Button>
			</div>

			{seasonId && (
				<div className="rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Code</TableHead>
								<TableHead>Title</TableHead>
								<TableHead>Status</TableHead>
								<TableHead />
							</TableRow>
						</TableHeader>
						<TableBody>
							{episodes.length ? (
								episodes.map((ep) => (
									<TableRow key={ep.id}>
										<TableCell className="font-mono text-xs">
											{ep.episodeCode}
										</TableCell>
										<TableCell>{ep.title ?? "—"}</TableCell>
										<TableCell>
											<StatusBadge status={ep.status} />
										</TableCell>
										<TableCell className="flex justify-end gap-2">
											<Button
												variant="default"
												size="sm"
												onClick={() =>
													setSheet({ kind: "upload", episode: ep })
												}
											>
												Video
											</Button>
											<Button
												variant="outline"
												size="sm"
												onClick={() => setSheet({ kind: "edit", episode: ep })}
											>
												Edit
											</Button>
											<Button
												variant="ghost"
												size="sm"
												onClick={() =>
													setSheet({ kind: "delete", episode: ep })
												}
											>
												Delete
											</Button>
										</TableCell>
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell colSpan={4} className="h-24 text-center">
										No episodes yet.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
			)}

			{sheet.kind === "create" && (
				<EpisodeFormSheet
					mode="create"
					seasonId={seasonId}
					open
					onOpenChange={() => setSheet({ kind: "none" })}
				/>
			)}
			{sheet.kind === "edit" && (
				<EpisodeFormSheet
					mode="edit"
					seasonId={seasonId}
					episode={sheet.episode}
					open
					onOpenChange={() => setSheet({ kind: "none" })}
				/>
			)}
			{sheet.kind === "upload" && (
				<Sheet open onOpenChange={() => setSheet({ kind: "none" })}>
					<SheetContent className="w-full overflow-y-auto sm:max-w-md">
						<SheetHeader>
							<SheetTitle>
								Video — {sheet.episode.episodeCode} {sheet.episode.title ?? ""}
							</SheetTitle>
						</SheetHeader>
						<div className="px-4 pb-4">
							<EpisodeUploadCard episode={sheet.episode} seasonId={seasonId} />
						</div>
					</SheetContent>
				</Sheet>
			)}
			{sheet.kind === "delete" && (
				<ConfirmDelete
					open
					label={sheet.episode.episodeCode}
					pending={deleteEpisode.isPending}
					onOpenChange={() => setSheet({ kind: "none" })}
					onConfirm={() => deleteEpisode.mutate({ id: sheet.episode.id })}
				/>
			)}
		</div>
	)
}
