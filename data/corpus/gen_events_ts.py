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
import collections, csv, datetime as dt, hashlib, html, io, json, os, re, subprocess, sys
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


NEGATION = r"\bno evidence\b|\bnot\b|n't\b|\bdeni(ed|es)\b|\bdeny\b|\bfalse\b|\bdebunk|\bfake\b|\brumou?r|\bno (one|binance|customer|user)s?\b|\bnobody\b|\bnever\b"


def snippet(text, rx):
    for s in re.split(r"(?<=[.!?])\s+|\n+", text or ""):
        if rx.search(s):
            s = s.strip()
            return s if len(s) <= 220 else s[:217].rsplit(" ", 1)[0] + "..."
    return None



GROUPS = [("official", "From Binance"), ("investigators", "Investigators and agencies"), ("news", "News"), ("youtube", "YouTube"), ("tiktok", "TikTok"),
          ("instagram", "Instagram"), ("x", "On X"), ("reddit", "Reddit"), ("hackernews", "Hacker News")]


def group_of(d):
    if d["voice"] == "official":
        return "official"
    if d["voice"] in ("investigator", "government"):
        return "investigators"
    return d["platform"] if d["platform"] in ("youtube", "tiktok", "instagram", "x", "reddit", "hackernews") else "news"


def embed_of(d):
    u = d["url"]
    for typ, rx in (("youtube", r"[?&]v=([\w-]{11})"), ("tiktok", r"tiktok\.com/@[^/]+/video/(\d+)"), ("x", r"(?:x|twitter)\.com/[^/]+/status/(\d+)")):
        m = re.search(rx, u)
        if m and d["platform"] in (typ, "x" if typ == "x" else typ):
            return {"type": typ, "id": m.group(1)}
    m = re.search(r"instagram\.com/(p|reel|tv)/([\w-]+)", u)
    if m:
        return {"type": "instagram", "id": f"{m.group(1)}/{m.group(2)}"}
    m = re.search(r"reddit\.com(/r/[^/]+/comments/[^?#]+)", u)
    if m and d["kind"] == "thread":
        return {"type": "reddit", "id": m.group(1).rstrip("/")}
    return None


def english(t):
    """Mostly plain Latin letters and a few common English words: good enough to split English from everything else."""
    letters = [ch for ch in t if ch.isalpha()]
    if not letters:
        return True
    ascii_share = sum(1 for ch in letters if ch.isascii()) / len(letters)
    return ascii_share > 0.9 and bool(re.search(r"\b(the|and|is|of|to|in|for|on|hack|binance)\b", t, re.I))


def norm_title(t):
    return re.sub(r"[^a-z0-9]+", " ", (t or "").lower()).strip()[:90]


def host_of(u):
    return re.sub(r"^www\.", "", (re.match(r"https?://([^/]+)", u or "") or [None, ""])[1].lower())


ABOUT = re.compile(r"binance|\bhack|exploit|heist|stolen|TraderTraitor|North Korea|\bCZ\b", re.I)
RELEVANT = re.compile(r"hack|exploit|security|incident|withdraw|deposit|SAFU|stolen|theft|breach|attack|freez|frozen|reserve|funds|laptop|TraderTraitor|North Korea|DPRK|recover", re.I)
CFG_X_NAMES = {}
for _f in os.listdir(os.path.join(HERE, "events")):
    if _f.endswith(".json") and not _f.endswith((".seed.json", ".media.json")):
        _c = json.load(open(os.path.join(HERE, "events", _f)))
        CFG_X_NAMES[_c["slug"]] = _c.get("x_names") or {}


def build_sources(slug, docs, claim_hits):
    media = {}
    mp = os.path.join(HERE, "events", slug + ".media.json")
    if os.path.exists(mp):
        media = json.load(open(mp))
    thumbs, logos, avatars = media.get("thumbs", {}), media.get("logos", {}), media.get("avatars", {})
    out, seen = [], {}
    items = [d for d in docs if d["kind"] != "comment"]
    # one card per story: a Google News redirect duplicate of a story we hold with its real link is dropped
    items.sort(key=lambda d: ("google.com/goto" in d["url"], "news.google.com" in d["url"]))
    names = {k.lower(): v for k, v in (CFG_X_NAMES.get(slug) or {}).items()}
    for d in items:
        g = group_of(d)
        # Official accounts post about other things too: keep only their posts about the event.
        if g in ("official", "investigators") and d["platform"] == "x" and not RELEVANT.search(d.get("body") or d.get("title") or ""):
            continue
        # Posts pulled by account (Instagram news accounts) cover everything they posted: keep only the ones about the event.
        if d["platform"] == "instagram" and not ABOUT.search((d.get("title") or "") + " " + (d.get("body") or "")):
            continue
        if d["platform"] == "x" and d["voice"] in ("official", "investigator"):
            h = (re.search(r"x\.com/([^/]+)/status", d["url"]) or [None, ""])[1].lower()
            d = dict(d, author=names.get(h, d.get("author")))
        nt = norm_title(d.get("title")) if g == "news" else None
        if nt and nt in seen:
            continue
        if nt:
            seen[nt] = True
        m = d.get("metrics") or {}
        link = linkable(d)
        dom = m.get("domain") or (host_of(m.get("link")) if d["platform"] == "hackernews" else host_of(link)) or None
        hits = claim_hits.get(d["url"], [])
        said = next((h["said"] for h in hits if h.get("said")), None)
        text = (d.get("body") or "").strip()
        excerpt = said or (text[:200].rsplit(" ", 1)[0] + "..." if len(text) > 200 else text) or None
        # No excerpt that only repeats the card's own title (a claim matched in a headline).
        if excerpt and d.get("title") and norm_title(excerpt).startswith(norm_title(d.get("title"))[:50]):
            excerpt = None
        out.append({"id": hashlib.sha1(d["url"].encode()).hexdigest()[:10], "group": g, "platform": d["platform"], "kind": d["kind"], "voice": d["voice"],
                    "title": (d.get("title") or text[:140] or "").strip(), "url": link, "publisher": d.get("author") if (d["voice"] != "public" or d["platform"] == "youtube") else None,
                    "domain": dom, "logo": logos.get(dom) if dom else None, "thumb": thumbs.get(d["url"]), "date": (d.get("published_at") or "")[:19] or None,
                    "views": m.get("views"), "likes": m.get("likes"), "comments": m.get("comments"), "points": m.get("points") or m.get("upvotes") or m.get("score"),
                    "subreddit": m.get("subreddit"), "embed": embed_of(d), "excerpt": excerpt,
                    # a transcript read earlier stays in the stored text even when the flag was reset by a later parse
                    "transcript": bool(m.get("transcript")) or (d["platform"] in ("youtube", "tiktok") and len(text) > 1500),
                    "claims": [{"key": h["key"], "verdict": h["verdict"]} for h in hits][:4],
                    "avatar": avatars.get((re.search(r"x\.com/([^/]+)/status", d["url"]) or [None, ""])[1].lower()) if d["platform"] == "x" else None,
                    "lang": "en" if english(text or d.get("title") or "") else "other",
                    "reach": max([m.get(k) or 0 for k in ("views", "likes", "points", "upvotes", "score", "comments")] + [0])})
    order = {g: i for i, (g, _) in enumerate(GROUPS)}
    out.sort(key=lambda x: (order[x["group"]], -(x["views"] or x["likes"] or x["points"] or x["comments"] or 0), x["date"] or ""), reverse=False)
    return out




def event_graph(ev, seed, facts, claims, sources, money):
    """The page's knowledge graph: the event at the centre; people and organizations, key facts, claims, platforms and
    the money around it; edges say who is the source for what and which platforms carry which claim (with counts)."""
    N, E = [], []
    def node(id, label, kind, **kw):
        N.append({"id": id, "label": label, "kind": kind, **kw})
    def edge(a, b, label, weight=1):
        E.append({"source": a, "target": b, "label": label, "weight": weight})
    node("event", ev["title"], "event")
    cats = [("c-actors", "People and organizations"), ("c-facts", "Key facts"), ("c-claims", "Claims going around"), ("c-platforms", "Where it is discussed"), ("c-money", "The money")]
    for cid, lab in cats:
        node(cid, lab, "category")
        edge("event", cid, "has")
    for i, a in enumerate(seed.get("actors", [])):
        node(f"a-{i}", a["name"], "actor", role=a["role"], sub=a["kind"])
        edge("c-actors", f"a-{i}", "includes")
    for f in facts:
        node(f"f-{f['key']}", f["label"], "fact", value=f["value"], status=f["status"])
        edge("c-facts", f"f-{f['key']}", "includes")
    for c in claims:
        node(f"q-{c['key']}", c["claim"], "claim", verdict=c["verdict"], count=c["spread"]["total"])
        edge("c-claims", f"q-{c['key']}", "includes")
    groups = collections.Counter(x["group"] for x in sources)
    labels = dict(GROUPS)
    for g, n in groups.items():
        node(f"p-{g}", labels.get(g, g), "platform", count=n)
        edge("c-platforms", f"p-{g}", "includes", n)
    for r in money.get("rows", []):
        k = re.sub(r"[^a-z0-9]+", "-", r["chain"].lower())
        node(f"m-{k}", r["chain"], "money", usd=r["usd"])
        edge("c-money", f"m-{k}", "lost", r["usd"])
    # which platforms carry which claim
    per = collections.defaultdict(collections.Counter)
    for x in sources:
        for c in x["claims"]:
            per[c["key"]][x["group"]] += 1
    for k, cnt in per.items():
        for g, n in cnt.items():
            edge(f"p-{g}", f"q-{k}", "carries", n)
    # who is the source for which fact and claim (by the evidence's author)
    actors = [(f"a-{i}", a["name"]) for i, a in enumerate(seed.get("actors", []))]
    def actor_of(author):
        a = (author or "").lower()
        for aid, name in actors:
            for part in re.split(r",\s*| and ", name):
                part = re.sub(r"\s*\(.*?\)", "", part).strip().lower()
                if part and len(part) > 2 and (part in a or a in part):
                    return aid
        return None
    seen = set()
    for f in facts:
        for v in f["evidence"]:
            aid = actor_of(v.get("author"))
            if aid and (aid, f"f-{f['key']}") not in seen:
                seen.add((aid, f"f-{f['key']}"))
                edge(aid, f"f-{f['key']}", "is the source for")
    for c in claims:
        for v in c["evidence"]:
            aid = actor_of(v.get("author"))
            if aid and (aid, f"q-{c['key']}") not in seen:
                seen.add((aid, f"q-{c['key']}"))
                edge(aid, f"q-{c['key']}", "is the evidence for the verdict on")
    return {"nodes": N, "edges": E}


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

    talk = [d for d in docs if d["voice"] in ("press", "public", "creator")]
    claims, claim_hits = [], {}
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
        for d in hits:
            claim_hits.setdefault(d["url"], []).append({"key": c["key"], "verdict": c["verdict"], "claim": c["claim"], "said": says(d)})
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
        if d.get("published_at") and d["voice"] in ("press", "public", "creator"):
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
        items = [d for d in docs if d["platform"] == p and d["kind"] != "comment" and d["voice"] in ("press", "public", "creator")]
        items.sort(key=lambda d: (-reach(d), (d.get("metrics") or {}).get("rank") or 999, d.get("published_at") or ""))
        if items:
            top[p] = [{"title": (d.get("title") or (d.get("body") or "")[:140]).strip(), "url": linkable(d), "date": (d.get("published_at") or "")[:10] or None,
                       "meta": meta(d), "transcript": bool((d.get("metrics") or {}).get("transcript"))} for d in items[:8]]
    sources = build_sources(ev["slug"], docs, claim_hits)
    # The hero is the most-watched video with a picture (a landscape YouTube frame when there is one).
    playable = [x for x in sources if x["thumb"] and x["embed"] and x["platform"] == "youtube"] or [x for x in sources if x["thumb"] and x["embed"]]
    featured = max(playable, key=lambda x: x["reach"])["id"] if playable else None
    top10 = [x["id"] for x in sorted([x for x in sources if x["group"] not in ("official", "investigators") and x["reach"]], key=lambda x: -x["reach"])[:10]]
    colls = []
    for c in sorted(claims, key=lambda c: -c["spread"]["total"]):
        ids = [x["id"] for x in sources if any(k["key"] == c["key"] for k in x["claims"])]
        if len(ids) >= 3:
            colls.append({"id": "claim-" + c["key"], "label": f"Saying \"{c['claim']}\"", "verdict": c["verdict"], "ids": ids})
    wrong = [x["id"] for x in sources if any(k["verdict"] in ("false", "misleading") for k in x["claims"])]
    if wrong:
        colls.insert(0, {"id": "wrong", "label": "Spreading something false or misleading", "verdict": "false", "ids": wrong})
    return {"slug": ev["slug"], "title": ev["title"], "summary": ev.get("summary"), "updatedAt": ev["updated_at"][:19], "window": [ev["window_from"], ev["window_to"]],
            "groups": [{"id": g, "label": lab, "count": sum(1 for x in sources if x["group"] == g)} for g, lab in GROUPS if any(x["group"] == g for x in sources)],
            "featured": featured, "top10": top10, "collections": colls,
            "graph": event_graph(ev, seed, facts, claims, sources, money),
            "sources": sources,
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
export interface TopicGraphNode { id: string; label: string; kind: "event" | "category" | "actor" | "fact" | "claim" | "platform" | "money"; role?: string; sub?: string; value?: string; status?: string; verdict?: Verdict; count?: number; usd?: number }
export interface TopicGraphEdge { source: string; target: string; label: string; weight: number }
export interface TopicGraphData { nodes: TopicGraphNode[]; edges: TopicGraphEdge[] }
export type SourceGroup = "official" | "investigators" | "news" | "youtube" | "tiktok" | "instagram" | "x" | "reddit" | "hackernews";
export interface EventSourceCard {
  id: string; group: SourceGroup; platform: string; kind: string; voice: string; title: string; url: string | null; publisher: string | null;
  domain: string | null; logo: string | null; thumb: string | null; date: string | null; views: number | null; likes: number | null;
  comments: number | null; points: number | null; subreddit: string | null; embed: { type: "youtube" | "tiktok" | "instagram" | "x" | "reddit"; id: string } | null;
  transcript: boolean; excerpt: string | null; claims: { key: string; verdict: Verdict }[];
  avatar: string | null; lang: "en" | "other"; reach: number;
}
export interface EventFile {
  slug: string; title: string; summary: string | null; updatedAt: string; window: [string, string];
  groups: { id: SourceGroup; label: string; count: number }[]; sources: EventSourceCard[];
  featured: string | null; top10: string[]; collections: { id: string; label: string; verdict: Verdict; ids: string[] }[];
  graph: TopicGraphData;
  facts: EventFact[]; moments: EventMoment[]; money: EventMoney; actors: { name: string; role: string; kind: string }[];
  claims: EventClaim[]; watch: EventWatch[];
  coverage: { items: number; byPlatform: { platform: string; label: string; items: number }[]; byVoice: Record<string, number>; hours: [string, Record<string, number>][] };
  top: Record<string, { label: string; items: EventTopItem[] }>;
}

"""
text = header + "export const EVENTS: Record<string, EventFile> = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n"


# ---- Copies for crawlers, AI agents and researchers: static files beside the page (never under /api/, which
# robots.txt closes to every bot), each linked from the page head and from its "Data for AI agents" section.
SITE = "https://venkatapagadala.com"
PUB = os.path.join(HERE, "..", "..", "public", "notebook", "events")
VLABEL = {"true": "True", "false": "False", "misleading": "Misleading", "unconfirmed": "Unconfirmed"}


def md_of(e):
    url = f"{SITE}/notebook/events/{e['slug']}"
    L = [f"# {e['title']}", "", f"Updated {e['updatedAt']} UTC. Source page: {url}", "", e.get("summary") or "", "", "## Key takeaways", ""]
    for f in e["facts"]:
        L.append(f"- **{f['label']}:** {f['value']}" + (f" ({f['note']})" if f.get("note") else ""))
        for ev in f["evidence"]:
            L.append(f"  - \"{ev['quote']}\" ({ev.get('author') or ''} {ev.get('url') or ''})".replace("  )", ")"))
    L += ["", "## What happened (UTC)", ""]
    for m in e["moments"]:
        L.append(f"- {m['at'][:16].replace('T', ' ')}: {m['label']}. \"{m['quote']}\" ({m.get('url') or ''})")
    L += ["", "## The numbers", "", "| Chain | USD | What |", "|---|---|---|"]
    for r in e["money"]["rows"]:
        L.append(f"| {r['chain']} | {r['usd']:,} | {r.get('what') or ''} |")
    for f in e["money"]["frozen"]:
        L.append(f"\nFrozen: about USD {f['usd']:,} by {f['who']}. \"{f['quote']}\" ({f.get('url') or ''})")
    L += ["", "## Is it true? Claims people are making", "", "| Claim | Verdict | Why | Items making it |", "|---|---|---|---|"]
    for c in e["claims"]:
        L.append(f"| {c['claim']} | {VLABEL[c['verdict']]} | {c['explain']} | {c['spread']['total']} |")
    L += ["", "## What happens next", ""]
    for w in e["watch"]:
        L.append(f"- **{w['label']}**" + (f" (expected {w['when']})" if w.get("when") else "") + f": {w.get('note') or ''} \"{w['quote']}\" ({w.get('url') or ''})")
    L += ["", "## People in this story", ""] + [f"- {a['name']}: {a['role']}" for a in e["actors"]]
    L += ["", "## Sources", ""]
    for g in e["groups"]:
        L += [f"### {g['label']} ({g['count']})", ""]
        for x in [x for x in e["sources"] if x["group"] == g["id"]]:
            meta = ", ".join(filter(None, [x.get("publisher") or x.get("domain"), (x.get("date") or "")[:10], f"{x['views']:,} views" if x.get("views") else None]))
            L.append(f"- [{x['title'][:160]}]({x['url']})" + (f" ({meta})" if meta else "") if x.get("url") else f"- {x['title'][:160]}" + (f" ({meta})" if meta else ""))
        L.append("")
    L += ["## How this page is made", "",
          "Every fact, moment and verdict carries the exact words of its source, checked word for word against the stored page before publishing. "
          "Public posts are listed without their authors' names. Data files: "
          f"{url}.json, {url}-sources.csv, {url}.rss.xml. Cite as: {e['title']}, Venkata Pagadala, {url}", ""]
    return "\n".join(L)


def csv_of(e):
    b = io.StringIO()
    w = csv.writer(b)
    w.writerow(["group", "platform", "title", "publisher", "domain", "url", "published", "views", "likes", "comments", "points", "claims"])
    for x in e["sources"]:
        w.writerow([x["group"], x["platform"], x["title"], x.get("publisher") or "", x.get("domain") or "", x.get("url") or "", x.get("date") or "",
                    x.get("views") or "", x.get("likes") or "", x.get("comments") or "", x.get("points") or "", ";".join(f"{c['key']}={c['verdict']}" for c in x["claims"])])
    return b.getvalue()


def rss_of(e):
    url = f"{SITE}/notebook/events/{e['slug']}"
    esc = lambda t: html.escape(t or "", quote=True)
    items = []
    for m in sorted(e["moments"], key=lambda m: m["at"], reverse=True):
        when = dt.datetime.fromisoformat(m["at"].replace("Z", "+00:00")).strftime("%a, %d %b %Y %H:%M:%S +0000")
        items.append(f"<item><title>{esc(m['label'])}</title><link>{url}#what-happened</link><guid isPermaLink=\"false\">{esc(e['slug'] + ':' + m['at'])}</guid>"
                     f"<pubDate>{when}</pubDate><description>{esc(chr(8220) + m['quote'] + chr(8221) + ' Source: ' + (m.get('url') or ''))}</description></item>")
    return ('<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel>'
            f"<title>{esc(e['title'])}</title><link>{url}</link><description>{esc(e.get('summary'))}</description><language>en</language>"
            f"<lastBuildDate>{dt.datetime.fromisoformat(e['updatedAt'] + '+00:00').strftime('%a, %d %b %Y %H:%M:%S +0000')}</lastBuildDate>"
            + "".join(items) + "</channel></rss>\n")


def write_twins(data):
    os.makedirs(PUB, exist_ok=True)
    for slug, e in data.items():
        url = f"{SITE}/notebook/events/{slug}"
        doc = {"about": {"title": e["title"], "page": url, "updated": e["updatedAt"] + "Z", "publisher": "Venkata Pagadala",
                         "method": "Every quote is checked word for word against its stored source before publishing. Public posts carry no author names.",
                         "cite": f"{e['title']}, Venkata Pagadala, {url}"}, **e}
        open(os.path.join(PUB, f"{slug}.json"), "w", encoding="utf8").write(json.dumps(doc, ensure_ascii=False, indent=1))
        open(os.path.join(PUB, f"{slug}.md"), "w", encoding="utf8").write(md_of(e))
        open(os.path.join(PUB, f"{slug}-sources.csv"), "w", encoding="utf8", newline="").write(csv_of(e))
        open(os.path.join(PUB, f"{slug}.rss.xml"), "w", encoding="utf8").write(rss_of(e))


if "--check" in sys.argv:
    if (open(DEST, encoding="utf8").read() if os.path.exists(DEST) else "") != text:
        raise SystemExit("events.ts is stale: run gen_events_ts.py")
    print("events.ts up to date")
else:
    open(DEST, "w", encoding="utf8").write(text)
    write_twins(data)
    print(f"wrote {DEST} and the .json/.md/.csv/.rss.xml copies: {len(text) // 1024} KB; " + "; ".join(f"{k}: {v['coverage']['items']} items, {len(v['claims'])} claims" for k, v in data.items()))
