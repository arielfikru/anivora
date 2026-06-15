import { readdir, rm } from "node:fs/promises"
import { join } from "node:path"

import type { RemoteUploadJobRepository } from "#/domain/upload/remote-upload-job-repository.ts"
import { logger } from "#/infrastructure/observability/logger.ts"
import { ACTIVE_WORK } from "./process-remote-upload-jobs.ts"

export interface CleanupWorkDirsDeps {
	jobRepo: RemoteUploadJobRepository
	workRoot: string
}

/**
 * Removes scratch dirs left behind by crashed or failed jobs. A dir is kept
 * only when its job (dir name = job id) is still in an active state — anything
 * terminal, canceled, or with no matching job is reclaimed. Run at worker
 * startup so a crash mid-job can't leak disk indefinitely.
 */
export function makeCleanupWorkDirs(deps: CleanupWorkDirsDeps) {
	return async (): Promise<{ removed: number }> => {
		// Work root doesn't exist yet (no upload has run) — nothing to sweep.
		const entries = await readdir(deps.workRoot, { withFileTypes: true }).catch(
			() => null,
		)
		if (!entries) return { removed: 0 }

		let removed = 0
		for (const entry of entries) {
			if (!entry.isDirectory()) continue
			const job = await deps.jobRepo.findById(entry.name)
			if (job && ACTIVE_WORK.includes(job.status)) continue
			await rm(join(deps.workRoot, entry.name), {
				recursive: true,
				force: true,
			})
			removed++
		}
		if (removed > 0) logger.info({ removed }, "swept orphaned upload work dirs")
		return { removed }
	}
}
