import * as React from "react"
import * as tus from "tus-js-client"

import { client } from "#/libs/orpc/client"

export type UploadPhase = "idle" | "uploading" | "processing" | "failed"

export interface UploadState {
	phase: UploadPhase
	progress: number
	filename: string
	size: number
	error: string | null
}

const initial: UploadState = {
	phase: "idle",
	progress: 0,
	filename: "",
	size: 0,
	error: null,
}

/**
 * Video files are uploaded directly to Bunny Stream over the TUS resumable
 * protocol, bypassing our origin and any CDN request-body cap (Cloudflare's
 * free tier rejects bodies over 100MB). The server only mints a short-lived,
 * signed ticket — the API key never reaches the browser.
 */
export function useVideoUpload(onComplete: () => void) {
	const [state, setState] = React.useState<UploadState>(initial)

	const reset = React.useCallback(() => setState(initial), [])

	const upload = React.useCallback(
		async (episodeId: string, file: File) => {
			setState({
				phase: "uploading",
				progress: 0,
				filename: file.name,
				size: file.size,
				error: null,
			})
			try {
				const ticket = await client.admin.createEpisodeUpload({ episodeId })
				const tusUpload = new tus.Upload(file, {
					endpoint: ticket.endpoint,
					retryDelays: [0, 3000, 5000, 10000, 20000],
					headers: {
						AuthorizationSignature: ticket.signature,
						AuthorizationExpire: String(ticket.expiration),
						VideoId: ticket.videoId,
						LibraryId: ticket.libraryId,
					},
					metadata: { filetype: file.type, title: file.name },
					onError: (err) =>
						setState((s) => ({ ...s, phase: "failed", error: err.message })),
					onProgress: (uploaded, total) =>
						setState((s) => ({
							...s,
							progress: Math.round((uploaded / total) * 100),
						})),
					onSuccess: () => {
						setState((s) => ({ ...s, phase: "processing", progress: 100 }))
						onComplete()
					},
				})
				tusUpload.start()
			} catch (err) {
				setState((s) => ({
					...s,
					phase: "failed",
					error: err instanceof Error ? err.message : "Upload failed",
				}))
			}
		},
		[onComplete],
	)

	return { state, upload, reset }
}
