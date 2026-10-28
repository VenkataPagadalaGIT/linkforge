#!/usr/bin/env python3
"""
Photos for people in public roles, from Wikimedia Commons only.

For each person with a Wikidata id (set by hand in a 360 file, never matched by
name alone), read the item's image (P18), then the Commons file's license and
author. Only freely licensed files are used (CC0, CC BY, CC BY-SA, public
domain), and each one is stored with its author, license and file page so the
site can credit it. The thumbnail is saved to public/ai/people/<slug>.<ext>.
People without a free photo get initials on the site instead; LinkedIn and
company headshots are never copied.

Run: python3 fetch_people_photos.py [--refresh] [--only slug,slug]
"""
import html, json, os, re, sys, time, urllib.error, urllib.parse, urllib.request
sys.path.insert(0, os.path.dirname(__file__))
from db import sql, query

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "..", "public", "ai", "people")
UA = "mono-mind-ai-graph (people photos from Wikimedia Commons; contact via venkatapagadala.com)"
FREE = re.compile(r"^(CC0|CC BY(-SA)? [0-9.]+|CC BY(-SA)?|Public domain|PD.*)", re.I)


def get(url, tries=5):
    """Polite GET: on 429 or 503 wait as long as the server asks (Retry-After), then try again."""
    for attempt in range(tries):
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            if e.code not in (429, 503) or attempt == tries - 1:
                raise
            wait = int(e.headers.get("Retry-After") or 0) or 15 * (attempt + 1)
            print(f"  {e.code}: waiting {wait}s as asked")
            time.sleep(min(wait, 120))


def lit(v):
    return "NULL" if v is None else "'" + str(v).replace("'", "''") + "'"


def plain(h):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", h or ""))).strip()


def credit_from_wikitext(title):
    """Some files keep the author only in the page text ("Credit: ..." or "|author=...")."""
    q = urllib.parse.urlencode({"action": "query", "titles": title, "prop": "revisions", "rvprop": "content", "rvslots": "main", "format": "json"})
    page = next(iter(json.loads(get("https://commons.wikimedia.org/w/api.php?" + q))["query"]["pages"].values()))
    txt = page.get("revisions", [{}])[0].get("slots", {}).get("main", {}).get("*", "")
    m = re.search(r"\|\s*author\s*=\s*([^\n|]+)", txt, re.I) or re.search(r"credit:\s*([^\n]+)", txt, re.I)
    if not m:
        return ""
    t = re.sub(r"\[\[(?:[^|\]]*\|)?([^\]]+)\]\]", r"\1", m.group(1))
    t = re.sub(r"\[https?://\S+\s+([^\]]+)\]", r"\1", t)
    return re.sub(r"\{\{[^}]*\}\}|'{2,}", "", t).strip(" *")


def main():
    refresh = "--refresh" in sys.argv
    os.makedirs(OUT, exist_ok=True)
    only = set(sys.argv[sys.argv.index("--only") + 1].split(",")) if "--only" in sys.argv else None
    rows = [r for r in query("SELECT slug, wikidata, COALESCE(image_path,'-') FROM ontology.person WHERE wikidata IS NOT NULL AND NOT photo_blocked ORDER BY slug")
            if not only or r[0] in only]
    st, got, none = [], 0, []
    for slug, qid, have in rows:
        if have != '-' and not refresh:
            continue
        time.sleep(1.5)
        claims = json.loads(get(f"https://www.wikidata.org/w/api.php?action=wbgetclaims&entity={qid}&property=P18&format=json"))
        files = [c["mainsnak"]["datavalue"]["value"] for c in claims.get("claims", {}).get("P18", []) if c["mainsnak"].get("datavalue")]
        if not files:
            none.append(slug)
            continue
        title = "File:" + files[0]
        q = urllib.parse.urlencode({"action": "query", "titles": title, "prop": "imageinfo", "iiprop": "url|extmetadata|mime", "iiurlwidth": 320, "format": "json"})
        info = next(iter(json.loads(get("https://commons.wikimedia.org/w/api.php?" + q))["query"]["pages"].values()))["imageinfo"][0]
        meta = info.get("extmetadata", {})
        lic = plain((meta.get("LicenseShortName") or {}).get("value"))
        if not FREE.match(lic):
            print(f"{slug}: skipped, license not free ({lic!r})")
            none.append(slug)
            continue
        ext = {"image/png": "png", "image/webp": "webp"}.get(info.get("mime"), "jpg")
        thumb = info.get("thumburl") or info["url"]
        open(os.path.join(OUT, f"{slug}.{ext}"), "wb").write(get(thumb))
        credit = next((plain((meta.get(k) or {}).get("value")) for k in ("Artist", "Credit", "Attribution") if plain((meta.get(k) or {}).get("value"))), "")
        if not credit:
            credit = credit_from_wikitext(title) or "author on the file page"
        sql(f"UPDATE ontology.person SET image_path={lit(f'/ai/people/{slug}.{ext}')}, image_credit={lit(credit[:160])}, image_license={lit(lic)},"
                  f" image_license_url={lit((meta.get('LicenseUrl') or {}).get('value'))}, image_page={lit(info.get('descriptionurl'))}, updated_at=now() WHERE slug={lit(slug)};")
        got += 1
        print(f"{slug}: {files[0][:60]} | {lic} | {credit[:60]}")
        time.sleep(1)
    print(f"photos saved: {got}; no free photo: {len(none)} ({', '.join(none)})")


if __name__ == "__main__":
    main()
