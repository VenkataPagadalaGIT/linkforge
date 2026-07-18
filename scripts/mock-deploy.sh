#!/usr/bin/env bash
# mock-deploy.sh — free dress rehearsal of a Railway deployment.
# Run BEFORE every push: catches build/boot failures locally at $0
# instead of as paid failed Railway builds.
#
# Usage: ./scripts/mock-deploy.sh [backend|frontend|all]
set -euo pipefail
cd "$(dirname "$0")/.."
TARGET="${1:-all}"
PASS=1

backend() {
  echo "── backend: Linux py3.11 install → boot → seed → probe ──"
  docker network create mockdeploy >/dev/null 2>&1 || true
  docker rm -f mock-mongo mock-backend >/dev/null 2>&1 || true
  docker run -d --rm --name mock-mongo --network mockdeploy mongo:7 >/dev/null
  docker run -d --rm --name mock-backend --network mockdeploy -v "$PWD/backend:/app:ro" \
    -e MONGO_URL='mongodb://mock-mongo:27017' -e DB_NAME='monomind' -e JWT_SECRET='mocktest' \
    -e ADMIN_EMAIL='mock@test.local' -e ADMIN_PASSWORD='mock' -e CORS_ORIGINS='*' -e PORT=8000 \
    python:3.11-slim sh -c "pip install --no-cache-dir -q -r /app/requirements.txt >/dev/null 2>&1 \
      && cp -r /app /srv/app && cd /srv/app && uvicorn server:app --host 0.0.0.0 --port 8000" >/dev/null
  echo "   installing deps + booting (~2 min)…"
  for i in $(seq 1 36); do
    sleep 5
    if docker run --rm --network mockdeploy curlimages/curl:latest -sf -o /dev/null "http://mock-backend:8000/docs" 2>/dev/null; then
      echo "   ✓ backend serves /docs"
      NOTES=$(docker run --rm --network mockdeploy curlimages/curl:latest -sf "http://mock-backend:8000/api/notebook/notes/public/seo-week-2026" 2>/dev/null | tr -cd '{' | wc -c | tr -d ' ')
      echo "   ✓ public notes endpoint returns ${NOTES} records"
      docker logs mock-backend 2>&1 | grep -E "Seed complete|startup complete" | sed 's/^/   ✓ /'
      docker rm -f mock-mongo mock-backend >/dev/null 2>&1; docker network rm mockdeploy >/dev/null 2>&1
      return 0
    fi
  done
  echo "   ✗ backend never became healthy — logs:"
  docker logs mock-backend 2>&1 | tail -25
  docker rm -f mock-mongo mock-backend >/dev/null 2>&1; docker network rm mockdeploy >/dev/null 2>&1
  return 1
}

frontend() {
  echo "── frontend: next build (same env contract as Railway) ──"
  ( cd frontend && \
    NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL:-https://venkatapagadala.com}" \
    BACKEND_URL="${BACKEND_URL:-http://localhost:8090}" \
    NEXT_PUBLIC_BACKEND_URL="${NEXT_PUBLIC_BACKEND_URL:-https://venkatapagadala.com}" \
    npm run build > /tmp/mockdeploy-frontend.log 2>&1 ) \
    && echo "   ✓ next build succeeded ($(grep -c '├\|└' /tmp/mockdeploy-frontend.log || true) routes)" \
    || { echo "   ✗ next build FAILED:"; tail -25 /tmp/mockdeploy-frontend.log; return 1; }
}

case "$TARGET" in
  backend)  backend  || PASS=0 ;;
  frontend) frontend || PASS=0 ;;
  all)      backend  || PASS=0; frontend || PASS=0 ;;
esac

echo
if [ "$PASS" = 1 ]; then echo "MOCK DEPLOY: ✅ all green — safe to push"; else echo "MOCK DEPLOY: ❌ FAILED — do NOT push"; exit 1; fi
