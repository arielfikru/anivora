import { IconPlus } from "@tabler/icons-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import * as React from "react"
import { toast } from "sonner"

import { Button } from "#/components/ui/button"
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
import type { AnimeRow } from "./anime-form-helpers"
import { AnimeFormSheet } from "./anime-form-sheet"
import { ConfirmDelete } from "./confirm-delete"
import { StatusBadge } from "./shared"

type SheetState =
	| { kind: "none" }
	| { kind: "create" }
	| { kind: "edit"; anime: AnimeRow }
	| { kind: "delete"; anime: AnimeRow }

export function AnimeManager() {
	const { data } = useQuery(orpc.admin.listAllAnime.queryOptions())
	const anime = (data?.anime ?? []) as AnimeRow[]
	const [sheet, setSheet] = React.useState<SheetState>({ kind: "none" })
	const queryClient = useQueryClient()

	const deleteAnime = useMutation({
		...orpc.admin.deleteAnime.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: orpc.admin.listAllAnime.key() })
			setSheet({ kind: "none" })
			toast.success("Anime deleted")
		},
		onError: (e) => toast.error(extractErrorMessage(e)),
	})

	return (
		<div className="flex flex-col gap-4">
			<div className="flex justify-end">
				<Button size="sm" onClick={() => setSheet({ kind: "create" })}>
					<IconPlus className="size-4" />
					New Anime
				</Button>
			</div>
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Title</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Year</TableHead>
							<TableHead>Slug</TableHead>
							<TableHead />
						</TableRow>
					</TableHeader>
					<TableBody>
						{anime.length ? (
							anime.map((a) => (
								<TableRow key={a.id}>
									<TableCell className="font-medium">{a.title}</TableCell>
									<TableCell>
										<StatusBadge status={a.status} />
									</TableCell>
									<TableCell>{a.releaseYear ?? "—"}</TableCell>
									<TableCell className="text-muted-foreground">
										{a.slug}
									</TableCell>
									<TableCell className="flex justify-end gap-2">
										<Button
											variant="outline"
											size="sm"
											onClick={() => setSheet({ kind: "edit", anime: a })}
										>
											Edit
										</Button>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => setSheet({ kind: "delete", anime: a })}
										>
											Delete
										</Button>
									</TableCell>
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell colSpan={5} className="h-24 text-center">
									No anime yet.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{sheet.kind === "create" && (
				<AnimeFormSheet
					mode="create"
					open
					onOpenChange={() => setSheet({ kind: "none" })}
				/>
			)}
			{sheet.kind === "edit" && (
				<AnimeFormSheet
					mode="edit"
					anime={sheet.anime}
					open
					onOpenChange={() => setSheet({ kind: "none" })}
				/>
			)}
			{sheet.kind === "delete" && (
				<ConfirmDelete
					open
					label={sheet.anime.title}
					pending={deleteAnime.isPending}
					onOpenChange={() => setSheet({ kind: "none" })}
					onConfirm={() => deleteAnime.mutate({ id: sheet.anime.id })}
				/>
			)}
		</div>
	)
}
