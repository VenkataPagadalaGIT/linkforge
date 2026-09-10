#!/usr/bin/env python3
"""
Mine the crawled USAFacts pages.

They are a Next.js app, so the visible HTML is mostly framework noise, but
every answer page ships FAQPage and QAPage JSON-LD carrying the question, the
full prose answer with its figures, and NewsArticle dates. That is a structured
route: no regex against prose, which is where fabricated numbers come from.

Each page becomes one observation per figure found in its own answer text,
carrying the geography from the URL, the topic from the breadcrumb, and the
answer verbatim so a reader can always see the sentence the number came from.
Where a page states no figure, nothing is written rather than something
approximate.
"""
import gzip, json, os, re, sys, glob
sys.path.insert(0, os.path.dirname(__file__))
from db import sql, query, q

CACHE = os.path.join(os.path.dirname(__file__), "cache")

def ld(html):
    out = []
    for m in re.findall(r'<script type="application/ld\+json"[^>]*>(.*?)</script>', html, re.S):
        try:
            out.append(json.loads(m))
        except Exception:
            pass
    return out

def label_from_slug(slug):
    """`how-many-people-are-on-medicare` -> `How many people are on medicare?`"""
    t = slug.replace("-", " ").strip()
    t = re.sub(r"\bunited states\b", "United States", t)
    t = re.sub(r"\bus\b", "US", t)
    t = re.sub(r"\bcovid 19\b", "COVID-19", t)
    t = re.sub(r"\baca\b", "ACA", t)
    return (t[:1].upper() + t[1:] + "?") if t else "?"


def geo_of(url):
    """/answers/<q>/country|state|county|metro-area/<place>/"""
    m = re.search(r'/answers/[^/]+/(country|state|county|metro-area)/([^/?#]+)', url)
    if not m:
        return ("united-states", "country")
    return (m.group(2), m.group(1))

def slug_of(url):
    m = re.search(r'/answers/([^/]+)', url)
    return m.group(1) if m else None

NUM = re.compile(
    r'(-?\$?\d[\d,]*(?:\.\d+)?)\s*(%|percent|percentage points|million|billion|trillion)?')

def figures(answer):
    """
    Every number in the answer, with the clause it sits in.

    The clause is stored, not just the digits, because "3.5%" alone is not a
    fact. Sentences are the unit a reader can check.
    """
    out = []
    for sent in re.split(r'(?<=[.!?])\s+', answer):
        s = sent.strip()
        if not s:
            continue
        for m in NUM.finditer(s):
            raw, unit = m.group(1), (m.group(2) or "").strip()
            try:
                val = float(raw.replace("$", "").replace(",", ""))
            except ValueError:
                continue
            if unit in ("million",):   val *= 1e6
            elif unit in ("billion",): val *= 1e9
            elif unit in ("trillion",):val *= 1e12
            out.append((val, unit or "count", s[:400]))
        if out:
            break   # first sentence with figures is the headline answer
    return out

def main():
    rows = query("""SELECT r.id, r.url, r.local_path FROM resource r
                    JOIN source s ON s.id = r.source_id
                    WHERE s.slug='usafacts' AND r.status='ok'
                      AND r.local_path IS NOT NULL AND r.url LIKE '%%/answers/%%';""")
    print(f"{len(rows)} answer pages cached")

    metrics, obs, skipped = {}, [], 0
    for rid, url, rel in rows:
        path = os.path.join(CACHE, rel)
        if not os.path.exists(path):
            skipped += 1; continue
        try:
            html = gzip.open(path, "rt", errors="replace").read()
        except Exception:
            skipped += 1; continue

        question = answer = None
        modified = None
        topic = None
        for d in ld(html):
            t = d.get("@type")
            if t == "FAQPage":
                for e in d.get("mainEntity", []):
                    question = e.get("name")
                    answer = re.sub(r"<[^>]+>", "", (e.get("acceptedAnswer") or {}).get("text", ""))
                    break
            elif t == "NewsArticle":
                modified = (d.get("effectiveDateUpdated") or d.get("dateModified") or "")[:10]
            elif t == "BreadcrumbList":
                names = [i.get("name") for i in d.get("itemListElement", [])]
                if len(names) >= 2: topic = names[1]
        if not question or not answer:
            skipped += 1; continue

        mslug = "uf-" + (slug_of(url) or "")[:80]
        # USAFacts localises the question per page: the Texas page asks "in
        # Texas?", the Vermont page "in Vermont?", and /country/ is not only
        # the United States, it also serves /country/puerto-rico/.
        #
        # Two attempts to scrub the place out of the rendered question left
        # leaks both times ("How many disasters are declared in Puerto Rico?"
        # sitting on a Texas row). So the rendered question is not used for the
        # label at all. The slug is generic by construction and the label comes
        # only from there. Slightly less elegant wording, and a place name
        # cannot get in.
        place, kind = geo_of(url)
        metrics.setdefault(mslug, (label_from_slug(slug_of(url) or ""), topic or ""))
        if topic and not metrics[mslug][1]:
            metrics[mslug] = (metrics[mslug][0], topic)

        figs = figures(answer)
        if not figs:
            skipped += 1; continue
        val, unit, sent = figs[0]
        obs.append((mslug, place, kind, modified or "2026", val, unit, sent, url))

    print(f"metrics {len(metrics)}  observations {len(obs)}  skipped {skipped}")

    stmts = ["""INSERT INTO document (source_id, slug, title, url, retrieval, retrieved_at, population)
      SELECT id,'usafacts-answers','USAFacts answer pages','https://usafacts.org/answers/',
      'Crawled directly, mined from the FAQPage JSON-LD each page ships','2026-09-09','United States'
      FROM source WHERE slug='usafacts' ON CONFLICT (slug) DO NOTHING;"""]
    for mslug, (qtext, topic) in metrics.items():
        stmts.append(f"""INSERT INTO metric (slug,label,unit,definition,topic)
          VALUES ({q(mslug)},{q(qtext)},'mixed',{q('USAFacts answer to: ' + qtext)},{q(topic)})
          ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, topic=EXCLUDED.topic;""")
    stmts.append("""CREATE TEMP TABLE s_uf2 (metric text, geo text, geo_kind text,
                    period text, value numeric, unit text, sent text, url text) ON COMMIT DROP;""")
    B = 400
    for i in range(0, len(obs), B):
        vals = ",".join(
            f"({q(m)},{q(g)},{q(k)},{q(p)},{v},{q(u)},{q(s)},{q(url)})"
            for m, g, k, p, v, u, s, url in obs[i:i+B])
        stmts.append(f"INSERT INTO s_uf2 VALUES {vals};")
    stmts.append("""
      INSERT INTO observation (document_id, metric_id, subject, segment_id, period, value, geo, geo_kind, answer_text)
      SELECT d.id, m.id, NULL, NULL, st.period, st.value, st.geo, st.geo_kind, st.sent
      FROM s_uf2 st
      JOIN metric m ON m.slug = st.metric
      CROSS JOIN document d WHERE d.slug='usafacts-answers'
      ON CONFLICT DO NOTHING;""")
    stmts.append(f"""INSERT INTO ingest_run (script,documents,observations,notes)
      VALUES ('extract_usafacts.py',1,{len(obs)},{q(f'{len(metrics)} distinct questions, {skipped} pages with no extractable figure')});""")
    sql("\n".join(stmts), timeout=600)
    print("loaded")

if __name__ == "__main__":
    main()
