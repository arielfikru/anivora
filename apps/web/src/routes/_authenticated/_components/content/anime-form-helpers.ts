import { z } from "zod"

import { CATALOG_STATUSES, CONTENT_RATINGS } from "./shared"

export const animeFormSchema = z.object({
	title: z.string().min(1, "Title is required").max(200),
	description: z.string().max(5000),
	status: z.enum(CATALOG_STATUSES),
	contentRating: z.enum(CONTENT_RATINGS),
	releaseYear: z.string(),
	studioName: z.string().max(200),
	creatorName: z.string().max(200),
	coverImageUrl: z.string(),
	bannerImageUrl: z.string(),
	rightsOwnerName: z.string().max(200),
	licenseType: z.string().max(200),
	attributionText: z.string().max(2000),
	isFanmade: z.boolean(),
	isOriginalContent: z.boolean(),
})

export type AnimeFormValues = z.infer<typeof animeFormSchema>

export interface AnimeRow {
	id: string
	title: string
	slug: string
	status: string
	releaseYear: number | null
	contentRating: string
}

export const emptyAnimeForm: AnimeFormValues = {
	title: "",
	description: "",
	status: "draft",
	contentRating: "general",
	releaseYear: "",
	studioName: "",
	creatorName: "",
	coverImageUrl: "",
	bannerImageUrl: "",
	rightsOwnerName: "",
	licenseType: "",
	attributionText: "",
	isFanmade: false,
	isOriginalContent: false,
}

const orNull = (s: string) => (s.trim() === "" ? null : s.trim())
const yearOrNull = (s: string) => (s.trim() === "" ? null : Number(s))

export function toAnimePayload(v: AnimeFormValues) {
	return {
		title: v.title.trim(),
		description: orNull(v.description),
		status: v.status,
		contentRating: v.contentRating,
		releaseYear: yearOrNull(v.releaseYear),
		studioName: orNull(v.studioName),
		creatorName: orNull(v.creatorName),
		coverImageUrl: orNull(v.coverImageUrl),
		bannerImageUrl: orNull(v.bannerImageUrl),
		rightsOwnerName: orNull(v.rightsOwnerName),
		licenseType: orNull(v.licenseType),
		attributionText: orNull(v.attributionText),
		isFanmade: v.isFanmade,
		isOriginalContent: v.isOriginalContent,
	}
}
