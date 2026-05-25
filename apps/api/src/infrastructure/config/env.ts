import { z } from "zod"

const envSchema = z
	.object({
		DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
		REDIS_URL: z.string().min(1).default("redis://127.0.0.1:6379"),
		BETTER_AUTH_SECRET: z
			.string()
			.min(
				16,
				"BETTER_AUTH_SECRET must be at least 16 chars (use `openssl rand -hex 32`)",
			),
		BETTER_AUTH_URL: z.string().url().default("http://localhost:3000"),
		WEB_ORIGIN: z.string().url().default("http://localhost:3000"),
		PORT: z.coerce.number().int().positive().default(3001),
		WEB_DIST_PATH: z.string().optional(),
		UPLOAD_DIR: z.string().default("./uploads"),
		BUNNY_STREAM_LIBRARY_ID: z
			.string()
			.min(1, "BUNNY_STREAM_LIBRARY_ID required"),
		BUNNY_STREAM_API_KEY: z.string().min(1, "BUNNY_STREAM_API_KEY required"),
		BUNNY_STREAM_CDN_HOSTNAME: z
			.string()
			.min(1, "BUNNY_STREAM_CDN_HOSTNAME required"),
		BUNNY_STREAM_BASE_URL: z
			.string()
			.url()
			.default("https://video.bunnycdn.com"),
		WEBHOOK_SECRET: z.string().optional(),
		GOOGLE_CLIENT_ID: z.string().optional(),
		GOOGLE_CLIENT_SECRET: z.string().optional(),
		NODE_ENV: z
			.enum(["development", "production", "test"])
			.default("development"),
	})
	.refine(
		(v) =>
			(v.GOOGLE_CLIENT_ID && v.GOOGLE_CLIENT_SECRET) ||
			(!v.GOOGLE_CLIENT_ID && !v.GOOGLE_CLIENT_SECRET),
		{
			message:
				"GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must both be set or both be empty",
			path: ["GOOGLE_CLIENT_ID"],
		},
	)

export type Env = z.infer<typeof envSchema>

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
	const parsed = envSchema.safeParse(source)
	if (!parsed.success) {
		const issues = parsed.error.issues
			.map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
			.join("\n")
		throw new Error(`Invalid environment configuration:\n${issues}`)
	}
	return parsed.data
}

export const env = loadEnv()
