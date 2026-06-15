import {
	bigint,
	boolean,
	integer,
	pgTable,
	primaryKey,
	text,
	timestamp,
} from "drizzle-orm/pg-core"

export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").notNull().default(false),
	image: text("image"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
	role: text("role").notNull().default("user"),
	banned: boolean("banned").notNull().default(false),
	banReason: text("ban_reason"),
	banExpires: timestamp("ban_expires"),
})

export const session = pgTable("session", {
	id: text("id").primaryKey(),
	expiresAt: timestamp("expires_at").notNull(),
	token: text("token").notNull().unique(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	impersonatedBy: text("impersonated_by"),
})

export const account = pgTable("account", {
	id: text("id").primaryKey(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at"),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
	scope: text("scope"),
	password: text("password"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const activityLog = pgTable("activity_log", {
	id: text("id").primaryKey(),
	userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
	action: text("action").notNull(),
	resource: text("resource").notNull(),
	resourceId: text("resource_id"),
	metadata: text("metadata"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const anime = pgTable("anime", {
	id: text("id").primaryKey(),
	title: text("title").notNull(),
	slug: text("slug").notNull().unique(),
	description: text("description"),
	coverImageUrl: text("cover_image_url"),
	bannerImageUrl: text("banner_image_url"),
	status: text("status").notNull().default("draft"),
	contentRating: text("content_rating").notNull().default("general"),
	studioName: text("studio_name"),
	creatorName: text("creator_name"),
	releaseYear: integer("release_year"),
	rightsOwnerName: text("rights_owner_name"),
	licenseType: text("license_type"),
	permissionDocumentUrl: text("permission_document_url"),
	isOriginalContent: boolean("is_original_content").notNull().default(false),
	isFanmade: boolean("is_fanmade").notNull().default(false),
	requiresAttribution: boolean("requires_attribution").notNull().default(false),
	attributionText: text("attribution_text"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const season = pgTable("season", {
	id: text("id").primaryKey(),
	animeId: text("anime_id")
		.notNull()
		.references(() => anime.id, { onDelete: "cascade" }),
	seasonNumber: integer("season_number").notNull(),
	title: text("title"),
	description: text("description"),
	releaseYear: integer("release_year"),
	status: text("status").notNull().default("draft"),
	autoPublish: boolean("auto_publish").notNull().default(false),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const episode = pgTable("episode", {
	id: text("id").primaryKey(),
	animeId: text("anime_id")
		.notNull()
		.references(() => anime.id, { onDelete: "cascade" }),
	seasonId: text("season_id")
		.notNull()
		.references(() => season.id, { onDelete: "cascade" }),
	episodeNumber: integer("episode_number").notNull(),
	episodeCode: text("episode_code").notNull(),
	title: text("title"),
	slug: text("slug").notNull().unique(),
	description: text("description"),
	durationSeconds: integer("duration_seconds"),
	thumbnailUrl: text("thumbnail_url"),
	bunnyVideoId: text("bunny_video_id"),
	bunnyLibraryId: text("bunny_library_id"),
	playbackUrl: text("playback_url"),
	embedUrl: text("embed_url"),
	// Cloudflare R2 progressive playback. mp4Url is the watchable source;
	// hlsUrl is populated later (Phase 2) once HLS transcode lands. null
	// storageProvider on legacy rows = bunny.
	mp4Url: text("mp4_url"),
	hlsUrl: text("hls_url"),
	storageProvider: text("storage_provider"),
	status: text("status").notNull().default("draft"),
	publishedAt: timestamp("published_at"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const remoteUploadJob = pgTable("remote_upload_job", {
	id: text("id").primaryKey(),
	seasonId: text("season_id")
		.notNull()
		.references(() => season.id, { onDelete: "cascade" }),
	animeId: text("anime_id")
		.notNull()
		.references(() => anime.id, { onDelete: "cascade" }),
	sourceType: text("source_type").notNull(),
	sourceUrl: text("source_url").notNull(),
	isArchive: boolean("is_archive").notNull().default(false),
	status: text("status").notNull().default("pending"),
	error: text("error"),
	workDir: text("work_dir"),
	bytesDownloaded: bigint("bytes_downloaded", { mode: "number" })
		.notNull()
		.default(0),
	bytesTotal: bigint("bytes_total", { mode: "number" }).notNull().default(0),
	files: text("files").notNull().default("[]"),
	createdBy: text("created_by").references(() => user.id, {
		onDelete: "set null",
	}),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const genre = pgTable("genre", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	slug: text("slug").notNull().unique(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const animeGenre = pgTable(
	"anime_genre",
	{
		animeId: text("anime_id")
			.notNull()
			.references(() => anime.id, { onDelete: "cascade" }),
		genreId: text("genre_id")
			.notNull()
			.references(() => genre.id, { onDelete: "cascade" }),
	},
	(t) => [primaryKey({ columns: [t.animeId, t.genreId] })],
)
