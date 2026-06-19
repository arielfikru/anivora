import { execFile } from "node:child_process"
import { promisify } from "node:util"

const exec = promisify(execFile)

async function probeCodec(
	path: string,
	stream: "v:0" | "a:0",
): Promise<string | null> {
	try {
		const { stdout } = await exec("ffprobe", [
			"-v",
			"error",
			"-select_streams",
			stream,
			"-show_entries",
			"stream=codec_name",
			"-of",
			"default=nk=1:nw=1",
			path,
		])
		return stdout.trim() || null
	} catch {
		return null
	}
}

/**
 * Produce a progressive-streaming MP4 at `dest` from `src`. R2 serves the
 * uploaded file directly, so every episode must land as an H.264/AAC `.mp4`
 * with a moved moov atom (`+faststart`) for instant playback/seeking. Streams
 * already in H.264/AAC are stream-copied (fast remux); anything else is
 * transcoded.
 */
export async function transcodeToMp4(src: string, dest: string): Promise<void> {
	const video = await probeCodec(src, "v:0")

	const args = ["-y", "-i", src, "-map", "0:v:0", "-map", "0:a:0?"]
	if (video === "h264") args.push("-c:v", "copy")
	else
		args.push(
			"-c:v",
			"libx264",
			"-preset",
			"veryfast",
			"-crf",
			"20",
			"-pix_fmt",
			"yuv420p",
		)
	// Always normalize audio to AAC-LC. ffprobe reports codec_name "aac" for both
	// LC and HE-AAC, so a copy-when-aac shortcut silently passes HE-AAC through.
	// Linux/Chromium and TVs decode HE-AAC, but macOS browsers reject it and fail
	// the whole media element (stuck at 0:00). Re-encoding audio is cheap.
	args.push("-c:a", "aac", "-profile:a", "aac_low", "-b:a", "192k")
	args.push("-movflags", "+faststart", dest)

	await exec("ffmpeg", args, { maxBuffer: 16 * 1024 * 1024 })
}
