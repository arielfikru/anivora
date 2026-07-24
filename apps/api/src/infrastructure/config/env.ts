import { z } from "zod"

const envBoolean = z
	.enum(["true", "false", "1", "0"])
	.transform((value) => value === "true" || value === "1")

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
		UPLOAD_WORK_DIR: z.string().default("./work"),
		REMOTE_UPLOAD_MAX_BYTES: z.coerce.number().int().positive().optional(),
		MIRROR_ENABLED: envBoolean.default(false),
		MIRROR_INITIAL_PAGES: z.coerce.number().int().min(1).max(100).default(5),
		MIRROR_DAILY_PAGES: z.coerce.number().int().min(1).max(20).default(1),
		MIRROR_SYNC_INTERVAL_SECONDS: z.coerce
			.number()
			.int()
			.min(300)
			.default(86_400),
		MIRROR_RIGHTS_OWNER_NAME: z.string().default("Authorized content partner"),
		MIRROR_LICENSE_TYPE: z.string().default("authorized-mirror"),
		MIRROR_PERMISSION_DOCUMENT_URL: z.string().url().optional(),
		ANOBOY_BASE_URL: z.string().url().default("https://anoboy.be"),
		GOFILE_API_TOKEN: z.string().min(1).optional(),
		// Cloudflare R2 (S3-compatible) — the only video storage backend.
		R2_ACCOUNT_ID: z.string().min(1, "R2_ACCOUNT_ID required"),
		R2_ACCESS_KEY_ID: z.string().min(1, "R2_ACCESS_KEY_ID required"),
		R2_SECRET_ACCESS_KEY: z.string().min(1, "R2_SECRET_ACCESS_KEY required"),
		R2_BUCKET: z.string().min(1, "R2_BUCKET required"),
		// Public base URL of the bucket (Cloudflare custom domain or r2.dev),
		// no trailing slash. Playback URLs are `${R2_PUBLIC_URL}/${key}`.
		R2_PUBLIC_URL: z.string().url(),
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
