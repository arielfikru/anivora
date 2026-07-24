const NAMED_ENTITIES: Record<string, string> = {
	amp: "&",
	apos: "'",
	gt: ">",
	lt: "<",
	nbsp: " ",
	quot: '"',
	"#039": "'",
}

export function decodeHtml(value: string): string {
	return value
		.replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
		.replace(/&#x([\da-f]+);/gi, (_, n: string) =>
			String.fromCodePoint(Number.parseInt(n, 16)),
		)
		.replace(
			/&([a-z]+|#039);/gi,
			(entity, name: string) => NAMED_ENTITIES[name.toLowerCase()] ?? entity,
		)
}

export function textContent(value: string): string {
	return decodeHtml(
		value
			.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
			.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
			.replace(/<br\s*\/?\s*>/gi, "\n")
			.replace(/<\/p\s*>/gi, "\n")
			.replace(/<[^>]+>/g, " "),
	)
		.replace(/[ \t]+/g, " ")
		.replace(/\s*\n\s*/g, "\n")
		.trim()
}

export function sourceIdFromUrl(url: string): string {
	const parts = new URL(url).pathname.split("/").filter(Boolean)
	return decodeURIComponent(parts.at(-1) ?? "")
}

export function absoluteUrl(value: string, baseUrl: string): string {
	return new URL(decodeHtml(value), baseUrl).toString()
}
