import { access } from "node:fs/promises"

import { chromium } from "playwright-core"

const EXECUTABLE_CANDIDATES = [
	process.env.CHROMIUM_EXECUTABLE_PATH,
	"/usr/bin/chromium-browser",
	"/usr/bin/chromium",
	"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter((value): value is string => Boolean(value))

async function findChromium(): Promise<string> {
	for (const candidate of EXECUTABLE_CANDIDATES) {
		try {
			await access(candidate)
			return candidate
		} catch {
			/* try the next known location */
		}
	}
	throw new Error(
		"Dynamic player extraction requires Chromium (set CHROMIUM_EXECUTABLE_PATH)",
	)
}

/**
 * Some embedded players only mint their short-lived media URL after a real
 * play interaction. Launch a minimal headless browser, click the player and
 * capture the first MP4/googlevideo request without downloading it in-browser.
 */
export interface DynamicPlayerMedia {
	url: string
	headers: Record<string, string>
}

export async function resolveDynamicPlayerUrl(
	playerUrl: string,
): Promise<DynamicPlayerMedia> {
	const browser = await chromium.launch({
		headless: true,
		executablePath: await findChromium(),
		args: ["--disable-dev-shm-usage", "--no-sandbox"],
		// The production image has a read-only root filesystem. Alpine Chromium's
		// crashpad exits immediately when HOME points at the unwritable /home/node;
		// keep its tiny profile/config/cache inside the writable container tmpfs.
		env: {
			...process.env,
			HOME: "/tmp",
			XDG_CONFIG_HOME: "/tmp/.config",
			XDG_CACHE_HOME: "/tmp/.cache",
		},
	})
	try {
		const context = await browser.newContext({
			userAgent:
				"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36",
		})
		const page = await context.newPage()
		let resolveMedia: (media: DynamicPlayerMedia) => void = () => undefined
		const media = new Promise<DynamicPlayerMedia>((resolve) => {
			resolveMedia = resolve
		})
		let captured = false
		page.on("request", async (request) => {
			const url = request.url()
			if (
				!captured &&
				/\/videoplayback(?:[?]|$)/i.test(url) &&
				(/googlevideo\.com/i.test(url) || /[?&]mime=video(?:%2F|\/)/i.test(url))
			) {
				captured = true
				try {
					resolveMedia({ url, headers: await request.allHeaders() })
				} catch {
					captured = false
				}
			}
		})
		await page.goto(playerUrl, {
			waitUntil: "domcontentloaded",
			timeout: 30_000,
		})
		// Blogger currently renders a .ppVepb play overlay. Keep generic fallbacks
		// for other authorized vendors and future player markup changes.
		for (const selector of [
			".ppVepb",
			"video",
			"button[aria-label*='Play' i]",
			"[role='button']",
		]) {
			try {
				await page.locator(selector).first().click({ timeout: 3_000 })
				break
			} catch {
				/* try the next play surface */
			}
		}
		await page.mouse.click(320, 180)
		return await Promise.race([
			media,
			new Promise<never>((_, reject) =>
				setTimeout(
					() => reject(new Error("Player did not emit a media request")),
					25_000,
				),
			),
		])
	} finally {
		await browser.close()
	}
}
