export interface Cache {
	get<T>(key: string): Promise<T | null>
	set(key: string, value: unknown, ttlSeconds: number): Promise<void>
	del(...keys: string[]): Promise<void>
	delPattern(pattern: string): Promise<void>
	ping(): Promise<boolean>
}
