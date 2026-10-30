#!/usr/bin/env python3
"""
Pictures for an event's sources, stored on our own site so the page never depends on another site's CDN:

  thumbnails   one small JPEG (480 px wide) per source: YouTube's thumbnail, the image Google News shows
               for a story, a page's og:image, an X post's photo or card image, a TikTok/Instagram cover
  logos        each publisher's favicon (64 px PNG)
  platforms    TikTok, YouTube, Instagram, X, Reddit, Hacker News, Binance marks from Simple Icons (CC0)

Thumbnails are link previews at preview size; the video itself only ever plays through the platform's
own embedded player. Writes public/events/<slug>/thumbs/, public/events/logos/, public/events/platforms/
and data/corpus/events/<slug>.media.json (document url -> thumbnail and logo). Free; re-runs skip
what is already stored.

Run: python3 event_media.py binance-hack-2026
"""
import gzip, hashlib, html, json, os, re, subprocess, sys, urllib.parse, urllib.request
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from db import CONTAINER, DB, USER, q

HERE = os.path.dirname(os.path.abspath(__file__))
PUBLIC = os.path.join(HERE, "..", "..", "public", "events")
BROWSER = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36"
ICONS = {"tiktok": "tiktok", "youtube": "youtube", "instagram": "instagram", "x": "x", "reddit": "reddit", "hackernews": "ycombinator", "binance": "binance"}


def rows(sql_):
    p = subprocess.run(["docker", "exec", "-i", CONTAINER, "psql", "-U", USER, "-d", DB, "-t", "-A", "-c",
                        "SELECT COALESCE(jsonb_agg(t), '[]'::jsonb)::text FROM (" + sql_ + ") t"], capture_output=True, text=True)
    return json.loads(p.stdout.strip() or "[]")


def arch(slug, name):
    p = os.path.join(HERE, "raw", "events", slug, re.sub(r"[^A-Za-z0-9._-]+", "_", name)[:150] + ".json.gz")
    if not os.path.exists(p):
        return None
    with gzip.open(p, "rb") as f:
        return json.loads(f.read())


def fetch(url, timeout=25, limit=6_000_000):
    req = urllib.request.Request(url, headers={"User-Agent": BROWSER, "Accept": "image/avif,image/webp,image/*,*/*;q=0.8"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        data = r.read(limit + 1)
        return data if len(data) <= limit else None


def thumb(url, out):
    """Download an image and store a 480 px wide JPEG; returns the public path or None."""
    if os.path.exists(out):
        return out
    try:
        data = fetch(url)
    except Exception:  # noqa: BLE001 - a missing preview is not fatal: the card shows the platform mark
        return None
    if not data or len(data) < 1500:
        return None
    tmp = out + ".src"
    open(tmp, "wb").write(data)
    r = subprocess.run(["sips", "-Z", "480", "-s", "format", "jpeg", "-s", "formatOptions", "70", tmp, "--out", out], capture_output=True)
    os.remove(tmp)
    return out if r.returncode == 0 and os.path.exists(out) else None


def first(*vals):
    for v in vals:
        if isinstance(v, list):
            v = next((x for x in v if x), None)
        if isinstance(v, str) and v.startswith("http"):
            return v
    return None


def main(slug):
    os.makedirs(os.path.join(PUBLIC, slug, "thumbs"), exist_ok=True)
    os.makedirs(os.path.join(PUBLIC, "logos"), exist_ok=True)
    os.makedirs(os.path.join(PUBLIC, "platforms"), exist_ok=True)
    docs = rows(f"SELECT url, platform, kind, voice, source_call, metrics FROM events.document WHERE event_slug={q(slug)} AND kind <> 'comment'")
    img = {}
    # Google News thumbnails (DataForSEO keeps them on its own CDN)
    for i in range(12):
        d = arch(slug, f"news-{i}")
        for it in (((d or {}).get("tasks") or [{}])[0].get("result") or [{}])[0].get("items") or [] if d else []:
            if it.get("url") and it.get("image_url"):
                img.setdefault(it["url"], it["image_url"])
    for d in docs:
        u, sc = d["url"], d.get("source_call") or ""
        if d["platform"] == "youtube":
            vid = re.search(r"v=([\w-]{11})", u)
            if vid:
                img.setdefault(u, f"https://i.ytimg.com/vi/{vid.group(1)}/hqdefault.jpg")
        elif sc.startswith("page-") or sc.startswith("binance-"):
            a = arch(slug, sc) or {}
            raw = a.get("html") or ""
            m = re.search(r'<meta[^>]+property=["\']og:image(?::secure_url)?["\'][^>]+content=["\']([^"\']+)', raw) or re.search(r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image', raw)
            if m:
                img.setdefault(u, urllib.parse.urljoin(u, html.unescape(m.group(1))))
        elif sc.startswith("x-"):
            t = ((arch(slug, sc) or {}).get("tweet") or {})
            media = t.get("media") or {}
            img.setdefault(u, first([p.get("url") for p in media.get("photos") or []], [v.get("thumbnail_url") for v in media.get("videos") or []]) or "")
    for name in ("bd-x-profiles", "bd-tiktok", "bd-instagram", "bd-instagram-profiles", "bd-reddit"):
        for r in (arch(slug, name) or {}).get("records") or []:
            if isinstance(r, dict) and r.get("url"):
                img.setdefault(r["url"], first(r.get("photos"), r.get("external_image_urls"), r.get("preview_image"), r.get("cover"), r.get("origin_cover"),
                                               r.get("thumbnail"), r.get("display_url"), r.get("image"), r.get("images")) or "")
    media, ok, miss = {"thumbs": {}, "logos": {}, "platforms": {}, "avatars": {}}, 0, 0
    # Posts by private people (TikTok, Instagram, Reddit, X) get no stored picture: their covers often show faces,
    # so the card shows the post's text and the post itself only plays in the platform's own player.
    private = {d["url"] for d in docs if d["voice"] == "public" and d["platform"] in ("tiktok", "instagram", "reddit", "x")}
    # Profile photos of the official and investigator accounts (organizations and public roles), for their cards.
    os.makedirs(os.path.join(PUBLIC, slug, "avatars"), exist_ok=True)
    media["avatars"] = {}
    for r in (arch(slug, "bd-x-profiles") or {}).get("records") or []:
        h, src = (r.get("user_posted") or "").lstrip("@"), r.get("profile_image_link") or ""
        if not h or not src or h.lower() in media["avatars"]:
            continue
        out = os.path.join(PUBLIC, slug, "avatars", re.sub(r"[^A-Za-z0-9_-]", "_", h.lower()) + ".jpg")
        if thumb(src.replace("_normal.", "_400x400."), out):
            media["avatars"][h.lower()] = "/" + os.path.relpath(out, os.path.join(PUBLIC, "..")).replace(os.sep, "/")
    for u in private:
        old = os.path.join(PUBLIC, slug, "thumbs", hashlib.sha1(u.encode()).hexdigest()[:16] + ".jpg")
        if os.path.exists(old):
            os.remove(old)
    for u, src in img.items():
        if not src or u in private:
            continue
        out = os.path.join(PUBLIC, slug, "thumbs", hashlib.sha1(u.encode()).hexdigest()[:16] + ".jpg")
        if thumb(src, out):
            media["thumbs"][u] = "/" + os.path.relpath(out, os.path.join(PUBLIC, "..")).replace(os.sep, "/")
            ok += 1
        else:
            miss += 1
    # Publisher logos: every non-Google domain a source or a Hacker News story points to
    domains = set()
    for d in docs:
        link = (d.get("metrics") or {}).get("link") or d["url"]
        h = urllib.parse.urlparse(link).netloc.lower().removeprefix("www.")
        if h and "google.com" not in h:
            domains.add(h)
    for h in sorted(domains):
        out = os.path.join(PUBLIC, "logos", h + ".png")
        if not os.path.exists(out):
            try:
                data = fetch(f"https://www.google.com/s2/favicons?domain={h}&sz=64")
                if data and len(data) > 400:  # Google's blank globe for unknown domains is tiny: skip it
                    open(out, "wb").write(data)
            except Exception:  # noqa: BLE001
                pass
        if os.path.exists(out):
            media["logos"][h] = f"/events/logos/{h}.png"
    # Platform marks (Simple Icons, CC0), pinned to the version resolved today
    ver = json.loads(fetch("https://data.jsdelivr.com/v1/packages/npm/simple-icons/resolved?specifier=latest"))["version"]
    for key, icon in ICONS.items():
        out = os.path.join(PUBLIC, "platforms", key + ".svg")
        if not os.path.exists(out):
            try:
                open(out, "wb").write(fetch(f"https://cdn.jsdelivr.net/npm/simple-icons@{ver}/icons/{icon}.svg"))
            except Exception:  # noqa: BLE001
                continue
        media["platforms"][key] = f"/events/platforms/{key}.svg"
    media["simpleIconsVersion"] = ver
    json.dump(media, open(os.path.join(HERE, "events", slug + ".media.json"), "w"), indent=1)
    print(f"{slug}: {ok} thumbnails stored, {miss} could not be fetched, {len(media['logos'])} publisher logos, {len(media['platforms'])} platform marks (simple-icons {ver})")


if __name__ == "__main__":
    main(sys.argv[1])
