#!/usr/bin/env bash
# preflight-deploy.sh — MANDATORY gate before any `railway up` on this repo.
# Rule: deployment failures are not acceptable. This script checks the two
# layers a local app smoke test cannot see: the upload manifest and the
# platform build plan's known failure classes.
#
# Born from deploy 77725b9f (2026-07-16): Nixpacks generated a cache mount
# targeting /app/tsconfig.tsbuildinfo; the tracked artifact file at that path
# aborted the build container before npm run build even started.
set -euo pipefail
cd "$(dirname "$0")/.."
FAIL=0

say() { printf '%s\n' "$*"; }
bad() { say "FAIL: $*"; FAIL=1; }
ok()  { say "ok:   $*"; }

# 1. Build artifacts must never be tracked or uploadable.
if git ls-files | grep -qE '\.tsbuildinfo$'; then
  bad "*.tsbuildinfo is tracked in git (Nixpacks cache-mount killer). Run: git rm --cached <file>"
else
  ok "no tracked *.tsbuildinfo"
fi

# 2. Root .railwayignore must exist and cover the artifact classes.
if [ ! -f .railwayignore ]; then
  bad "root .railwayignore missing (railway up sweeps local artifacts without it)"
else
  grep -q 'tsbuildinfo' .railwayignore && ok ".railwayignore covers *.tsbuildinfo" \
    || bad ".railwayignore does not cover *.tsbuildinfo"
fi

# 3. No secrets in the upload set (tracked or untracked-but-unignored).
LEAKS=$(git status --short --untracked-files=all | awk '{print $2}' | grep -E '^\.env|\.pem$|\.key$' || true)
[ -z "$LEAKS" ] && ok "no env/key files in upload set" || bad "possible secret files in upload set: $LEAKS"

# 4. Working tree committed (deploys must be reproducible from a commit).
if [ -n "$(git status --porcelain)" ]; then
  bad "working tree not clean; commit before deploying"
else
  ok "working tree clean at $(git rev-parse --short HEAD)"
fi

# 5. Local production build must be green (app-level smoke precondition).
say "running production build (this is the slow step)..."
if node node_modules/next/dist/bin/next build > /tmp/preflight-build.log 2>&1; then
  ok "next build green"
else
  bad "next build failed; see /tmp/preflight-build.log"
fi

# Published counts must match the data they describe. This is the OKF
# attested computation running as a gate: it re-derives every number from
# the data modules and fails if any surface still states an old one. Counts
# drifted silently for weeks before this existed.
if python3 scripts/okf_corpus_counts.py > /tmp/preflight-receipt.json 2>/tmp/preflight-counts.log \
   && python3 scripts/okf_attest.py /tmp/preflight-receipt.json >> /tmp/preflight-counts.log 2>&1; then
  ok "published counts match the data (OKF attester)"
else
  bad "published counts disagree with the data; see /tmp/preflight-counts.log"
fi

# Brand and accessibility gate: accent colors carry theme pairs, readable
# text never drops below the /70 floor. See docs/BRAND_GUIDELINES.md.
if python3 scripts/check-brand.py > /tmp/preflight-brand.log 2>&1; then
  ok "brand gate: accent pairs and text-contrast floor hold"
else
  bad "brand gate failed; see /tmp/preflight-brand.log"
fi

# Persona surface gate: every page discoverable, rendered server-side, and
# carrying the schema an answer engine needs. Needs a running server, so it
# skips rather than fails when none is up.
PERSONA_BASE="${PERSONA_BASE:-http://127.0.0.1:3402}"
if curl -sf -o /dev/null --max-time 5 "$PERSONA_BASE/personas"; then
  if python3 scripts/audit-personas.py "$PERSONA_BASE" > /tmp/preflight-personas.log 2>&1; then
    ok "persona surface: linked, rendered, schema complete"
  else
    bad "persona audit failed; see /tmp/preflight-personas.log"
  fi
else
  say "  - persona audit skipped (no server at $PERSONA_BASE)"
fi

if [ "$FAIL" -ne 0 ]; then
  say ""
  say "PREFLIGHT FAILED. Do NOT run railway up."
  exit 1
fi
say ""
say "PREFLIGHT PASSED. Deploy with: railway up --detach, then WATCH the"
say "deployment to success and verify content markers on the live domain."
