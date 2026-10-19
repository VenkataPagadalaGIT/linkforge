#!/usr/bin/env python3
"""
Extracts Venkata's LinkedIn articles from the LinkedIn data export into
posts.json, the input that build-linkedin-archive.mjs turns into the
/linkedin/articles pages and the article nodes of the knowledge graph.

Runs on the owner's machine against the export on the SSD; nothing here is
private, but the export is, so only this script lives in the repository.

  python3 -I scripts/linkedin/extract-linkedin-posts.py \
    --export "<LinkedIn-Data>/raw/archive/part1-2026-10-19/extracted" [--export <part2 dir> ...] \
    --manifest "<LinkedIn-Data>/raw/rich-media/manifest-final.json" \
    --items "<LinkedIn-Data>/web/linkedin/items.json" \
    --out "<LinkedIn-Data>/web/linkedin/posts.json"

What it does, per article (Articles/Articles/*.html):
  - reads title, LinkedIn URL, created and published times (GMT, as LinkedIn
    writes them); an article never published is kept as a draft (never public)
  - rebuilds the body from an allowlist of tags; every attribute is dropped
    except a link's href and an image's source
  - swaps each LinkedIn image for this site's copy of the same upload, matched
    by LinkedIn's media asset id (the id in the image URL is the id in the
    rich-media export); images that are not public on this site are dropped
  - collects the people the article links to (linkedin.com/in/...) and tags the
    article with topics from its images and its text
"""
import argparse
import html
import json
import os
import re
import sys
from html.parser import HTMLParser
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

OWN_PROFILE = "venkata-pagadala"
OWN_HOSTS = {"venkatapagadala.com", "www.venkatapagadala.com"}
ASSET = re.compile(r"(?:urn:li:digitalmediaAsset:|/media|/v2/|/image/)([CD][0-9A-Z]{2}\d{2}AQ[\w-]{10,})")

# Site URL for an article: the LinkedIn slug minus the author suffix LinkedIn adds,
# unless an explicit slug reads better. FROZEN once live.
SLUG_OVERRIDES = {
    "google-search-console-updates-algotiyhm-update-sep-venkata-pagadala": "google-search-console-and-algorithm-update-september-2019",
    "i-classified-53-million-keywords-under-second-heres-what-pagadala-yufre": "i-classified-5-3-million-keywords-in-under-a-second",
    "simple-python-script-clustering-keywords-included-venkata-pagadala": "simple-python-script-for-clustering-keywords",
    "top-10-points-improving-your-seo-conceptual-models-mark-pagadala-6hx6e": "improving-seo-with-conceptual-models-mark-williams-cook",
    "233-resources-110-concepts-100-experts-one-free-ai-system-pagadala-xbyse": "233-resources-110-concepts-100-experts-one-free-ai-learning-system",
}

# Topics chosen by hand for the articles published so far (an editorial call, not a keyword count:
# the search-operators guide uses "AI" only in its example queries). New articles fall back to the rules.
TOPIC_OVERRIDES = {
    "233-resources-110-concepts-100-experts-one-free-ai-learning-system": ["ai_llm", "career_education"],
    "i-classified-5-3-million-keywords-in-under-a-second": ["data_engineering", "seo_search", "ai_llm"],
    "improving-seo-with-conceptual-models-mark-williams-cook": ["seo_search", "events_conferences", "google_updates"],
    "brighton-seo-conference-2024": ["events_conferences", "seo_search", "ai_llm"],
    "mastering-google-search-operators-comprehensive-guide": ["seo_search"],
    "simple-python-script-for-clustering-keywords": ["data_engineering", "seo_search"],
    "python-nlp-seo-basic-guide": ["data_engineering", "seo_search", "ai_llm"],
    "google-search-console-and-algorithm-update-september-2019": ["search_console_analytics", "google_updates"],
}

# Topic rules over the title and text (ids are the archive's topic ids).
TOPIC_RULES = [
    ("events_conferences", r"\b(conference|brighton ?seo|tech ?seo ?connect|summit|searchnorwich|keynote)\b"),
    ("seo_search", r"\b(seo|search engines?|keywords?|serps?|rankings?)\b"),
    ("ai_llm", r"\b(ai|llms?|gpt[\w-]*|machine learning|nlp|chatgpt|claude)\b"),
    ("data_engineering", r"\b(python|script|clustering|taxonomy|classif\w*|pipeline|dataset)\b"),
    ("search_console_analytics", r"\bsearch console\b"),
    ("google_updates", r"\b(algorithm update|core update)\b"),
    ("career_education", r"\b(learning system|roadmap|courses?|certifications?|learn python)\b"),
]

ALLOWED = {"p", "h2", "h3", "h4", "ul", "ol", "li", "strong", "em", "a", "blockquote", "pre", "code", "hr", "br", "figure", "figcaption", "img", "sup", "sub"}
# Dropped with everything inside them (never shown as text).
DROP = {"script", "style", "noscript", "template", "svg", "head", "title"}
# LinkedIn's own filler when an image has no alt text.
NO_ALT = re.compile(r"^\s*no alt text provided", re.I)
RENAME = {"b": "strong", "i": "em", "h1": "h2"}
VOID = {"img", "br", "hr"}


class Node:
    def __init__(self, tag, attrs=None):
        self.tag, self.attrs, self.children = tag, dict(attrs or []), []


class TreeBuilder(HTMLParser):
    """A forgiving tree builder for LinkedIn's export HTML (it writes </br>, for one)."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node("#root")
        self.stack = [self.root]

    def handle_starttag(self, tag, attrs):
        n = Node(tag, attrs)
        self.stack[-1].children.append(n)
        if tag not in VOID:
            self.stack.append(n)

    def handle_startendtag(self, tag, attrs):
        self.stack[-1].children.append(Node(tag, attrs))

    def handle_endtag(self, tag):
        if tag in VOID:
            if tag == "br":
                self.stack[-1].children.append(Node("br"))
            return
        for k in range(len(self.stack) - 1, 0, -1):
            if self.stack[k].tag == tag:
                del self.stack[k:]
                return

    def handle_data(self, data):
        self.stack[-1].children.append(data)


def text_of(n):
    if isinstance(n, str):
        return n
    return "".join(text_of(c) for c in n.children)


def find(n, pred):
    if isinstance(n, str):
        return None
    if pred(n):
        return n
    for c in n.children:
        r = find(c, pred)
        if r is not None:
            return r
    return None


def clean_text(s):
    """Site copy rule: no em dashes. LinkedIn's own spacing quirks are kept otherwise."""
    s = re.sub(r"\s*—\s*", " - ", s)
    return s.replace("–", "-")


def clean_href(href):
    href = (href or "").strip()
    if not re.match(r"^https?://", href, re.I):
        return None  # mailto: and anything else: kept as plain text (no addresses in public pages)
    u = urlsplit(href)
    q = [(k, v) for k, v in parse_qsl(u.query, keep_blank_values=True) if not k.lower().startswith("utm_")]
    host = u.netloc.lower()
    if host in OWN_HOSTS:
        # Links to this site become site-relative internal links ("/\\x" or "//x" would leave the site).
        path = "/" + u.path.replace("\\", "/").lstrip("/")
        return urlunsplit(("", "", path, urlencode(q), u.fragment))
    if host in {"apartments.com", "americanaddictioncenters.org", "venkatapagadala.com"} and u.scheme == "http":
        u = u._replace(scheme="https")
    return urlunsplit((u.scheme, u.netloc, u.path, urlencode(q), u.fragment))


def person_from(href, name):
    m = re.match(r"^https?://(?:[a-z]{2,3}\.)?linkedin\.com/in/([^/?#]+)", href or "", re.I)
    if not m or m.group(1).lower() == OWN_PROFILE:
        return None
    name = re.sub(r"\s+", " ", name).strip(" ,.;:")
    name = re.sub(r"\)(?=\S)", ") ", name)
    name = re.split(r"\s+from\s+", name)[0].strip(" ,.;:")  # "Jordan Koene from Previsible"
    if not name or len(name) > 60 or re.search(r"https?:|www\.|/", name):
        return None  # link text that is a URL, not a name
    # Capitalize words written all lower case ("Wil reynolds"), leaving particles like "de" and "van".
    name = " ".join(w[:1].upper() + w[1:] if w.isalpha() and w.islower() and len(w) > 2 and w not in {"van", "von", "der", "den"} else w for w in name.split(" "))
    return {"name": name, "url": f"https://www.linkedin.com/in/{m.group(1)}/"}


class Body:
    """Serializes an article body through the allowlist."""

    def __init__(self, asset_to_idx, public):
        self.asset_to_idx, self.public = asset_to_idx, public
        self.media, self.people, self.links = [], [], []

    def image(self, n):
        src = n.attrs.get("data-media-urn", "") + " " + n.attrs.get("src", "")
        m = ASSET.search(src)
        idx = self.asset_to_idx.get(m.group(1)) if m else None
        if not idx or idx not in self.public:
            return ""
        it = self.public[idx]
        if idx not in self.media:
            self.media.append(idx)
        # The author's own alt text, else empty: the builder fills it with the item's public caption.
        alt = clean_text((n.attrs.get("alt") or "").strip())
        if NO_ALT.match(alt):
            alt = ""
        return (
            f'<img src="{{{{media}}}}/f/{idx}.webp" alt="{html.escape(alt)}" width="{it["width"]}" height="{it["height"]}"'
            f' loading="lazy" decoding="async" data-li-idx="{idx}">'
        )

    def render(self, n, pre=False):
        if isinstance(n, str):
            t = clean_text(n)
            # Code must paste and run: LinkedIn indents it with no-break spaces.
            return html.escape(t.replace("\u00a0", " ") if pre else t, quote=False)
        tag = RENAME.get(n.tag, n.tag)
        if tag in DROP:
            return ""
        if tag == "img":
            return self.image(n)
        if tag == "iframe":
            # An embedded LinkedIn post: keep it as a link to the post (the embed itself is LinkedIn's).
            m = re.search(r"(urn:li:(?:ugcPost|share|activity):\d+)", n.attrs.get("src", ""))
            if not m:
                return ""
            url = f"https://www.linkedin.com/feed/update/{m.group(1)}/"
            if url not in self.links:
                self.links.append(url)
            return f'<p><a href="{url}" target="_blank" rel="noopener noreferrer">Embedded LinkedIn post: view it on LinkedIn</a></p>'
        inner = "".join(self.render(c, pre or tag in {"pre", "code"}) for c in n.children)
        if tag not in ALLOWED:
            return inner  # unwrap div, span and anything unknown
        if tag in VOID:
            return f"<{tag}>"
        if tag == "a":
            href = clean_href(n.attrs.get("href"))
            if not href:
                return inner
            p = person_from(href, text_of(n))
            if p and p["url"] not in [x["url"] for x in self.people]:
                self.people.append(p)
            if href not in self.links:
                self.links.append(href)
            ext = "" if href.startswith("/") else ' target="_blank" rel="noopener noreferrer"'
            return f'<a href="{html.escape(href)}"{ext}>{inner}</a>' if inner.strip() else ""
        if tag == "figure":
            return f"<figure>{inner}</figure>" if "<img" in inner else ""
        if tag in {"p", "li", "figcaption", "h2", "h3", "h4", "strong", "em", "blockquote", "code", "sup", "sub"}:
            plain = re.sub(r"<[^>]+>", "", inner)
            if not plain.strip() and "<img" not in inner:
                return ""
            if tag == "figcaption" and re.fullmatch(r"\s*image credits?:?\s*", plain, re.I):
                return ""
        return f"<{tag}>{inner}</{tag}>"


def plain(html_s):
    t = re.sub(r"</(p|li|h2|h3|h4|figcaption|blockquote|pre)>", "\n", html_s)
    t = re.sub(r"<br>", "\n", t)
    t = html.unescape(re.sub(r"<[^>]+>", "", t))
    return re.sub(r"[ \t]+", " ", re.sub(r"\n\s*\n+", "\n", t)).strip()


def gmt(s):
    m = re.search(r"(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})", s or "")
    return f"{m.group(1)}T{m.group(2)}:00Z" if m else None


def site_slug(li_slug):
    if li_slug in SLUG_OVERRIDES:
        return SLUG_OVERRIDES[li_slug]
    return re.sub(r"-(venkata-)?pagadala(-[a-z0-9]{5})?$", "", li_slug)


def topics_for(title, text, media, public):
    score = {}
    low_t, low = title.lower(), text.lower()
    for tid, pat in TOPIC_RULES:
        n = len(re.findall(pat, low))
        s = (6 if re.search(pat, low_t) else 0) + min(n, 12) * 0.5
        if re.search(pat, low_t) or n >= 3:
            score[tid] = score.get(tid, 0) + s
    for idx in media:
        for t in public[idx]["topics"]:
            if t != "other":
                score[t] = score.get(t, 0) + 1.5
    return [t for t, _ in sorted(score.items(), key=lambda kv: -kv[1])[:4]]


def article(path, asset_to_idx, public):
    tb = TreeBuilder()
    tb.feed(open(path, encoding="utf-8", errors="replace").read())
    body = find(tb.root, lambda n: n.tag == "body") or tb.root
    h1 = find(body, lambda n: n.tag == "h1")
    a = find(h1, lambda n: n.tag == "a") if h1 else None
    lines = [l.strip() for l in (text_of(h1) if h1 else "").split("\n") if l.strip()]
    title = re.sub(r"\s+", " ", clean_text(lines[0])).strip() if lines else ""
    edition = None
    if len(lines) > 1:
        m = re.match(r"(.+?)\s*[—-]\s*Edition #(\d+)", lines[1])
        if m:
            edition = {"series": m.group(1).strip(), "number": int(m.group(2))}
    series_t = find(body, lambda n: "series-title" in n.attrs.get("class", ""))
    series = text_of(series_t).strip() if series_t else (edition or {}).get("series")
    created = find(body, lambda n: n.attrs.get("class") == "created")
    published = find(body, lambda n: n.attrs.get("class") == "published")
    url = (a.attrs.get("href") if a else "") or ""
    li_slug = url.rstrip("/").rsplit("/", 1)[-1] if "/pulse/" in url else ""
    content = next((c for c in body.children if not isinstance(c, str) and c.tag == "div"), None)
    b = Body(asset_to_idx, public)
    # The cover is the first image above the title (not the series logo).
    cover = None
    for c in body.children:
        if isinstance(c, str) or c is h1:
            if c is h1:
                break
            continue
        if c.tag == "img" and "series-logo" not in c.attrs.get("class", ""):
            if b.image(c):
                cover = b.media[-1]
            break
    html_s = b.render(content) if content else ""
    html_s = re.sub(r"(<hr>\s*){2,}", "<hr>", html_s).strip()
    text = plain(html_s)
    pub = gmt(text_of(published)) if published else None
    draft = not pub or not li_slug
    words = len(re.findall(r"\b\w+\b", text))
    return {
        "id": site_slug(li_slug) if li_slug else "draft-" + re.sub(r"\D", "", os.path.basename(path))[:12],
        "type": "article",
        "draft": draft,
        "title": title,
        "series": series,
        "edition": (edition or {}).get("number"),
        "created": gmt(text_of(created)) if created else None,
        "date": pub or (gmt(text_of(created)) if created else None),
        "url": url if li_slug else None,
        "cover": cover,
        "media": b.media,
        "people": b.people,
        "links": [l for l in b.links if not l.startswith("mailto:")],
        "topics": (TOPIC_OVERRIDES.get(site_slug(li_slug)) if li_slug else None) or topics_for(title, text, b.media, public),
        "words": words,
        "excerpt": excerpt(text),
        "html": html_s,
        "engagement": None,
    }


def excerpt(text, n=240):
    # Block breaks become sentence ends, so list items and headings do not run together.
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    t = " ".join(l if re.search(r"[.!?:;]$", l) else l.rstrip(",") + "." for l in lines)
    t = re.sub(r"\s+", " ", t).strip()
    if len(t) <= n:
        return t
    cut = t[:n].rsplit(" ", 1)[0].rstrip(",;:.")
    return cut + "..."


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--export", action="append", required=True)
    ap.add_argument("--manifest", required=True)
    ap.add_argument("--items", required=True)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()

    manifest = json.load(open(a.manifest, encoding="utf-8"))
    asset_to_idx = {}
    for e in manifest:
        m = ASSET.search(e.get("source") or "")
        if m:
            asset_to_idx[m.group(1)] = e["idx"]
    public = {i["idx"]: i for i in json.load(open(a.items, encoding="utf-8")) if not i.get("review")}

    posts = []
    for d in a.export:
        art = os.path.join(d, "Articles", "Articles")
        if not os.path.isdir(art):
            continue
        for f in sorted(os.listdir(art)):
            if f.endswith(".html") and not f.startswith("._"):
                posts.append(article(os.path.join(art, f), asset_to_idx, public))
    ids = [p["id"] for p in posts]
    dup = {i for i in ids if ids.count(i) > 1}
    if dup:
        sys.exit(f"extract-linkedin-posts: duplicate ids {sorted(dup)}")
    posts.sort(key=lambda p: p["date"] or "", reverse=True)
    json.dump(posts, open(a.out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    pub = [p for p in posts if not p["draft"]]
    print(f"wrote {a.out}: {len(pub)} published articles, {len(posts) - len(pub)} drafts (never public)")
    for p in pub:
        print(f"  {p['date'][:10]}  {p['words']:6} words  {len(p['media']):2} media  {len(p['people']):2} people  {','.join(p['topics']):60}  /linkedin/articles/{p['id']}")


if __name__ == "__main__":
    main()
