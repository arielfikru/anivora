import {
	IconActivity,
	IconChevronLeft,
	IconChevronRight,
} from "@tabler/icons-react"

import { Badge } from "#/components/ui/badge"
import { Button } from "#/components/ui/button"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table"

export const ACTION_COLORS: Record<
	string,
	"default" | "secondary" | "outline" | "destructive"
> = {
	create: "default",
	update: "secondary",
	delete: "destructive",
	ban: "destructive",
	unban: "secondary",
	"set-role": "secondary",
}

export function RelativeTime({ date }: { date: Date }) {
	const now = Date.now()
	const diff = now - date.getTime()
	const s = Math.floor(diff / 1000)
	const m = Math.floor(s / 60)
	const h = Math.floor(m / 60)
	const d = Math.floor(h / 24)

	let label: string
	if (s < 60) label = `${s}s ago`
	else if (m < 60) label = `${m}m ago`
	else if (h < 24) label = `${h}h ago`
	else label = `${d}d ago`

	return (
		<span title={date.toLocaleString()} className="tabular-nums">
			{label}
		</span>
	)
}

interface ActivityLog {
	id: string
	action: string
	resource: string
	resourceId: string | null
	metadata: string | null
	createdAt: string | Date
	userName: string | null
	userEmail: string | null
}

interface ActivityTableProps {
	logs: ActivityLog[]
	isLoading: boolean
	page: number
	totalPages: number
	onPrevPage: () => void
	onNextPage: () => void
}

export function ActivityTable({
	logs,
	isLoading,
	page,
	totalPages,
	onPrevPage,
	onNextPage,
}: ActivityTableProps) {
	return (
		<>
			<div className="rounded-lg border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-36">When</TableHead>
							<TableHead>Actor</TableHead>
							<TableHead className="w-28">Action</TableHead>
							<TableHead className="w-28">Resource</TableHead>
							<TableHead>Resource ID</TableHead>
							<TableHead>Details</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading ? (
							Array.from({ length: 8 }).map((_, i) => (
								<TableRow key={i}>
									{Array.from({ length: 6 }).map((_, j) => (
										<TableCell key={j}>
											<div className="h-4 w-full animate-pulse rounded bg-muted" />
										</TableCell>
									))}
								</TableRow>
							))
						) : logs.length === 0 ? (
							<TableRow>
								<TableCell colSpan={6} className="py-16 text-center">
									<div className="flex flex-col items-center gap-2 text-muted-foreground">
										<IconActivity className="size-8 opacity-40" />
										<p className="text-sm">No activity found</p>
									</div>
								</TableCell>
							</TableRow>
						) : (
							logs.map((log) => {
								let details: Record<string, unknown> | null = null
								try {
									if (log.metadata) details = JSON.parse(log.metadata)
								} catch {}

								return (
									<TableRow key={log.id}>
										<TableCell className="text-muted-foreground text-xs">
											<RelativeTime date={new Date(log.createdAt)} />
										</TableCell>
										<TableCell>
											{log.userName ? (
												<div>
													<p className="text-sm font-medium leading-none">
														{log.userName}
													</p>
													<p className="text-xs text-muted-foreground">
														{log.userEmail}
													</p>
												</div>
											) : (
												<span className="text-xs text-muted-foreground">
													System
												</span>
											)}
										</TableCell>
										<TableCell>
											<Badge
												variant={ACTION_COLORS[log.action] ?? "outline"}
												className="text-xs font-mono"
											>
												{log.action}
											</Badge>
										</TableCell>
										<TableCell>
											<span className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
												{log.resource}
											</span>
										</TableCell>
										<TableCell className="text-xs text-muted-foreground font-mono">
											{log.resourceId ? (
												<span title={log.resourceId}>
													{log.resourceId.slice(0, 8)}…
												</span>
											) : (
												"—"
											)}
										</TableCell>
										<TableCell className="text-xs text-muted-foreground max-w-xs truncate">
											{details
												? Object.entries(details)
														.map(([k, v]) => `${k}: ${String(v)}`)
														.join(", ")
												: "—"}
										</TableCell>
									</TableRow>
								)
							})
						)}
					</TableBody>
				</Table>
			</div>

			{totalPages > 1 && (
				<div className="flex items-center justify-between">
					<p className="text-sm text-muted-foreground">
						Page {page} of {totalPages}
					</p>
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							disabled={page <= 1}
							onClick={onPrevPage}
						>
							<IconChevronLeft className="size-4" />
						</Button>
						<Button
							variant="outline"
							size="sm"
							disabled={page >= totalPages}
							onClick={onNextPage}
						>
							<IconChevronRight className="size-4" />
						</Button>
					</div>
				</div>
			)}
		</>
	)
}
