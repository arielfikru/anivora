# Project Memory

## 2026-06-25: Modern Mode Mobile/Tablet Responsiveness

- User asked to update Anivora modern mode UI so it supports mobile and tablet viewports.
- Modern mode is the React SPA under `apps/web`, mounted at `/app/`.
- Public streaming shell used to be TV/desktop-oriented with a fixed `72px` left rail and `main` always offset by `ml-[72px]`.
- Implemented responsive shell behavior:
  - Mobile: bottom navigation bar.
  - Tablet/desktop (`md` and up): fixed left icon rail.
  - Main content only gets left margin on `md` and up.
- Important visual bug found by screenshot, not code review:
  - `MediaGrid` reused `MediaCard`, whose default carousel width (`w-[180px] sm:w-[220px] lg:w-[280px]`) caused mobile grid overflow.
  - Fixed by adding `variant="grid"` to `MediaCard`, making grid cards `w-full` across breakpoints.
- `CoverImage` had broken public fallback assets in modern mode because `/cover.png` and `/banner.png` resolve from site root while the SPA base is `/app/`.
  - Fixed by resolving root-relative public assets through `import.meta.env.BASE_URL`.
- Detail and watch pages were adjusted for smaller viewports:
  - Hero CTA stacks on mobile.
  - Episode rows become vertical on mobile and horizontal on larger screens.
  - Watch footer uses a compact responsive grid/flex layout.

## Visual Verification Notes

- User explicitly requested: test and screenshot, trust visual output rather than code.
- Playwright was not installed in the project.
- Used Google Chrome headless with Chrome DevTools Protocol instead of simple `--window-size` screenshots.
  - Simple Chrome CLI screenshots produced misleading results: output image was 390px wide, but CSS viewport was not reliably mobile.
  - CDP `Emulation.setDeviceMetricsOverride` was needed for trustworthy mobile/tablet viewport testing.
- Final screenshot output folder:
  - `/Users/ariel/Desktop/anivora-viewport-screenshots`
- Final screenshot set:
  - `mobile-home.png`
  - `mobile-catalog.png`
  - `mobile-detail.png`
  - `tablet-home-portrait.png`
  - `tablet-home-landscape.png`
  - `tablet-detail-landscape.png`
  - `desktop-home.png`
- CDP metrics verified no horizontal overflow:
  - `scrollWidth === innerWidth` for mobile, tablet, and desktop captures.
- Screenshots should be taken from production preview, not Vite dev server, because TanStack Devtools appears in dev and can cover bottom navigation.

## Build/Pnpm Notes

- `pnpm --filter @anivora/web build` is the relevant web build check.
- Pnpm 11 may fail with `[ERR_PNPM_IGNORED_BUILDS]` unless build scripts are approved for:
  - `core-js`
  - `esbuild`
  - `protobufjs`
- `pnpm-workspace.yaml` now has explicit `allowBuilds: true` for those packages so builds can run non-interactively.
- During visual tests, temporary mock RPC and capture scripts were kept in `/private/tmp`, not in the repo.

## 2026-06-25: NekoVPS Deploy Notes

- NekoVPS SSH alias exists locally as `nekovps`.
  - Host: `147.93.159.42`
  - User: `deploy`
  - VPS architecture: `linux/x86_64` / Docker `linux/amd64`.
- Public domain/proxy:
  - `https://anime.mynekomy.site`
  - Caddy proxies to `127.0.0.1:28063`.
- Server deploy folder:
  - `/home/deploy/anivora`
  - It is a source snapshot folder, not a Git working tree.
  - `.env` lives on the VPS and should not be overwritten by local syncs.
- Production compose:
  - `docker-compose.yml` runs `app`, `postgres`, `redis`, and `migrate`.
  - Current app image tag expected by compose: `anivora:latest`.
  - App container publishes `127.0.0.1:28063->3000`.
- User preference after testing: build on the local MacBook first, then upload/load the image on the Linux VPS.
- Full cross-build using the repo `Dockerfile` for `linux/amd64` on Mac/Colima can fail while running pnpm under amd64 emulation:
  - Failure seen: `Assertion failed: errno == EEXIST ... uv__io_poll` / `SIGABRT`.
- Working deploy path:
  1. Build web locally: `pnpm --filter @anivora/web run build`.
  2. Bundle API locally with esbuild API or a known-good local esbuild wrapper:
     - `apps/api/src/main.ts` -> `apps/api/dist/main.mjs`
     - `apps/api/src/migrate.ts` -> `apps/api/dist/migrate.mjs`
     - `apps/api/src/infrastructure/db/seed.ts` -> `apps/api/dist/seed.mjs`
  3. Create production API dependency tree locally:
     - `pnpm deploy --filter=@anivora/api --prod --ignore-scripts --legacy /private/tmp/anivora-runtime/api`
     - This may need network escalation.
  4. Create a runtime image context with:
     - `/api` from the deployed API tree plus `main.mjs`, `migrate.mjs`, `seed.mjs`, and `drizzle/`
     - `/web` from `apps/web/dist`
     - A minimal runtime Dockerfile based on `node:22-alpine`, installing `dumb-init`, `wget`, `libarchive-tools`, and `ffmpeg`, with `WEB_DIST_PATH=/app/web`.
  5. Build/export local image for VPS:
     - `docker buildx build --builder colima --platform linux/amd64 -t anivora:latest --output type=docker,dest=/private/tmp/anivora-latest-linux-amd64.tar /private/tmp/anivora-runtime-image`
  6. Compress and upload:
     - `gzip -f /private/tmp/anivora-latest-linux-amd64.tar`
     - `scp /private/tmp/anivora-latest-linux-amd64.tar.gz nekovps:/tmp/anivora-latest-linux-amd64.tar.gz`
  7. Load and restart on VPS:
     - `ssh nekovps 'gunzip -c /tmp/anivora-latest-linux-amd64.tar.gz | docker load'`
     - `ssh nekovps 'cd ~/anivora && docker compose up -d --no-build --force-recreate app'`
  8. Verify:
     - `docker compose ps` should show `anivora-app-1` healthy.
     - `curl -fsS http://127.0.0.1:28063/healthz` returns `ok`.
     - `curl -I https://anime.mynekomy.site/app/` returns HTTP 200.
- Important cleanup/ops note:
  - An interrupted `ssh nekovps 'docker compose up --build -d'` can keep running on the VPS after local interruption. Check with `ps` and kill stale `docker compose up --build` processes before loading images.
