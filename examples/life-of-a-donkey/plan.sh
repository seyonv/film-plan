#!/usr/bin/env bash
# Serve this example plan with the chat bridge attached.
#
# Works straight from a clone — it prefers the copy of the bridge in this
# repository, and falls back to an installed film-plan skill.
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

for CANDIDATE in \
  "$HERE/../../assets/plan.server.mjs" \
  "$HOME/.claude/skills/film-plan/assets/plan.server.mjs"
do
  if [ -f "$CANDIDATE" ]; then exec node "$CANDIDATE" --dir "$HERE" "$@"; fi
done

echo "Could not find plan.server.mjs. Run this from a clone of the repo," >&2
echo "or install the skill: npx skills add seyonv/film-plan" >&2
exit 1
