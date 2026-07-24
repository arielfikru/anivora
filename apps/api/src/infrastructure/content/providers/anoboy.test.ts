import { describe, expect, it, vi } from "vitest"
import {
	AnoboyProvider,
	parseAnoboyAnime,
	parseAnoboyEpisodeMedia,
	parseAnoboyList,
} from "./anoboy.ts"

describe("Anoboy provider parser", () => {
	it("uses the native WordPress search endpoint", async () => {
		const fetchImpl = vi.fn().mockResolvedValue(
			new Response(`
				<article class="bs"><a href="https://anoboy.be/anime/mushoku-tensei/" title="Mushoku Tensei">
				<img src="https://img.example/mushoku.jpg"></a></article>`),
		)
		const provider = new AnoboyProvider({ fetchImpl })
		const results = await provider.searchAnime("mushoku")

		expect(fetchImpl).toHaveBeenCalledWith(
			"https://anoboy.be/?s=mushoku",
			expect.any(Object),
		)
		expect(results).toEqual([
			expect.objectContaining({
				id: "mushoku-tensei",
				title: "Mushoku Tensei",
			}),
		])
	})

	it("parses archive cards and pagination", () => {
		const html = `
			<article class="bs"><div class="bsx">
			<a href="https://anoboy.be/anime/tenmaku-no-jaadugar/" title="Tenmaku no Jaadugar">
			<div class="typez TV">TV</div><span class="epx">Ongoing</span>
			<img src="https://img.example/cover.jpg"></a></div></article>
			<a class="next page-numbers" href="/anime/page/2/">Next</a>`
		const page = parseAnoboyList(html)
		expect(page.hasNext).toBe(true)
		expect(page.items).toEqual([
			{
				id: "tenmaku-no-jaadugar",
				url: "https://anoboy.be/anime/tenmaku-no-jaadugar/",
				title: "Tenmaku no Jaadugar",
				coverImageUrl: "https://img.example/cover.jpg",
				status: "Ongoing",
				type: "TV",
			},
		])
	})

	it("parses anime metadata and episodes", () => {
		const html = `
			<div class="animefull"><div class="thumb"><img src="https://img.example/cover.jpg"></div>
			<h1 class="entry-title">Tenmaku no Jaadugar</h1><div class="spe">
			<span><b>Status:</b> Ongoing</span><span><b>Studio:</b> Science SARU</span>
			<span><b>Released:</b> 2026</span><span><b>Type:</b> TV</span></div>
			<div class="genxed"><a>Drama</a><a>Historical</a></div></div>
			<div class="bixbox synp"><div class="entry-content" itemprop="description"><p>A &amp; B</p></div></div>
			<div class="eplister"><ul><li><a href="/tenmaku-no-jaadugar-episode-1-subtitle-indonesia/">
			<div class="epl-num">1</div><div class="epl-title">Episode 1</div>
			<div class="epl-date">July 4, 2026</div></a></li></ul></div>`
		const anime = parseAnoboyAnime(
			html,
			"https://anoboy.be/anime/tenmaku-no-jaadugar/",
		)
		expect(anime.title).toBe("Tenmaku no Jaadugar")
		expect(anime.releaseYear).toBe(2026)
		expect(anime.studioName).toBe("Science SARU")
		expect(anime.description).toBe("A & B")
		expect(anime.genres).toEqual(["Drama", "Historical"])
		expect(anime.episodes[0]).toMatchObject({
			id: "tenmaku-no-jaadugar-episode-1-subtitle-indonesia",
			number: 1,
			title: "Episode 1",
		})
	})

	it("prefers the 720p Gofile share link", () => {
		const html = `<h3>Download Single Link 720P ⇩</h3><div class="soraurlx">
			<a href="https://gofile.io/d/Bfsm1Y">gofile</a></div>`
		expect(parseAnoboyEpisodeMedia(html)).toEqual({
			type: "gofile",
			url: "https://gofile.io/d/Bfsm1Y",
		})
	})

	it("prefers direct MP4 and supports Drive without assuming Gofile", () => {
		const direct = `<h3>Download Single Link 720P</h3><div class="soraurlx">
			<a href="https://cdn.example/episode.mp4">direct</a>
			<a href="https://gofile.io/d/fallback">gofile</a></div>`
		expect(parseAnoboyEpisodeMedia(direct)).toEqual({
			type: "url",
			url: "https://cdn.example/episode.mp4",
			alternatives: [{ type: "gofile", url: "https://gofile.io/d/fallback" }],
		})
		const drive = `<h3>Download Single Link 720P</h3><div class="soraurlx">
			<a href="https://drive.google.com/file/d/abc/view">drive</a></div>`
		expect(parseAnoboyEpisodeMedia(drive)).toEqual({
			type: "drive",
			url: "https://drive.google.com/file/d/abc/view",
		})
	})

	it("uses the video player first and keeps download links as fallbacks", () => {
		const html = `<iframe src="https://player.example/embed/123"></iframe>
			<h3>Download Single Link 720P</h3><div class="soraurlx">
			<a href="https://gofile.io/d/fallback">gofile</a></div>`
		expect(parseAnoboyEpisodeMedia(html)).toEqual({
			type: "player",
			url: "https://player.example/embed/123",
			alternatives: [{ type: "gofile", url: "https://gofile.io/d/fallback" }],
		})
	})

	it("supports the current download button without scraping navigation links", () => {
		const html = `<a href="https://anoboy.be/genres/action/">Action</a>
			<iframe src="https://www.blogger.com/video.g?token=abc\t"></iframe>
			<a href="https://mir.cr/APLL2WNG" target="_blank" aria-label="Download">
				<span>Download</span></a>
			<a href="https://anoboy.be/anime/other/">Other</a>`
		expect(parseAnoboyEpisodeMedia(html)).toEqual({
			type: "player",
			url: "https://www.blogger.com/video.g?token=abc",
			alternatives: [{ type: "url", url: "https://mir.cr/APLL2WNG" }],
		})
	})
})
