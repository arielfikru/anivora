import { useQuery } from "@tanstack/react-query"

import { Badge } from "#/components/ui/badge"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select"
import { orpc } from "#/libs/orpc/client"

export const CATALOG_STATUSES = [
	"draft",
	"published",
	"hidden",
	"archived",
] as const

export const CONTENT_RATINGS = ["general", "teen", "mature", "adult"] as const

export const EPISODE_STATUSES = [
	"draft",
	"uploaded",
	"processing",
	"ready",
	"published",
	"failed",
	"hidden",
	"archived",
] as const

export type CatalogStatusValue = (typeof CATALOG_STATUSES)[number]
export type EpisodeStatusValue = (typeof EPISODE_STATUSES)[number]

function statusVariant(status: string) {
	if (status === "published" || status === "ready") return "default" as const
	if (status === "failed") return "destructive" as const
	if (status === "processing" || status === "uploaded") {
		return "secondary" as const
	}
	return "outline" as const
}

export function StatusBadge({ status }: { status: string }) {
	return <Badge variant={statusVariant(status)}>{status}</Badge>
}

interface AnimePickerProps {
	value: string
	onChange: (id: string) => void
}

export function AnimePicker({ value, onChange }: AnimePickerProps) {
	const { data } = useQuery(orpc.admin.listAllAnime.queryOptions())
	const anime = data?.anime ?? []
	return (
		<Select value={value} onValueChange={onChange}>
			<SelectTrigger className="w-72">
				<SelectValue placeholder="Select anime…" />
			</SelectTrigger>
			<SelectContent>
				{anime.map((a) => (
					<SelectItem key={a.id} value={a.id}>
						{a.title}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	)
}
