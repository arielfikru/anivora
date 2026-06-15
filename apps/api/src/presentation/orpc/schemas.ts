import { z } from "zod"

const userId = z.string().min(1, "User ID is required")
const userName = z
	.string()
	.min(1, "Name is required")
	.max(100, "Name too long")
	.trim()
const userEmail = z
	.string()
	.email("Invalid email address")
	.max(254, "Email too long")
	.trim()
	.toLowerCase()
const userPassword = z
	.string()
	.min(8, "Password must be at least 8 characters")
	.max(72, "Password too long")
const userRole = z.enum(["admin", "user"])

export const banUserSchema = z.object({
	userId,
	banReason: z.string().max(500, "Reason too long").trim().optional(),
})

export const unbanUserSchema = z.object({ userId })

export const setRoleSchema = z.object({
	userId,
	role: userRole,
})

export const createUserSchema = z.object({
	name: userName,
	email: userEmail,
	password: userPassword,
	role: userRole.default("user"),
})

export const updateUserSchema = z
	.object({
		userId,
		name: userName.optional(),
		email: userEmail.optional(),
	})
	.refine((data) => data.name !== undefined || data.email !== undefined, {
		message: "At least one field (name or email) must be provided",
	})

export const deleteUserSchema = z.object({ userId })

export const listActivityLogsSchema = z.object({
	limit: z.number().int().min(1).max(200).default(50),
	offset: z.number().int().min(0).default(0),
	userId: z.string().optional(),
	resource: z.string().optional(),
	action: z.string().optional(),
})

const id = z.string().min(1, "ID is required")

// Accepts an absolute URL (external host) or a server-relative upload path
// like "/uploads/<uuid>.jpg" produced by the local image upload endpoint.
const imageUrl = z
	.string()
	.max(2048)
	.refine(
		(v) => v.startsWith("/") || URL.canParse(v),
		"Must be a URL or an upload path",
	)
const catalogStatus = z.enum(["draft", "published", "hidden", "archived"])
const contentRating = z.enum(["general", "teen", "mature", "adult"])
const episodeStatus = z.enum([
	"draft",
	"uploaded",
	"processing",
	"ready",
	"published",
	"failed",
	"hidden",
	"archived",
])

const animeFields = {
	title: z.string().min(1, "Title is required").max(200).trim(),
	description: z.string().max(5000).nullish(),
	coverImageUrl: imageUrl.nullish(),
	bannerImageUrl: imageUrl.nullish(),
	status: catalogStatus.optional(),
	contentRating: contentRating.optional(),
	studioName: z.string().max(200).nullish(),
	creatorName: z.string().max(200).nullish(),
	releaseYear: z.number().int().min(1900).max(2200).nullish(),
	rightsOwnerName: z.string().max(200).nullish(),
	licenseType: z.string().max(200).nullish(),
	permissionDocumentUrl: z.string().url().nullish(),
	isOriginalContent: z.boolean().optional(),
	isFanmade: z.boolean().optional(),
	requiresAttribution: z.boolean().optional(),
	attributionText: z.string().max(2000).nullish(),
}

export const listAnimeSchema = z.object({
	genreSlug: z.string().optional(),
	search: z.string().max(200).optional(),
	limit: z.number().int().min(1).max(100).default(24),
	offset: z.number().int().min(0).default(0),
})

export const searchAnimeSchema = z.object({
	query: z.string().min(1).max(200).trim(),
	limit: z.number().int().min(1).max(100).default(24),
})

export const animeSlugSchema = z.object({ slug: z.string().min(1) })
export const relatedAnimeSchema = z.object({
	slug: z.string().min(1),
	limit: z.number().int().min(1).max(24).default(12),
})
export const episodeSlugSchema = z.object({ slug: z.string().min(1) })

export const getAnimeAdminSchema = z.object({ id })
export const listSeasonsSchema = z.object({ animeId: id })
export const listEpisodesSchema = z.object({ seasonId: id })

export const createAnimeSchema = z.object(animeFields)
export const updateAnimeSchema = z.object({
	id,
	data: z.object(animeFields).partial(),
})
export const deleteAnimeSchema = z.object({ id })

const seasonFields = {
	title: z.string().max(200).nullish(),
	description: z.string().max(5000).nullish(),
	releaseYear: z.number().int().min(1900).max(2200).nullish(),
	status: catalogStatus.optional(),
	autoPublish: z.boolean().optional(),
}

export const createSeasonSchema = z.object({
	animeId: id,
	seasonNumber: z.number().int().min(0),
	...seasonFields,
})
export const updateSeasonSchema = z.object({
	id,
	data: z
		.object({ seasonNumber: z.number().int().min(0), ...seasonFields })
		.partial(),
})
export const deleteSeasonSchema = z.object({ id })

export const createEpisodeSchema = z.object({
	seasonId: id,
	episodeNumber: z.number().int().min(0),
	title: z.string().max(200).nullish(),
	description: z.string().max(5000).nullish(),
	durationSeconds: z.number().int().min(0).nullish(),
	thumbnailUrl: z.string().url().nullish(),
})

export const updateEpisodeSchema = z.object({
	id,
	data: z
		.object({
			episodeNumber: z.number().int().min(0),
			episodeCode: z.string().max(20),
			title: z.string().max(200).nullish(),
			slug: z.string().max(250),
			description: z.string().max(5000).nullish(),
			durationSeconds: z.number().int().min(0).nullish(),
			thumbnailUrl: imageUrl.nullish(),
			status: episodeStatus,
		})
		.partial(),
})
export const deleteEpisodeSchema = z.object({ id })

export const bulkCreateEpisodesSchema = z.object({
	seasonId: id,
	count: z.number().int().min(1).max(100),
	startNumber: z.number().int().min(0).nullish(),
})

export const setSeasonEpisodesStatusSchema = z.object({
	seasonId: id,
	status: episodeStatus,
})

export const createGenreSchema = z.object({
	name: z.string().min(1, "Name is required").max(100).trim(),
})
export const deleteGenreSchema = z.object({ id })

export const createRemoteUploadSchema = z.object({
	seasonId: id,
	sourceType: z.enum(["url", "drive"]),
	sourceUrl: z.string().url("Must be a valid URL").max(2048).trim(),
	isArchive: z.boolean().default(false),
})

export const listRemoteUploadsSchema = z.object({ seasonId: id })
export const getRemoteUploadSchema = z.object({ jobId: id })
export const cancelRemoteUploadSchema = z.object({ jobId: id })

export const mapRemoteUploadSchema = z.object({
	jobId: id,
	mappings: z
		.array(
			z.object({
				relPath: z.string().min(1),
				episodeNumber: z.number().int().min(0),
			}),
		)
		.min(1, "Map at least one file"),
})
