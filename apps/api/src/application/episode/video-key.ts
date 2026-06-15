/** R2 object key for an episode's progressive mp4 source. */
export function episodeVideoKey(episodeId: string): string {
	return `videos/${episodeId}/source.mp4`
}
