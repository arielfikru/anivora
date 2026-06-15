import * as React from "react"

export type UploadPhase = "idle" | "uploading" | "failed"

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

function parseError(xhr: XMLHttpRequest): string {
	try {
		const body = JSON.parse(xhr.responseText) as { error?: string }
		return body.error ?? `Upload failed (${xhr.status})`
	} catch {
		return `Upload failed (${xhr.status})`
	}
}

/**
 * Uploads a video file to the server, which transcodes it to mp4 and stores it
 * in Cloudflare R2. The episode is playable as soon as the request resolves —
 * no separate processing step. Large files should use remote upload instead,
 * since this request passes through the origin's body-size limit.
 */
export function useVideoUpload(onComplete: () => void) {
	const [state, setState] = React.useState<UploadState>(initial)

	const reset = React.useCallback(() => setState(initial), [])

	const upload = React.useCallback(
		(episodeId: string, file: File) => {
			setState({
				phase: "uploading",
				progress: 0,
				filename: file.name,
				size: file.size,
				error: null,
			})
			const formData = new FormData()
			formData.append("file", file)

			const xhr = new XMLHttpRequest()
			xhr.open("POST", `/api/admin/episodes/${episodeId}/upload`)
			xhr.withCredentials = true
			xhr.upload.onprogress = (e) => {
				if (!e.lengthComputable) return
				setState((s) => ({
					...s,
					progress: Math.round((e.loaded / e.total) * 100),
				}))
			}
			xhr.onload = () => {
				if (xhr.status >= 200 && xhr.status < 300) {
					setState(initial)
					onComplete()
				} else {
					setState((s) => ({ ...s, phase: "failed", error: parseError(xhr) }))
				}
			}
			xhr.onerror = () => {
				setState((s) => ({ ...s, phase: "failed", error: "Network error" }))
			}
			xhr.send(formData)
		},
		[onComplete],
	)

	return { state, upload, reset }
}
