export interface Genre {
	id: string
	name: string
	slug: string
	createdAt: Date
	updatedAt: Date
}

export interface NewGenre {
	name: string
	slug: string
}
