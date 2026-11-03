"""
Parse the paid pilot's archived responses (raw/paid/<entity>/) into ontology.series_point / watch_item.
Free to re-run: nothing here calls a paid endpoint. Reviewer and advertiser names that belong to
people are never stored. Called by: python3 paid_signals.py parse --entity anthropic
"""
import datetime as dt, gzip, json, os, re, urllib.request
from db import sql, query, q
from collect_signals import points, items

HERE = os.path.dirname(os.path.abspath(__file__))


def run_dir(ent):
    """The newest month's archive folder, or PAID_RUN to re-parse an older one."""
    base = os.path.join(HERE, "raw", "paid", ent)
    runs = sorted(d for d in os.listdir(base) if re.fullmatch(r"\d{4}-\d{2}", d))
    return os.path.join(base, os.environ.get("PAID_RUN") or runs[-1])


def load(ent, name):
    p = os.path.join(run_dir(ent), name + ".json.gz")
    if not os.path.exists(p):
        return None
    with gzip.open(p, "rb") as f:
        return json.loads(f.read())


def result(d):
    t = (d or {}).get("tasks") or [{}]
    return t[0].get("result") or [] if t[0].get("status_code") == 20000 else None


def mcps_full(ent, name):
    """MCP Scraper hands large results over as a file; fetch it once and archive it beside the call."""
    full = load(ent, name + "_full")
    if full is not None:
        return full
    d = load(ent, name)
    r = (d or {}).get("result") or {}
    sc = r.get("structuredContent") or {}
    if (sc.get("delivery") or {}).get("mode") != "artifact":
        return sc
    url = next((a["downloadUrl"] for a in sc["delivery"].get("artifacts", []) if a.get("filename") == "complete-result.json"), None)
    if not url:
        return None
    with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "curl/8.4"}), timeout=120) as f:
        full = json.loads(f.read())
    with gzip.open(os.path.join(run_dir(ent), name + "_full.json.gz"), "wb") as f:
        f.write(json.dumps(full).encode())
    return full


def month(y, m):
    return f"{int(y):04d}-{int(m):02d}-01"


def parse(ent):
    eid = int(query(f"SELECT id FROM ontology.entity WHERE slug={q(ent)}")[0][0])
    st, notes = [], []

    r = result(load(ent, "ads_volume"))
    if r:
        for k in r:
            st += points(eid, "google_ads", "search_volume", k["keyword"], "month",
                         [(month(m["year"], m["month"]), m["search_volume"]) for m in k.get("monthly_searches") or [] if m.get("search_volume") is not None])
        notes.append(f"google_ads {len(r)} keywords")

    for setname in ("assistants", "coding"):
        r = result(load(ent, "trends_" + setname))
        if r:
            g = r[0]["items"][0]
            for i, kw in enumerate(g["keywords"]):
                st += points(eid, "dfs_trends", "interest", f"{setname}:{kw}", "week",
                             [(p["date_from"], p["values"][i]) for p in g["data"] if p.get("values") and p["values"][i] is not None])
            notes.append(f"trends {setname} {len(g['data'])} weeks")

    r = result(load(ent, "news"))
    if r:
        rows = [{"key": i["url"], "kind": "news", "title": i.get("title"), "url": i.get("url"), "happened_at": (i.get("timestamp") or "")[:19] or None,
                 "detail": {"source": None if (i.get("domain") or "").endswith("google.com") else (i.get("domain") or "").removeprefix("www."),
                            "rank": i.get("rank_absolute"), "snippet": (i.get("snippet") or "")[:300]}}
                for i in r[0].get("items") or [] if i.get("type") == "news_search" and i.get("url")]
        st += items(eid, "google_news", rows)
        notes.append(f"news {len(rows)}")

    for dom in ("claude.ai", "anthropic.com"):
        r = result(load(ent, "ranked_" + dom))
        if r:
            x = r[0]
            st += points(eid, "dfs_labs", "ranked_keywords", dom, "snapshot", [(dt.date.today(), x.get("total_count"))])
            st += points(eid, "dfs_labs", "ranked_etv", dom, "snapshot", [(dt.date.today(), ((x.get("metrics") or {}).get("organic") or {}).get("etv"))])
            rows = []
            for i in (x.get("items") or [])[:25]:
                kd, se = i.get("keyword_data") or {}, (i.get("ranked_serp_element") or {}).get("serp_item") or {}
                rows.append({"key": f"{dom}:{kd.get('keyword')}", "kind": "keyword", "title": kd.get("keyword"), "url": se.get("url"),
                             "detail": {"rank": se.get("rank_absolute"), "search_volume": (kd.get("keyword_info") or {}).get("search_volume"), "etv": se.get("etv")}})
            st += items(eid, "dfs_ranked", rows)
            notes.append(f"ranked {dom} {x.get('total_count')}")

    for dom in ("claude.ai", "anthropic.com", "chatgpt.com"):
        r = result(load(ent, "history_" + dom))
        if r:
            its = r[0].get("items") or []
            st += points(eid, "dfs_labs", "organic_etv", dom, "month", [(month(i["year"], i["month"]), ((i.get("metrics") or {}).get("organic") or {}).get("etv")) for i in its])
            st += points(eid, "dfs_labs", "organic_keywords", dom, "month", [(month(i["year"], i["month"]), ((i.get("metrics") or {}).get("organic") or {}).get("count")) for i in its])
            notes.append(f"history {dom} {len(its)} months")

    for plat in ("google", "chatgpt"):
        r = result(load(ent, "llm_share_" + plat))
        if r:
            key = "google" if plat == "google" else "chat_gpt"
            for it in r[0].get("items") or []:
                m = (it.get("platform") or it.get("location") or [{}])[0]
                st += points(eid, "llm_mentions", "mentions", f"{key}:{it['key']}", "snapshot", [(dt.date.today(), m.get("mentions"))])
                st += points(eid, "llm_mentions", "ai_search_volume", f"{key}:{it['key']}", "snapshot", [(dt.date.today(), m.get("ai_search_volume"))])
            notes.append(f"llm {key} {len(r[0].get('items') or [])} brands")
    r = result(load(ent, "llm_top_domains"))
    if r:
        rows = [{"key": it["key"], "kind": "domain", "title": it["key"].removeprefix("www."), "url": "https://" + it["key"],
                 "detail": {"mentions": ((it.get("platform") or [{}])[0]).get("mentions")}} for it in r[0].get("items") or []]
        st += items(eid, "llm_top_domains", rows)
        notes.append(f"llm top domains {len(rows)}")

    # Google Ads Transparency: keep only the company's own advertiser account; a different company with a
    # similar name ("Anthropics Technology Limited") must never be counted as Anthropic.
    d = load(ent, "google_ads_search")
    sc = ((d or {}).get("result") or {}).get("structuredContent") or {}
    own = [a for a in sc.get("advertisers") or [] if re.fullmatch(r"anthropic,? pbc\.?", (a.get("name") or "").strip(), re.I)]
    st += items(eid, "google_ads_transparency", [{"key": a["name"], "kind": "advertiser", "title": a["name"], "url": a.get("detailUrl"),
                                                  "detail": {"ads": a.get("approxAdCount"), "region": sc.get("region"), "domain": a.get("domain")}} for a in own])
    intel = (((load(ent, "google_ads_intel") or {}).get("result") or {}).get("structuredContent") or {})
    if intel.get("advertiserId"):
        n = intel.get("totalCreatives") or 0
        st += items(eid, "google_ads_transparency", [{"key": intel["advertiserName"], "kind": "advertiser", "title": intel["advertiserName"],
                                                      "url": f"https://adstransparency.google.com/advertiser/{intel['advertiserId']}?region={intel.get('region') or 'US'}",
                                                      "detail": {"ads": f"{n}+" if n >= 50 else n, "video": intel.get("videoCount"), "text": intel.get("textCount"),
                                                                 "image": intel.get("imageCount"), "region": intel.get("region")}}])
    notes.append(f"google ads: {len(own)} own of {len(sc.get('advertisers') or [])}; creatives read {intel.get('totalCreatives')}")

    # Meta Ad Library: pages whose ads match the name. Only a page named for the company or its product is
    # stored by name; other pages are counted, never named (they can be people).
    d = load(ent, "meta_ads")
    sc = ((d or {}).get("result") or {}).get("structuredContent") or {}
    ads = sc.get("advertisers") or []
    named = [a for a in ads if (a.get("name") or "").strip().lower() in ("anthropic", "claude", "claude by anthropic", "anthropic pbc")]
    rows = [{"key": a["pageId"], "kind": "page", "title": a["name"], "url": f"https://www.facebook.com/ads/library/?id={a['libraryId']}" if a.get("libraryId") else None,
             "detail": {"ads": a.get("adCount")}} for a in named]
    rows.append({"key": "_other_pages", "kind": "summary", "title": f"{len(ads) - len(named)} other pages", "url": None,
                 "detail": {"ads": sum(a.get("adCount") or 0 for a in ads if a not in named), "note": "pages not named for the company; not named here"}})
    st += items(eid, "meta_ad_library", rows)
    notes.append(f"meta: {len(named)} named, {len(ads) - len(named)} other")

    for name, src in (("trustpilot", "trustpilot"), ("g2", "g2")):
        full = mcps_full(ent, name)
        if not full:
            continue
        revs = full.get("reviews") or (full.get("structuredContent") or {}).get("reviews") or []
        rows = []
        for i, rv in enumerate(revs):
            rating = rv.get("rating") or rv.get("stars")
            if rating is None:
                continue
            rows.append({"key": rv.get("sourceReviewId") or rv.get("id") or rv.get("reviewUrl") or f"{name}-{rv.get('date')}-{i}", "kind": "review",
                         "title": (rv.get("title") or "")[:140], "url": rv.get("reviewUrl") or rv.get("url"),
                         "happened_at": (rv.get("date") or rv.get("publishedDate") or "")[:10] or None,
                         "detail": {"rating": float(rating)}})
        st += items(eid, src, rows)
        notes.append(f"{name} {len(rows)} reviews")

    d = load(ent, "play_app")
    if d and d.get("task_get"):
        r = result(d)
        it = ((r or [{}])[0].get("items") or [{}])[0] if r else {}
        rating = it.get("rating") or {}
        st += points(eid, "google_play", "rating", "com.anthropic.claude", "snapshot", [(dt.date.today(), rating.get("value"))])
        st += points(eid, "google_play", "rating_count", "com.anthropic.claude", "snapshot", [(dt.date.today(), rating.get("votes_count"))])
        inst = re.sub(r"[^0-9]", "", str(it.get("installs") or ""))
        if inst:
            st += points(eid, "google_play", "installs_min", "com.anthropic.claude", "snapshot", [(dt.date.today(), int(inst))])
        notes.append(f"play rating {rating.get('value')} installs {it.get('installs')}")

    if st:
        sql("\n".join(st), timeout=300)
    print("parsed:", "; ".join(notes))
    return 0
