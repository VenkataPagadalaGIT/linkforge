"""
Archived event pulls (raw/events/<slug>/) -> events.document, plus the transcribe step.
Free to re-run. Names of private people are never stored: an author is kept only for official accounts,
news organizations and YouTube channels (publishers); everything else is the platform and the text.
Called by event_collect.py (modes: transcribe, parse).
"""
import datetime as dt, gzip, json, os, re, urllib.request
import urllib.error
from event_collect import load, save, upsert

HERE = os.path.dirname(os.path.abspath(__file__))
CREATOR_MIN = 50_000
NEWS_ORGS = {"cointelegraph", "coindesk", "theblock__", "decryptmedia", "watcherguru", "kobeissiletter", "wublockchain", "reuters", "business", "cnbc",
             "bloombergcrypto", "evolving.ai", "evolving_ai"}


def sc_of(d, slug=None, name=None):
    """structuredContent of an MCP result, or the full file it was handed over as. The file's link expires, so the
    first download is archived beside the call ("<name>_full") and later parses read the archive."""
    r = (d or {}).get("result") or {}
    sc = r.get("structuredContent") or {}
    dl = sc.get("delivery") or {}
    if dl.get("mode") != "artifact":
        return sc
    if slug and name:
        full = load(slug, name + "_full")
        if full is not None:
            return full.get("structuredContent") or full
    url = next((a["downloadUrl"] for a in dl.get("artifacts", []) if a.get("filename") == "complete-result.json"), None)
    if not url:
        return {}
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "curl/8.4"}), timeout=120) as f:
            full = json.loads(f.read())
    except urllib.error.HTTPError:
        return {}  # link expired: whatever was parsed before stays in the database (the upsert keeps the longer body)
    if slug and name:
        save(slug, name + "_full", full)
    return full.get("structuredContent") or full


def ts(v):
    if v in (None, ""):
        return None
    if isinstance(v, (int, float)):
        return dt.datetime.fromtimestamp(v / 1000 if v > 1e12 else v, dt.timezone.utc).isoformat()
    return str(v)


def num(v):
    """123, "1,234", "65,133 views" or "1.2K" -> int."""
    if v is None:
        return None
    m = re.search(r"([0-9][0-9,]*\.?[0-9]*)\s*([KkMmBb])?\b", str(v))
    if not m:
        return None
    x = float(m.group(1).replace(",", ""))
    return int(x * {"k": 1e3, "m": 1e6, "b": 1e9}.get((m.group(2) or "").lower(), 1))


def minutes(d):
    """"3:58" or "1:02:10" -> minutes."""
    try:
        parts = [int(x) for x in str(d).split(":")]
    except ValueError:
        return None
    s = 0
    for x in parts:
        s = s * 60 + x
    return s / 60


THIS_EVENT = re.compile(r"6(\.\d)? ?b|billion|biggest|largest|north korea|record|heist|explained|20 minutes", re.I)
OLD_HACKS = re.compile(r"2019|2022|\b40 ?m|570|7,000 bitcoin", re.I)


def records(slug, name):
    st = load(slug, name) or {}
    return [r for r in st.get("records") or [] if isinstance(r, dict) and not r.get("error")]


def handle_of(url):
    m = re.match(r"https?://(?:www\.)?(?:x|twitter)\.com/([^/]+)/status/", url or "")
    return m.group(1) if m else None


def parse(c):
    slug, docs, notes = c["slug"], [], []
    official = {h.lower() for h in c.get("x_profiles", [])}
    # News (DataForSEO Google News). Google's own redirect links cannot be resolved (403): kept as text only.
    for i, _ in enumerate(c.get("news_queries", [])):
        d = load(slug, f"news-{i}")
        if not d or d.get("status_code") != 20000:
            continue
        for it in ((d["tasks"][0].get("result") or [{}])[0].get("items") or []):
            if it.get("type") != "news_search" or not it.get("url"):
                continue
            goto = "google.com/goto" in it["url"]
            docs.append({"url": it["url"], "platform": "news", "kind": "article", "voice": "press", "title": it.get("title"),
                         "author": None if goto else (it.get("source") or (it.get("domain") or "").removeprefix("www.")),
                         "published_at": (it.get("timestamp") or "")[:19] or None, "body": " ".join(filter(None, [it.get("title"), it.get("snippet")])),
                         "metrics": {"rank": it.get("rank_absolute"), "linkable": not goto}, "source_call": f"news-{i}"})
    notes.append(f"news {sum(1 for d in docs if d['platform'] == 'news')}")
    # X posts Google shows for the topic
    d = load(slug, "serp-x")
    if d and d.get("status_code") == 20000:
        for it in ((d["tasks"][0].get("result") or [{}])[0].get("items") or []):
            h = handle_of(it.get("url"))
            if it.get("type") == "organic" and h:
                docs.append({"url": it["url"], "platform": "x", "kind": "post", "voice": "official" if h.lower() in official else ("press" if h.lower() in NEWS_ORGS else "public"),
                             "author": h if (h.lower() in official or h.lower() in NEWS_ORGS) else None, "title": it.get("title"),
                             "body": " ".join(filter(None, [it.get("title"), it.get("description")])), "source_call": "serp-x"})
    # Bright Data: X posts from the official and investigator accounts
    for r in records(slug, "bd-x-profiles"):
        h = (r.get("user_posted") or handle_of(r.get("url")) or "").lstrip("@")
        docs.append({"url": r.get("url"), "platform": "x", "kind": "post", "voice": "investigator" if h.lower() == "zachxbt" else "official", "author": r.get("name") or h,
                     "title": (r.get("description") or "")[:140], "body": r.get("description"), "published_at": ts(r.get("date_posted")),
                     "metrics": {k: num(r.get(k)) for k in ("likes", "views", "replies", "reposts", "quotes") if r.get(k) is not None}, "source_call": "bd-x-profiles"})
    # Bright Data: TikTok, Instagram and Reddit posts found by keyword (public voices: no names)
    for r in records(slug, "bd-tiktok"):
        # A verified account or one with 50K+ followers publishes to the public like a YouTube channel: named, with its cover.
        creator = bool(r.get("is_verified")) or (num(r.get("profile_followers")) or 0) >= CREATOR_MIN
        docs.append({"url": r.get("url"), "platform": "tiktok", "kind": "video", "voice": "creator" if creator else "public", "title": (r.get("description") or "")[:140],
                     "author": r.get("profile_username") if creator else None,
                     "body": r.get("description"), "published_at": ts(r.get("create_time") or r.get("date_posted")), "source_call": "bd-tiktok",
                     "metrics": {"views": num(r.get("play_count")), "likes": num(r.get("digg_count")), "comments": num(r.get("comment_count")), "shares": num(r.get("share_count"))}})
    for r in records(slug, "bd-instagram") + records(slug, "bd-instagram-profiles"):
        acct = (r.get("user_posted") or "").lower()
        docs.append({"url": r.get("url"), "platform": "instagram", "kind": "post", "voice": "press" if acct in {a.lower() for a in c.get("instagram_accounts", [])} else "public",
                     "author": r.get("user_posted") if acct in {a.lower() for a in c.get("instagram_accounts", [])} else None, "title": (r.get("description") or "")[:140],
                     "body": r.get("description"), "published_at": ts(r.get("date_posted")), "source_call": "bd-instagram",
                     "metrics": {"likes": num(r.get("likes")), "comments": num(r.get("num_comments")), "views": num(r.get("video_view_count") or r.get("views"))}})
    for r in records(slug, "bd-reddit"):
        docs.append({"url": r.get("url"), "platform": "reddit", "kind": "thread", "voice": "public", "title": r.get("title"),
                     "body": " ".join(filter(None, [r.get("title"), r.get("description")])), "published_at": ts(r.get("date_posted")), "source_call": "bd-reddit",
                     "metrics": {"upvotes": num(r.get("num_upvotes")), "comments": num(r.get("num_comments")), "subreddit": r.get("community_name")}})
    # Reddit threads read in full: the comments become their own documents
    for n in range(10):
        d = load(slug, f"reddit-thread-{n}")
        if not d:
            continue
        sc = sc_of(d)
        url = sc.get("url") or (sc.get("thread") or {}).get("url")
        for k, cm in enumerate(sc.get("comments") or []):
            body = cm.get("body") or cm.get("text")
            if url and body:
                docs.append({"url": f"{url}#c{cm.get('id') or k}", "platform": "reddit", "kind": "comment", "voice": "public", "title": body[:140], "body": body,
                             "published_at": ts(cm.get("createdAt") or cm.get("created_utc") or cm.get("date")), "source_call": f"reddit-thread-{n}",
                             "metrics": {"score": num(cm.get("score") or cm.get("upvotes"))}})
    # YouTube search results, with transcripts where we bought them
    sc = sc_of(load(slug, "youtube"), slug, "youtube")
    for v in sc.get("videos") or sc.get("items") or []:
        vid = v.get("videoId") or v.get("id")
        if not vid:
            continue
        tr = sc_of(load(slug, f"yt-{vid}"), slug, f"yt-{vid}")
        text = tr.get("transcriptText") or tr.get("transcript") or tr.get("text") or " ".join(ch.get("text", "") for ch in tr.get("chunks") or [] if isinstance(ch, dict)) or None
        text = text if isinstance(text, str) else None
        docs.append({"url": f"https://www.youtube.com/watch?v={vid}", "platform": "youtube", "kind": "video", "voice": "public", "title": v.get("title"),
                     "author": v.get("channelName") or v.get("channelTitle"),
                     "published_at": ts(v.get("publishedAt") or v.get("published") or v.get("uploadDate")), "body": " ".join(filter(None, [v.get("title"), v.get("description"), text])),
                     "metrics": {"views": num(v.get("viewCount") or v.get("views")), "transcript": bool(text)}, "source_call": "youtube"})
    # TikTok and Instagram transcripts bought for the most-viewed posts
    for n in range(10):
        for plat, nm in (("tiktok", f"tt-{n}"), ("instagram", f"ig-{n}")):
            d = load(slug, nm)
            if not d:
                continue
            tr = sc_of(d, slug, nm)
            said = tr.get("transcriptText") or (tr.get("transcript") if isinstance(tr.get("transcript"), str) else None)
            text = " ".join(filter(None, [tr.get("caption"), said]))
            url = (tr.get("sourceUrl") or tr.get("url") or "").rstrip("/")
            if url and text:
                # same post as the discovery record: the upsert keeps the longer body, so the transcript is added, not a second card
                rec = next((r for r in records(slug, "bd-tiktok") + records(slug, "bd-instagram-profiles") if (r.get("url") or "").rstrip("/") == url), {})
                acct = (rec.get("user_posted") or "").lower()
                press = acct in {a.lower() for a in c.get("instagram_accounts", [])}
                creator = plat == "tiktok" and (bool(rec.get("is_verified")) or (num(rec.get("profile_followers")) or 0) >= CREATOR_MIN)
                docs.append({"url": rec.get("url") or url, "platform": plat, "kind": "video" if plat == "tiktok" or said else "post",
                             "voice": "press" if press else ("creator" if creator else "public"),
                             "author": rec.get("user_posted") if press else (rec.get("profile_username") if creator else None), "title": None, "body": text,
                             "source_call": nm, "metrics": {"transcript": bool(said)}})
    docs = [d for d in docs if d.get("url")]
    upsert(slug, docs)
    by = {}
    for d in docs:
        by[d["platform"]] = by.get(d["platform"], 0) + 1
    print("parsed:", ", ".join(f"{k} {v}" for k, v in sorted(by.items())))
    return 0


def transcribe(c, b, top, mcps_call):
    """Transcripts for the most-viewed YouTube and TikTok videos and Instagram posts, and full Reddit threads."""
    slug = c["slug"]
    since = c["window"][0]
    sc = sc_of(load(slug, "youtube"))
    vids = [v for v in sc.get("videos") or sc.get("items") or [] if (v.get("videoId") or v.get("id"))]
    vids = [v for v in vids if THIS_EVENT.search(v.get("title") or "") and not OLD_HACKS.search(v.get("title") or "")]  # search returns old hacks too
    vids.sort(key=lambda v: -(num(v.get("viewCount") or v.get("views")) or 0))
    for v in vids[:top]:
        vid = v.get("videoId") or v.get("id")
        mins = minutes(v.get("duration")) or 30
        mcps_call(slug, b, f"yt-{vid}", "youtube_transcribe", {"videoId": vid}, int(200 + 2 * mins + 10))
    tt = sorted(records(slug, "bd-tiktok"), key=lambda r: -(num(r.get("play_count")) or 0))
    for n, r in enumerate(tt[:top]):
        mcps_call(slug, b, f"tt-{n}", "tiktok_video_transcribe", {"url": r["url"]}, 220)
    ig = [r for r in records(slug, "bd-instagram") + records(slug, "bd-instagram-profiles") if re.search(r"binance", r.get("description") or "", re.I)]
    ig = sorted(ig, key=lambda r: -(num(r.get("likes")) or 0))
    for n, r in enumerate(ig[:max(2, top // 2)]):
        mcps_call(slug, b, f"ig-{n}", "instagram_media_download", {"url": r["url"], "includeTranscript": True, "downloadMedia": False}, 230)
    rd = sorted(records(slug, "bd-reddit"), key=lambda r: -(num(r.get("num_comments")) or 0))
    for n, r in enumerate(rd[:5]):
        mcps_call(slug, b, f"reddit-thread-{n}", "reddit_thread", {"url": r["url"], "maxComments": 60, "idempotencyKey": f"{slug}-thread-{n}"}, 160)
