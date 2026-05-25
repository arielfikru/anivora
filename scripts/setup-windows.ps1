#Requires -Version 5.1
<#
.SYNOPSIS
    Bootstrap the SaaS Boilerplate dev environment on Windows.

.DESCRIPTION
    Windows equivalent of the Nix devenv setup on Mac/Linux.
    Starts PostgreSQL + Redis via Docker, creates .env.local,
    installs dependencies, and pushes the DB schema.

    Safe to re-run — all steps are idempotent.

.EXAMPLE
    .\scripts\setup-windows.ps1
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Push-Location $ProjectRoot

try {
    # ── colours ──────────────────────────────────────────────────────────
    function Write-Step  { param([string]$Msg) Write-Host "  [*] $Msg" -ForegroundColor Cyan }
    function Write-Ok    { param([string]$Msg) Write-Host "  [+] $Msg" -ForegroundColor Green }
    function Write-Warn  { param([string]$Msg) Write-Host "  [!] $Msg" -ForegroundColor Yellow }
    function Write-Err   { param([string]$Msg) Write-Host "  [-] $Msg" -ForegroundColor Red }

    # ── prerequisite checks ──────────────────────────────────────────────
    Write-Host ""
    Write-Host "  Checking prerequisites..." -ForegroundColor White
    Write-Host ""

    $missing = @()

    # Node.js 22+
    if (Get-Command node -ErrorAction SilentlyContinue) {
        $nodeVer = (node --version) -replace '^v', ''
        $nodeMajor = [int]($nodeVer.Split('.')[0])
        if ($nodeMajor -lt 22) {
            Write-Err "Node.js v$nodeVer found — v22+ required"
            $missing += "Node.js 22+ (https://nodejs.org/)"
        } else {
            Write-Ok "Node.js v$nodeVer"
        }
    } else {
        Write-Err "Node.js not found"
        $missing += "Node.js 22+ (https://nodejs.org/)"
    }

    # pnpm
    if (Get-Command pnpm -ErrorAction SilentlyContinue) {
        $pnpmVer = pnpm --version
        Write-Ok "pnpm v$pnpmVer"
    } else {
        Write-Warn "pnpm not found — will enable via corepack"
    }

    # Docker
    if (Get-Command docker -ErrorAction SilentlyContinue) {
        $dockerInfo = docker info 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Err "Docker is installed but not running"
            $missing += "Docker Desktop must be running (https://www.docker.com/products/docker-desktop/)"
        } else {
            Write-Ok "Docker is running"
        }
    } else {
        Write-Err "Docker not found"
        $missing += "Docker Desktop (https://www.docker.com/products/docker-desktop/)"
    }

    # docker compose
    $composeAvailable = $false
    if (Get-Command docker -ErrorAction SilentlyContinue) {
        docker compose version 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            $composeAvailable = $true
            Write-Ok "Docker Compose available"
        }
    }
    if (-not $composeAvailable) {
        Write-Err "Docker Compose not found"
        $missing += "Docker Compose (included with Docker Desktop)"
    }

    if ($missing.Count -gt 0) {
        Write-Host ""
        Write-Err "Missing prerequisites:"
        foreach ($m in $missing) {
            Write-Host "      - $m" -ForegroundColor Red
        }
        Write-Host ""
        exit 1
    }

    Write-Host ""

    # ── start docker services ────────────────────────────────────────────
    Write-Step "Starting PostgreSQL + Redis via Docker..."

    docker compose -f docker-compose.dev.yml up -d 2>&1 | Out-Null

    # Wait for healthy status
    $timeout = 30
    $elapsed = 0
    $healthy = $false

    while ($elapsed -lt $timeout) {
        $pgHealth = docker compose -f docker-compose.dev.yml ps postgres --format json 2>$null | ConvertFrom-Json
        $rdHealth = docker compose -f docker-compose.dev.yml ps redis --format json 2>$null | ConvertFrom-Json

        $pgReady = if ($pgHealth) { $pgHealth.Health -eq "healthy" } else { $false }
        $rdReady = if ($rdHealth) { $rdHealth.Health -eq "healthy" } else { $false }

        if ($pgReady -and $rdReady) {
            $healthy = $true
            break
        }

        Start-Sleep -Seconds 2
        $elapsed += 2
    }

    if ($healthy) {
        Write-Ok "PostgreSQL (127.0.0.1:5432) and Redis (127.0.0.1:6379) are healthy"
    } else {
        Write-Warn "Services started but health check timed out after ${timeout}s — they may still be initializing"
    }

    # ── create .env.local ────────────────────────────────────────────────
    if (-not (Test-Path ".env.local")) {
        Write-Step "Creating .env.local..."

        $secret = node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

        $envContent = @"
DATABASE_URL=postgresql://tanstack:tanstack@127.0.0.1:5432/tanstack_start_dev
REDIS_URL=redis://127.0.0.1:6379
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=$secret
WEB_ORIGIN=http://localhost:3000
"@
        Set-Content -Path ".env.local" -Value $envContent -Encoding UTF8
        Write-Ok ".env.local created with auto-generated BETTER_AUTH_SECRET"
    } else {
        Write-Ok ".env.local already exists — skipping"
    }

    # ── enable corepack + install deps ───────────────────────────────────
    if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
        Write-Step "Enabling pnpm via corepack..."
        corepack enable pnpm
    }

    Write-Step "Installing dependencies..."
    pnpm install

    # ── push DB schema ───────────────────────────────────────────────────
    Write-Step "Pushing database schema..."
    pnpm db:push

    # ── welcome banner ───────────────────────────────────────────────────
    $nodeVer   = node --version
    $pnpmVer   = pnpm --version
    $gitBranch = git rev-parse --abbrev-ref HEAD 2>$null
    if (-not $gitBranch) { $gitBranch = "n/a" }
    $pkgVer    = node -p "require('./package.json').version" 2>$null
    if (-not $pkgVer) { $pkgVer = "n/a" }

    Write-Host ""
    Write-Host "  ============================================================" -ForegroundColor Cyan
    Write-Host "           SaaS Boilerplate  --  Dev Environment Ready        " -ForegroundColor Cyan
    Write-Host "  ============================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   Project version   " -NoNewline -ForegroundColor White; Write-Host "v$pkgVer" -ForegroundColor Green
    Write-Host "   Git branch        " -NoNewline -ForegroundColor White; Write-Host "$gitBranch" -ForegroundColor Green
    Write-Host "   Node.js           " -NoNewline -ForegroundColor White; Write-Host "$nodeVer" -ForegroundColor Green
    Write-Host "   pnpm              " -NoNewline -ForegroundColor White; Write-Host "v$pnpmVer" -ForegroundColor Green
    Write-Host "   PostgreSQL        " -NoNewline -ForegroundColor White; Write-Host "127.0.0.1:5432 (Docker)" -ForegroundColor Green
    Write-Host "   Redis             " -NoNewline -ForegroundColor White; Write-Host "127.0.0.1:6379 (Docker)" -ForegroundColor Green
    Write-Host ""
    Write-Host "   Commands:" -ForegroundColor White
    Write-Host "     pnpm dev            " -NoNewline -ForegroundColor White; Write-Host "start web + api via moon" -ForegroundColor DarkGray
    Write-Host "     pnpm dev:web        " -NoNewline -ForegroundColor White; Write-Host "web only (port 3000)" -ForegroundColor DarkGray
    Write-Host "     pnpm dev:api        " -NoNewline -ForegroundColor White; Write-Host "api only (port 3001)" -ForegroundColor DarkGray
    Write-Host "     pnpm build          " -NoNewline -ForegroundColor White; Write-Host "production build (all apps)" -ForegroundColor DarkGray
    Write-Host "     pnpm test           " -NoNewline -ForegroundColor White; Write-Host "run test suite" -ForegroundColor DarkGray
    Write-Host "     pnpm lint           " -NoNewline -ForegroundColor White; Write-Host "lint with Biome" -ForegroundColor DarkGray
    Write-Host "     pnpm check          " -NoNewline -ForegroundColor White; Write-Host "format + lint check" -ForegroundColor DarkGray
    Write-Host "     pnpm db:migrate     " -NoNewline -ForegroundColor White; Write-Host "run DB migrations" -ForegroundColor DarkGray
    Write-Host "     pnpm db:studio      " -NoNewline -ForegroundColor White; Write-Host "open Drizzle Studio" -ForegroundColor DarkGray
    Write-Host "     pnpm db:seed        " -NoNewline -ForegroundColor White; Write-Host "seed the database" -ForegroundColor DarkGray
    Write-Host "     pnpm storybook      " -NoNewline -ForegroundColor White; Write-Host "launch Storybook (port 6006)" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "   Stop services:    " -NoNewline -ForegroundColor White; Write-Host "pnpm dev:services:stop" -ForegroundColor Yellow
    Write-Host ""

} finally {
    Pop-Location
}
