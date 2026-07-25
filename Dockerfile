# syntax=docker/dockerfile:1.7

# ─── deps ────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS deps
RUN corepack enable pnpm
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
# pnpm gates native build scripts (esbuild/lightningcss) behind an approval
# prompt that exits non-zero in CI. The install itself succeeds; we tolerate
# the advisory exit, then explicitly build the native deps and assert the
# store materialised so a genuine install failure still breaks the build.
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
	pnpm install --frozen-lockfile; \
	pnpm rebuild esbuild lightningcss core-js protobufjs; \
	test -d node_modules/.pnpm

# ─── build ───────────────────────────────────────────────────────────────────
FROM node:22-alpine AS build
RUN corepack enable pnpm && apk add --no-cache esbuild
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY . .
RUN pnpm --filter @anivora/web run build \
	&& mkdir -p apps/api/dist \
	&& esbuild apps/api/src/main.ts \
		--bundle --platform=node --target=node22 --format=esm \
		--packages=external \
		--outfile=apps/api/dist/main.mjs \
	&& esbuild apps/api/src/migrate.ts \
		--bundle --platform=node --target=node22 --format=esm \
		--packages=external \
		--outfile=apps/api/dist/migrate.mjs \
	&& esbuild apps/api/src/infrastructure/db/seed.ts \
		--bundle --platform=node --target=node22 --format=esm \
		--packages=external \
		--outfile=apps/api/dist/seed.mjs

# ─── prune ───────────────────────────────────────────────────────────────────
# pnpm deploy emits a self-contained api/ folder with a flat node_modules
# containing only @anivora/api's production dependencies.
FROM node:22-alpine AS prune
RUN corepack enable pnpm
WORKDIR /app
COPY --from=build /app /app
# Under amd64 QEMU emulation (arm64 host) pnpm completes its work but then
# aborts on exit with a libuv `uv__io_poll` assertion. Tolerate that advisory
# exit, then assert the pruned api/ materialised so a genuine failure still
# breaks the build (same pattern as the deps stage above).
RUN pnpm deploy --filter=@anivora/api --prod --ignore-scripts --legacy /out/api || true; \
	test -d /out/api/node_modules \
	&& rm -rf /out/api/src \
	&& cp apps/api/dist/main.mjs    /out/api/main.mjs \
	&& cp apps/api/dist/migrate.mjs /out/api/migrate.mjs \
	&& cp apps/api/dist/seed.mjs    /out/api/seed.mjs \
	&& cp -r apps/api/drizzle       /out/api/drizzle

# ─── runner ──────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner

# Remote-upload worker tooling:
#  - libarchive-tools (bsdtar): extracts zip + rar/RAR5 (Alpine's 7zip/p7zip
#    carry no rar codec; proprietary `unrar` was dropped).
#  - ffmpeg: transcodes/remuxes each video to H.264/AAC faststart mp4 for
#    progressive playback from R2 (which serves the uploaded file verbatim).
RUN apk add --no-cache dumb-init wget libarchive-tools ffmpeg yt-dlp chromium

ENV NODE_ENV=production
ENV PORT=3000
ENV WEB_DIST_PATH=/app/web
ENV UPLOAD_DIR=/app/uploads
ENV UPLOAD_WORK_DIR=/app/work

WORKDIR /app
COPY --chown=node:node --from=prune /out/api ./api
COPY --chown=node:node --from=build /app/apps/web/dist ./web

# node:alpine already ships with an unprivileged `node` user (uid 1000).
# Drop root and make only the data we need writeable at runtime.
# /app/uploads is a persistent volume mount (admin-uploaded poster/banner
# images); /app/work is the remote-upload scratch volume. Create both owned by
# node so the read-only rootfs container can write to the mounts.
RUN mkdir -p /app/uploads /app/work && chown node:node /app/uploads /app/work
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
	CMD wget -qO- http://127.0.0.1:${PORT:-3000}/healthz >/dev/null 2>&1 || exit 1

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "/app/api/main.mjs"]
