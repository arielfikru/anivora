import * as React from "react"

interface ImageUploadState {
	uploading: boolean
	progress: number
	error: string | null
}

const initial: ImageUploadState = {
	uploading: false,
	progress: 0,
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

export function useImageUpload() {
	const [state, setState] = React.useState<ImageUploadState>(initial)

	const upload = React.useCallback(
		(file: File) =>
			new Promise<string>((resolve, reject) => {
				const formData = new FormData()
				formData.append("file", file)
				setState({ uploading: true, progress: 0, error: null })

				const xhr = new XMLHttpRequest()
				xhr.open("POST", "/api/admin/uploads/image")
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
						const url = (JSON.parse(xhr.responseText) as { url: string }).url
						setState(initial)
						resolve(url)
					} else {
						const error = parseError(xhr)
						setState({ uploading: false, progress: 0, error })
						reject(new Error(error))
					}
				}
				xhr.onerror = () => {
					setState({ uploading: false, progress: 0, error: "Network error" })
					reject(new Error("Network error"))
				}
				xhr.send(formData)
			}),
		[],
	)

	return { state, upload }
}
