import { IconPlus } from "@tabler/icons-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import * as React from "react"
import { toast } from "sonner"

import { Button } from "#/components/ui/button"
import { Label } from "#/components/ui/label"
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
import { type SeasonRow, SeasonFormSheet } from "./season-form-sheet"
import { AnimePicker, StatusBadge } from "./shared"

type SheetState =
	| { kind: "none" }
	| { kind: "create" }
	| { kind: "edit"; season: SeasonRow }
	| { kind: "delete"; season: SeasonRow }

export function SeasonManager() {
	const [animeId, setAnimeId] = React.useState("")
	const [sheet, setSheet] = React.useState<SheetState>({ kind: "none" })
	const queryClient = useQueryClient()

	const { data } = useQuery({
		...orpc.admin.listSeasons.queryOptions({ input: { animeId } }),
		enabled: Boolean(animeId),
	})
	const seasons = (data?.seasons ?? []) as SeasonRow[]

	const deleteSeason = useMutation({
		...orpc.admin.deleteSeason.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: orpc.admin.listSeasons.key({ input: { animeId } }),
			})
			setSheet({ kind: "none" })
			toast.success("Season deleted")
		},
		onError: (e) => toast.error(extractErrorMessage(e)),
	})

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-end justify-between gap-4">
				<div className="flex flex-col gap-1.5">
					<Label>Anime</Label>
					<AnimePicker value={animeId} onChange={setAnimeId} />
				</div>
				<Button
					size="sm"
					disabled={!animeId}
					onClick={() => setSheet({ kind: "create" })}
				>
					<IconPlus className="size-4" />
					New Season
				</Button>
			</div>

			{animeId && (
				<div className="rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>#</TableHead>
								<TableHead>Title</TableHead>
								<TableHead>Year</TableHead>
								<TableHead>Status</TableHead>
								<TableHead />
							</TableRow>
						</TableHeader>
						<TableBody>
							{seasons.length ? (
								seasons.map((s) => (
									<TableRow key={s.id}>
										<TableCell>{s.seasonNumber}</TableCell>
										<TableCell>{s.title ?? "—"}</TableCell>
										<TableCell>{s.releaseYear ?? "—"}</TableCell>
										<TableCell>
											<StatusBadge status={s.status} />
										</TableCell>
										<TableCell className="flex justify-end gap-2">
											<Button
												variant="outline"
												size="sm"
												onClick={() => setSheet({ kind: "edit", season: s })}
											>
												Edit
											</Button>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => setSheet({ kind: "delete", season: s })}
											>
												Delete
											</Button>
										</TableCell>
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell colSpan={5} className="h-24 text-center">
										No seasons yet.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
			)}

			{sheet.kind === "create" && (
				<SeasonFormSheet
					mode="create"
					animeId={animeId}
					open
					onOpenChange={() => setSheet({ kind: "none" })}
				/>
			)}
			{sheet.kind === "edit" && (
				<SeasonFormSheet
					mode="edit"
					animeId={animeId}
					season={sheet.season}
					open
					onOpenChange={() => setSheet({ kind: "none" })}
				/>
			)}
			{sheet.kind === "delete" && (
				<ConfirmDelete
					open
					label={`Season ${sheet.season.seasonNumber}`}
					pending={deleteSeason.isPending}
					onOpenChange={() => setSheet({ kind: "none" })}
					onConfirm={() => deleteSeason.mutate({ id: sheet.season.id })}
				/>
			)}
		</div>
	)
}
