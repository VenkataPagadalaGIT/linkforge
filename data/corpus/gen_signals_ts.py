#!/usr/bin/env python3
"""
Generate src/data/aiSignals.ts: each company's signals, grouped the way a reader asks about them.

  history  how it got here: downloads since launch, article views, search demand, search traffic
  now      this week: incidents, app ratings, news, ads running, reviews, AI answer share
  ahead    early signals: new public repos and datasets, rules on the way in the Federal Register

Every number is computed here once, from ontology.series_point and ontology.watch_item, so the page
only formats. Daily series are summed into Monday-to-Sunday weeks; a week still in progress is
dropped so the last point is never a half week.

Run: python3 gen_signals_ts.py [--check]
"""
import collections, datetime as dt, json, os, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from db import CONTAINER, DB, USER

HERE = os.path.dirname(os.path.abspath(__file__))
DEST = os.path.join(HERE, "..", "..", "src", "data", "aiSignals.ts")
CFG = json.load(open(os.path.join(HERE, "ontology", "signal_sources.json"), encoding="utf8"))


def rows(q):
    p = subprocess.run(["docker", "exec", "-i", CONTAINER, "psql", "-U", USER, "-d", DB, "-t", "-A", "-c",
                        "SELECT COALESCE(jsonb_agg(t), '[]'::jsonb)::text FROM (" + q + ") t"], capture_output=True, text=True)
    if p.returncode != 0:
        raise SystemExit("QUERY FAILED:\n" + p.stderr[-2000:])
    return json.loads(p.stdout.strip() or "[]")


def compact(v):
    v = float(v)
    for div, suf in ((1e9, "B"), (1e6, "M"), (1e3, "K")):
        if abs(v) >= div:
            x = v / div
            return f"{x:.1f}{suf}" if x < 100 else f"{x:.0f}{suf}"
    return f"{v:,.0f}" if v == int(v) else f"{v:,.2f}"


def pct(a, b):
    if not b:
        return None
    x = (a - b) / b * 100
    return f"{'+' if x >= 0 else ''}{x:.0f}% vs the 30 days before"


def dmy(d):
    d = dt.date.fromisoformat(str(d)[:10])
    return f"{d.day} {d.strftime('%b')} {d.year}"


def weekly(pts, min_days=4):
    """Daily [(date, v)] -> [(monday, average a day)] for weeks with at least min_days of data. An average,
    not a sum, so a week with a gap in the source is neither dropped nor under-counted."""
    wk = collections.defaultdict(float)
    days = collections.Counter()
    for d, v in pts:
        d = dt.date.fromisoformat(d)
        m = d - dt.timedelta(days=d.weekday())
        wk[m] += v
        days[m] += 1
    return [(m.isoformat(), round(wk[m] / days[m])) for m in sorted(wk) if days[m] >= min_days]


def window(pts, days, offset=0):
    if not pts:
        return 0
    end = dt.date.fromisoformat(pts[-1][0]) - dt.timedelta(days=offset)
    start = end - dt.timedelta(days=days - 1)
    return sum(v for d, v in pts if start <= dt.date.fromisoformat(d) <= end)


def avg_day(pts, days, offset=0):
    """(average a day over the days that have data, how many days had data) in a window ending at the last point."""
    end = dt.date.fromisoformat(pts[-1][0]) - dt.timedelta(days=offset)
    start = end - dt.timedelta(days=days - 1)
    vs = [v for d, v in pts if start <= dt.date.fromisoformat(d) <= end]
    return (sum(vs) / len(vs) if vs else 0, len(vs))


S = collections.defaultdict(lambda: collections.defaultdict(list))  # entity -> (source, series, subject) -> [(period, value)]
GRAIN, READ = {}, collections.defaultdict(dict)
for r in rows("""SELECT e.slug AS ent, p.source, p.series, p.subject, p.period::text AS period, p.grain, p.value::float AS value, p.retrieved_at::text AS read
                 FROM ontology.series_point p JOIN ontology.entity e ON e.id = p.entity_id ORDER BY 1, 2, 3, 4, 5"""):
    S[r["ent"]][(r["source"], r["series"], r["subject"])].append((r["period"], r["value"]))
    GRAIN[(r["source"], r["series"])] = r["grain"]
    READ[r["ent"]][r["source"]] = max(READ[r["ent"]].get(r["source"], ""), r["read"])
W = collections.defaultdict(lambda: collections.defaultdict(list))
for r in rows("""SELECT e.slug AS ent, w.source, w.item_key, w.kind, w.title, w.url, w.happened_at::text AS at, w.ended_at::text AS ended, w.detail, w.retrieved_at::text AS read
                 FROM ontology.watch_item w JOIN ontology.entity e ON e.id = w.entity_id ORDER BY w.happened_at DESC NULLS LAST"""):
    W[r["ent"]][r["source"]].append(r)
    READ[r["ent"]][r["source"]] = max(READ[r["ent"]].get(r["source"], ""), r["read"])


def latest(series_map, source, series):
    """{subject: latest value} for a snapshot series."""
    return {k[2]: v[-1][1] for k, v in series_map.items() if k[0] == source and k[1] == series and v}


def group(id, horizon, title, source, url, ent, srcs, kpis=(), charts=(), lists=(), note=None, paid=False):
    reads = [READ[ent].get(s) for s in srcs if READ[ent].get(s)]
    if not (kpis or charts or lists):
        return None
    return {"id": id, "horizon": horizon, "title": title, "source": source, "sourceUrl": url, "readOn": max(reads) if reads else None,
            "kpis": [{"label": a, "value": b, "sub": c} for a, b, c in kpis], "charts": list(charts), "lists": list(lists), "note": note, "paid": paid}


def line(key, label, pts):
    return {"key": key, "label": label, "points": [[d, v] for d, v in pts]}


def build(ent):
    s, w, cfg = S[ent], W[ent], CFG.get(ent, {})
    out = []
    today = dt.date.today()

    # ---- history: developer adoption ----
    npm = {k[2]: v for k, v in s.items() if k[:2] == ("npm", "downloads")}
    pypi = {k[2]: v for k, v in s.items() if k[:2] == ("pypi", "downloads")}
    kp = []
    for name, label in (("anthropic", "Python SDK"), ("@anthropic-ai/sdk", "TypeScript SDK"), ("@anthropic-ai/claude-code", "Claude Code (npm)")):
        pts = pypi.get(name) or npm.get(name)
        if pts:
            a, b = avg_day(pts, 30), avg_day(pts, 30, 30)
            gap = 30 - a[1]
            kp.append((f"{label}, downloads a day", compact(a[0]), " · ".join(filter(None, [pct(a[0], b[0]), f"{gap} days missing in the source" if gap else None]))))
    stars = latest(s, "github", "stars")
    if stars:
        top = max(stars, key=stars.get)
        kp.append(("GitHub stars", compact(sum(stars.values())), f"{len(stars)} public repos; most: {top.split('/')[-1]} ({compact(stars[top])})"))
    charts = []
    if npm:
        charts.append({"title": "npm downloads a day, weekly average", "unit": "a day", "grain": "week",
                       "lines": [line(n, n.replace("@anthropic-ai/", ""), weekly(p)) for n, p in sorted(npm.items(), key=lambda kv: -sum(v for _, v in kv[1]))],
                       "note": "Downloads count installs, including automated builds, not people. Days missing in npm's own stats are left out of each week's average."})
    if pypi:
        charts.append({"title": "PyPI downloads a day, weekly average", "unit": "a day", "grain": "week",
                       "lines": [line(n, n, weekly(p)) for n, p in sorted(pypi.items(), key=lambda kv: -sum(v for _, v in kv[1]))],
                       "note": "PyPI keeps about 180 days; mirrors excluded."})
    g = group("adoption", "history", "Developer adoption", "npm, PyPI (pypistats.org), GitHub", "https://www.npmjs.com/org/anthropic-ai", ent, ["npm", "pypi", "github"], kp, charts)
    out.append(g)

    # ---- history: attention ----
    wiki = {k[2]: v for k, v in s.items() if k[:2] == ("wikipedia", "views")}
    if wiki:
        kp = [(f"Wikipedia: {t.replace('_', ' ')}, 30 days", compact(window(p, 30)), pct(window(p, 30), window(p, 30, 30))) for t, p in wiki.items()]
        notes = [a.get("note") for a in cfg.get("wikipedia", []) if a.get("note")]
        out.append(group("attention", "history", "Attention", "Wikimedia page views (people, not bots)", "https://pageviews.wmcloud.org/", ent, ["wikipedia"], kp,
                         [{"title": "Wikipedia views a day, weekly average", "unit": "a day", "grain": "week",
                           "lines": [line(t, t.replace("_", " "), weekly(p)) for t, p in wiki.items()], "note": " ".join(notes) or None}]))

    # ---- history: search demand (Google Ads monthly volume, DataForSEO Trends) ----
    ads = {k[2]: v for k, v in s.items() if k[:2] == ("google_ads", "search_volume")}
    trends = {k[2]: v for k, v in s.items() if k[:2] == ("dfs_trends", "interest")}
    if ads or trends:
        kp = []
        for kw in ("claude ai", "claude code", "anthropic", "chatgpt"):
            if ads.get(kw):
                last = ads[kw][-1]
                kp.append((f"Searches for \"{kw}\"", compact(last[1]), f"US, {dt.date.fromisoformat(last[0]).strftime('%b %Y')}"))
        ch = []
        if ads:
            pick = [k for k in ("claude ai", "claude code", "anthropic", "chatgpt", "gemini", "perplexity") if k in ads]
            ch.append({"title": "Monthly Google searches, US", "unit": "searches", "grain": "month", "lines": [line(k, k, ads[k]) for k in pick],
                       "note": "Google Ads Keyword Planner via DataForSEO; ranges are rounded by Google. \"claude\" alone also counts other Claudes."})
        for setname, title in (("assistants", "Search interest, AI assistants, US (5 years)"), ("coding", "Search interest, AI coding tools, US (12 months)")):
            ls = [line(k.split(":", 1)[1], k.split(":", 1)[1], v) for k, v in trends.items() if k.startswith(setname + ":")]
            if ls:
                ch.append({"title": title, "unit": "index", "grain": "week", "lines": ls, "note": "DataForSEO Trends index, 100 = the peak of any line in the chart."})
        out.append(group("demand", "history", "Search demand", "DataForSEO (Google Ads volume, DataForSEO Trends)", None, ent, ["google_ads", "dfs_trends"], kp, ch, paid=True))

    # ---- history: search traffic (organic) ----
    etv = {k[2]: v for k, v in s.items() if k[:2] == ("dfs_labs", "organic_etv")}
    ranked = latest(s, "dfs_labs", "ranked_keywords")
    if etv or ranked:
        kp = []
        for d in ("claude.ai", "anthropic.com"):
            if d in ranked:
                kp.append((f"{d}: Google keywords ranked", compact(ranked[d]), "US, organic"))
            if etv.get(d):
                kp.append((f"{d}: est. monthly visits from Google", compact(etv[d][-1][1]), dt.date.fromisoformat(etv[d][-1][0]).strftime("%b %Y")))
        ch = [{"title": "Estimated monthly visits from Google search, US", "unit": "visits", "grain": "month",
               "lines": [line(d, d, p) for d, p in sorted(etv.items())], "note": "DataForSEO Labs estimate from rankings x search volume x click rates: a model, not measured traffic."}] if etv else []
        top = [r for r in w.get("dfs_ranked", [])]
        top.sort(key=lambda r: -(r["detail"] or {}).get("etv", 0))
        ls = [{"title": "Top Google keywords by estimated visits", "note": "US, organic",
               "rows": [{"title": r["title"], "url": r["url"], "date": None,
                         "meta": f"{r['item_key'].split(':')[0]} · #{(r['detail'] or {}).get('rank')} · {compact((r['detail'] or {}).get('search_volume') or 0)} searches"} for r in top[:10]]}] if top else []
        out.append(group("search", "history", "Search traffic", "DataForSEO Labs", None, ent, ["dfs_labs", "dfs_ranked"], kp, ch, ls, paid=True))

    # ---- now: reliability ----
    inc = w.get("statuspage", [])
    if inc:
        cutoff = (today - dt.timedelta(days=30)).isoformat()
        last30 = [i for i in inc if (i["at"] or "") >= cutoff]
        hours = sorted((dt.datetime.fromisoformat(i["ended"]) - dt.datetime.fromisoformat(i["at"])).total_seconds() / 3600 for i in inc if i["ended"] and i["at"])
        med = hours[len(hours) // 2] if hours else None
        big = [i for i in inc if i["kind"] in ("major", "critical")]
        kp = [("Incidents, last 30 days", str(len(last30)), f"{sum(1 for i in last30 if i['kind'] in ('major', 'critical'))} major or critical"),
              ("Median time to resolve", f"{med:.1f} h" if med is not None else "", f"over the last {len(hours)} resolved"),
              ("Major or critical", str(len(big)), f"of {len(inc)} since {dmy(min(i['at'] for i in inc))}")]
        rows_ = [{"title": i["title"], "url": i["url"], "date": i["at"][:10],
                  "meta": f"{i['kind'] or 'none'} impact" + (f" · {((dt.datetime.fromisoformat(i['ended']) - dt.datetime.fromisoformat(i['at'])).total_seconds() / 3600):.1f} h" if i["ended"] else " · open")}
                 for i in inc[:12]]
        out.append(group("reliability", "now", "Reliability", "status.claude.com", cfg.get("statuspage"), ent, ["statuspage"], kp, [],
                         [{"title": "Latest incidents", "rows": rows_, "note": None}],
                         note=f"The status page publishes its last {len(inc)} incidents; the record grows from here with each run."))

    # ---- now: app ratings ----
    rating, count = latest(s, "app_store", "rating"), latest(s, "app_store", "rating_count")
    play = {k: v for k, v in [("rating", latest(s, "google_play", "rating")), ("count", latest(s, "google_play", "rating_count")), ("installs", latest(s, "google_play", "installs_min"))] if v}
    if rating or play:
        kp = []
        for subj, r in rating.items():
            kp.append(("App Store rating, US", f"{r:.2f}", f"{compact(count.get(subj, 0))} ratings"))
        if play.get("rating"):
            r = next(iter(play["rating"].values()))
            c = next(iter(play.get("count", {}).values()), None)
            kp.append(("Google Play rating, US", f"{r:.2f}", f"{compact(c)} ratings" if c else None))
        if play.get("installs"):
            kp.append(("Google Play installs", compact(next(iter(play["installs"].values()))) + "+", "Google's install band"))
        vers = w.get("app_store", [])
        ls = [{"title": "App Store versions seen", "note": None,
               "rows": [{"title": v["title"], "url": v["url"], "date": (v["at"] or "")[:10] or None, "meta": ((v["detail"] or {}).get("notes") or "")[:140] or None} for v in vers[:5]]}] if vers else []
        out.append(group("apps", "now", "Claude app ratings", "Apple App Store" + (", Google Play (DataForSEO)" if play else ""), None, ent, ["app_store", "google_play"], kp, [], ls))

    # ---- now: news ----
    news = w.get("google_news", [])
    if news:
        out.append(group("news", "now", "In the news", "Google News via DataForSEO", None, ent, ["google_news"], [], [],
                         [{"title": "Latest stories naming Anthropic", "note": "Google News, US, as ranked on the day we read it",
                           "rows": [{"title": n["title"], "url": n["url"], "date": (n["at"] or "")[:10] or None, "meta": (n["detail"] or {}).get("source")} for n in news[:12]]}], paid=True))

    # ---- now: AI answer share ----
    share = {k[2]: v[-1][1] for k, v in s.items() if k[:2] == ("llm_mentions", "mentions") and v}
    if share:
        kp = []
        for plat, label in (("google", "Google AI answers"), ("chat_gpt", "ChatGPT answers")):
            brands = {k.split(":", 1)[1]: v for k, v in share.items() if k.startswith(plat + ":")}
            tot = sum(brands.values())
            if tot and "Claude" in brands:
                lead = max(brands, key=brands.get)
                kp.append((f"Claude's share of mentions, {label}", f"{brands['Claude'] / tot * 100:.1f}%", f"{compact(brands['Claude'])} of {compact(tot)} mentions; most: {lead}"))
        doms = w.get("llm_top_domains", [])
        ls = [{"title": "Sites Google's AI answers cite when Claude comes up", "note": None,
               "rows": [{"title": d["title"], "url": d["url"], "date": None, "meta": f"{compact((d['detail'] or {}).get('mentions') or 0)} mentions"} for d in doms[:10]]}] if doms else []
        brand_rows = []
        for plat, label in (("google", "Google AI answers"), ("chat_gpt", "ChatGPT")):
            for b, v in sorted(((k.split(":", 1)[1], v) for k, v in share.items() if k.startswith(plat + ":")), key=lambda x: -x[1]):
                brand_rows.append({"title": f"{b} · {label}", "url": None, "date": None, "meta": f"{compact(v)} mentions"})
        if brand_rows:
            ls.insert(0, {"title": "Mentions by brand", "note": "Answers that name the brand, US, English", "rows": brand_rows})
        out.append(group("ai_answers", "now", "AI answer share", "DataForSEO LLM Mentions", None, ent, ["llm_mentions", "llm_top_domains"], kp, [], ls,
                         note="Counts answers whose text names the brand. \"Copilot\" and \"Gemini\" also match other uses of those words.", paid=True))

    # ---- now: ads running ----
    gads, meta = w.get("google_ads_transparency", []), w.get("meta_ad_library", [])
    if gads or meta:
        rows_ = [{"title": a["title"], "url": a["url"], "date": None, "meta": f"Google · {(a['detail'] or {}).get('ads') or '?'} ads · {(a['detail'] or {}).get('country') or ''}".strip(" ·")} for a in gads[:6]]
        rows_ += [{"title": a["title"], "url": a["url"], "date": None, "meta": f"Meta · {(a['detail'] or {}).get('ads') or '?'} ads"} for a in meta[:6]]
        out.append(group("ads", "now", "Ads running", "Google Ads Transparency Center, Meta Ad Library (MCP Scraper)", None, ent, ["google_ads_transparency", "meta_ad_library"], [], [],
                         [{"title": "Advertisers matching Anthropic", "rows": rows_, "note": "Ad counts are the libraries' own approximate numbers."}], paid=True))

    # ---- now: reviews ----
    rv = []
    for src, label in (("trustpilot", "Trustpilot"), ("g2", "G2")):
        rs = [r for r in w.get(src, []) if (r["detail"] or {}).get("rating") is not None]
        if rs:
            avg = sum(r["detail"]["rating"] for r in rs) / len(rs)
            rv.append((src, label, rs, avg))
    if rv:
        kp = [(f"{label}: average of reviews read", f"{avg:.2f} / 5", f"{len(rs)} most recent reviews") for _, label, rs, avg in rv]
        ls = [{"title": f"Latest {label} reviews", "note": None,
               "rows": [{"title": r["title"] or "(no title)", "url": r["url"], "date": (r["at"] or "")[:10] or None, "meta": f"{r['detail']['rating']} / 5"} for r in rs[:6]]} for _, label, rs, _ in rv]
        out.append(group("reviews", "now", "Reviews", "Trustpilot, G2 (MCP Scraper)", None, ent, [x[0] for x in rv], kp, [], ls,
                         note="A sample of the newest reviews, not every review ever written.", paid=True))

    # ---- ahead: what they are building ----
    since = (today - dt.timedelta(days=90)).isoformat()
    new_repos = [r for r in w.get("github", []) if (r["at"] or "") >= since]
    new_ds = [r for r in w.get("huggingface", []) if (r["at"] or "") >= since]
    if new_repos or new_ds:
        rows_ = [{"title": r["title"], "url": r["url"], "date": r["at"][:10], "meta": ((r["detail"] or {}).get("description") or "")[:140] or None} for r in new_repos[:10]]
        rows_ += [{"title": r["title"], "url": r["url"], "date": r["at"][:10], "meta": "Hugging Face dataset"} for r in new_ds[:5]]
        out.append(group("building", "ahead", "What they are building", "GitHub, Hugging Face", f"https://github.com/{cfg.get('github_org', '')}", ent, ["github", "huggingface"],
                         [("New public repos, 90 days", str(len(new_repos)), f"of {len(w.get('github', []))} public repos"), ("New datasets, 90 days", str(len(new_ds)), "Hugging Face")], [],
                         [{"title": "Newest public work", "rows": rows_, "note": "A new public repo or dataset often shows up before the product or paper it belongs to."}]))

    # ---- ahead: rules on the way ----
    fr = w.get("federal_register", [])
    if fr:
        kinds = collections.Counter(r["kind"] for r in fr)
        out.append(group("rules", "ahead", "Rules on the way", "Federal Register", "https://www.federalregister.gov/", ent, ["federal_register"],
                         [("Documents naming Anthropic", str(len(fr)), ", ".join(f"{n} {k.lower()}" for k, n in kinds.most_common()))], [],
                         [{"title": "Federal Register documents", "note": "Full-text match: some only mention Anthropic in passing, for example in a quoted comment.",
                           "rows": [{"title": r["title"], "url": r["url"], "date": (r["at"] or "")[:10] or None,
                                     "meta": " · ".join(filter(None, [r["kind"], ", ".join((r["detail"] or {}).get("agencies") or [])[:80]]))} for r in fr[:10]]}]))
    out = [g for g in out if g]
    return {"readOn": max(filter(None, (g["readOn"] for g in out)), default=None), "groups": out} if out else None


data = {e: b for e in sorted(set(S) | set(W)) if (b := build(e))}
header = """// AUTO-GENERATED by data/corpus/gen_signals_ts.py from ontology.series_point and ontology.watch_item.
// Each company's signals: history (how it got here), now (this week) and ahead (early signals). Do not edit by hand.

export type Horizon = "history" | "now" | "ahead";
export interface SignalKpi { label: string; value: string; sub: string | null }
export interface SignalLine { key: string; label: string; points: [string, number][] }
export interface SignalChart { title: string; unit: string; grain: "week" | "month"; lines: SignalLine[]; note: string | null }
export interface SignalRow { title: string; url: string | null; date: string | null; meta: string | null }
export interface SignalList { title: string; rows: SignalRow[]; note: string | null }
export interface SignalGroup { id: string; horizon: Horizon; title: string; source: string; sourceUrl: string | null; readOn: string | null; kpis: SignalKpi[]; charts: SignalChart[]; lists: SignalList[]; note: string | null; paid: boolean }
export interface EntitySignals { readOn: string | null; groups: SignalGroup[] }

"""
text = header + "export const AI_SIGNALS: Record<string, EntitySignals> = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n"
if "--check" in sys.argv:
    cur = open(DEST, encoding="utf8").read() if os.path.exists(DEST) else ""
    if cur != text:
        raise SystemExit("aiSignals.ts is stale: run gen_signals_ts.py")
    print("aiSignals.ts up to date")
else:
    open(DEST, "w", encoding="utf8").write(text)
    print(f"wrote {DEST}: {len(text) // 1024} KB, {sum(len(v['groups']) for v in data.values())} groups for {len(data)} companies")
