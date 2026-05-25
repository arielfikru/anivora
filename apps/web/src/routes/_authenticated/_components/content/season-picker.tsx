import { useQuery } from "@tanstack/react-query"

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select"
import { orpc } from "#/libs/orpc/client"
import type { SeasonRow } from "./season-form-sheet"

interface Props {
	animeId: string
	value: string
	onChange: (id: string) => void
}

export function SeasonPicker({ animeId, value, onChange }: Props) {
	const { data } = useQuery({
		...orpc.admin.listSeasons.queryOptions({ input: { animeId } }),
		enabled: Boolean(animeId),
	})
	const seasons = (data?.seasons ?? []) as SeasonRow[]
	return (
		<Select value={value} onValueChange={onChange} disabled={!animeId}>
			<SelectTrigger className="w-56">
				<SelectValue placeholder="Select season…" />
			</SelectTrigger>
			<SelectContent>
				{seasons.map((s) => (
					<SelectItem key={s.id} value={s.id}>
						Season {s.seasonNumber}
						{s.title ? ` · ${s.title}` : ""}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	)
}
