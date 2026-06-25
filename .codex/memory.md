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
