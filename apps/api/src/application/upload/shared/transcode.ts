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
	const [video, audio] = await Promise.all([
		probeCodec(src, "v:0"),
		probeCodec(src, "a:0"),
	])

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
	if (audio === "aac") args.push("-c:a", "copy")
	else args.push("-c:a", "aac", "-b:a", "192k")
	args.push("-movflags", "+faststart", dest)

	await exec("ffmpeg", args, { maxBuffer: 16 * 1024 * 1024 })
}
