#!/usr/bin/env python3
"""
Load every Pew fact sheet table into research_corpus.

Reads the archived markdown in data/pew/ rather than the network, so a reload
is deterministic and a refresh is an explicit re-fetch followed by a diff.

Everything goes in, including the historical trend rows back to 2000. The site
only renders the current period, but "we pulled it and dropped it on the floor"
was the exact problem this database exists to end.
"""
import json, os, re, sys, glob
sys.path.insert(0, os.path.dirname(__file__))
from db import sql, q, query

ROOT = os.path.join(os.path.dirname(__file__), "..", "pew")

# --- segment vocabulary -----------------------------------------------------
SEG = {
 "Ages 18-29":"18-29","30-49":"30-49","50-64":"50-64","65+":"65+","Ages 18-49":"18-49","50+":"50plus",
 "Men":"men","Women":"women",
 "White":"race-white","Black":"race-black","Hispanic":"race-hispanic","Asian*":"race-asian","Asian":"race-asian",
 "Less than $30,000":"inc-lt30","$30,000- $69,999":"inc-30-70","$30,000-$69,999":"inc-30-70",
 "$70,000- $99,999":"inc-70-100","$100,000+":"inc-100",
 "Less than $30,000 (NPORS)":"inc-lt30","$30,000- $69,999 (NPORS)":"inc-30-70",
 "$70,000- $99,999 (NPORS)":"inc-70-100","$100,000+ (NPORS)":"inc-100",
 "$30,000- $49,999":"inc-30-50-legacy","$50,000- $74,999":"inc-50-75-legacy","$75,000+":"inc-75-legacy",
 "High school or less":"edu-hs","HS or less":"edu-hs","Some college":"edu-some",
 "College graduate":"edu-grad","College+":"edu-grad",
 "Less than high school graduate":"edu-lths-legacy","High school graduate":"edu-hsgrad-legacy",
 "Urban":"urban","Suburban":"suburban","Rural":"rural",
 "Rep/Lean Rep":"party-rep","Dem/Lean Dem":"party-dem",
 "U.S. adults":None, "US adults":None,
}
SEG_META = {
 "men":("gender","Men",2194,3.0,1),"women":("gender","Women",2758,2.5,2),
 "18-29":("age","18 to 29",480,5.6,10),"30-49":("age","30 to 49",1399,3.4,11),
 "50-64":("age","50 to 64",1274,3.6,12),"65+":("age","65 and over",1813,3.0,13),
 "18-49":("age","18 to 49",None,None,14),"50plus":("age","50 and over",None,None,15),
 "race-white":("race","White",3304,2.3,20),"race-black":("race","Black",512,6.0,21),
 "race-hispanic":("race","Hispanic",757,5.0,22),"race-asian":("race","Asian",211,8.9,23),
 "inc-lt30":("income","Under $30K",939,4.5,30),"inc-30-70":("income","$30K to $70K",1533,3.6,31),
 "inc-70-100":("income","$70K to $100K",692,5.1,32),"inc-100":("income","$100K and over",1629,3.1,33),
 "inc-30-50-legacy":("income","$30K to $50K (pre-2023 bands)",None,None,34),
 "inc-50-75-legacy":("income","$50K to $75K (pre-2023 bands)",None,None,35),
 "inc-75-legacy":("income","$75K and over (pre-2023 bands)",None,None,36),
 "edu-hs":("education","High school or less",1175,3.8,40),
 "edu-some":("education","Some college",1587,3.4,41),
 "edu-grad":("education","College graduate",2215,2.7,42),
 "edu-lths-legacy":("education","Less than high school (legacy band)",None,None,43),
 "edu-hsgrad-legacy":("education","High school graduate (legacy band)",None,None,44),
 "urban":("community","Urban",1394,3.6,50),"suburban":("community","Suburban",2334,2.8,51),
 "rural":("community","Rural",1235,3.8,52),
 "party-rep":("party","Rep / lean Rep",2234,2.8,60),"party-dem":("party","Dem / lean Dem",2446,2.8,61),
}

DOCS = {
 "Social Media Fact Sheet": dict(
   slug="pew-social-media-2025", url="https://www.pewresearch.org/internet/fact-sheet/social-media/",
   published="2025-11-20", sample=5022, fs="2025-02-05", fe="2025-06-18", moe=1.9,
   population="US adults"),
 "Mobile Fact Sheet": dict(
   slug="pew-mobile-2025", url="https://www.pewresearch.org/internet/fact-sheet/mobile/",
   published="2025-11-20", sample=5022, fs="2025-02-05", fe="2025-06-18", moe=1.9,
   population="US adults"),
 "Internet, Broadband Fact Sheet": dict(
   slug="pew-internet-broadband-2025", url="https://www.pewresearch.org/internet/fact-sheet/internet-broadband/",
   published="2025-11-20", sample=5022, fs="2025-02-05", fe="2025-06-18", moe=1.9,
   population="US adults"),
 "News Platform Fact Sheet": dict(
   slug="pew-news-platform-2025", url="https://www.pewresearch.org/journalism/fact-sheet/news-platform-fact-sheet/",
   published="2025-09-25", sample=None, fs=None, fe=None, moe=None, population="US adults"),
 "Social Media and News Fact Sheet": dict(
   slug="pew-social-news-2025", url="https://www.pewresearch.org/journalism/fact-sheet/social-media-and-news-fact-sheet/",
   published="2025-09-25", sample=None, fs=None, fe=None, moe=None, population="US adults"),
 "News Influencers Fact Sheet": dict(
   slug="pew-news-influencers-2025", url="https://www.pewresearch.org/journalism/fact-sheet/news-influencers-fact-sheet/",
   published="2025-11-04", sample=None, fs=None, fe=None, moe=None, population="US adults"),
}

METRICS = [
 ("ever_use","Ever uses the platform","percent","% of the group who say they ever use the named platform."),
 ("internet_use","Uses the internet","percent","% of the group who say they use the internet."),
 ("home_broadband","Subscribes to home broadband","percent","% of the group who say they have a home broadband subscription."),
 ("owns_cellphone","Owns a cellphone","percent","% who own a cellphone of any kind."),
 ("owns_smartphone","Owns a smartphone","percent","% who own a smartphone."),
 ("owns_featurephone","Owns a cellphone but not a smartphone","percent","% who own a cellphone that is not a smartphone."),
 ("smartphone_dependent","Smartphone-only internet user","percent","% who own a smartphone and do not subscribe to home broadband."),
 ("news_platform_use","Gets news on this platform","percent","% who say they get news at least sometimes from the named platform."),
 ("news_platform_preference","Prefers this platform for news","percent","% naming the platform as their preferred way to get news."),
 ("news_on_social","Gets news on social media","percent","% who get news on social media, by frequency."),
 ("news_influencer_use","Gets news from news influencers","percent","% who regularly get news from influencers on social media."),
 ("news_freq_often","Gets news here often","percent","% who say they often get news from the named channel."),
 ("news_freq_sometimes","Gets news here sometimes","percent","% who say they sometimes get news from the named channel."),
 ("news_freq_rarely","Gets news here rarely","percent","% who say they rarely get news from the named channel."),
 ("news_freq_never","Never gets news here","percent","% who say they never get news from the named channel."),
 ("news_influencer_seek","Seeks out news influencers","percent","% of those who get news from influencers who say they were looking for it, rather than coming across it."),
 ("news_influencer_stumble","Comes across news influencers","percent","% of those who get news from influencers who say they happen to come across it."),
 ("influencer_reason_major","Major reason for following news influencers","percent","% naming this as a MAJOR reason they get news from influencers."),
 ("influencer_reason_minor","Minor reason for following news influencers","percent","% naming this as a minor reason."),
 ("influencer_reason_none","Not a reason for following news influencers","percent","% saying this is not a reason."),
 ("influencer_affiliation","Believed affiliation of news influencers","percent","% giving this answer about whether news influencers work for a news organisation."),
]

def num(s):
    s = (s or "").replace("%","").replace(",","").strip()
    return float(s) if re.fullmatch(r'\d+(\.\d+)?', s) else None

def period_of(label, doc_published):
    """A row label that is a year or a date becomes the period; otherwise the doc year."""
    lab = (label or "").strip()
    if re.fullmatch(r'\d{4}', lab): return lab
    m = re.fullmatch(r'(\d{1,2})/(\d{1,2})/(\d{4})', lab)
    if m: return m.group(3)
    return doc_published[:4]

def main():
    corpora = []
    for f in ("pew.json", "pew-news.json"):
        p = os.path.join(ROOT, f)
        if os.path.exists(p): corpora.append(json.load(open(p)))
    tables = [t for c in corpora for t in c["tables"]]

    stmts = []
    stmts.append(f"""INSERT INTO source (slug,name,homepage,kind,access_note) VALUES
      ('pew','Pew Research Center','https://www.pewresearch.org','survey',
       'robots.txt declares Content-Signal: ai-train=yes, search=yes, ai-input=yes. Every post has a machine-readable .md twin. No scraper used.')
      ON CONFLICT (slug) DO UPDATE SET access_note=EXCLUDED.access_note;""")

    for slug,label,unit,defn in METRICS:
        stmts.append(f"INSERT INTO metric (slug,label,unit,definition) VALUES ({q(slug)},{q(label)},{q(unit)},{q(defn)}) ON CONFLICT (slug) DO UPDATE SET definition=EXCLUDED.definition;")

    for sheet,d in DOCS.items():
        stmts.append(f"""INSERT INTO document (source_id,slug,title,url,published_on,retrieval,retrieved_at,sample_size,field_start,field_end,moe_overall,population)
          SELECT id,{q(d['slug'])},{q(sheet)},{q(d['url'])},{q(d['published'])},
          'Pew machine-readable .md endpoint, archived in data/pew/','2026-09-09',
          {q(d['sample'])},{q(d['fs'])},{q(d['fe'])},{q(d['moe'])},{q(d['population'])}
          FROM source WHERE slug='pew'
          ON CONFLICT (slug) DO UPDATE SET title=EXCLUDED.title, published_on=EXCLUDED.published_on;""")

    for sl,(dim,lab,n,moe,order) in SEG_META.items():
        stmts.append(f"""INSERT INTO segment (slug,dimension,label,n,moe,sort_order,source_doc_id)
          VALUES ({q(sl)},{q(dim)},{q(lab)},{q(n)},{q(moe)},{order},
                  (SELECT id FROM document WHERE slug='pew-social-media-2025'))
          ON CONFLICT (slug) DO UPDATE SET n=EXCLUDED.n, moe=EXCLUDED.moe, label=EXCLUDED.label;""")


    # ---- observations ------------------------------------------------------
    # Three orientations appear across these sheets, and guessing between them
    # is how cells get silently dropped, so each is handled explicitly.
    #   A  rows are periods, columns are subjects or segments
    #   B  rows are subjects, columns are segments
    #   C  rows are segments, columns are subjects
    rows, skipped, unmapped = [], 0, []
    for t in tables:
        sheet = t["sheet"]; doc = DOCS.get(sheet)
        if not doc: continue
        hdr = t["header"]; h3 = (t["h3"] or ""); h2 = (t["h2"] or "")
        year = doc["published"][:4]

        for row in t["rows"]:
            if not row: continue
            # Pew marks footnotes inline on labels ("65+**", "Asian*, **").
            # Strip them before any lookup or the cell is silently dropped.
            label = re.sub(r"[*,\s]+$", "", row[0].strip()) or row[0].strip()
            if label not in SEG and row[0].strip() in SEG: label = row[0].strip()
            vals = [(i, num(row[i])) for i in range(1, min(len(row), len(hdr))) if num(row[i]) is not None]
            if not vals: continue

            # --- A: period-indexed -------------------------------------------
            if re.fullmatch(r"\d{4}|\d{1,2}/\d{1,2}/\d{4}", label):
                period = period_of(label, doc["published"])
                for i, v in vals:
                    m, subj, seg = classify_series(sheet, h3, hdr[i])
                    if not m:
                        skipped += 1; unmapped.append((sheet, h3, hdr[i])); continue
                    rows.append((doc["slug"], m, subj, seg, period, v))
                continue

            # --- C: rows are segments ---------------------------------------
            if label in SEG or label in ("U.S. adults", "US adults"):
                seg = SEG.get(label)
                for i, v in vals:
                    m, subj = classify_column(sheet, h3, hdr[i])
                    if not m:
                        skipped += 1; unmapped.append((sheet, h3, hdr[i])); continue
                    rows.append((doc["slug"], m, subj, seg, year, v))
                continue

            # --- B: rows are subjects ---------------------------------------
            m, subj = classify_row(sheet, h2, h3, label)
            if not m:
                skipped += len(vals); unmapped.append((sheet, h3, "ROW " + label)); continue
            for i, v in vals:
                key = hdr[i].strip()
                mm = m
                if m == "__REASON__":
                    # This family splits the metric across the columns rather
                    # than the rows: "Major reason" / "Minor reason" / "Not a
                    # reason", or an age split of the major-reason share.
                    kl = key.lower()
                    if kl.startswith("major"):   mm, seg = "influencer_reason_major", None
                    elif kl.startswith("minor"): mm, seg = "influencer_reason_minor", None
                    elif kl.startswith("not"):   mm, seg = "influencer_reason_none", None
                    elif key in SEG:             mm, seg = "influencer_reason_major", SEG[key]
                    else:
                        skipped += 1; unmapped.append((sheet, h3, key)); continue
                    rows.append((doc["slug"], mm, subj, seg, year, v))
                    continue
                if key.lower() == "percentage":
                    rows.append((doc["slug"], mm, subj, None, year, v)); continue
                if key not in SEG:
                    skipped += 1; unmapped.append((sheet, h3, key)); continue
                rows.append((doc["slug"], mm, subj, SEG[key], year, v))

    # dedupe on the natural key, last write wins
    seen = {}
    for r in rows: seen[(r[0],r[1],r[2],r[3],r[4])] = r
    rows = list(seen.values())

    # Stage into a temp table, then resolve slugs to ids in one pass. A
    # correlated subquery per row is what made the previous version crawl.
    stmts.append("""CREATE TEMP TABLE stage (doc text, metric text, subject text,
                    segment text, period text, value numeric) ON COMMIT DROP;""")
    B = 400
    for i in range(0, len(rows), B):
        vals = ",".join(f"({q(d)},{q(m)},{q(s)},{q(g)},{q(p)},{v})" for d,m,s,g,p,v in rows[i:i+B])
        stmts.append(f"INSERT INTO stage VALUES {vals};")
    stmts.append("""
      INSERT INTO observation (document_id, metric_id, subject, segment_id, period, value)
      SELECT d.id, m.id, st.subject, sg.id, st.period, st.value
      FROM stage st
      JOIN document d ON d.slug = st.doc
      JOIN metric   m ON m.slug = st.metric
      LEFT JOIN segment sg ON sg.slug = st.segment
      ON CONFLICT (document_id, metric_id, subject, segment_id, period)
      DO UPDATE SET value = EXCLUDED.value;""")
    total = len(rows)
    stmts.append(f"INSERT INTO ingest_run (script,documents,observations,notes) VALUES ('load_pew.py',{len(DOCS)},{total},{q(str(skipped) + ' cells not mapped to a metric')});")
    sql("\n".join(stmts))
    print(f"documents   {len(DOCS)}")
    print(f"observations{total:>8}")
    print(f"unmapped    {skipped:>8}")
    if unmapped:
        from collections import Counter
        for k, n in Counter(unmapped).most_common(8):
            print(f"   {n:4}  {k[0][:22]:24}{k[1][:28]:30}{k[2][:34]}")


PLATFORMS = {"YouTube":"youtube","Facebook":"facebook","Instagram":"instagram","TikTok":"tiktok",
 "WhatsApp":"whatsapp","Reddit":"reddit","Snapchat":"snapchat","X (formerly Twitter)":"x",
 "Threads":"threads","Bluesky":"bluesky","Truth Social":"truthsocial",
 "Pinterest":"pinterest","LinkedIn":"linkedin","BeReal":"bereal","Nextdoor":"nextdoor"}
OWN = {"Cellphone":"owns_cellphone","Smartphone":"owns_smartphone",
       "Cellphone, but not a smartphone":"owns_featurephone"}
NEWS_COL = {"Television":"television","Radio":"radio",
 "Printed newspapers or printed magazines**":"print","Print publications":"print",
 "Printed newspapers or printed magazines":"print","Digital devices":"digital",
 "News websites or apps":"news_sites","Social media":"social_media","Search":"search",
 "Podcasts":"podcasts","Email newsletters":"newsletters","AI chatbots":"ai_chatbots"}

def classify_row(sheet, h2, h3, label):
    """A row label that names a thing -> (metric, subject)."""
    if label in PLATFORMS: return "ever_use", PLATFORMS[label]
    if label in OWN:       return OWN[label], None
    # News-influencer motivations: the row names the reason, which is the subject.
    if "reasons for getting news" in (h3 or "").lower() or "reasons for getting news" in (h2 or "").lower():
        return "__REASON__", slugify(label)
    if "affiliation" in (h3 or "").lower():
        return "influencer_affiliation", slugify(label)
    return None, None


def slugify(t):
    return re.sub(r"[^a-z0-9]+", "-", (t or "").lower()).strip("-")[:60]


def classify_column(sheet, h3, col):
    """Orientation C: the column names the thing measured."""
    c = col.strip()
    if c in NEWS_COL:
        pref = "news_platform_preference" if "preference" in (h3 or "").lower() else "news_platform_use"
        return pref, NEWS_COL[c]
    if c in PLATFORMS:
        return "ever_use", PLATFORMS[c]
    if c == "Percentage":
        if "influencer" in (h3 or "").lower(): return "news_influencer_use", None
    # Curly and straight apostrophes both appear in these headers.
    cn = c.replace("\u2019", "'").lower()
    if cn.startswith("they're looking"): return "news_influencer_seek", None
    if cn.startswith("they happen to come across"): return "news_influencer_stumble", None
    return None, None

def classify_series(sheet, h3, col):
    """A column header in a period-indexed table -> (metric, subject, segment)."""
    c = col.strip()
    if sheet == "Social Media Fact Sheet" and c in PLATFORMS:
        return "ever_use", PLATFORMS[c], None
    if c in SEG or c == "U.S. adults":
        seg = SEG.get(c)
        h = (h3 or "").lower()
        if "internet use" in h:            return "internet_use", None, seg
        if "home broadband" in h:          return "home_broadband", None, seg
        if "smartphone dependency" in h:   return "smartphone_dependent", None, seg
        if "news consumption on social" in h: return "news_on_social", None, seg
        if "news influencer" in h:         return "news_influencer_use", None, seg
    if sheet == "Mobile Fact Sheet" and c in ("Cellphone","Smartphone"):
        return OWN[c], None, None
    # "Television, often" and friends: channel plus frequency in one header.
    m = re.fullmatch(r"(.+?),\s*(often|sometimes|rarely|never)", c, re.I)
    if m and m.group(1).strip() in NEWS_COL:
        return f"news_freq_{m.group(2).lower()}", NEWS_COL[m.group(1).strip()], None
    if c in ("Often","Sometimes","Rarely","Never") and "social" in (h3 or "").lower():
        return f"news_freq_{c.lower()}", "social_media", None
    return None, None, None

if __name__ == "__main__":
    main()
