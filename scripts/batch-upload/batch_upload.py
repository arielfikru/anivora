#!/usr/bin/env python3
"""Anivora batch upload tool (PROJECT.md §10.2).

Reads a metadata file describing one anime, its seasons and episodes (with
local video files), then talks to the Anivora backend API to:

  1. sign in as an admin (better-auth, cookie session),
  2. create the anime / season / episode records if they don't exist yet,
  3. upload each episode's video file to the backend upload endpoint
     (which forwards it to Bunny Stream and attaches the video id).

The backend upload endpoint (POST /api/admin/episodes/<id>/upload) is used
rather than a direct Bunny TUS upload, so the Bunny API key never leaves the
server (see PROJECT.md §10.1 security rule).

Usage:
    python batch_upload.py \
        --api-url http://localhost:8787 \
        --email admin@example.com \
        --password '...' \
        --metadata ./example.yaml

    # Preview without creating/uploading anything:
    python batch_upload.py ... --dry-run

Metadata format: see example.yaml.
"""

from __future__ import annotations

import argparse
import mimetypes
import sys
from pathlib import Path
from typing import Any

try:
    import requests
except ImportError:  # pragma: no cover
    sys.exit("Missing dependency 'requests'. Run: pip install -r requirements.txt")

try:
    import yaml
except ImportError:  # pragma: no cover
    sys.exit("Missing dependency 'PyYAML'. Run: pip install -r requirements.txt")


# Episode statuses that mean the video is already present — skip re-upload.
UPLOADED_STATUSES = {"uploaded", "processing", "ready", "published"}

# Fields copied straight through to the createAnime payload when present.
ANIME_FIELDS = [
    "title",
    "description",
    "coverImageUrl",
    "bannerImageUrl",
    "status",
    "contentRating",
    "studioName",
    "creatorName",
    "releaseYear",
    "rightsOwnerName",
    "licenseType",
    "permissionDocumentUrl",
    "isOriginalContent",
    "isFanmade",
    "requiresAttribution",
    "attributionText",
]
SEASON_FIELDS = ["seasonNumber", "title", "description", "releaseYear", "status", "autoPublish"]
EPISODE_FIELDS = ["episodeNumber", "title", "description", "durationSeconds", "thumbnailUrl"]


class ApiError(RuntimeError):
    pass


class AnivoraClient:
    """Thin wrapper over the Anivora OpenAPI + better-auth endpoints."""

    def __init__(self, api_url: str, dry_run: bool = False) -> None:
        self.base = api_url.rstrip("/")
        self.dry_run = dry_run
        self.session = requests.Session()

    # -- transport -------------------------------------------------------
    def _post(self, path: str, payload: dict[str, Any]) -> Any:
        res = self.session.post(f"{self.base}{path}", json=payload, timeout=60)
        if not res.ok:
            raise ApiError(f"POST {path} -> {res.status_code}: {res.text}")
        return res.json() if res.content else None

    def _try_list(self, path: str, payload: dict[str, Any]) -> list[dict[str, Any]]:
        """No-input/list procedures may be exposed as GET or POST; try both."""
        for method in (self.session.get, self.session.post):
            try:
                res = method(f"{self.base}{path}", json=payload, timeout=60)
            except requests.RequestException:
                continue
            if res.ok and res.content:
                data = res.json()
                return _as_list(data)
        return []

    # -- auth ------------------------------------------------------------
    def login(self, email: str, password: str) -> None:
        res = self.session.post(
            f"{self.base}/api/auth/sign-in/email",
            json={"email": email, "password": password},
            timeout=60,
        )
        if not res.ok:
            raise ApiError(f"Login failed ({res.status_code}): {res.text}")

    # -- find-or-create --------------------------------------------------
    def find_or_create_anime(self, spec: dict[str, Any]) -> str:
        title = spec["title"]
        for anime in self._try_list("/api/admin/listAllAnime", {}):
            if anime.get("title") == title:
                print(f"  anime exists: {title} ({anime['id']})")
                return anime["id"]
        payload = _pick(spec, ANIME_FIELDS)
        if self.dry_run:
            print(f"  [dry-run] would create anime: {title}")
            return "dry-run-anime-id"
        created = _extract(self._post("/api/admin/createAnime", payload), "anime")
        print(f"  created anime: {title} ({created['id']})")
        return created["id"]

    def find_or_create_season(self, anime_id: str, spec: dict[str, Any]) -> str:
        number = spec["seasonNumber"]
        for season in self._try_list("/api/admin/listSeasons", {"animeId": anime_id}):
            if season.get("seasonNumber") == number:
                print(f"    season exists: #{number} ({season['id']})")
                return season["id"]
        payload = {"animeId": anime_id, **_pick(spec, SEASON_FIELDS)}
        if self.dry_run:
            print(f"    [dry-run] would create season #{number}")
            return "dry-run-season-id"
        created = _extract(self._post("/api/admin/createSeason", payload), "season")
        print(f"    created season: #{number} ({created['id']})")
        return created["id"]

    def find_or_create_episode(
        self, season_id: str, spec: dict[str, Any]
    ) -> dict[str, Any]:
        number = spec["episodeNumber"]
        for ep in self._try_list("/api/admin/listEpisodes", {"seasonId": season_id}):
            if ep.get("episodeNumber") == number:
                print(f"      episode exists: #{number} ({ep['id']}, {ep.get('status')})")
                return ep
        payload = {"seasonId": season_id, **_pick(spec, EPISODE_FIELDS)}
        if self.dry_run:
            print(f"      [dry-run] would create episode #{number}")
            return {"id": "dry-run-episode-id", "status": "draft"}
        created = _extract(self._post("/api/admin/createEpisode", payload), "episode")
        print(f"      created episode: #{number} ({created['id']})")
        return created

    # -- upload ----------------------------------------------------------
    def upload_video(self, episode_id: str, file_path: Path) -> None:
        if self.dry_run:
            print(f"      [dry-run] would upload {file_path.name}")
            return
        mime = mimetypes.guess_type(file_path.name)[0] or "video/mp4"
        with file_path.open("rb") as fh:
            res = self.session.post(
                f"{self.base}/api/admin/episodes/{episode_id}/upload",
                files={"file": (file_path.name, fh, mime)},
                timeout=60 * 60,
            )
        if not res.ok:
            raise ApiError(f"Upload failed ({res.status_code}): {res.text}")
        print(f"      uploaded {file_path.name}")


def _as_list(data: Any) -> list[dict[str, Any]]:
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        for value in data.values():
            if isinstance(value, list):
                return value
    return []


def _extract(data: Any, key: str) -> dict[str, Any]:
    """Procedures return either the entity directly or wrapped as {key: ...}."""
    if isinstance(data, dict) and key in data and isinstance(data[key], dict):
        return data[key]
    if isinstance(data, dict):
        return data
    raise ApiError(f"Unexpected response: {data!r}")


def _pick(spec: dict[str, Any], fields: list[str]) -> dict[str, Any]:
    return {k: spec[k] for k in fields if k in spec and spec[k] is not None}


def process(client: AnivoraClient, metadata: dict[str, Any], base_dir: Path) -> None:
    anime_spec = metadata["anime"]
    print(f"Anime: {anime_spec['title']}")
    anime_id = client.find_or_create_anime(anime_spec)

    for season_spec in metadata.get("seasons", []):
        season_id = client.find_or_create_season(anime_id, season_spec)
        for ep_spec in season_spec.get("episodes", []):
            episode = client.find_or_create_episode(season_id, ep_spec)
            file_ref = ep_spec.get("file")
            if not file_ref:
                continue
            if episode.get("status") in UPLOADED_STATUSES:
                print(f"      skip upload (status={episode.get('status')})")
                continue
            file_path = (base_dir / file_ref).resolve()
            if not file_path.is_file():
                print(f"      WARNING: file not found: {file_path}", file=sys.stderr)
                continue
            client.upload_video(episode["id"], file_path)


def main() -> int:
    parser = argparse.ArgumentParser(description="Anivora batch upload tool")
    parser.add_argument("--api-url", required=True, help="Backend base URL")
    parser.add_argument("--email", required=True, help="Admin email")
    parser.add_argument("--password", required=True, help="Admin password")
    parser.add_argument("--metadata", required=True, help="Path to YAML/JSON metadata")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print actions without creating or uploading anything",
    )
    args = parser.parse_args()

    metadata_path = Path(args.metadata).resolve()
    if not metadata_path.is_file():
        print(f"Metadata file not found: {metadata_path}", file=sys.stderr)
        return 1
    with metadata_path.open("r", encoding="utf-8") as fh:
        # yaml.safe_load also parses JSON.
        metadata = yaml.safe_load(fh)

    client = AnivoraClient(args.api_url, dry_run=args.dry_run)
    try:
        client.login(args.email, args.password)
        print("Signed in as admin." if not args.dry_run else "Signed in (dry-run).")
        process(client, metadata, metadata_path.parent)
    except ApiError as err:
        print(f"ERROR: {err}", file=sys.stderr)
        return 1
    print("Done.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
