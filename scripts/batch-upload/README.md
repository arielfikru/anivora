# Anivora Batch Upload Tool

Python script for bulk-registering anime, seasons and episodes and uploading
their video files to Anivora — e.g. a full season or all 48 episodes at once
(PROJECT.md §10.2).

## How it works

1. Signs in as an admin via better-auth (`POST /api/auth/sign-in/email`),
   keeping the session cookie.
2. For the anime in the metadata file, creates the anime → seasons → episodes
   records **if they don't already exist** (matched by anime title, season
   number and episode number, so re-runs are safe).
3. Uploads each episode's local video file to the backend upload endpoint
   (`POST /api/admin/episodes/<id>/upload`). The backend forwards it to Bunny
   Stream and attaches the video id — the Bunny API key never leaves the
   server.

Episodes already in `uploaded` / `processing` / `ready` / `published` state are
skipped, so interrupted runs can be resumed.

## Install

```bash
cd scripts/batch-upload
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

## Usage

```bash
python batch_upload.py \
  --api-url http://localhost:8787 \
  --email admin@example.com \
  --password 'your-password' \
  --metadata ./example.yaml

# Preview only (no writes / uploads):
python batch_upload.py ... --dry-run
```

## Metadata

YAML (or JSON) — see [`example.yaml`](./example.yaml). File paths are resolved
relative to the metadata file's directory. Supported fields mirror the admin
API create payloads:

- **anime**: `title` (required), `description`, `status`, `contentRating`,
  `studioName`, `creatorName`, `releaseYear`, `isFanmade`, `isOriginalContent`,
  `coverImageUrl`, `bannerImageUrl`, …
- **seasons[]**: `seasonNumber` (required), `title`, `description`,
  `releaseYear`, `status`, `autoPublish`
- **seasons[].episodes[]**: `episodeNumber` (required), `title`, `description`,
  `durationSeconds`, `thumbnailUrl`, `file` (local video path)

## Notes

- Large files stream through the backend (limit 2 GB per file).
- The slug is generated server-side from the title; don't set it here.
- Genres are not attached by this script (no admin attach endpoint yet).
