import { paraglideVitePlugin } from "@inlang/paraglide-js"
import legacy from "@vitejs/plugin-legacy"
import tailwindcss from "@tailwindcss/vite"
import { tanstackRouter } from "@tanstack/router-plugin/vite"
import viteReact from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"

const API_URL = process.env.VITE_API_URL ?? "http://localhost:3001"

export default defineConfig({
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
		// Smart TV browsers (Tizen/webOS/Android TV WebView) can run old Chromium
		// that cannot parse the default modern-ESM output, leaving a white screen.
		// Emit a nomodule ES5 + polyfill bundle they load via SystemJS fallback.
		legacy({
			targets: ["chrome >= 51", "safari >= 10"],
			modernPolyfills: true,
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
