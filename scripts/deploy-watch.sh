#!/usr/bin/env bash
# deploy-watch.sh — watch a Railway deploy to its verdict while proving the
# live site never went down.
#
# Railway is blue/green by default: the OLD deployment keeps serving until the
# NEW one builds and passes health checks. A failed build therefore causes zero
# downtime — but you only KNOW that if you measured it. This script measures it.
#
# It does two things concurrently:
#   1. Uptime probe: hits the live domain every 5s for the whole deploy and
#      records every non-200 as a downtime sample.
#   2. Build watch: polls Railway for the deployment verdict and pulls the
#      error log immediately on failure (instead of waiting on the domain).
#
# Usage:  ./scripts/deploy-watch.sh [deployment_id]
#         (deployment_id optional; omit to just watch service status)
set -uo pipefail
cd "$(dirname "$0")/.."

DOMAIN="${DEPLOY_WATCH_DOMAIN:-https://venkatapagadala.com}"
MARKER="${DEPLOY_WATCH_MARKER:-/guides/screaming-frog}"
DEPLOY_ID="${1:-}"
MAX_MIN=15

TMP="${TMPDIR:-/tmp}/deploy-watch-$$"
mkdir -p "$TMP"
UPFILE="$TMP/uptime.log"
: > "$UPFILE"

# --- uptime probe in the background -------------------------------------- #
(
  while :; do
    CODE=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$DOMAIN$MARKER" 2>/dev/null)
    echo "$(date +%s) $CODE" >> "$UPFILE"
    sleep 5
  done
) &
PROBE_PID=$!
cleanup() { kill $PROBE_PID 2>/dev/null; }
trap cleanup EXIT

printf '\nWatching deploy (uptime probe every 5s against %s%s)\n\n' "$DOMAIN" "$MARKER"

VERDICT="timeout"
for i in $(seq 1 $((MAX_MIN * 3))); do
  STATUS=$(railway status 2>/dev/null | grep -A1 "mono-mind-frontend-v2" | grep "status:" | head -1)
  printf '  [%3ds] %s\n' "$((i * 20))" "${STATUS:-(status unavailable)}"

  case "$STATUS" in
    *"Deploy failed"*|*Crashed*|*FAILED*)
      VERDICT="failed"
      printf '\n  DEPLOY FAILED — error context:\n'
      [ -n "$DEPLOY_ID" ] && railway logs --build "$DEPLOY_ID" 2>&1 \
        | grep -iE 'error|failed|not a directory|cannot find|exit code' | tail -15
      break;;
  esac

  # Success signal: the build log for THIS deployment reports a completed image.
  if [ -n "$DEPLOY_ID" ]; then
    if railway logs --build "$DEPLOY_ID" 2>&1 | grep -q "image push"; then
      # give the new container a moment to take traffic, then confirm the marker
      sleep 15
      if curl -s --max-time 15 "$DOMAIN$MARKER" | grep -q "<title>"; then
        VERDICT="success"; break
      fi
    fi
  fi
  sleep 20
done

# --- uptime report -------------------------------------------------------- #
TOTAL=$(wc -l < "$UPFILE" | tr -d ' ')
BAD=$(awk '$2 != "200"' "$UPFILE" | wc -l | tr -d ' ')
printf '\n  ── UPTIME DURING DEPLOY ──\n'
printf '  samples: %s   non-200: %s\n' "$TOTAL" "$BAD"
if [ "$BAD" -eq 0 ]; then
  printf '  \033[32mZERO DOWNTIME — every probe returned 200.\033[0m\n'
else
  printf '  \033[31mDOWNTIME DETECTED on %s samples:\033[0m\n' "$BAD"
  awk '$2 != "200"' "$UPFILE" | head -10
fi

printf '\n  VERDICT: %s\n\n' "$VERDICT"
[ "$VERDICT" = "success" ] || exit 1
