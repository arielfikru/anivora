{ pkgs, lib, config, inputs, ... }:

{
  packages = with pkgs; [
    nodejs_22
    corepack_22
  ];

  languages.javascript = {
    enable = true;
    package = pkgs.nodejs_22;
    corepack.enable = true;
  };

  services.redis = {
    enable = true;
    port = 6379;
  };

  services.postgres = {
    enable = true;
    package = pkgs.postgresql_16;
    port = 5432;
    listen_addresses = "127.0.0.1";
    initialDatabases = [{ name = "tanstack_start_dev"; }];
    initialScript = ''
      CREATE USER tanstack WITH PASSWORD 'tanstack' CREATEDB;
      GRANT ALL PRIVILEGES ON DATABASE tanstack_start_dev TO tanstack;
      ALTER DATABASE tanstack_start_dev OWNER TO tanstack;
    '';
  };

  env.DATABASE_URL = "postgresql://tanstack:tanstack@127.0.0.1:5432/tanstack_start_dev";
  env.REDIS_URL = "redis://127.0.0.1:6379";
  env.BETTER_AUTH_URL = "http://localhost:3000";

  processes = {
    dev.exec = "pnpm dev";
  };

  enterShell = ''
    # ── collect stats ────────────────────────────────────────────────
    _node_ver=$(node --version 2>/dev/null || echo "n/a")
    _pnpm_ver=$(pnpm --version 2>/dev/null | sed 's/^/v/' || echo "n/a")
    _pg_ver=$(psql --version 2>/dev/null | awk '{print $NF}' | sed 's/^/v/' || echo "n/a")
    _git_branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "n/a")
    _pkg_ver=$(node -p "require('./package.json').version" 2>/dev/null || echo "n/a")

    # ── welcome banner (all to stderr so direnv eval doesn't swallow it) ──
    {
      printf '\033[1;36m'
      printf '╔══════════════════════════════════════════════════════╗\n'
      printf '║          ⚡  SaaS Boilerplate  — Dev Shell  ⚡       ║\n'
      printf '╚══════════════════════════════════════════════════════╝\n'
      printf '\033[0m'

      printf '\n\033[1;33m  Welcome back! Environment is ready.\033[0m\n\n'

      printf '\033[1;34m  ┌─ Stats ──────────────────────────────────────────┐\033[0m\n'
      printf '\033[1;34m  │\033[0m  %-18s \033[0;32m%-30s\033[1;34m │\033[0m\n' "Project version" "v$_pkg_ver"
      printf '\033[1;34m  │\033[0m  %-18s \033[0;32m%-30s\033[1;34m │\033[0m\n' "Git branch"      "$_git_branch"
      printf '\033[1;34m  │\033[0m  %-18s \033[0;32m%-30s\033[1;34m │\033[0m\n' "Node.js"         "$_node_ver"
      printf '\033[1;34m  │\033[0m  %-18s \033[0;32m%-30s\033[1;34m │\033[0m\n' "pnpm"            "$_pnpm_ver"
      printf '\033[1;34m  │\033[0m  %-18s \033[0;32m%-30s\033[1;34m │\033[0m\n' "PostgreSQL"      "$_pg_ver"
      printf '\033[1;34m  │\033[0m  %-18s \033[0;32m%-30s\033[1;34m │\033[0m\n' "DB"              "tanstack_start_dev@127.0.0.1:5432"
      printf '\033[1;34m  │\033[0m  %-18s \033[0;32m%-30s\033[1;34m │\033[0m\n' "Redis"           "127.0.0.1:6379"
      printf '\033[1;34m  └──────────────────────────────────────────────────┘\033[0m\n'

      printf '\n\033[1;34m  ┌─ Commands ────────────────────────────────────────┐\033[0m\n'
      printf '\033[1;34m  │\033[0m  \033[1;37m%-20s\033[0m %-29s\033[1;34m│\033[0m\n' "pnpm dev"         "start dev server  (port 3000)"
      printf '\033[1;34m  │\033[0m  \033[1;37m%-20s\033[0m %-29s\033[1;34m│\033[0m\n' "pnpm build"        "production build"
      printf '\033[1;34m  │\033[0m  \033[1;37m%-20s\033[0m %-29s\033[1;34m│\033[0m\n' "pnpm start"        "run production server"
      printf '\033[1;34m  │\033[0m  \033[1;37m%-20s\033[0m %-29s\033[1;34m│\033[0m\n' "pnpm test"         "run test suite"
      printf '\033[1;34m  │\033[0m  \033[1;37m%-20s\033[0m %-29s\033[1;34m│\033[0m\n' "pnpm lint"         "lint with Biome"
      printf '\033[1;34m  │\033[0m  \033[1;37m%-20s\033[0m %-29s\033[1;34m│\033[0m\n' "pnpm check"        "format + lint check"
      printf '\033[1;34m  │\033[0m  \033[1;37m%-20s\033[0m %-29s\033[1;34m│\033[0m\n' "pnpm db:migrate"   "run DB migrations"
      printf '\033[1;34m  │\033[0m  \033[1;37m%-20s\033[0m %-29s\033[1;34m│\033[0m\n' "pnpm db:generate"  "generate migration files"
      printf '\033[1;34m  │\033[0m  \033[1;37m%-20s\033[0m %-29s\033[1;34m│\033[0m\n' "pnpm db:studio"    "open Drizzle Studio"
      printf '\033[1;34m  │\033[0m  \033[1;37m%-20s\033[0m %-29s\033[1;34m│\033[0m\n' "pnpm db:seed"      "seed the database"
      printf '\033[1;34m  │\033[0m  \033[1;37m%-20s\033[0m %-29s\033[1;34m│\033[0m\n' "pnpm storybook"    "launch Storybook  (port 6006)"
      printf '\033[1;34m  └──────────────────────────────────────────────────┘\033[0m\n\n'
    } >&2

    unset _node_ver _pnpm_ver _pg_ver _git_branch _pkg_ver
  '';
}
