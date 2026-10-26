#!/usr/bin/env bash
# Applies upstream pstack changes (cursor/plugins, pstack/skills and pstack/agents) between the commit in
# UPSTREAM and a target ref onto this checkout. Hunks that do not apply land as *.rej files to port by hand.
# Run from a checkout with LF line endings (git -c core.autocrlf=false worktree add ...).
set -euo pipefail

target="${1:-origin/main}"
root="$(git rev-parse --show-toplevel)"
cache="${PSTACK_UPSTREAM_CACHE:-${TMPDIR:-/tmp}/pstack-upstream}"
base="$(awk '{print $2}' "$root/UPSTREAM")"

if [ ! -d "$cache/.git" ]; then
  git clone -q --filter=blob:none --no-checkout https://github.com/cursor/plugins "$cache"
fi
git -C "$cache" fetch -q origin main
resolved="$(git -C "$cache" rev-parse --short "$target")"

patch="$cache/pstack-$base-$resolved.patch"
git -C "$cache" diff --binary "$base" "$resolved" -- pstack/skills pstack/agents > "$patch"
echo "upstream $base..$resolved: $(grep -c '^diff --git' "$patch") files"

cd "$root"
if git apply -p2 --reject --whitespace=nowarn "$patch"; then
  echo "applied cleanly"
else
  echo "rejected hunks to port by hand:"
  find skills agents -name '*.rej' | sort
fi
echo "after porting, set UPSTREAM to: cursor/plugins $resolved"
