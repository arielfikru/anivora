import { useMutation, useQueryClient } from "@tanstack/react-query"
import * as React from "react"
import { toast } from "sonner"

import { Button } from "#/components/ui/button"
import { Input } from "#/components/ui/input"
import { Label } from "#/components/ui/label"
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "#/components/ui/sheet"
import { extractErrorMessage } from "#/libs/errors/extract-message"
import { orpc } from "#/libs/orpc/client"

const PRESETS = [12, 24] as const

interface Props {
	seasonId: string
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function BulkEpisodeSheet({ seasonId, open, onOpenChange }: Props) {
	const queryClient = useQueryClient()
	const [count, setCount] = React.useState(12)

	const bulk = useMutation({
		...orpc.admin.bulkCreateEpisodes.mutationOptions(),
		onSuccess: (res) => {
			queryClient.invalidateQueries({
				queryKey: orpc.admin.listEpisodes.key({ input: { seasonId } }),
			})
			toast.success(
				`${res.created} episode dibuat${res.skipped ? `, ${res.skipped} dilewati` : ""}`,
			)
			onOpenChange(false)
		},
		onError: (e) => toast.error(extractErrorMessage(e)),
	})

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="w-full sm:max-w-md">
				<SheetHeader>
					<SheetTitle>Bulk add episode</SheetTitle>
				</SheetHeader>
				<div className="flex flex-col gap-4 px-4 pb-4">
					<p className="text-sm text-muted-foreground">
						Episode dibuat berurutan setelah episode terakhir. Nomor yang sudah
						ada otomatis dilewati.
					</p>
					<div className="flex gap-2">
						{PRESETS.map((n) => (
							<Button
								key={n}
								type="button"
								variant={count === n ? "default" : "outline"}
								size="sm"
								onClick={() => setCount(n)}
							>
								{n}
							</Button>
						))}
					</div>
					<div className="flex flex-col gap-1.5">
						<Label>Jumlah</Label>
						<Input
							type="number"
							min={1}
							max={100}
							value={count}
							onChange={(e) =>
								setCount(
									Math.min(100, Math.max(1, Number(e.target.value) || 1)),
								)
							}
						/>
					</div>
					<Button
						disabled={bulk.isPending}
						onClick={() => bulk.mutate({ seasonId, count })}
					>
						{bulk.isPending ? "Membuat…" : `Buat ${count} episode`}
					</Button>
				</div>
			</SheetContent>
		</Sheet>
	)
}
