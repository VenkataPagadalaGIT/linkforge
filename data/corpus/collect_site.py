#!/usr/bin/env python3
"""
The company's whole public web presence, birth to now, into ontology.site_page:
every page of each site listed in ontology/site_sources.json, with its title,
description, the publish date the page states, its full text (word count),
the team and topics it is filed under, and the authors it names. Pages on a
"titles" site (product docs, support articles, a marketplace) are stored as
titles only.

Free. One request a second per host; robots.txt read with our own user agent
(the parser's default agent can be refused, which it treats as "disallow all").
Pages already stored keep their text unless --refresh; failed pages are retried
next run.

After the pages, the company_site rows of ontology.footprint are rebuilt from
the authors the pages name (a byline is a public role on the company's own
site). --people runs only that step.

Run: python3 collect_site.py [--only host] [--refresh] [--limit N] [--people]
"""
import datetime as dt, html, json, os, re, sys, time, urllib.error, urllib.request, urllib.robotparser
sys.path.insert(0, os.path.dirname(__file__))
from db import sql, query

HERE = os.path.dirname(os.path.abspath(__file__))
SITES = json.load(open(os.path.join(HERE, "ontology", "site_sources.json"), encoding="utf8"))["sites"]
UA = "mono-mind-ai-graph (company site reader; contact via venkatapagadala.com)"
MONTHS = "January|February|March|April|May|June|July|August|September|October|November|December"
DATE_TEXT = re.compile(rf"\b({MONTHS}|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\.? (\d{{1,2}}),?\s*(20\d\d)\b")
STOP_AUTHORS = {"affiliations", "affiliation", "published", "acknowledgments", "acknowledgements", "citation", "abstract", "contents", "doi", "introduction", "summary", "team", "topics", "share"}


def lit(v):
    if v is None or v == "":
        return "NULL"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float)):
        return str(v)
    return "'" + str(v).replace("'", "''") + "'"


def arr(xs):
    return "ARRAY[" + ",".join(lit(x) for x in xs) + "]::text[]" if xs else "NULL"


def get(url, tries=4):
    for attempt in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"})
            with urllib.request.urlopen(req, timeout=60) as r:
                return r.status, r.geturl(), r.read().decode("utf8", "replace")
        except urllib.error.HTTPError as e:
            if e.code in (429, 503) and attempt < tries - 1:
                time.sleep(int(e.headers.get("Retry-After") or 0) or 20 * (attempt + 1))
                continue
            return e.code, url, ""
        except (urllib.error.URLError, TimeoutError, ConnectionError):
            if attempt < tries - 1:
                time.sleep(10 * (attempt + 1))
                continue
            return 0, url, ""


def to_date(s):
    if not s:
        return None
    m = re.match(r"(\d{4}-\d{2}-\d{2})", s)
    if m:
        return m.group(1)
    m = DATE_TEXT.search(s)
    if m:
        n = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"].index(m.group(1)[:3].lower()) + 1
        return f"{m.group(3)}-{n:02d}-{int(m.group(2)):02d}"
    return None


def text_lines(fragment):
    t = re.sub(r"<(script|style|noscript|svg|nav|header|footer|form)\b.*?</\1>", " ", fragment, flags=re.S | re.I)
    t = re.sub(r"<br\s*/?>|</(p|div|li|h[1-6]|tr|td|th|section|article|blockquote|figcaption|dt|dd|d-title|d-byline|d-article|d-appendix|summary)>", "\n", t, flags=re.I)
    t = html.unescape(re.sub(r"<[^>]+>", "", t)).replace(" ", " ")
    return [re.sub(r"[ \t]+", " ", l).strip() for l in t.split("\n") if l.strip()]


def meta(raw, name):
    m = re.search(rf'<meta (?:property|name)="{re.escape(name)}" content="([^"]*)"', raw) or re.search(rf'<meta content="([^"]*)" (?:property|name)="{re.escape(name)}"', raw)
    return html.unescape(m.group(1)).strip() if m else None


def ld_blocks(raw):
    out = []
    for m in re.finditer(r'<script type="application/ld\+json"[^>]*>(.*?)</script>', raw, re.S):
        try:
            out.append(json.loads(m.group(1)))
        except ValueError:
            continue
    return out


def looks_like_name(s):
    s = s.strip(" ,*∗†‡§.")
    if not (3 <= len(s) <= 40) or re.search(r"\d|@|http|\(|\)|:|\bet al\b", s):
        return None
    words = s.split()
    small = {"de", "van", "von", "der", "da", "del", "la", "le", "di", "du"}
    if not (2 <= len(words) <= 4) or not all(w[0].isupper() or w.lower() in small for w in words):
        return None
    if s.lower() in STOP_AUTHORS:
        return None
    return s


def extract(raw):
    """title, description, published, modified, lines, team, topics, authors."""
    title = meta(raw, "og:title")
    if not title:
        m = re.search(r"<title>(.*?)</title>", raw, re.S)
        title = html.unescape(m.group(1)).strip() if m else None
    if title:
        title = re.sub(r"\s*[\\|–-]\s*(Anthropic|Transformer Circuits Thread|Alignment Science Blog|Claude(?: Docs| Help Center)?)\s*$", "", title).strip()
    desc = meta(raw, "description") or meta(raw, "og:description")
    published = modified = None
    authors = []
    for b in ld_blocks(raw):
        for it in (b if isinstance(b, list) else [b]):
            if not isinstance(it, dict):
                continue
            published = published or to_date(it.get("datePublished"))
            modified = modified or to_date(it.get("dateModified"))
            au = it.get("author")
            for a in (au if isinstance(au, list) else [au] if au else []):
                if isinstance(a, dict) and a.get("@type") == "Person" and a.get("name"):
                    authors.append(a["name"].strip())
    published = published or to_date(meta(raw, "article:published_time"))
    for m in re.finditer(r'<meta name="citation_author" content="([^"]*)"', raw):
        authors.append(html.unescape(m.group(1)).strip())
    fm = re.search(r"<d-front-matter>\s*<script[^>]*>(.*?)</script>\s*</d-front-matter>", raw, re.S)
    if fm:
        try:
            for a in json.loads(fm.group(1)).get("authors") or []:
                if isinstance(a, dict) and a.get("author"):
                    authors.append(a["author"].strip())
        except ValueError:
            pass
    main = re.search(r"<main\b.*?</main>", raw, re.S | re.I) or re.search(r"<article\b.*?</article>", raw, re.S | re.I) or re.search(r"<d-article\b.*?</d-article>", raw, re.S | re.I)
    lines = text_lines(main.group(0) if main else raw)
    # Bylines, dates, team and topics often sit outside the article body (Distill's d-byline, the page header), so
    # those are read from the whole page; the stored text is the body.
    full = text_lines(raw) if main else lines
    # A page cannot be published after the day it is read: docs and help pages mention future dates (a model's
    # deprecation date, the end of a program), which the text fallback below used to take as the publication date.
    today = dt.date.today().isoformat()
    if published and published > today:
        published = None
    if not published:
        for i, l in enumerate(full[:80]):
            d = to_date(l)
            # Distill pages split "October 6," and "2025" over two lines.
            if not d and re.match(rf"^({MONTHS}) \d{{1,2}},?$", l) and i + 1 < len(full) and re.match(r"^20\d\d$", full[i + 1]):
                d = to_date(f"{l} {full[i + 1]}")
            if d and d <= today:
                published = d
                break
    # anthropic.com marks the team and topics as links in the article header; read those markers straight from the HTML.
    tm = re.search(r'href="/research/team/[^"]+"[^>]*>([^<]{1,60})<', raw)
    team = html.unescape(tm.group(1)).strip() if tm else None
    topics = []
    for t in re.findall(r'href="/search\?topic=[^"]+"[^>]*>([^<]{1,60})<', raw):
        t = html.unescape(t).strip()
        if t and t not in topics and t.lower() not in ("view more", "see more", "see more..."):
            topics.append(t)
    # Author lists in the page text (Transformer Circuits, Alignment Science): the lines after an "Authors" heading.
    for i, l in enumerate(full):
        if l in ("Authors", "Author", "Authors:", "Written by"):
            for t in full[i + 1:i + 40]:
                if t.lower().strip(":") in STOP_AUTHORS or t.lower().startswith(("affiliation", "published", "acknowledg")):
                    break
                for piece in re.split(r",|·|•| and ", t):
                    n = looks_like_name(piece)
                    if n:
                        authors.append(n)
            break
    seen, out = set(), []
    for a in authors:
        if a.lower() not in seen:
            seen.add(a.lower())
            out.append(a)
    return title, desc, published, modified, lines, team, topics, out


def urls_for(site):
    base = f"https://{site['host']}"
    if site.get("sitemap"):
        _, _, body = get(site["sitemap"])
        locs = re.findall(r"<loc>([^<]+)</loc>", body)
        if locs and all(l.endswith(".xml") for l in locs[:5]):  # a sitemap index
            more = []
            for l in locs:
                _, _, b = get(l)
                more += re.findall(r"<loc>([^<]+)</loc>", b)
                time.sleep(1)
            locs = more
    else:
        _, final, body = get(site["index"])
        locs = [final]
        for h in set(re.findall(r'href="([^"#?]+)"', body)):
            if h.startswith("http") and not h.startswith(base):
                continue
            locs.append(h if h.startswith("http") else base + ("/" if not h.startswith("/") else "") + h)
    inc, exc = site.get("include"), site.get("exclude")
    out = []
    for u in sorted(set(locs)):
        u = re.sub(r"/index\.html$", "/", u)
        if (inc and not re.search(inc, u)) or (exc and re.search(exc, u)):
            continue
        out.append(u)
    return out


def section_of(u, base):
    path = u[len(base):].strip("/")
    return path.split("/")[0] if path else "(home)"


def read_site(site, limit, refresh):
    base = f"https://{site['host']}"
    rp = urllib.robotparser.RobotFileParser()
    _, _, robots = get(base + "/robots.txt")
    rp.parse(robots.splitlines())
    want = [u for u in urls_for(site) if rp.can_fetch(UA, u)]
    titles_only = site.get("content") == "titles"
    titles_re = site.get("titles_only")
    have = set() if refresh else {r[0] for r in query(f"SELECT url FROM ontology.site_page WHERE host={lit(site['host'])} AND http_status=200 AND (content IS NOT NULL OR kind='listing')")}
    todo = [u for u in want if u not in have][: limit or None]
    print(f"{site['host']}: {len(want)} pages allowed, {len(todo)} to read", flush=True)
    ent = f"(SELECT id FROM ontology.entity WHERE slug={lit(site['entity'])})"
    for n, u in enumerate(todo, 1):
        status, final, raw = get(u)
        if status != 200 or not raw:
            sql(f"INSERT INTO ontology.site_page (entity_id, url, host, section, http_status) VALUES ({ent}, {lit(u)}, {lit(site['host'])}, {lit(section_of(u, base))}, {status})"
                " ON CONFLICT (url) DO UPDATE SET http_status=EXCLUDED.http_status, retrieved_at=current_date;")
            time.sleep(1)
            continue
        title, desc, published, modified, lines, team, topics, authors = extract(raw)
        listing = titles_only or bool(titles_re and re.search(titles_re, u))
        text = None if listing else "\n".join(lines)
        words = len(text.split()) if text else None
        sql("INSERT INTO ontology.site_page (entity_id, url, host, section, kind, title, description, published_on, modified_on, content, word_count, team, topics, authors, http_status, retrieved_at)"
            f" VALUES ({ent}, {lit(u)}, {lit(site['host'])}, {lit(section_of(u, base))}, {lit('listing' if listing else 'page')}, {lit(title)}, {lit(desc)}, {lit(published)}, {lit(modified)},"
            f" {lit(text)}, {lit(words)}, {lit(team)}, {arr(topics)}, {lit(json.dumps(authors, ensure_ascii=False))}::jsonb, 200, current_date)"
            " ON CONFLICT (url) DO UPDATE SET host=EXCLUDED.host, section=EXCLUDED.section, kind=EXCLUDED.kind, title=EXCLUDED.title, description=EXCLUDED.description,"
            " published_on=COALESCE(EXCLUDED.published_on, ontology.site_page.published_on), modified_on=EXCLUDED.modified_on, content=EXCLUDED.content, word_count=EXCLUDED.word_count,"
            " team=EXCLUDED.team, topics=EXCLUDED.topics, authors=EXCLUDED.authors, http_status=200, retrieved_at=current_date;")
        if n % 50 == 0:
            print(f"  {site['host']}: {n}/{len(todo)}", flush=True)
        time.sleep(1)
    c = query(f"SELECT count(*), count(*) FILTER (WHERE content IS NOT NULL), count(published_on), count(*) FILTER (WHERE jsonb_array_length(authors) > 0) FROM ontology.site_page WHERE host={lit(site['host'])}")[0]
    print(f"{site['host']}: stored {c[0]}, with text {c[1]}, dated {c[2]}, with authors {c[3]}", flush=True)


def people():
    """Authors named on the company's own sites become public-footprint rows (source company_site)."""
    rows = query("""SELECT e.slug, sp.host, sp.url, sp.title, sp.published_on, sp.authors::text FROM ontology.site_page sp JOIN ontology.entity e ON e.id = sp.entity_id
                    WHERE jsonb_array_length(sp.authors) > 0 ORDER BY sp.published_on""")
    by = {}
    for slug, host, url, title, pub, authors in rows:
        for a in json.loads(authors):
            k = (slug, re.sub(r"[^a-z]+", "-", a.lower()).strip("-"))
            by.setdefault(k, {"name": a, "pages": []})["pages"].append({"host": host, "url": url, "title": title, "date": pub or None})
    st = ["DELETE FROM ontology.footprint WHERE source='company_site';"]
    for (slug, sid), r in by.items():
        pages = sorted(r["pages"], key=lambda p: p["date"] or "", reverse=True)
        hosts = sorted({p["host"] for p in pages})
        dates = [p["date"] for p in pages if p["date"]]
        detail = {"pages": len(pages), "hosts": hosts, "recent": pages[:3], "tier": "confirmed"}
        st.append("INSERT INTO ontology.footprint (entity_id, source, source_id, name, headline, profile_url, evidence_url, first_seen, last_seen, is_current, detail)"
                  f" VALUES ((SELECT id FROM ontology.entity WHERE slug={lit(slug)}), 'company_site', {lit(sid)}, {lit(r['name'])},"
                  f" {lit('Named author on ' + str(len(pages)) + ' page' + ('s' if len(pages) != 1 else '') + ' of ' + ', '.join(hosts))}, NULL, {lit(pages[0]['url'])},"
                  f" {lit(min(dates) if dates else None)}, {lit(max(dates) if dates else None)}, NULL, {lit(json.dumps(detail, ensure_ascii=False))}::jsonb);")
    sql("\n".join(st), timeout=300)
    print(f"people named on the company's sites: {len(by)}")


def main():
    only = sys.argv[sys.argv.index("--only") + 1] if "--only" in sys.argv else None
    limit = int(sys.argv[sys.argv.index("--limit") + 1]) if "--limit" in sys.argv else None
    refresh = "--refresh" in sys.argv
    if "--people" not in sys.argv:
        for site in SITES:
            if only and site["host"] != only:
                continue
            read_site(site, limit, refresh)
    people()


if __name__ == "__main__":
    main()
