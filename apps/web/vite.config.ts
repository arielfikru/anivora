import { paraglideVitePlugin } from "@inlang/paraglide-js"
import legacy from "@vitejs/plugin-legacy"
import tailwindcss from "@tailwindcss/vite"
import { tanstackRouter } from "@tanstack/router-plugin/vite"
import viteReact from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"

const API_URL = process.env.VITE_API_URL ?? "http://localhost:3001"

export default defineConfig({
	// Modern SPA is mounted under /app — the bare root serves the static
	// device chooser (choose.html). All built asset URLs become /app/assets/*.
	base: "/app/",
	plugins: [
		paraglideVitePlugin({
			project: "./src/libs/paraglide/project.inlang",
			outdir: "./src/libs/paraglide/generated",
			strategy: ["globalVariable", "baseLocale"],
		}),
		tsconfigPaths({ projects: ["./tsconfig.json"] }),
		tailwindcss(),
		tanstackRouter({
			target: "react",
			autoCodeSplitting: true,
			routesDirectory: "./src/routes",
			generatedRouteTree: "./src/routeTree.gen.ts",
			routeFileIgnorePattern: "^(_hooks|_components|_server|_data)",
		}),
		viteReact({
			babel: {
				plugins: ["babel-plugin-react-compiler"],
			},
		}),
		// Smart TV browsers (Tizen/webOS/Android TV WebView) can run very old
		// Chromium that cannot parse modern syntax, leaving a white screen.
		// Including `ie >= 11` forces babel to fully down-level to ES5 (default
		// params, arrows, classes, etc.) — plain `chrome >= 51` left ES2015
		// syntax intact, which the oldest TVs choke on ("Unexpected token =").
		legacy({
			targets: ["ie >= 11", "chrome >= 38", "safari >= 9"],
			modernPolyfills: true,
			// core-js covers ES syntax/builtins but not Web APIs. Old TV engines
			// lack the Streams API (TransformStream) that the RPC client uses.
			// Use the ES5 build — additionalLegacyPolyfills are concatenated as-is
			// (not transpiled), and the default export ships modern syntax that
			// the oldest TVs cannot parse.
			additionalLegacyPolyfills: ["web-streams-polyfill/dist/polyfill.min.js"],
		}),
	],
	server: {
		proxy: {
			"/api": {
				target: API_URL,
				changeOrigin: true,
			},
			"/rpc": {
				target: API_URL,
				changeOrigin: true,
			},
		},
	},
	build: {
		target: "es2015",
		rollupOptions: {
			output: {
				manualChunks(id) {
					if (!id.includes("node_modules")) return
					if (id.includes("/posthog-js/")) return "vendor-posthog"
					if (id.includes("/@tabler/icons-react/")) return "vendor-icons"
					if (id.includes("/zod/")) return "vendor-zod"
					if (
						id.includes("/recharts/") ||
						id.includes("/d3-shape") ||
						id.includes("/d3-scale") ||
						id.includes("/d3-color") ||
						id.includes("/d3-interpolate") ||
						id.includes("/d3-path") ||
						id.includes("/victory-vendor/")
					)
						return "vendor-charts"
				},
			},
		},
	},
})
