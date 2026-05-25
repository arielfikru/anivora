export interface ActivityLogEntry {
	userId?: string | null
	action: string
	resource: string
	resourceId?: string | null
	metadata?: Record<string, unknown>
	ipAddress?: string | null
	userAgent?: string | null
}

export interface ActivityLogRecord {
	id: string
	userId: string | null
	action: string
	resource: string
	resourceId: string | null
	metadata: string | null
	ipAddress: string | null
	userAgent: string | null
	createdAt: Date
	userName: string | null
	userEmail: string | null
}

export interface ActivityLogFilters {
	userId?: string
	resource?: string
	action?: string
	limit: number
	offset: number
}
