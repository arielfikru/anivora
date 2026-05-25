import type { UseCases } from "#/application/use-cases.ts"
import { adminProcedure, toAuthedContext } from "../orpc/middleware.ts"
import { listActivityLogsSchema } from "../orpc/schemas.ts"

export function buildActivityRouter(useCases: UseCases["activity"]) {
	return {
		listActivityLogs: adminProcedure
			.input(listActivityLogsSchema)
			.handler(({ input, context }) =>
				useCases.list(input, toAuthedContext(context)),
			),
	}
}
