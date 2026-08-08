#!/usr/bin/env bash
# deploy-rehearsal.sh — run the deployment TWICE, for real, before it goes live.
#
# Why two rehearsals? They catch different failure classes:
#
#   REHEARSAL 1 (fast integrity):  isolated copy + symlinked node_modules.
#     Catches: code errors, type errors, bad next.config, broken routes, bad
#     content. Fast because it reuses installed deps.
#
#   REHEARSAL 2 (true-to-Railway): builds ONLY the committed tree (`git archive
#     HEAD`, which is what Railway receives) with a FRESH `npm ci` from
#     package-lock, running Railway's exact `npm run build` command.
#     Catches: missing/phantom dependencies (a symlinked node_modules hides
#     these completely), lockfile drift, and anything that only appears in a
#     clean container. This is the rehearsal that most resembles production.
#
# Both rehearsals then BOOT the built app and run the live QA suite against it.
# Nothing is deployed by this script. It exits non-zero if anything fails.
#
# Usage:  ./scripts/deploy-rehearsal.sh
set -uo pipefail
cd "$(dirname "$0")/.."
REPO="$(pwd)"
WORK="${TMPDIR:-/tmp}/deploy-rehearsal-$$"
PORT1=3211
PORT2=3212
FAIL=0

say()  { printf '\n\033[1m%s\033[0m\n' "$*"; }
ok()   { printf '  ok:   %s\n' "$*"; }
bad()  { printf '  FAIL: %s\n' "$*"; FAIL=1; }

cleanup() {
  for p in $PORT1 $PORT2; do lsof -ti tcp:$p 2>/dev/null | xargs kill 2>/dev/null; done
  rm -rf "$WORK"
}
trap cleanup EXIT

mkdir -p "$WORK"

# --- RAILWAY ENV CONTRACT -------------------------------------------------- #
# Railway builds with these set. Without them SITE_URL falls back to localhost
# and the build emits a sitemap full of http://localhost URLs — which would be
# catastrophic in production and would also false-fail our own QA checks.
export NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL:-https://venkatapagadala.com}"
export NEXT_PUBLIC_BACKEND_URL="${NEXT_PUBLIC_BACKEND_URL:-https://venkatapagadala.com}"
export BACKEND_URL="${BACKEND_URL:-http://localhost:8090}"

# ---------------------------------------------------------------- #
# 0. Upload-hazard checks (the class that broke deploy 77725b9f)
# ---------------------------------------------------------------- #
say "0. UPLOAD HAZARDS"
if git ls-files | grep -qE '\.tsbuildinfo$'; then
  bad "*.tsbuildinfo is tracked — Nixpacks mounts a cache at that path and the build container aborts"
else
  ok "no tracked *.tsbuildinfo"
fi
[ -f .railwayignore ] && ok ".railwayignore present" || bad ".railwayignore missing"
if [ -n "$(git status --porcelain)" ]; then
  bad "working tree dirty — deploys must be reproducible from a commit"
else
  ok "working tree clean at $(git rev-parse --short HEAD)"
fi

# ---------------------------------------------------------------- #
# QA suite — run against a booted build. Fails loudly.
# ---------------------------------------------------------------- #
qa_suite() {
  local base="$1" label="$2"
  python3 - "$base" "$label" <<'PY'
import sys, urllib.request, urllib.error, re
base, label = sys.argv[1], sys.argv[2]
def get(p):
    try:
        with urllib.request.urlopen(urllib.request.Request(base+p, headers={"User-Agent":"rehearsal"}), timeout=90) as r:
            return r.status, r.read().decode("utf-8","replace"), dict(r.headers)
    except urllib.error.HTTPError as e:
        # Read the body on error responses too. Discarding it made every
        # assertion about a 404 page unfalsifiable: the noindex check could
        # only pass while the page was wrongly answering 200.
        try:
            body = e.read().decode("utf-8", "replace")
        except Exception:
            body = ""
        return e.code, body, dict(e.headers)
    except Exception as e:
        return 0, f"ERR {e}", {}

c = {}
# every key route must render
for p in ["/","/about","/guides","/guides/screaming-frog","/guides/how-llms-work",
          "/guides/graph-types-for-ai-agents","/guides/hvac-system-troubleshooting",
          "/notebook/ai","/solutions","/contact","/experience","/insights","/projects"]:
    st,_,_ = get(p); c[f"200 {p}"] = st == 200

# canonicals present sitewide (the thing we were accused of missing)
for p in ["/","/about","/guides/screaming-frog","/notebook/ai"]:
    _, h, _ = get(p)
    c[f"canonical {p}"] = 'rel="canonical"' in h

# markdown twins + their canonical header
st, body, hdrs = get("/guides/screaming-frog.md")
c["md twin 200"] = st == 200
c["md twin is markdown"] = "markdown" in hdrs.get("Content-Type","")
c["md twin canonical header"] = 'rel="canonical"' in hdrs.get("Link","")
c["md twin has content"] = "Screaming Frog" in body

# AEO resources
st, llms, _ = get("/llms.txt");      c["llms.txt"] = st == 200 and "guides/" in llms
st, full, _ = get("/llms-full.txt"); c["llms-full.txt"] = st == 200
st, sm, _   = get("/sitemap.xml")
c["sitemap 200"] = st == 200
c["sitemap has llms"] = "llms.txt" in sm
c["sitemap excludes .md twins"] = ".md<" not in sm
c["sitemap no localhost leak"] = "localhost" not in sm
st, rb, _ = get("/robots.txt")
c["robots 200"] = st == 200
c["robots allows AI bots"] = "GPTBot" in rb

# soft-404 must be a hard 404 — including the four slug-reflection families
# that used to return 200 + index,follow + a title lifted from the URL.
# Routes that are force-static return a true 404.
for p in ["/guides/definitely-not-a-real-guide-xyz", "/notebook/fake-xyz-9911"]:
    st, _, _ = get(p)
    c[f"hard-404 {p}"] = st == 404

# Contributors, speakers and sessions now pre-render their params, so a bogus
# slug is a routing 404. The insights and updates routes stay backend-driven,
# so their valid set is unknowable at build time and they answer 200 with the
# not-found body. Either way the security property must hold: a bogus slug
# must not be indexable and must not reflect an attacker-chosen title.
for p in ["/ai-contributors/best-cheap-payday-loans-online",
          "/insights/totally-fake-slug-xyz",
          "/insights/fake-category-xyz/fake-child-xyz",
          "/ai-updates/not-a-real-update-9911"]:
    st, body, _ = get(p)
    c[f"noindex on bogus {p}"] = 'content="noindex' in body
    c[f"no slug-reflection {p}"] = "Payday" not in body and "Totally Fake" not in body
    c[f"no self-canonical {p}"] = f'rel="canonical" href="https://venkatapagadala.com{p}"' not in body

# no x-robots-tag noindex anywhere
_,_,h = get("/"); c["no noindex header"] = "noindex" not in h.get("X-Robots-Tag","").lower()

bad = [k for k,v in c.items() if not v]
print(f"  [{label}] {len(c)-len(bad)}/{len(c)} checks passed")
for k in bad: print(f"    FAIL: {k}")
sys.exit(1 if bad else 0)
PY
}

boot_and_test() {
  local dir="$1" port="$2" label="$3"
  (cd "$dir" && node node_modules/next/dist/bin/next start -p "$port" -H 127.0.0.1 > "$WORK/$label.server.log" 2>&1 &)
  for i in $(seq 1 30); do
    sleep 2
    if curl -s -o /dev/null --max-time 5 "http://127.0.0.1:$port/"; then break; fi
  done
  if ! curl -s -o /dev/null --max-time 10 "http://127.0.0.1:$port/"; then
    bad "$label: server never came up (see $WORK/$label.server.log)"; return 1
  fi
  if qa_suite "http://127.0.0.1:$port" "$label"; then ok "$label: QA suite passed"; else bad "$label: QA suite failed"; fi
  lsof -ti tcp:$port 2>/dev/null | xargs kill 2>/dev/null
}

# ---------------------------------------------------------------- #
# REHEARSAL 1 — fast integrity (symlinked deps)
# ---------------------------------------------------------------- #
say "1. REHEARSAL ONE — fast integrity check"
R1="$WORK/r1"
mkdir -p "$R1"
rsync -a --exclude node_modules --exclude .next --exclude .git "$REPO/" "$R1/"
ln -s "$REPO/node_modules" "$R1/node_modules"
if (cd "$R1" && node node_modules/next/dist/bin/next build > "$WORK/r1.build.log" 2>&1); then
  ok "build green"
  boot_and_test "$R1" "$PORT1" "rehearsal-1"
else
  bad "build failed — see $WORK/r1.build.log"; tail -20 "$WORK/r1.build.log"
fi

# ---------------------------------------------------------------- #
# REHEARSAL 2 — true-to-Railway (committed tree + fresh npm ci)
# ---------------------------------------------------------------- #
say "2. REHEARSAL TWO — true-to-Railway (clean install of the committed tree)"
R2="$WORK/r2"
mkdir -p "$R2"
# Railway receives the committed tree; reproduce it exactly.
git archive HEAD | tar -x -C "$R2"
ok "extracted committed tree ($(find "$R2" -type f | wc -l | tr -d ' ') files)"
if find "$R2" -name '*.tsbuildinfo' | grep -q .; then
  bad "committed tree contains *.tsbuildinfo — this aborts the Nixpacks build container"
else
  ok "no cache-mount hazards in the uploaded tree"
fi
say "   running fresh npm ci (this is the slow, honest part)"
if (cd "$R2" && npm ci > "$WORK/r2.install.log" 2>&1); then
  ok "npm ci clean (no missing or phantom dependencies)"
  if (cd "$R2" && npm run build > "$WORK/r2.build.log" 2>&1); then
    ok "npm run build green (Railway's exact command)"
    boot_and_test "$R2" "$PORT2" "rehearsal-2"
  else
    bad "npm run build failed — see $WORK/r2.build.log"; tail -20 "$WORK/r2.build.log"
  fi
else
  bad "npm ci failed — see $WORK/r2.install.log"; tail -20 "$WORK/r2.install.log"
fi

# ---------------------------------------------------------------- #
say "VERDICT"
if [ "$FAIL" -ne 0 ]; then
  printf '  \033[31mREHEARSALS FAILED — do NOT deploy.\033[0m\n\n'
  exit 1
fi
printf '  \033[32mBOTH REHEARSALS PASSED.\033[0m\n'
printf '  Safe to deploy:  railway up --detach\n'
printf '  Then run:        ./scripts/deploy-watch.sh   (monitors uptime + build outcome)\n\n'
