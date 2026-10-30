#!/usr/bin/env python3
"""
Generate src/data/events.ts: one file per breaking event, from events.event (the checked seed) and
events.document (everything read about it).

  facts, moments, money, actors, watch   the seed, each line with its exact quote and its source
  claims                                 what people are saying, matched in every news story, post, video
                                         transcript, thread and comment, with a verdict from the sources
  coverage                               how many items each platform carried, hour by hour
  top                                    the most-read items per platform

Public posts are shown as text with a link; their authors are never named.
Run: python3 gen_events_ts.py [--check]
"""
import collections, datetime as dt, json, os, re, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from db import CONTAINER, DB, USER

HERE = os.path.dirname(os.path.abspath(__file__))
DEST = os.path.join(HERE, "..", "..", "src", "data", "events.ts")
PLATFORMS = ["binance", "x", "news", "web", "reddit", "youtube", "tiktok", "instagram", "hackernews"]
LABEL = {"binance": "Binance", "x": "X", "news": "News", "web": "Investigators and agencies", "reddit": "Reddit", "youtube": "YouTube",
         "tiktok": "TikTok", "instagram": "Instagram", "hackernews": "Hacker News"}


def rows(q):
    p = subprocess.run(["docker", "exec", "-i", CONTAINER, "psql", "-U", USER, "-d", DB, "-t", "-A", "-c",
                        "SELECT COALESCE(jsonb_agg(t), '[]'::jsonb)::text FROM (" + q + ") t"], capture_output=True, text=True)
    if p.returncode != 0:
        raise SystemExit("QUERY FAILED:\n" + p.stderr[-2000:])
    return json.loads(p.stdout.strip() or "[]")


def compact(v):
    v = float(v or 0)
    for d, s in ((1e9, "B"), (1e6, "M"), (1e3, "K")):
        if v >= d:
            x = v / d
            return f"{x:.1f}{s}" if x < 100 else f"{x:.0f}{s}"
    return f"{v:,.0f}"


def linkable(d):
    return d["url"] if (d.get("metrics") or {}).get("linkable", True) and "google.com/goto" not in d["url"] else None


def reach(d):
    m = d.get("metrics") or {}
    return max([m.get(k) or 0 for k in ("views", "likes", "points", "upvotes", "score", "comments")] + [0])


def meta(d):
    m = d.get("metrics") or {}
    parts = []
    for k, lab in (("views", "views"), ("likes", "likes"), ("points", "points"), ("upvotes", "upvotes"), ("comments", "comments"), ("score", "points")):
        if m.get(k):
            parts.append(f"{compact(m[k])} {lab}")
    if m.get("subreddit"):
        parts.insert(0, "r/" + m["subreddit"])
    if d.get("author") and d["voice"] != "public":
        parts.insert(0, d["author"])
    elif d.get("author") and d["platform"] == "youtube":
        parts.insert(0, d["author"])
    return " · ".join(parts) or None


NEGATION = r"\bno evidence\b|\bnot\b|n't\b|\bdeni(ed|es)\b|\bdeny\b|\bfalse\b|\bdebunk|\bfake\b|\brumou?r"


def snippet(text, rx):
    for s in re.split(r"(?<=[.!?])\s+|\n+", text or ""):
        if rx.search(s):
            s = s.strip()
            return s if len(s) <= 220 else s[:217].rsplit(" ", 1)[0] + "..."
    return None


def build(ev, docs):
    seed = ev["seed"] or {}
    by_url = {d["url"]: d for d in docs}

    def src(url):
        d = by_url.get(url) or {}
        return {"url": linkable(d) if d else url, "title": d.get("title"), "author": d.get("author"), "voice": d.get("voice"), "publishedAt": (d.get("published_at") or "")[:19] or None}

    def ev_list(es):
        return [dict(src(e["url"]), quote=e["quote"]) for e in es]

    facts = [{"key": f["key"], "label": f["label"], "value": f["value"], "status": f["status"], "note": f.get("note"), "evidence": ev_list(f.get("evidence", []))} for f in seed.get("facts", [])]
    moments = [{"at": m["at"], "label": m["label"], "quote": m["quote"], **{k: v for k, v in src(m["url"]).items() if k in ("url", "author", "title")}} for m in seed.get("moments", [])]
    mon = seed.get("money") or {}
    money = {"note": mon.get("note"), "source": src(mon["source"]) if mon.get("source") else None, "total": sum(r["usd"] for r in mon.get("rows", [])),
             "rows": [{"chain": r["chain"], "usd": r["usd"], "what": r.get("what") or None, "quote": r["quote"]} for r in mon.get("rows", [])],
             "frozen": [{"who": f["who"], "usd": f["usd"], "quote": f["quote"], **{k: v for k, v in src(f["url"]).items() if k in ("url", "author")}} for f in mon.get("frozen", [])]}
    watch = [{"label": w["label"], "when": w.get("when"), "note": w.get("note"), "quote": w["quote"], **{k: v for k, v in src(w["url"]).items() if k in ("url", "author")}} for w in seed.get("watch", [])]

    talk = [d for d in docs if d["voice"] in ("press", "public")]
    claims = []
    for c in seed.get("claims", []):
        rx = re.compile(c["match"], re.I)
        # A sentence that denies or negates the claim does not count as saying it ("no evidence of any private key leak").
        guard = re.compile(NEGATION + ("|" + c["unless"] if c.get("unless") else ""), re.I)

        def says(d):
            """The first sentence that makes the claim, cut to about 220 characters around the words that make it."""
            for s in re.split(r"(?<=[.!?])\s+|\n+", (d.get("title") or "") + ". " + (d.get("body") or "")):
                m = rx.search(s)
                if m and not guard.search(s):
                    s = s.strip()
                    if len(s) <= 220:
                        return s
                    a = max(0, m.start() - 90)
                    b = min(len(s), a + 210)
                    return ("..." if a else "") + s[a:b].strip() + ("..." if b < len(s) else "")
            return None
        hits = [d for d in talk if says(d)]
        per = collections.Counter(d["platform"] for d in hits)
        ex, seen = [], set()
        for d in sorted(hits, key=lambda d: (-reach(d), d["platform"])):
            if d["platform"] in seen and len(ex) < 3:
                continue
            s = says(d)
            if s:
                ex.append({"platform": d["platform"], "text": s, "url": linkable(d), "date": (d.get("published_at") or "")[:10] or None,
                           "who": d.get("author") if d["voice"] == "press" else None})
                seen.add(d["platform"])
            if len(ex) >= 4:
                break
        claims.append({"key": c["key"], "claim": c["claim"], "verdict": c["verdict"], "explain": c["explain"], "evidence": ev_list(c.get("evidence", [])),
                       "spread": {"total": len(hits), "byPlatform": {p: per[p] for p in PLATFORMS if per[p]}}, "examples": ex})
    claims.sort(key=lambda c: -c["spread"]["total"])

    cov = collections.Counter(d["platform"] for d in docs)
    voices = collections.Counter(d["voice"] for d in docs)
    start = dt.datetime.fromisoformat(seed.get("moments", [{}])[0].get("at", "2026-10-29T00:00:00Z").replace("Z", "+00:00")).replace(minute=0, second=0)
    hours = collections.defaultdict(collections.Counter)
    for d in docs:
        if d.get("published_at") and d["voice"] in ("press", "public"):
            try:
                t = dt.datetime.fromisoformat(d["published_at"].replace("Z", "+00:00"))
            except ValueError:
                continue
            if t.tzinfo is None:
                t = t.replace(tzinfo=dt.timezone.utc)
            if t >= start:
                hours[t.replace(minute=0, second=0, microsecond=0).isoformat()[:13]][d["platform"]] += 1
    top = {}
    for p in PLATFORMS:
        items = [d for d in docs if d["platform"] == p and d["kind"] != "comment" and d["voice"] in ("press", "public")]
        items.sort(key=lambda d: (-reach(d), (d.get("metrics") or {}).get("rank") or 999, d.get("published_at") or ""))
        if items:
            top[p] = [{"title": (d.get("title") or (d.get("body") or "")[:140]).strip(), "url": linkable(d), "date": (d.get("published_at") or "")[:10] or None,
                       "meta": meta(d), "transcript": bool((d.get("metrics") or {}).get("transcript"))} for d in items[:8]]
    return {"slug": ev["slug"], "title": ev["title"], "summary": ev.get("summary"), "updatedAt": ev["updated_at"][:19], "window": [ev["window_from"], ev["window_to"]],
            "facts": facts, "moments": moments, "money": money, "actors": seed.get("actors", []), "claims": claims, "watch": watch,
            "coverage": {"items": len(docs), "byPlatform": [{"platform": p, "label": LABEL[p], "items": cov[p]} for p in PLATFORMS if cov[p]],
                         "byVoice": dict(voices), "hours": [[h, dict(c)] for h, c in sorted(hours.items())]},
            "top": {p: {"label": LABEL[p], "items": v} for p, v in top.items()}}


evs = rows("SELECT slug, title, summary, window_from::text, window_to::text, seed, updated_at::text FROM events.event WHERE seed IS NOT NULL ORDER BY slug")
data = {}
for ev in evs:
    docs = rows(f"SELECT url, platform, kind, voice, title, author, published_at::text, metrics, body FROM events.document WHERE event_slug='{ev['slug']}'")
    data[ev["slug"]] = build(ev, docs)

header = """// AUTO-GENERATED by data/corpus/gen_events_ts.py from events.event and events.document. Do not edit by hand.
// One file per breaking event: what is known (each line with its exact quote), what people are saying, and what to watch.

export type Verdict = "true" | "false" | "misleading" | "unconfirmed";
export type FactStatus = "official" | "independent" | "reported" | "disputed";
export interface EventSource { url: string | null; title: string | null; author: string | null; voice: string | null; publishedAt: string | null; quote: string }
export interface EventFact { key: string; label: string; value: string; status: FactStatus; note: string | null; evidence: EventSource[] }
export interface EventMoment { at: string; label: string; quote: string; url: string | null; author: string | null; title: string | null }
export interface EventMoney { note: string | null; source: Omit<EventSource, "quote"> | null; total: number; rows: { chain: string; usd: number; what: string | null; quote: string }[]; frozen: { who: string; usd: number; quote: string; url: string | null; author: string | null }[] }
export interface EventClaim { key: string; claim: string; verdict: Verdict; explain: string; evidence: EventSource[]; spread: { total: number; byPlatform: Record<string, number> }; examples: { platform: string; text: string; url: string | null; date: string | null; who: string | null }[] }
export interface EventWatch { label: string; when: string | null; note: string | null; quote: string; url: string | null; author: string | null }
export interface EventTopItem { title: string; url: string | null; date: string | null; meta: string | null; transcript: boolean }
export interface EventFile {
  slug: string; title: string; summary: string | null; updatedAt: string; window: [string, string];
  facts: EventFact[]; moments: EventMoment[]; money: EventMoney; actors: { name: string; role: string; kind: string }[];
  claims: EventClaim[]; watch: EventWatch[];
  coverage: { items: number; byPlatform: { platform: string; label: string; items: number }[]; byVoice: Record<string, number>; hours: [string, Record<string, number>][] };
  top: Record<string, { label: string; items: EventTopItem[] }>;
}

"""
text = header + "export const EVENTS: Record<string, EventFile> = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n"
if "--check" in sys.argv:
    if (open(DEST, encoding="utf8").read() if os.path.exists(DEST) else "") != text:
        raise SystemExit("events.ts is stale: run gen_events_ts.py")
    print("events.ts up to date")
else:
    open(DEST, "w", encoding="utf8").write(text)
    print(f"wrote {DEST}: {len(text) // 1024} KB; " + "; ".join(f"{k}: {v['coverage']['items']} items, {len(v['claims'])} claims" for k, v in data.items()))
