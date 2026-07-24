import type { UseCases } from "#/application/use-cases.ts"
import { logger } from "#/infrastructure/observability/logger.ts"

export function startContentSyncWorker(
	useCases: UseCases,
	intervalMs: number,
): NodeJS.Timeout {
	let running = false
	const run = async (mode: "startup" | "daily") => {
		if (running) return
		running = true
		try {
			const result = await useCases.content.sync({ mode })
			logger.info({ mode, ...result }, "content provider sync completed")
		} catch (err) {
			logger.error({ err, mode }, "content provider sync failed")
		} finally {
			running = false
		}
	}
	void run("startup")
	const timer = setInterval(() => void run("daily"), intervalMs)
	timer.unref?.()
	return timer
}
