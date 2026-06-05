import type { UseCases } from "#/application/use-cases.ts"
import { logger } from "#/infrastructure/observability/logger.ts"

const POLL_INTERVAL_MS = 5_000

/**
 * Single in-process worker that drains the remote-upload queue one job at a
 * time (downloads/extracts/uploads are heavy, so no concurrency). A re-entrancy
 * guard keeps overlapping ticks from claiming the same job twice.
 */
export function startRemoteUploadWorker(useCases: UseCases): NodeJS.Timeout {
	let running = false
	const tick = async (): Promise<void> => {
		if (running) return
		running = true
		try {
			// Keep draining while there is work, then idle until the next tick.
			let processed = 1
			while (processed > 0) {
				const result = await useCases.upload.process()
				processed = result.processed
			}
		} catch (err) {
			logger.error({ err }, "remote upload worker tick failed")
		} finally {
			running = false
		}
	}
	const timer = setInterval(tick, POLL_INTERVAL_MS)
	timer.unref?.()
	return timer
}
