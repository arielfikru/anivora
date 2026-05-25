import type { UseCases } from "#/application/use-cases.ts"
import { logger } from "#/infrastructure/observability/logger.ts"

const POLL_INTERVAL_MS = 30_000

export function startEpisodePoller(useCases: UseCases): NodeJS.Timeout {
	const tick = async (): Promise<void> => {
		try {
			const { updated } = await useCases.episode.pollProcessing()
			if (updated > 0) logger.info({ updated }, "episode poll synced")
		} catch (err) {
			logger.error({ err }, "episode poll failed")
		}
	}
	const timer = setInterval(tick, POLL_INTERVAL_MS)
	timer.unref?.()
	return timer
}
