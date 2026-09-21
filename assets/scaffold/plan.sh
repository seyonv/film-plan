#!/usr/bin/env bash
# Serve this plan with the chat bridge attached.
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER="$HOME/.claude/skills/film-plan/assets/plan.server.mjs"

if [ ! -f "$SERVER" ]; then
  echo "film-plan is not installed. Install it with:" >&2
  echo "  npx skills add seyonv/film-plan" >&2
  exit 1
fi
exec node "$SERVER" --dir "$HERE" "$@"
