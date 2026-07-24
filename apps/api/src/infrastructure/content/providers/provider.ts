export interface ProviderAnimeSummary {
	id: string
	url: string
	title: string
	coverImageUrl: string | null
	status: string | null
	type: string | null
}

export interface ProviderEpisode {
	id: string
	url: string
	number: number
	title: string
	releasedAt: string | null
}

export interface ProviderAnime extends ProviderAnimeSummary {
	description: string | null
	studioName: string | null
	releaseYear: number | null
	genres: string[]
	episodes: ProviderEpisode[]
}

export interface ProviderPage {
	items: ProviderAnimeSummary[]
	hasNext: boolean
}

export interface ProviderMediaSource {
	type: "url" | "drive" | "gofile" | "player"
	url: string
	alternatives?: ProviderMediaSource[]
}

/** Adapter boundary shared by Anoboy, Otakudesu, and future vendors. */
export interface ContentProvider {
	readonly id: string
	listAnime(page: number): Promise<ProviderPage>
	searchAnime?(query: string): Promise<ProviderAnimeSummary[]>
	getAnime(url: string): Promise<ProviderAnime>
	resolveEpisodeMedia(url: string): Promise<ProviderMediaSource>
}

export class ContentProviderRegistry {
	private readonly providers = new Map<string, ContentProvider>()

	constructor(providers: ContentProvider[]) {
		for (const provider of providers) this.providers.set(provider.id, provider)
	}

	get(id: string): ContentProvider | null {
		return this.providers.get(id) ?? null
	}

	list(): ContentProvider[] {
		return [...this.providers.values()]
	}
}
