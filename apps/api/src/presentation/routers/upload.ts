import type { UseCases } from "#/application/use-cases.ts"
import { adminProcedure, toAuthedContext } from "../orpc/middleware.ts"
import {
	cancelRemoteUploadSchema,
	createRemoteUploadSchema,
	getRemoteUploadSchema,
	listRemoteUploadsSchema,
	mapRemoteUploadSchema,
} from "../orpc/schemas.ts"

export function buildUploadRouter(useCases: UseCases["upload"]) {
	return {
		createRemoteUpload: adminProcedure
			.input(createRemoteUploadSchema)
			.handler(({ input, context }) =>
				useCases.create(input, toAuthedContext(context)),
			),

		listRemoteUploads: adminProcedure
			.input(listRemoteUploadsSchema)
			.handler(({ input, context }) =>
				useCases.list(input, toAuthedContext(context)),
			),

		getRemoteUpload: adminProcedure
			.input(getRemoteUploadSchema)
			.handler(({ input, context }) =>
				useCases.get(input, toAuthedContext(context)),
			),

		mapRemoteUpload: adminProcedure
			.input(mapRemoteUploadSchema)
			.handler(({ input, context }) =>
				useCases.map(input, toAuthedContext(context)),
			),

		cancelRemoteUpload: adminProcedure
			.input(cancelRemoteUploadSchema)
			.handler(({ input, context }) =>
				useCases.cancel(input, toAuthedContext(context)),
			),
	}
}
