import type {
	ActivityLogEntry,
	ActivityLogFilters,
	ActivityLogRecord,
} from "./activity-log.ts"

export interface ActivityRepository {
	insert(entry: ActivityLogEntry): Promise<void>
	list(
		filters: ActivityLogFilters,
	): Promise<{ logs: ActivityLogRecord[]; total: number }>
}
