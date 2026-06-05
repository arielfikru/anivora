import { useQuery } from "@tanstack/react-query"
import * as React from "react"

import { Label } from "#/components/ui/label"
import { orpc } from "#/libs/orpc/client"
import { EpisodeUploadCard } from "./episode-upload-card"
import type { EpisodeRow } from "./episode-types"
import { RemoteUploadPanel } from "./remote-upload-panel"
import { AnimePicker } from "./shared"
import { SeasonPicker } from "./season-picker"

export function UploadsManager() {
	const [animeId, setAnimeId] = React.useState("")
	const [seasonId, setSeasonId] = React.useState("")

	const { data } = useQuery({
		...orpc.admin.listEpisodes.queryOptions({ input: { seasonId } }),
		enabled: Boolean(seasonId),
	})
	const episodes = (data?.episodes ?? []) as EpisodeRow[]

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
			</div>

			{seasonId && <RemoteUploadPanel seasonId={seasonId} />}

			{seasonId && (
				<div className="grid gap-3 lg:grid-cols-2">
					{episodes.length ? (
						episodes.map((ep) => (
							<EpisodeUploadCard key={ep.id} episode={ep} seasonId={seasonId} />
						))
					) : (
						<p className="text-muted-foreground text-sm">
							No episodes in this season. Create one first.
						</p>
					)}
				</div>
			)}
		</div>
	)
}
