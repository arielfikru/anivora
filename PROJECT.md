# PROJECT.md

# Local Anime / Fanmade Anime Streaming Platform

## 1. Project Overview

This project is a video streaming platform for:

- Anime fanmade content
- Anime doujin content
- Local anime creators
- Season-based and episode-based video catalogs

The platform should behave like a streaming app, not a normal blog or file listing website.

The main technical decision is to use **Bunny Stream** for video hosting, transcoding, adaptive streaming, CDN delivery, and playback. The MVP must not build a custom FFmpeg, Cloudflare R2, or RunPod transcoding pipeline.

The website/application focuses on:

- Anime catalog
- Season catalog
- Episode catalog
- Video playback
- Admin content management
- Metadata management
- TV / Android TV / tablet optimized user experience

Bunny Stream handles:

- Video upload
- Video transcoding
- Adaptive streaming
- CDN video delivery
- Video storage
- Playback/embed delivery

---

## 2. Primary Product Goal

Build an MVP streaming platform where admins can upload and manage anime/fanmade video content, and users can browse and watch episodes comfortably on TV, Android TV, tablet, desktop, and mobile.

Priority order for user experience:

1. TV / Android TV
2. Tablet
3. Desktop
4. Mobile phone

This is a **TV-first streaming interface**.

---

## 3. Core Assumptions

Initial content estimate:

- 2 seasons
- 24 episodes per season
- 48 total episodes
- Source video quality: 720p
- Average duration: around 24 minutes per episode
- Total duration: around 19.2 hours

The platform must support more content later, but the MVP should be optimized for this initial scale.

---

## 4. Non-Goals for MVP

Do not build these in the MVP unless explicitly requested later:

- Custom FFmpeg transcoding pipeline
- Cloudflare R2 HLS hosting
- RunPod GPU worker
- Manual HLS segment generation
- DRM system
- Native mobile app
- Payment/subscription system
- Recommendation engine
- Comment system
- Complex social features
- Unauthorized scraping or piracy workflows

The MVP should use Bunny Stream for all video infrastructure.

---

## 5. Tech Stack (Kana monorepo standard)

Anivora follows the Kana full-stack TypeScript monorepo convention. Reference: `https://github.com/kana-consultant/saas-boilerplate`.

**Tenancy decision: single-tenant.** One streaming platform, no organizations. Role axis is the single `user.role` (`admin | user`). Org aggregates, `$orgSlug` routes, and `organizationId` scoping are stripped.

| Layer | Tech |
|---|---|
| Monorepo | moon + pnpm workspaces |
| Backend | Hono + oRPC (RPC + OpenAPI), Drizzle ORM, better-auth, ioredis |
| Frontend | React 19 + TanStack Router SPA (file-based) + Vite + Tailwind v4 + shadcn/ui |
| Data fetching | TanStack Query + oRPC client, typed end-to-end via `@anivora/api` types |
| Lint/format | Biome (tabs, double quotes, semicolons as-needed) |
| Test | Vitest |
| Database | PostgreSQL (Drizzle ORM) |
| Cache | Redis (ioredis) — Bunny status polling, catalog cache |
| Video provider | Bunny Stream |

### Workspace layout

```
apps/
  api/    # @anivora/api — Hono backend, hexagonal architecture
  web/    # @anivora/web — TanStack Router SPA
scripts/
  batch-upload/   # Python batch upload tool (PROJECT.md §10.2)
```

**Rule:** `web` imports **types only** from `@anivora/api`. All runtime calls go over HTTP (`/rpc` or `/api`). Never import backend code into the frontend.

### Frontend priorities

Responsive, but design priority is TV and tablet (PROJECT.md §7). TanStack Router with `autoCodeSplitting`.

### Optional Asset Storage

For poster images, banners, and custom thumbnails:

- Bunny Storage (preferred — same provider)
- S3-compatible storage / Cloudflare R2
- Local dev storage for dev only

---

## 6. High-Level Architecture

```txt
Public Client
TV / Android TV / Tablet / Desktop / Mobile
        ↓
@anivora/web (TanStack Router SPA)
        ↓  /rpc (oRPC) + /api (OpenAPI) + /api/auth (better-auth)
@anivora/api (Hono) — hexagonal: presentation → application → domain ← infrastructure
        ↓
PostgreSQL + Redis        Bunny Stream
```

Backend is hexagonal (clean architecture):

- `domain/` — framework-free entities + ports (`anime`, `season`, `episode`, `genre`, `user`, `ports/`). The `BunnyService` and `Cache` interfaces are ports here.
- `application/` — use-cases as `makeX(deps) → (input, ctx) => Result` factories; `buildUseCases(deps)` wires them.
- `infrastructure/` — concrete adapters: Drizzle repositories, better-auth, ioredis, Bunny HTTP client, Zod env.
- `presentation/orpc/` — oRPC procedures, middleware (`publicProcedure`, `protectedProcedure`, `adminProcedure`), error mapping.

Admin upload can happen through two supported workflows:

```txt
Option A: Frontend Admin Upload
Admin Frontend
        ↓
Backend API
        ↓
Bunny Stream
```

```txt
Option B: Python Batch Upload
Python Script
        ↓
Backend API
        ↓
Bunny Stream
```

The backend/database is always the source of truth.

---

## 7. TV / Android TV / Tablet UI/UX Requirements

The frontend must be designed primarily for TV, Android TV, and tablet usage.

Do not design the UI as a normal mobile-first website only. The platform should feel like a streaming app.

### UI/UX Priorities

1. Android TV / TV
2. Tablet
3. Desktop
4. Mobile phone

### TV Requirements

The UI must support:

- D-pad navigation
- Keyboard navigation
- Remote-control friendly navigation
- Visible focus states
- Large focusable cards
- Large buttons
- Readable typography from a distance
- Landscape-first layouts
- Horizontal content rows
- Minimal text input
- Clear selected/focused state
- Back button behavior
- Play/pause behavior when possible

### Tablet Requirements

The UI must support:

- Touch navigation
- Large tap targets
- Swipeable rows where appropriate
- Portrait and landscape layouts
- Readable episode grids
- Comfortable media browsing

### Avoid

Avoid these UI patterns:

- Hover-only interactions
- Tiny buttons
- Dense forms on TV screens
- Carousels that only work with mouse drag
- UI flows that require precise cursor movement
- Small text
- Hidden controls that cannot be reached by keyboard/D-pad

### Focus States

Every interactive item must have clear states:

- default
- focused
- selected
- disabled
- loading

Focused cards should be visually obvious, for example:

- Slight scale-up
- Bright border
- Shadow
- Clear title display

### Recommended Layout Pattern

Homepage:

- Hero/banner featured anime
- Continue watching row, if user accounts/history exist
- Latest episodes row
- Popular anime row
- Genre rows
- Local creator picks

Anime detail page:

- Large banner
- Poster
- Title
- Synopsis
- Season selector
- Episode list
- Main Play button

Watch page:

- Fullscreen-first video player
- Next episode
- Previous episode
- Episode list overlay
- Back to anime detail
- Subtitle/audio selector if added later

---

## 8. Core Data Model

Schema lives in `apps/api/src/infrastructure/db/schema.ts` (Drizzle). Migrations generated into `apps/api/drizzle/` and committed. Dev: `pnpm db:push`. Prod: `pnpm db:generate` → commit SQL → `migrate.ts` runs at deploy. Repositories return domain shapes, never leak Drizzle types. `user` / `session` / `account` tables are owned by better-auth — do not hand-roll auth tables.

The field lists below are the domain shape; map them to Drizzle columns (snake_case) in `schema.ts`.

### Table: `animes`

Fields:

```txt
id
title
slug
description
cover_image_url
banner_image_url
status
content_rating
studio_name
creator_name
release_year
rights_owner_name
license_type
permission_document_url
is_original_content
is_fanmade
requires_attribution
attribution_text
created_at
updated_at
```

Recommended `status` values:

```txt
draft
published
hidden
archived
```

Recommended `content_rating` values:

```txt
general
teen
mature
adult
```

### Table: `seasons`

Fields:

```txt
id
anime_id
season_number
title
description
release_year
status
created_at
updated_at
```

Relationship:

```txt
Anime has many seasons.
Season belongs to anime.
```

### Table: `episodes`

Fields:

```txt
id
anime_id
season_id
episode_number
episode_code
title
slug
description
duration_seconds
thumbnail_url
bunny_video_id
bunny_library_id
playback_url
embed_url
status
published_at
created_at
updated_at
```

Recommended `status` values:

```txt
draft
uploaded
processing
ready
published
failed
hidden
archived
```

Rules:

- Only `ready` or `published` episodes should be publicly playable.
- `processing`, `failed`, `draft`, and `hidden` episodes must not be shown publicly.
- Failed episodes should be visible only to admins.

### Table: `genres`

Fields:

```txt
id
name
slug
created_at
updated_at
```

### Table: `anime_genres`

Fields:

```txt
anime_id
genre_id
```

### Table: `users` (managed by better-auth)

better-auth owns the `user`, `session`, `account`, `verification` tables. Do not define `password_hash` yourself — better-auth handles credentials. Add a `role` column via the better-auth admin plugin.

Single-tenant `role` values:

```txt
admin   # full content management, uploads, publish
user    # public viewer (watch history, favorites)
```

### Optional Table: `watch_history`

Fields:

```txt
id
user_id
episode_id
progress_seconds
completed
last_watched_at
created_at
updated_at
```

### Optional Table: `favorites`

Fields:

```txt
id
user_id
anime_id
created_at
```

---

## 9. Bunny Stream Integration

### Environment Variables

Use server-side environment variables only:

```env
DATABASE_URL=
REDIS_URL=redis://127.0.0.1:6379

BETTER_AUTH_SECRET=        # openssl rand -hex 32
BETTER_AUTH_URL=http://localhost:3000
WEB_ORIGIN=http://localhost:3000
PORT=3001

BUNNY_STREAM_LIBRARY_ID=
BUNNY_STREAM_API_KEY=
BUNNY_STREAM_CDN_HOSTNAME=
BUNNY_STREAM_BASE_URL=https://video.bunnycdn.com

WEBHOOK_SECRET=            # verify Bunny webhook
WEB_DIST_PATH=             # prod single-image: path to built SPA
```

Auth is better-auth (sessions + admin plugin), not hand-rolled JWT. Seed the first admin via `infrastructure/db/seed.ts` (`pnpm db:seed`).

The Bunny Stream API key must never be exposed in frontend code.

Env validated with Zod at startup in `infrastructure/config/env.ts` (`loadEnv()` throws with listed issues). All Bunny vars are server-side only.

### Bunny Service Responsibilities

`BunnyService` is a **port** in `domain/ports/bunny.ts` (interface). The concrete HTTP adapter lives in `infrastructure/bunny/bunny-service.ts` as `createBunnyService(config): BunnyService`. Use-cases receive it via deps — never instantiate or call Bunny directly from a router. Server-side handles:

- Creating a video object
- Uploading a video file
- Fetching video processing status
- Building embed URL
- Building playback URL if needed
- Handling errors and retries

Pseudocode:

```ts
class BunnyStreamService {
  constructor(config) {
    this.libraryId = config.libraryId;
    this.apiKey = config.apiKey;
    this.baseUrl = "https://video.bunnycdn.com";
  }

  async createVideo(title: string) {
    // Create Bunny Stream video object.
    // Return Bunny video ID.
  }

  async uploadVideo(videoId: string, file: Buffer | ReadableStream) {
    // Upload video file to Bunny Stream.
  }

  async getVideo(videoId: string) {
    // Fetch video status/details from Bunny Stream.
  }

  buildEmbedUrl(videoId: string) {
    // Build Bunny embed/player URL from library ID and video ID.
  }

  buildPlaybackUrl(videoId: string) {
    // Build playback URL if custom player is used.
  }
}
```

### Playback Strategy

For MVP, prefer Bunny embed player.

Reason:

- Faster implementation
- Less player complexity
- Good enough for MVP
- Bunny handles adaptive playback

Custom player can be added later using:

- hls.js
- Shaka Player
- Video.js

---

## 10. Upload Strategy

The platform must support two video upload workflows:

1. Upload from frontend admin client
2. Upload from Python batch script

Both workflows must use the backend/database as the source of truth.

### 10.1 Frontend Admin Upload

Use this for manual/small uploads.

Flow:

```txt
Admin login
   ↓
Create anime / season / episode
   ↓
Upload MP4 from browser
   ↓
Backend receives upload
   ↓
Backend uploads video to Bunny Stream
   ↓
Backend saves bunny_video_id
   ↓
Episode status = processing
   ↓
Bunny processing completes
   ↓
Episode status = ready
```

Frontend admin upload must display:

- Upload progress
- File name
- File size
- Upload status
- Processing status
- Error message if failed
- Retry button

Important security rule:

- Do not expose Bunny API key in the frontend.
- Browser uploads must go through backend unless a secure temporary upload flow is implemented later.

### 10.2 Python Batch Upload

Use this for large batch uploads, such as uploading a full season or all 48 episodes.

Flow:

```txt
Local folder contains episode files
   ↓
Python script reads metadata JSON/YAML
   ↓
Script calls backend API to create anime/season/episode records if needed
   ↓
Script uploads video to Bunny Stream or sends file to backend upload endpoint
   ↓
Script attaches bunny_video_id to episode via backend API
   ↓
Backend stores metadata and status
```

Python script should support:

- Metadata JSON or YAML
- Batch episode mapping
- Retry
- Resume where possible
- Progress bar
- Log file
- Dry-run mode
- S01E01, S01E02 naming
- Failure reporting

Example metadata file:

```json
{
  "anime": {
    "title": "Example Anime",
    "slug": "example-anime",
    "description": "Example description"
  },
  "season": {
    "seasonNumber": 1,
    "title": "Season 1"
  },
  "episodes": [
    {
      "episodeNumber": 1,
      "episodeCode": "S01E01",
      "title": "Episode 1",
      "filename": "E01.mp4"
    },
    {
      "episodeNumber": 2,
      "episodeCode": "S01E02",
      "title": "Episode 2",
      "filename": "E02.mp4"
    }
  ]
}
```

---

## 11. API Design

Primary transport is **oRPC** (`/rpc`), typed end-to-end. oRPC also exposes an OpenAPI surface at `/api` (with `SmartCoercionPlugin` + `OpenAPIReferencePlugin` docs) — the Python batch script (§10.2) consumes that REST surface. The HTTP routes below describe the OpenAPI shape; each maps to an oRPC procedure.

Procedure layout (`presentation/routers/`):

- `health`, `me`
- `catalog` — public: `listAnime`, `getAnime`, `getEpisode`, `listGenre`, `search` (`publicProcedure`)
- `admin` — spreads `{ ...anime, ...season, ...episode, ...upload }` (`adminProcedure`)
- `webhooks` — Bunny status callback (secret-verified, outside `/rpc`)

Rules:
- All inputs validated with Zod in `presentation/orpc/schemas.ts`.
- Public procedures filter to `status in (ready, published)` only.
- `adminProcedure` = `protectedProcedure` + `requireRole("admin")`. Authorization enforced both in route `beforeLoad` (UX) and on the procedure (authoritative).
- Audit admin mutations via `activityRepo.insert` inside the use-case.

Client usage: `useQuery(orpc.catalog.listAnime.queryOptions())`, `useMutation(orpc.admin.uploadEpisode.mutationOptions())`.

### Public API (OpenAPI shape)

#### Get anime list

```http
GET /api/anime
```

Response:

```json
{
  "items": [
    {
      "id": 1,
      "title": "Example Anime",
      "slug": "example-anime",
      "coverImageUrl": "https://example.com/cover.jpg",
      "status": "published"
    }
  ]
}
```

#### Get anime detail

```http
GET /api/anime/:slug
```

Response:

```json
{
  "id": 1,
  "title": "Example Anime",
  "slug": "example-anime",
  "description": "Example description",
  "seasons": [
    {
      "id": 1,
      "seasonNumber": 1,
      "title": "Season 1"
    }
  ]
}
```

#### Get episode detail

```http
GET /api/episodes/:slug
```

Response:

```json
{
  "id": 1,
  "title": "Episode 1",
  "episodeNumber": 1,
  "episodeCode": "S01E01",
  "status": "ready",
  "bunnyVideoId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "embedUrl": "https://example.com/embed",
  "playbackUrl": "https://example.com/playback"
}
```

### Admin API

#### Create anime

```http
POST /api/admin/anime
```

Body:

```json
{
  "title": "Example Anime",
  "description": "Example description",
  "releaseYear": 2026,
  "status": "draft"
}
```

#### Create season

```http
POST /api/admin/seasons
```

Body:

```json
{
  "animeId": 1,
  "seasonNumber": 1,
  "title": "Season 1"
}
```

#### Create episode metadata

```http
POST /api/admin/episodes
```

Body:

```json
{
  "animeId": 1,
  "seasonId": 1,
  "episodeNumber": 1,
  "episodeCode": "S01E01",
  "title": "Episode 1",
  "description": "Example episode description"
}
```

#### Upload video from frontend admin

```http
POST /api/admin/episodes/:id/upload
```

Input:

```txt
multipart/form-data
file: video.mp4
```

Backend behavior:

```txt
1. Validate admin auth.
2. Validate file type.
3. Validate file size.
4. Create Bunny Stream video object.
5. Upload file to Bunny Stream.
6. Save bunny_video_id.
7. Set episode status = processing.
8. Return episode update.
```

#### Attach Bunny video from Python script

```http
POST /api/admin/episodes/:id/attach-bunny-video
```

Body:

```json
{
  "bunnyVideoId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "bunnyLibraryId": "123456",
  "status": "processing"
}
```

#### Batch import metadata

```http
POST /api/admin/batch-import
```

Purpose:

- Create anime
- Create season
- Create episodes
- Return created IDs for use by Python script

#### Bunny webhook

```http
POST /api/webhooks/bunny
```

Purpose:

- Receive Bunny processing status updates
- Update episode status to `ready` or `failed`

If webhook is not implemented in MVP, implement polling:

```txt
Scheduled job checks Bunny video status every few minutes and updates episode status.
```

---

## 12. Website Routes

TanStack Router, file-based, `autoCodeSplitting: true`. Layout = `.tsx` file + sibling folder pair. Single-tenant: no `$orgSlug` layer. Underscore folders (`_apis`, `_components`, `_hooks`) are router-invisible; scope by placement. Features start as single files, promote to folders when they grow.

```
src/routes/
  __root.tsx                       # router context { queryClient, session }; beforeLoad fetches session
  index.tsx                        # homepage (hero, rows)
  _public.tsx / _public/           # public layout (guard: none) + children
    anime.tsx                      # /anime catalog
    anime.$slug.tsx                # /anime/:slug detail (season selector + episode list)
    anime.$slug.season.$num.tsx    # /anime/:slug/season/:num
    watch.$episodeSlug.tsx         # /watch/:episodeSlug — Bunny embed player
    genres.$slug.tsx               # /genres/:slug
    search.tsx                     # /search
  _authenticated.tsx / _authenticated/   # redirects to /auth/login when session null
    admin/                         # beforeLoad role gate: requireRole("admin")
      index.tsx                    # dashboard
      anime.tsx                    # manage + create/edit anime
      seasons.tsx                  # manage seasons
      episodes.tsx                 # manage + create episodes
      uploads.tsx                  # upload/manage Bunny video, processing/failed states
      settings.tsx
      _components/                 # admin-shared UI (data tables, forms)
```

Public pages render only `ready`/`published` episodes. Admin pages gated in `beforeLoad` (UX) and by `adminProcedure` on the server (authoritative).

---

## 13. Episode Status Lifecycle

Recommended lifecycle:

```txt
draft
  ↓
uploaded
  ↓
processing
  ↓
ready
  ↓
published
```

Failure states:

```txt
failed
hidden
archived
```

Rules:

- Public pages only show episodes that are `ready` or `published`.
- If using a separate `published` state, then public pages should only show `published`.
- Admin can preview `ready` episodes before publishing.
- Failed videos must show clear error state in admin.

---

## 14. Security Requirements

### Admin Security

- Auth via better-auth (cookie sessions, credentials = `include`); no custom JWT.
- Admin login is required.
- Upload endpoints must be protected.
- Bunny Stream API key must never be exposed to frontend code.
- Use server-side environment variables.
- Validate file type.
- Validate file size.
- Add rate limits to admin upload endpoints if public internet accessible.

### Video Security

MVP recommendation:

- Use Bunny Stream allowed domain / referer restrictions where appropriate.
- Do not expose Bunny API keys.
- Do not expose original files unless intentionally enabled.
- Use private/admin-only upload.

### API Security

- Gate all admin procedures with `adminProcedure` (server-authoritative) AND route `beforeLoad` (UX).
- better-auth handles CSRF + cookie security for the session.
- Validate all inputs.
- Sanitize text fields.
- Protect webhook endpoint with secret verification if possible.

---

## 15. Legal and Content Compliance

This platform is for anime fanmade, doujin, and local creator content. It must not be designed around piracy or unauthorized re-hosting.

The system should assume content is:

- Original
- Licensed
- Uploaded with permission
- Authorized by the creator or rights holder

Required compliance features:

- Creator/rights owner tracking
- License type field
- Permission document URL field
- Attribution support
- Content rating
- Age gate for mature/adult content
- Report content button
- Takedown request flow
- Terms of service
- Privacy policy

Important instruction:

```txt
Do not design the platform around piracy.
Do not implement scraping.
Do not implement unauthorized re-hosting.
Do not build tools to bypass DRM or access restrictions.
```

---

## 16. Naming Conventions

### Anime Slug

```txt
anime-title
```

### Episode Slug

```txt
anime-title-s01e01
anime-title-s01e02
anime-title-s02e01
```

### Episode Code

```txt
S01E01
S01E02
S02E01
```

### Display Title

```txt
Anime Title - S01E01 - Episode Title
```

---

## 17. MVP Build Order

### Phase 0: Monorepo Scaffold

1. Scaffold from `kana-consultant/saas-boilerplate`, single-tenant (strip org/member/role aggregates, `$orgSlug` routes, `organizationId` FKs per skill §0).
2. moon + pnpm workspace; `apps/api` (Hono/oRPC/Drizzle/better-auth), `apps/web` (TanStack Router SPA).
3. Zod env, Biome, Vitest, Postgres + Redis via `docker-compose.dev.yml`.

### Phase 1: Core Catalog

1. Define `domain/{anime,season,episode,genre}` entities + repo interfaces
2. Drizzle schema + `pnpm db:push`
3. Create anime model/table
4. Create season model/table
5. Create episode model/table
6. Build public anime listing
7. Build anime detail page
8. Build episode page without video first

### Phase 2: Bunny Integration

1. Add Bunny environment config
2. Implement Bunny Stream server-side service
3. Implement video create/upload flow
4. Save `bunny_video_id`
5. Save embed/playback URL
6. Add processing/ready status
7. Add webhook endpoint or polling job
8. Render Bunny embed player on watch page

### Phase 3: Admin Panel

1. Admin login/auth
2. Create/edit anime
3. Create/edit season
4. Create/edit episode
5. Upload video from admin frontend
6. Attach Bunny video ID from script
7. Publish/unpublish episode
8. Show processing and failed states

### Phase 4: Python Batch Script

1. Read metadata JSON/YAML
2. Create anime/season/episode records through backend API
3. Upload videos or attach Bunny video IDs
4. Support retry/logging/dry-run
5. Support batch season upload

### Phase 5: TV/Tablet UX Polish

1. Implement focus management
2. Improve D-pad navigation
3. Add large horizontal rows
4. Add large poster cards
5. Add watch page remote-friendly controls
6. Test on Android TV browser/app shell if available
7. Test on tablet portrait and landscape

### Phase 6: Product Polish

1. Search
2. Genre filter
3. Continue watching
4. Favorites/bookmarks
5. Related anime
6. SEO metadata
7. Sitemap
8. Analytics

---

## 18. Acceptance Criteria

The MVP is considered complete when:

1. Admin can log in.
2. Admin can create anime.
3. Admin can create seasons.
4. Admin can create episodes.
5. Admin can upload MP4 video to Bunny Stream from frontend admin.
6. Python batch script can register/attach uploaded Bunny videos through backend API.
7. Backend stores Bunny video ID.
8. Episode status can change from processing to ready/published.
9. Public user can open anime listing page.
10. Public user can open anime detail page.
11. Public user can select season and episode.
12. Public user can play video using Bunny embed player.
13. Bunny API key is never exposed to frontend.
14. TV/Android TV navigation has visible focus states.
15. Tablet layout is touch-friendly.
16. Only authorized/published content is visible publicly.

---

## 19. AI Agent Instruction Summary

Use this as the core instruction when implementing the project:

```txt
You are building an MVP anime/fanmade video streaming website.

The platform uses Bunny Stream for video hosting, transcoding, adaptive streaming, CDN delivery, and playback. Do not build a custom FFmpeg, Cloudflare R2, or RunPod transcoding pipeline for the MVP.

Use the Kana full-stack TypeScript monorepo (moon + pnpm): apps/api (Hono + oRPC + Drizzle + better-auth, hexagonal architecture) and apps/web (React 19 + TanStack Router SPA + Tailwind v4 + shadcn/ui). Single-tenant — no organizations, role axis is user.role (admin | user). web imports types only from @anivora/api; all runtime calls go over /rpc or /api.

The website should focus on catalog, anime details, seasons, episodes, admin content management, and video playback.

The frontend must be designed primarily for TV, Android TV, and tablet usage. Do not design the UI as a normal mobile-first web app only. The core experience should feel like a streaming app.

UI/UX priorities:
1. Android TV / TV
2. Tablet
3. Desktop
4. Mobile phone

The UI must support:
- D-pad navigation
- keyboard navigation
- visible focus states
- large clickable/focusable cards
- readable typography from a distance
- landscape-first layouts
- horizontal content rows
- touch support for tablets

Avoid:
- hover-only interactions
- tiny buttons
- dense forms on TV
- carousel components that only work with mouse drag
- UI flows that require precise cursor movement

Core entities:
- Anime
- Season
- Episode
- Genre
- User/Admin

Each episode must store:
- title
- slug
- anime_id
- season_id
- episode_number
- episode_code
- bunny_video_id
- bunny_library_id
- embed_url or playback_url
- status

Only episodes with status ready or published should be publicly playable.

Video upload must support two workflows:
1. Upload from frontend admin client
2. Upload from Python batch script

Both workflows must use the backend/database as the source of truth.

Frontend admin upload should be used for manual/small uploads.
Python script upload should be used for batch uploads, such as uploading full seasons.

Never expose Bunny Stream API keys in frontend code.
If uploading from the browser, route the upload through the backend or use a secure temporary upload mechanism.
The Bunny video ID must be stored in the episode record.

For MVP, prefer Bunny embed player over custom HLS player.

Add legal/content compliance fields because the platform is for anime fanmade/doujin/local creator content. Assume content must be original, licensed, or uploaded with permission.

Do not design for piracy.
Do not implement scraping.
Do not implement unauthorized re-hosting.
```

---

## 20. Final Recommendation

Final recommended architecture:

```txt
Monorepo: moon + pnpm (apps/api, apps/web)
Backend: Hono + oRPC + Drizzle + better-auth (hexagonal, single-tenant)
Frontend: React 19 + TanStack Router SPA + Vite + Tailwind v4 + shadcn/ui
Database: PostgreSQL (Drizzle) + Redis (ioredis)
Video infrastructure: Bunny Stream (port + adapter)
Upload: Admin frontend (oRPC) and Python batch script (OpenAPI surface)
Playback: Bunny embed player for MVP
Lint/test: Biome + Vitest
UI priority: TV / Android TV / Tablet
Deploy: single-image (Hono serves SPA via WEB_DIST_PATH)
Custom transcoding / R2 / RunPod: Future options only
```

The project should prioritize speed of delivery, simple operations, and a great TV-first viewing experience.
