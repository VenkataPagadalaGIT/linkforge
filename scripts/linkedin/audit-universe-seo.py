"""SEO and rendering audit of every Venkata Pagadala - Universe page (docs/UNIVERSE.md).

Usage (a production build served locally, or the live site):
  curl -s http://127.0.0.1:3402/sitemap.xml | grep -o "<loc>[^<]*</loc>" \
    | sed -E 's#<loc>https://venkatapagadala.com##; s#</loc>##' | sort -u > /tmp/sitemap-paths.txt
  python3 -I scripts/linkedin/audit-universe-seo.py http://127.0.0.1:3402 https://venkatapagadala.com /tmp/sitemap-paths.txt /tmp/universe-seo.json

Checks every Universe URL in the sitemap (and /, /sitemap/universe): status, title, description, canonical (self),
robots, X-Robots-Tag, Open Graph, Twitter card, one H1, JSON-LD, server-rendered words and post links, duplicates,
the old /linkedin redirects and robots.txt. Rules follow cms/rules.json (title <= 60, description 140-160, one H1,
on-site canonical, allowed robots, no em dash). Prints issue counts; the JSON has examples and per-type samples.
"""
import concurrent.futures as cf
import html
import json
import re
import sys
import urllib.error
import urllib.request

BASE, SITE, SITEMAP_FILE, OUT = sys.argv[1:5]
PREFIX = "/venkata-pagadala-universe"


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **k):
        return None


opener = urllib.request.build_opener(NoRedirect)


def fetch(path):
    req = urllib.request.Request(BASE + path, headers={"User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1)"})
    try:
        with opener.open(req, timeout=120) as r:
            return r.status, dict(r.headers), r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, dict(e.headers), ""


def meta(doc, attr, name):
    m = re.search(r'<meta[^>]*\b%s="%s"[^>]*>' % (attr, re.escape(name)), doc)
    if not m:
        return None
    c = re.search(r'content="([^"]*)"', m.group(0))
    return html.unescape(c.group(1)) if c else ""


def text_of(doc):
    body = re.sub(r"<script\b.*?</script>|<style\b.*?</style>|<noscript\b.*?</noscript>", " ", doc, flags=re.S)
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", body))).strip()


def audit(path):
    st, hd, doc = fetch(path)
    r = {"path": path, "status": st}
    if st != 200:
        r["location"] = hd.get("Location") or hd.get("location")
        return r
    t = re.search(r"<title>(.*?)</title>", doc, re.S)
    r["title"] = html.unescape(t.group(1)).strip() if t else None
    r["description"] = meta(doc, "name", "description")
    c = re.search(r'<link rel="canonical" href="([^"]*)"', doc)
    r["canonical"] = c.group(1) if c else None
    r["robots"] = meta(doc, "name", "robots")
    r["googlebot"] = meta(doc, "name", "googlebot")
    r["x_robots"] = hd.get("X-Robots-Tag") or hd.get("x-robots-tag")
    for k in ["og:title", "og:description", "og:url", "og:image", "og:type", "og:site_name"]:
        r[k] = meta(doc, "property", k)
    for k in ["twitter:card", "twitter:image", "twitter:title"]:
        r[k] = meta(doc, "name", k)
    r["h1"] = len(re.findall(r"<h1\b", doc))
    types, bad = [], 0
    for blk in re.findall(r'<script type="application/ld\+json"[^>]*>(.*?)</script>', doc, re.S):
        try:
            d = json.loads(blk)
            for x in d if isinstance(d, list) else [d]:
                types.append(x.get("@type"))
        except Exception:
            bad += 1
    r["ld_types"], r["ld_bad"] = types, bad
    txt = text_of(doc)
    r["text_words"] = len(txt.split())
    r["links_internal"] = len(set(re.findall(r'href="(/[^"#?]*)"', doc)))
    r["post_links"] = len(set(re.findall(r'href="(%s/linkedin/(?:posts|articles)/[^"#?]+)"' % PREFIX, doc)))
    r["emdash"] = "—" in (r["title"] or "") + (r["description"] or "") + (r["og:title"] or "") + (r["og:description"] or "")
    return r


paths = [p for p in open(SITEMAP_FILE).read().split() if p.startswith(PREFIX) or p == "/sitemap/universe"]
paths = sorted(set(paths + ["/"]))
with cf.ThreadPoolExecutor(8) as ex:
    results = list(ex.map(audit, paths))

redirects = {}
for old in ["/linkedin", "/linkedin/posts", "/linkedin/articles", "/linkedin/topics/seo-and-search", "/sitemap/linkedin"]:
    st, hd, _ = fetch(old)
    redirects[old] = [st, hd.get("Location") or hd.get("location")]
st, _, robots_txt = fetch("/robots.txt")

issues = {}


def flag(kind, path, detail=""):
    issues.setdefault(kind, []).append(f"{path} {detail}".strip())


titles, descs = {}, {}
for r in results:
    p = r["path"]
    if r["status"] != 200:
        flag("status", p, str(r["status"]))
        continue
    want = SITE + ("" if p == "/" else p)
    if not r["title"]:
        flag("title missing", p)
    elif len(r["title"]) > 60:
        flag("title > 60", p, f'({len(r["title"])}) {r["title"]}')
    titles.setdefault(r["title"], []).append(p)
    d = r["description"]
    if not d:
        flag("description missing", p)
    elif not 140 <= len(d) <= 160:
        flag("description not 140-160", p, f"({len(d)})")
    descs.setdefault(d, []).append(p)
    if r["canonical"] != want:
        flag("canonical not self", p, f'{r["canonical"]} != {want}')
    rb = (r["robots"] or "").replace(" ", "")
    if not rb.startswith("index,follow"):
        flag("robots not index,follow", p, r["robots"] or "(none)")
    if r["x_robots"]:
        flag("X-Robots-Tag header", p, r["x_robots"])
    for k in ["og:title", "og:description", "og:url", "og:image", "og:type"]:
        if not r[k]:
            flag(f"{k} missing", p)
    if r["og:url"] and r["og:url"] != want:
        flag("og:url != canonical", p, r["og:url"])
    if not r["twitter:card"]:
        flag("twitter:card missing", p)
    if r["og:image"] and not r["og:image"].startswith("https://"):
        flag("og:image not absolute https", p, r["og:image"])
    if r["og:image"] and "media.venkatapagadala.com" in r["og:image"]:
        flag("og:image on media host (R2, not live yet)", p)
    if r["h1"] != 1:
        flag("h1 count != 1", p, str(r["h1"]))
    if r["ld_bad"]:
        flag("JSON-LD does not parse", p)
    if not r["ld_types"]:
        flag("no JSON-LD", p)
    if r["emdash"]:
        flag("em dash in title/description", p)
for t, ps in titles.items():
    if t and len(ps) > 1:
        flag("duplicate title", ps[0], f"x{len(ps)}: {t}")
for d, ps in descs.items():
    if d and len(ps) > 1:
        flag("duplicate description", ps[0], f"x{len(ps)}")

kinds = {"hub": [], "post": [], "article": [], "topic": [], "index": []}
for r in results:
    p = r["path"]
    if r["status"] != 200:
        continue
    k = "post" if "/linkedin/posts/" in p else "article" if "/linkedin/articles/" in p else "topic" if "/topics/" in p else "index" if p.endswith(("/posts", "/articles")) else "hub" if p == PREFIX else None
    if k:
        kinds[k].append(r)


def stats(rs, key):
    v = sorted(x[key] for x in rs)
    return {"n": len(v), "min": v[0], "median": v[len(v) // 2], "max": v[-1]} if v else {}


summary = {
    "pages": len(results),
    "status_200": sum(r["status"] == 200 for r in results),
    "issues": {k: {"count": len(v), "examples": v[:6]} for k, v in sorted(issues.items(), key=lambda kv: -len(kv[1]))},
    "rendering": {k: {"words": stats(v, "text_words"), "post_links": stats(v, "post_links"), "ld_types": sorted({t for x in v for t in x["ld_types"] if isinstance(t, str)})} for k, v in kinds.items()},
    "redirects": redirects,
    "robots_txt_blocks_universe": bool(re.search(r"Disallow:\s*/venkata-pagadala-universe", robots_txt)),
    "samples": {k: {f: v[0].get(f) for f in ["path", "title", "description", "canonical", "robots", "og:title", "og:url", "og:image", "og:type", "twitter:card", "ld_types"]} for k, v in kinds.items() if v},
}
json.dump(summary, open(OUT, "w"), indent=1, ensure_ascii=False)
print(json.dumps({"pages": summary["pages"], "ok": summary["status_200"], "issue_counts": {k: v["count"] for k, v in summary["issues"].items()}}, indent=1))
