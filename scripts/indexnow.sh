#!/usr/bin/env bash
# indexnow.sh — tell search engines a set of URLs changed.
#
# Google retired its sitemap ping endpoint in 2023 and Bing retired theirs in
# favour of IndexNow, so this is the only working "we just published" signal
# left. One POST reaches Bing, Yandex, Seznam and Naver; Google ignores it but
# still picks the change up from the sitemap's lastmod.
#
# The key file must be reachable at https://<host>/<key>.txt and contain
# exactly the key. That file lives in public/ and ships with the deploy, so
# run this AFTER the deploy is live, never before.
#
# Usage:  ./scripts/indexnow.sh                 # submits the default set
#         ./scripts/indexnow.sh /a /b/c         # submits specific paths
set -euo pipefail
cd "$(dirname "$0")/.."

HOST="venkatapagadala.com"
KEY="f8d2520d758ec06e8b97c5f26ad0aedc"

# Default set: the pages whose content actually changes on a content release.
DEFAULT_PATHS=(
  "/"
  "/notebook/ai"
  "/notebook/ai/roadmap"
  "/notebook/ai/encyclopedia"
  "/notebook/ai/map"
  "/notebook/ai/shelf"
  "/3d"
  "/credits"
  "/ai-updates"
  "/ai-updates/stripe-openrouter-acquisition-7-billion"
  "/notebook/ai/encyclopedia/inference-optimization"
  "/notebook/ai/encyclopedia/llm"
  "/notebook/ai/encyclopedia/ai-agents"
  "/guides/how-neural-networks-work"
  "/publications"
  "/llms.txt"
  "/llms-full.txt"
)

paths=("$@")
if [ ${#paths[@]} -eq 0 ]; then paths=("${DEFAULT_PATHS[@]}"); fi

# Refuse to submit if the key is not actually being served: an unverifiable
# key makes every submission a silent no-op.
key_status=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "https://$HOST/$KEY.txt")
if [ "$key_status" != "200" ]; then
  echo "FAIL: https://$HOST/$KEY.txt returned $key_status. Deploy the key file first."
  exit 1
fi
echo "ok:   key file verified at https://$HOST/$KEY.txt"

url_list=""
for p in "${paths[@]}"; do url_list="$url_list\"https://$HOST$p\","; done
url_list="${url_list%,}"

body="{\"host\":\"$HOST\",\"key\":\"$KEY\",\"keyLocation\":\"https://$HOST/$KEY.txt\",\"urlList\":[$url_list]}"

code=$(curl -s -o /tmp/indexnow_resp.txt -w '%{http_code}' --max-time 30 \
  -X POST "https://api.indexnow.org/IndexNow" \
  -H "Content-Type: application/json; charset=utf-8" \
  -d "$body")

echo "submitted ${#paths[@]} URLs, HTTP $code"
case "$code" in
  200|202) echo "ok:   accepted (200 = processed, 202 = accepted, key validation pending)" ;;
  400) echo "FAIL: bad request"; cat /tmp/indexnow_resp.txt; exit 1 ;;
  403) echo "FAIL: key not valid for this host"; exit 1 ;;
  422) echo "FAIL: URLs do not match the host"; exit 1 ;;
  429) echo "FAIL: rate limited, try later"; exit 1 ;;
  *)   echo "FAIL: unexpected status"; cat /tmp/indexnow_resp.txt; exit 1 ;;
esac
