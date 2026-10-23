"""Build the CMS page (the HTML published to Claude) from the live-site inventory
and the one source of truth in cms/: page types, rules and permissions.

    python scripts/cms/inventory.py .cms/inventory.json
    python scripts/cms/build_view.py .cms/inventory.json .cms/venkatapagadala-cms.html
"""
import collections
import datetime
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CMS = ROOT / "cms"
TEMPLATE = Path(__file__).resolve().parent / "view_template.html"
# Every page carries these two site-wide types, and ListItem/Question/Answer are
# parts of other types, so none of them says what kind of page it is.
SCHEMA_NOISE = {"Person", "WebSite", "ListItem", "Question", "Answer"}


def main(inv_path, out_path):
    inv = json.loads(Path(inv_path).read_text())
    types_cfg = json.loads((CMS / "page-types.json").read_text())["types"]
    rules = json.loads((CMS / "rules.json").read_text())
    perms = json.loads((CMS / "permissions.json").read_text())
    tmax = rules["fields"]["title"]["max"]
    dmin, dmax = rules["fields"]["description"]["min"], rules["fields"]["description"]["max"]

    pages = [p for p in inv["pages"] if p["route"] != "(no route)"]
    by_route = {t["route"]: t for t in types_cfg if t["route"]}
    standalone = next(t for t in types_cfg if t["route"] is None)

    def schema(p):
        return ", ".join([s for s in p["schema"] if s not in SCHEMA_NOISE][:3])

    def canon(p):
        c = p["canonical"]
        if not c:
            return ""
        return "self" if (c.rstrip("/") or "/") == (p["url"].rstrip("/") or "/") else c

    def desc_off(p):
        return (not p["description"]) or not dmin <= len(p["description"]) <= dmax

    order = [t for t in types_cfg if t["route"]] + [standalone]
    members = {t["id"]: [] for t in order}
    for p in pages:
        members[(by_route.get(p["route"]) or standalone)["id"]].append(p)
    unknown = [p["route"] for p in pages if p["route"] not in by_route and "[" in p["route"]]
    if unknown:
        raise SystemExit(f"page types missing from cms/page-types.json: {sorted(set(unknown))}")

    order = sorted([t for t in order if t is not standalone and members[t["id"]]], key=lambda t: -len(members[t["id"]])) + [standalone]
    index = {t["id"]: i for i, t in enumerate(order)}
    types = []
    for t in order:
        ms = members[t["id"]]
        top = collections.Counter(schema(p) or "none" for p in ms).most_common(1)
        fixed = t is standalone
        types.append({
            "name": t["name"], "sub": t.get("note", ""),
            "pattern": f"{len(set(p['route'] for p in ms))} fixed URLs" if fixed else t["route"],
            "count": len(ms), "schema": "various" if fixed else (top[0][0] if top else "none"),
            "source": t["source"], "today": t["today"], "plan": t["plan"],
            "title60": sum(len(p["title"]) > tmax for p in ms), "descOff": sum(desc_off(p) for p in ms),
        })
    rows = []
    for p in pages:
        tid = (by_route.get(p["route"]) or standalone)["id"]
        rows.append([p["url"], index[tid], p["title"], p["description"], p["h1"], p["h1Count"],
                     canon(p), p["robots"], schema(p), p["ogImage"]])

    sufs = rules["titleSuffixes"]
    push = sum(1 for p in pages for s in sufs
               if p["title"].endswith(s) and len(p["title"]) > tmax and len(p["title"]) - len(s) <= tmax)
    robots_vals = collections.Counter(p["robots"] or "not set" for p in pages)
    n = len(pages)
    taken = datetime.datetime.fromtimestamp(os.path.getmtime(inv_path)).astimezone().strftime("%b %d, %Y, %-I:%M %p %Z")
    data = {
        "taken": taken, "base": inv["base"], "rules": rules,
        "totals": {"pages": n, "news": len(members["ai-update"]), "title60": sum(len(p["title"]) > tmax for p in pages),
                   "descOff": sum(desc_off(p) for p in pages), "sitemapUrls": len(inv["pages"])},
        "types": types, "pages": rows,
        "site": {
            "suffixes": [[s, sum(p["title"].endswith(s) for p in pages)] for s in sufs], "suffixPush": push,
            "robotsTxt": inv["robotsTxt"],
            "defaults": [
                ["Meta robots", "; ".join(f"{k} on {v:,} pages" for k, v in robots_vals.most_common())],
                ["Canonical host", f"{inv['base']} on {sum(p['canonical'].startswith('/') for p in pages):,} of {n:,} pages"],
                ["Social image", f"{sum(p['ogImage'] for p in pages):,} of {n:,} pages"],
                ["Sitemap", f"{len(inv['pages']):,} URLs, including /llms.txt and /llms-full.txt"],
                ["AI reader files", "/llms.txt and /llms-full.txt"],
            ],
        },
        "perms": [[r["what"], *r["modes"], r.get("note", "")] for r in perms["rows"]],
    }
    blob = json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    html = TEMPLATE.read_text().replace("/*__DATA__*/", blob)
    Path(out_path).parent.mkdir(parents=True, exist_ok=True)
    Path(out_path).write_text(html)
    print(f"{out_path}: {n} pages, {len(types)} page types, {len(html) // 1024} KB")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
