#!/usr/bin/env python3
"""
Paid signals pilot for one company (DataForSEO + MCP Scraper), into ontology.series_point / watch_item.

  fetch   buys each call ONCE: every raw response is archived under raw/paid/<entity>/ before anything
          is parsed, and a call whose archive already holds a good response is never bought again.
          A hard dollar cap (DataForSEO) and credit cap (MCP Scraper) are enforced in code: each call
          reserves its worst-case price first and the run stops before a call that could cross the cap.
          A lock file refuses a second copy of this script while one is running.
  parse   free: reads the archives and writes the database rows. Re-run as often as needed.

Run: python3 paid_signals.py fetch --entity anthropic --cap 5 --credit-cap 600
     python3 paid_signals.py parse --entity anthropic
Prices: our DataForSEO account price list (29 Oct 2026) and the MCP Scraper rate card; the response's own
`cost` field is the truth and is what the spend log records.
"""
import argparse, base64, datetime as dt, gzip, json, os, re, subprocess, sys, time, urllib.error, urllib.request
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from db import sql, query, q
from collect_signals import points, items

HERE = os.path.dirname(os.path.abspath(__file__))
SEC = os.path.expanduser("~/Desktop/sec")
US = {"location_code": 2840, "language_code": "en"}
AI_BRANDS = [("Claude", "claude"), ("ChatGPT", "chatgpt"), ("Gemini", "gemini"), ("Perplexity", "perplexity"), ("Copilot", "copilot")]

# name, provider, endpoint or tool, body or arguments, worst-case price (USD for dfs, credits for mcps)
CALLS = {
    "anthropic": [
        ("ads_volume", "dfs", "keywords_data/google_ads/search_volume/live",
         [dict(US, keywords=["claude ai", "claude", "claude code", "anthropic", "anthropic ipo", "anthropic stock", "claude opus", "claude sonnet",
                             "chatgpt", "openai", "gemini", "microsoft copilot", "perplexity", "grok"])], 0.10),
        ("trends_assistants", "dfs", "keywords_data/dataforseo_trends/explore/live",
         [{"keywords": ["claude ai", "chatgpt", "gemini", "perplexity", "copilot"], "location_name": "United States", "time_range": "past_5_years", "type": "web"}], 0.01),
        ("trends_coding", "dfs", "keywords_data/dataforseo_trends/explore/live",
         [{"keywords": ["claude code", "cursor", "github copilot", "openai codex", "windsurf"], "location_name": "United States", "time_range": "past_12_months", "type": "web"}], 0.01),
        ("news", "dfs", "serp/google/news/live/advanced", [dict(US, keyword="Anthropic", depth=30)], 0.05),
        ("ranked_claude.ai", "dfs", "dataforseo_labs/google/ranked_keywords/live",
         [dict(US, target="claude.ai", limit=200, order_by=["ranked_serp_element.serp_item.etv,desc"], item_types=["organic"])], 0.05),
        ("ranked_anthropic.com", "dfs", "dataforseo_labs/google/ranked_keywords/live",
         [dict(US, target="anthropic.com", limit=200, order_by=["ranked_serp_element.serp_item.etv,desc"], item_types=["organic"])], 0.05),
        ("history_claude.ai", "dfs", "dataforseo_labs/google/historical_rank_overview/live", [dict(US, target="claude.ai")], 0.30),
        ("history_anthropic.com", "dfs", "dataforseo_labs/google/historical_rank_overview/live", [dict(US, target="anthropic.com")], 0.30),
        ("history_chatgpt.com", "dfs", "dataforseo_labs/google/historical_rank_overview/live", [dict(US, target="chatgpt.com")], 0.30),
        ("llm_share_google", "dfs", "ai_optimization/llm_mentions/cross_aggregated_metrics/live",
         [{"targets": [{"aggregation_key": k, "target": [{"keyword": w}]} for k, w in AI_BRANDS], "platform": "google", "location_name": "United States", "language_code": "en"}], 0.25),
        ("llm_share_chatgpt", "dfs", "ai_optimization/llm_mentions/cross_aggregated_metrics/live",
         [{"targets": [{"aggregation_key": k, "target": [{"keyword": w}]} for k, w in AI_BRANDS], "platform": "chat_gpt", "location_name": "United States", "language_code": "en"}], 0.25),
        ("llm_top_domains", "dfs", "ai_optimization/llm_mentions/top_domains/live",
         [{"target": [{"keyword": "claude"}], "platform": "google", "location_name": "United States", "language_code": "en"}], 0.40),
        ("content_summary", "dfs", "content_analysis/summary/live", [{"keyword": "anthropic", "internal_list_limit": 10}], 0.10),
        ("content_trend", "dfs", "content_analysis/phrase_trends/live",
         [{"keyword": "anthropic", "date_from": "2025-01-01", "date_group": "month", "internal_list_limit": 1}], 0.10),
        ("google_ads_search", "mcps", "google_ads_search", {"query": "Anthropic", "region": "US", "maxResults": 5}, 10),
        ("meta_ads", "mcps", "facebook_ad_search", {"query": "Anthropic", "country": "US", "maxResults": 5}, 12),
        ("trustpilot", "mcps", "trustpilot_reviews", {"domain": "claude.ai", "maxPages": 3}, 80),
        ("google_ads_intel", "mcps", "google_ads_page_intel", {"advertiserName": "Anthropic, PBC", "region": "US", "maxAds": 50}, 10),
        ("play_app", "dfs_task", "app_data/google/app_info", [dict(US, app_id="com.anthropic.claude")], 0.01),
    ]
}


def rtf_text(name):
    return subprocess.run(["textutil", "-convert", "txt", "-stdout", os.path.join(SEC, name)], capture_output=True, text=True).stdout


def dfs_auth():
    env = json.load(open(os.path.expanduser("~/.claude.json")))["mcpServers"]["dataforseo"]["env"]
    return "Basic " + base64.b64encode(f"{env['DATAFORSEO_USERNAME']}:{env['DATAFORSEO_PASSWORD']}".encode()).decode()


def http(url, headers, body=None, timeout=180):
    req = urllib.request.Request(url, data=json.dumps(body).encode() if body is not None else None, headers=headers)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        raw = r.read().decode(errors="ignore")
    if raw.lstrip().startswith(("event:", "data:")) or "\ndata:" in raw:
        raw = "\n".join(l[5:].strip() for l in raw.splitlines() if l.startswith("data:"))
    return json.loads(raw)


def mcps(tool, args, key):
    meta = {"io.modelcontextprotocol/protocolVersion": "2026-07-28", "io.modelcontextprotocol/clientCapabilities": {},
            "io.modelcontextprotocol/clientInfo": {"name": "paid-signals", "version": "1"}}
    h = {"x-api-key": key, "Content-Type": "application/json", "Accept": "application/json, text/event-stream",
         "User-Agent": "curl/8.4", "MCP-Protocol-Version": "2026-07-28", "Mcp-Method": "tools/call", "Mcp-Name": tool}
    return http("https://mcpscraper.dev/mcp", h, {"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": tool, "arguments": args, "_meta": meta}}, 600)


RUN = os.environ.get("PAID_RUN") or dt.date.today().strftime("%Y-%m")  # one archive folder per month: a resume reuses it, next month buys fresh


def arch(ent, name):
    return os.path.join(HERE, "raw", "paid", ent, RUN, name + ".json.gz")


def load(ent, name):
    p = arch(ent, name)
    if not os.path.exists(p):
        return None
    try:
        with gzip.open(p, "rb") as f:
            return json.loads(f.read())
    except Exception:  # noqa: BLE001 - a truncated archive from a killed run: drop it, buy that one call again
        os.remove(p)
        return None


def good(provider, d):
    if d is None:
        return False
    if provider.startswith("dfs"):
        t = (d.get("tasks") or [{}])[0]
        return d.get("status_code") == 20000 and t.get("status_code") == 20000
    return "result" in d and not d["result"].get("isError")


def save(ent, name, d):
    os.makedirs(os.path.dirname(arch(ent, name)), exist_ok=True)
    with gzip.open(arch(ent, name), "wb") as f:
        f.write(json.dumps(d).encode())


def fetch(ent, cap, credit_cap):
    lock = os.path.join(HERE, "raw", "paid", ".lock")
    os.makedirs(os.path.dirname(lock), exist_ok=True)
    if os.path.exists(lock):
        pid = int(open(lock).read().strip() or 0)
        try:
            os.kill(pid, 0)
            raise SystemExit(f"[LOCK] paid_signals already running (pid {pid}). Refusing a duplicate.")
        except ProcessLookupError:
            pass
    open(lock, "w").write(str(os.getpid()))
    log = open(os.path.join(HERE, "raw", "paid", "spend_log.jsonl"), "a")
    spent, credits, bought, reused, failed = 0.0, 0, 0, 0, []
    auth, key = None, None
    try:
        for name, prov, ep, body, worst in CALLS[ent]:
            old = load(ent, name)
            if good(prov, old) and not (prov == "dfs_task" and "task_get" not in old):
                reused += 1
                continue
            if prov.startswith("dfs"):
                if spent + worst > cap:
                    print(f"[BUDGET] stop before {name}: ${spent:.4f} spent + ${worst} worst case > ${cap} cap")
                    break
                auth = auth or dfs_auth()
                h = {"Authorization": auth, "Content-Type": "application/json"}
                try:
                    if prov == "dfs":
                        d = http(f"https://api.dataforseo.com/v3/{ep}", h, body)
                    else:  # task endpoint: post once, keep the task id, collect when ready (a resumed run never re-posts)
                        d = old if old and old.get("tasks") and old.get("status_code") == 20000 else http(f"https://api.dataforseo.com/v3/{ep}/task_post", h, body)
                        if d is not old:
                            spent += float(d.get("cost") or 0)
                            log.write(json.dumps({"at": dt.datetime.now().isoformat(timespec="seconds"), "entity": ent, "call": name + ":post", "provider": "dataforseo", "usd": d.get("cost")}) + "\n")
                        save(ent, name, d)
                        tid = d["tasks"][0]["id"]
                        for _ in range(18):
                            g = http(f"https://api.dataforseo.com/v3/{ep}/task_get/advanced/{tid}", h)
                            if (g.get("tasks") or [{}])[0].get("status_code") == 20000:
                                d = dict(g, task_get=True)
                                break
                            time.sleep(20)
                except urllib.error.HTTPError as e:
                    failed.append(f"{name}: HTTP {e.code}")
                    continue
                cost = float(d.get("cost") or 0) if prov == "dfs" else 0.0
                spent += cost
                save(ent, name, d)
                t = (d.get("tasks") or [{}])[0]
                log.write(json.dumps({"at": dt.datetime.now().isoformat(timespec="seconds"), "entity": ent, "call": name, "provider": "dataforseo",
                                      "usd": cost, "status": t.get("status_code"), "message": t.get("status_message")}) + "\n")
                if not good(prov, d):
                    failed.append(f"{name}: {t.get('status_code')} {t.get('status_message')}")
                bought += 1
                print(f"dfs  {name:22} ${cost:.4f}  total ${spent:.4f}  {t.get('status_code')} {str(t.get('status_message'))[:60]}", flush=True)
            else:
                if credits + worst > credit_cap:
                    print(f"[BUDGET] stop before {name}: {credits} credits + {worst} worst case > {credit_cap} cap")
                    break
                key = key or re.findall(r"sk_[A-Za-z0-9_-]{20,}", rtf_text("mcpscraper.rtf"))[0]
                try:
                    d = mcps(ep, body, key)
                except urllib.error.HTTPError as e:
                    failed.append(f"{name}: HTTP {e.code}")
                    continue
                credits += worst
                save(ent, name, d)
                log.write(json.dumps({"at": dt.datetime.now().isoformat(timespec="seconds"), "entity": ent, "call": name, "provider": "mcpscraper",
                                      "credits_reserved": worst, "error": bool((d.get("result") or {}).get("isError")) or "error" in d}) + "\n")
                if not good(prov, d):
                    failed.append(f"{name}: {str(d.get('error') or (d.get('result') or {}).get('content'))[:160]}")
                bought += 1
                print(f"mcps {name:22} <= {worst} credits  total <= {credits}", flush=True)
    finally:
        log.close()
        os.remove(lock)
    print(f"\nbought {bought}, reused {reused}; DataForSEO ${spent:.4f} (cap ${cap}); MCP Scraper <= {credits} credits (cap {credit_cap})")
    for f in failed:
        print("FAILED", f)
    return 3 if failed else 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("mode", choices=["fetch", "parse"])
    ap.add_argument("--entity", default="anthropic")
    ap.add_argument("--cap", type=float, default=0.0, help="hard DataForSEO cap in USD; 0 refuses to buy")
    ap.add_argument("--credit-cap", type=int, default=0, help="hard MCP Scraper cap in credits; 0 refuses to buy")
    a = ap.parse_args()
    if a.mode == "fetch":
        if a.cap <= 0 and a.credit_cap <= 0:
            raise SystemExit("Refusing: pass --cap and --credit-cap (the owner-approved ceilings).")
        sys.exit(fetch(a.entity, a.cap, a.credit_cap))
    from paid_parse import parse
    sys.exit(parse(a.entity))


if __name__ == "__main__":
    main()
