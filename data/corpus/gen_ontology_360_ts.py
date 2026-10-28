#!/usr/bin/env python3
"""
Generate src/data/ai360.ts: the 360 layer of each company file.

  people    public-role people with their group, photo credit, quotes and
            other roles (the links between companies that run through people)
  rounds    every financing from the first round to the IPO, with investors
  legal     lawsuits and government actions as the company discloses them
  advisors  auditors, counsel and underwriters named in filings
  facts     identity facts with their sentences
  hiring    open roles from the company's public job board: teams, cities,
            themes from role titles, newest roles

Run: python3 gen_ontology_360_ts.py [--check]
"""
import collections, datetime as dt, json, os, re, subprocess, sys
sys.path.insert(0, os.path.dirname(__file__))
from db import CONTAINER, DB, USER

HERE = os.path.dirname(os.path.abspath(__file__))
DEST = os.path.join(HERE, "..", "..", "src", "data", "ai360.ts")


def rows(q):
    p = subprocess.run(["docker", "exec", "-i", CONTAINER, "psql", "-U", USER, "-d", DB, "-t", "-A", "-c",
                        "SELECT COALESCE(jsonb_agg(t), '[]'::jsonb)::text FROM (" + q + ") t"], capture_output=True, text=True)
    if p.returncode != 0:
        raise SystemExit("QUERY FAILED:\n" + p.stderr[-2000:])
    return json.loads(p.stdout.strip() or "[]")


ev = rows("""
  SELECT e.target_kind, e.target_id, e.quote, e.url, e.locator, d.title, d.published_on, s.kind AS source_kind, s.name AS publisher
  FROM ontology.evidence e LEFT JOIN document d ON d.id = e.document_id LEFT JOIN source s ON s.id = d.source_id
  WHERE e.target_kind IN ('person','affiliation','legal_case','engagement','funding_round','fact') ORDER BY e.id""")
by = collections.defaultdict(list)
for e in ev:
    by[(e["target_kind"], e["target_id"])].append({"quote": e["quote"], "url": e["url"], "locator": e["locator"], "source": e["title"] or "",
                                                   "publisher": e["publisher"], "publishedOn": e["published_on"], "secondary": e["source_kind"] == "aggregator"})

out = collections.defaultdict(lambda: {"people": [], "rounds": [], "legal": [], "advisors": [], "facts": [], "hiring": None})

aff = collections.defaultdict(list)
for a in rows("""SELECT a.id, a.person_id, a.org_name, o.slug AS org_entity, a.title, a.kind, a.period, a.start_year, a.end_year, a.current
                 FROM ontology.affiliation a LEFT JOIN ontology.entity o ON o.id = a.org_entity_id ORDER BY a.person_id, a.sort_order, a.id"""):
    aff[a["person_id"]].append({"org": a["org_name"], "entity": a["org_entity"], "title": a["title"], "kind": a["kind"], "period": a["period"],
                                "startYear": a["start_year"], "endYear": a["end_year"], "current": a["current"], "evidence": by[("affiliation", a["id"])]})

GROUP_ORDER = {"officer": 0, "director": 1, "founder": 2, "trustee": 3, "former_director": 4, None: 5}
for p in rows("""SELECT p.id, p.slug, p.name, p.public_role, p.grp, p.site_path, p.wikidata, p.image_path, p.image_credit, p.image_license, p.image_license_url,
                        p.image_page, p.sort_order, e.slug AS entity
                 FROM ontology.person p JOIN ontology.entity e ON e.id = p.entity_id WHERE p.verification = 'verified'
                 ORDER BY e.slug, p.sort_order NULLS LAST, p.name"""):
    photo = {"src": p["image_path"], "credit": p["image_credit"], "license": p["image_license"], "licenseUrl": p["image_license_url"], "page": p["image_page"]} if p["image_path"] else None
    out[p["entity"]]["people"].append({"slug": p["slug"], "name": p["name"], "role": p["public_role"], "group": p["grp"] or "leader", "sitePath": p["site_path"],
                                       "wikidata": p["wikidata"], "photo": photo, "evidence": by[("person", p["id"])], "affiliations": aff[p["id"]]})
for k in out:
    out[k]["people"].sort(key=lambda x: GROUP_ORDER.get(x["group"], 5))

inv = collections.defaultdict(list)
for i in rows("""SELECT ri.round_id, ri.investor_name, o.slug AS entity, ri.investor_kind, ri.role FROM ontology.round_investor ri
                 LEFT JOIN ontology.entity o ON o.id = ri.investor_entity_id ORDER BY ri.round_id, ri.role, ri.id"""):
    inv[i["round_id"]].append({"name": i["investor_name"], "entity": i["entity"], "kind": i["investor_kind"], "role": i["role"]})
ROLE_ORDER = {"lead": 0, "co_lead": 1, "participant": 2}
for r in rows("""SELECT r.*, e.slug AS entity FROM ontology.funding_round r JOIN ontology.entity e ON e.id = r.entity_id ORDER BY e.slug, r.sort_order"""):
    out[r["entity"]]["rounds"].append({
        "slug": r["slug"], "round": r["round"], "tranche": r["tranche"], "kind": r["kind"], "stage": r["stage"], "started": r["started"], "ended": r["ended"],
        "announcedOn": r["announced_on"], "investors": r["investors"], "pricePerShare": float(r["price_per_share"]) if r["price_per_share"] is not None else None,
        "shares": r["shares"], "amount": float(r["amount"]) if r["amount"] is not None else None, "qualifier": r["amount_qualifier"],
        "postMoney": float(r["post_money"]) if r["post_money"] is not None else None, "voting": r["voting"], "summary": r["summary"],
        "who": sorted(inv[r["id"]], key=lambda x: ROLE_ORDER[x["role"]]), "evidence": by[("funding_round", r["id"])]})

for c in rows("""SELECT c.*, e.slug AS entity FROM ontology.legal_case c JOIN ontology.entity e ON e.id = c.entity_id ORDER BY e.slug, c.sort_order"""):
    out[c["entity"]]["legal"].append({"slug": c["slug"], "name": c["name"], "court": c["court"], "role": c["role"], "kind": c["kind"], "filed": c["filed"],
                                      "status": c["status"], "statusOn": c["status_on"], "counterparties": c["counterparties"] or [],
                                      "amount": float(c["amount"]) if c["amount"] is not None else None, "summary": c["summary"], "docketUrl": c["docket_url"],
                                      "evidence": by[("legal_case", c["id"])]})

for g in rows("""SELECT g.*, e.slug AS entity, o.slug AS org_entity FROM ontology.engagement g JOIN ontology.entity e ON e.id = g.entity_id
                 LEFT JOIN ontology.entity o ON o.id = g.org_entity_id ORDER BY e.slug, g.sort_order"""):
    out[g["entity"]]["advisors"].append({"org": g["org_name"], "entity": g["org_entity"], "role": g["role"], "since": g["since"], "until": g["until"],
                                         "current": g["current"], "evidence": by[("engagement", g["id"])]})

for f in rows("""SELECT f.*, e.slug AS entity FROM ontology.fact f JOIN ontology.entity e ON e.id = f.entity_id ORDER BY e.slug, f.sort_order"""):
    out[f["entity"]]["facts"].append({"key": f["key"], "label": f["label"], "value": f["value"], "asOf": f["as_of"], "evidence": by[("fact", f["id"])]})

# ---- Hiring: open roles on each company's public job board ----
# Themes come from words in role titles, first match wins; they are approximate on purpose.
THEMES = [
    ("chips", "Chips and hardware", r"silicon|asic|\bchips?\b|hardware|\brtl\b|physical design|\bsoc\b|\bgpu\b|\btpu\b|accelerator|kernel|cuda|firmware|photonic|packaging|systems? architect"),
    ("datacenters", "Data centers and compute", r"data ?cent(er|re)|datacenter|\bcompute\b|capacity|\bpower\b|energy|electrical|mechanical|construction|site selection|facilit|cluster|\bhpc\b|network|technician"),
    ("research", "Research", r"research|scientist|pre-?training|post-?training|reinforcement|interpretab|alignment|model behavior|\bevals?\b|fellow"),
    ("safety", "Safety, security, policy", r"safety|trust|security|policy|governance|privacy|\brisk\b|integrity|compliance|threat|abuse|red team|safeguard|enforcement|harms?\b|cyber|affairs|tabletop"),
    ("inference", "Inference and performance", r"inference|performance|\bperf\b|latency|serving|optimi[sz]ation|benchmark"),
    ("data", "Training data and tutors", r"tutor|annotat|human data|label(l)?ing|\brater\b|data specialist"),
    ("corporate", "Finance, legal, people, ops", r"finance|financial|accountant|accounting|legal|counsel|paralegal|\bpeople\b|recruit|talent|\bhr\b|\btax\b|treasury|payroll|procurement|workplace|chief of staff|executive assistant|real estate|corporate development|investor relations|\bsox\b|\baudit\b|expense|vendor|contracts?\b|\bm&a\b|transaction|\bit\b"),
    ("gtm", "Sales and customers", r"sales|account (executive|manager|director)|solutions? (architect|engineer|consultant)|customer|partner|marketing|growth|business development|forward deployed|success|revenue|go-to-market|\bgtm\b|field|pre-?sales|channel|alliances|demand gen|communications|events|deal desk|strategist|applied ai|deployment|engagement|enablement|\bcx\b|\bfde\b|support|commercial|enterprise|public sector|startups|brand|podcast|media|editor|escalations|social"),
    ("product", "Product and engineering", r"engineer|developer|product|design|frontend|backend|full.?stack|platform|software|mobile|devops|\bsre\b|\bdata\b|infrastructure|\binfra\b|technical program"),
]
THEME_RE = [(k, l, re.compile(p, re.I)) for k, l, p in THEMES]
ALIAS = {"NYC": "New York City", "New York": "New York City", "SF": "San Francisco", "San Francisco Bay Area": "San Francisco", "US - Remote": "Remote (US)",
         "Remote - US": "Remote (US)", "Remote-Friendly": "Remote-friendly", "Remote, US": "Remote (US)"}


def theme(title):
    for k, l, rx in THEME_RE:
        if rx.search(title or ""):
            return k
    return "other"


def city(name):
    n = (name or "").strip()
    if re.match(r"remote[- ]friendly", n, re.I):
        return "Remote-friendly"
    if re.match(r"remote", n, re.I) or re.search(r"\bremote\b", n, re.I):
        return "Remote" if "US" not in n and "United States" not in n else "Remote (US)"
    head = n.split(",")[0].strip()
    return ALIAS.get(head, head)


boards = {b["entity"]: b for b in rows("SELECT e.slug AS entity, b.board, b.careers_url FROM ontology.job_board b JOIN ontology.entity e ON e.id = b.entity_id")}
posts = rows("""SELECT e.slug AS entity, p.title, p.team, p.location, p.locations, p.workplace, p.url, p.published_on, p.first_seen, p.last_seen, p.closed_on
                FROM ontology.job_posting p JOIN ontology.entity e ON e.id = p.entity_id
                ORDER BY e.slug, p.published_on DESC NULLS LAST, p.title, p.url""")
by_ent = collections.defaultdict(list)
for p in posts:
    by_ent[p["entity"]].append(p)
LABEL = {k: l for k, l, _ in THEMES} | {"other": "Other"}
for ent, ps in by_ent.items():
    open_ = [p for p in ps if not p["closed_on"]]
    if not open_:
        continue
    as_of = max(p["last_seen"] for p in ps)
    cutoff = (dt.date.fromisoformat(as_of) - dt.timedelta(days=30)).isoformat()
    teams = collections.Counter((p["team"] or "Unlisted").strip() for p in open_)
    cities = collections.Counter(c for p in open_ for c in sorted({city(x) for x in (p["locations"] or [p["location"]]) if x}))
    th = collections.defaultdict(list)
    for p in open_:
        th[theme(p["title"])].append(p["title"])
    themes = sorted(({"key": k, "label": LABEL[k], "count": len(v), "examples": sorted(set(v), key=lambda t: (len(t), t))[:3]} for k, v in th.items()),
                    key=lambda x: (-x["count"], x["key"]))
    wp = collections.Counter(sorted(p["workplace"] or "Not stated" for p in open_))
    # Newest roles, one line per title (a role posted in two cities is still one role to read).
    latest, seen_titles = [], set()
    for p in sorted((p for p in open_ if p["published_on"]), key=lambda p: (p["published_on"], p["title"], p["url"]), reverse=True):
        if p["title"] not in seen_titles:
            seen_titles.add(p["title"])
            latest.append(p)
        if len(latest) == 8:
            break
    closed30 = [p for p in ps if p["closed_on"] and p["closed_on"] >= cutoff]
    first_run = min(p["first_seen"] for p in ps)
    out[ent]["hiring"] = {
        "board": boards.get(ent, {}).get("board"), "careersUrl": boards.get(ent, {}).get("careers_url"), "asOf": as_of, "trackedSince": first_run,
        "open": len(open_), "new30": sum(1 for p in open_ if p["published_on"] and p["published_on"] >= cutoff),
        "closed30": len(closed30) if first_run < cutoff else None,
        "workplace": dict(wp.most_common()), "teams": [{"name": n, "count": c} for n, c in teams.most_common(8)], "teamCount": len(teams),
        "cities": [{"name": n, "count": c} for n, c in cities.most_common(8)], "themes": themes,
        "latest": [{"title": p["title"], "team": p["team"], "location": p["location"], "url": p["url"], "published": p["published_on"]} for p in latest],
    }

data = {k: v for k, v in sorted(out.items()) if v["people"] or v["rounds"] or v["legal"] or v["facts"] or v["hiring"]}
HEADER = """// AUTO-GENERATED by data/corpus/gen_ontology_360_ts.py from the ontology schema in research_corpus.
// The 360 layer of each company file: people and their other roles, funding rounds and investors,
// legal matters, advisors, identity facts and hiring. Do not edit by hand.
import type { IntelEvidence } from "./aiIntel";

export type PersonGroup = "officer" | "director" | "founder" | "trustee" | "former_director" | "leader";
export interface Photo { src: string; credit: string | null; license: string | null; licenseUrl: string | null; page: string | null }
export interface Affiliation { org: string; entity: string | null; title: string; kind: string; period: string | null; startYear: number | null; endYear: number | null; current: boolean; evidence: IntelEvidence[] }
export interface Person360 { slug: string; name: string; role: string; group: PersonGroup; sitePath: string | null; wikidata: string | null; photo: Photo | null; evidence: IntelEvidence[]; affiliations: Affiliation[] }
export type InvestorKind = "individual" | "nonprofit" | "venture" | "growth" | "asset_manager" | "hedge_fund" | "corporate" | "sovereign" | "other";
export interface RoundInvestor { name: string; entity: string | null; kind: InvestorKind; role: "lead" | "co_lead" | "participant" }
export interface FundingRound {
  slug: string; round: string; tranche: string | null; kind: "priced_round" | "note_conversion" | "safe_conversion" | "secondary_resale" | "convertible_note" | "strategic_commitment" | "ipo";
  stage: "pre_public" | "ipo" | "post_public"; started: string | null; ended: string | null; announcedOn: string | null; investors: number | null;
  pricePerShare: number | null; shares: number | null; amount: number | null; qualifier: string | null; postMoney: number | null; voting: boolean;
  summary: string; who: RoundInvestor[]; evidence: IntelEvidence[];
}
export interface LegalCase { slug: string; name: string; court: string | null; role: string; kind: string; filed: string | null; status: string; statusOn: string | null; counterparties: string[]; amount: number | null; summary: string; docketUrl: string | null; evidence: IntelEvidence[] }
export interface Advisor { org: string; entity: string | null; role: string; since: string | null; until: string | null; current: boolean; evidence: IntelEvidence[] }
export interface Fact { key: string; label: string; value: string; asOf: string | null; evidence: IntelEvidence[] }
export interface Hiring {
  board: string | null; careersUrl: string | null; asOf: string; trackedSince: string; open: number; new30: number; closed30: number | null;
  workplace: Record<string, number>; teams: { name: string; count: number }[]; teamCount: number; cities: { name: string; count: number }[];
  themes: { key: string; label: string; count: number; examples: string[] }[];
  latest: { title: string; team: string | null; location: string | null; url: string; published: string | null }[];
}
export interface Entity360 { people: Person360[]; rounds: FundingRound[]; legal: LegalCase[]; advisors: Advisor[]; facts: Fact[]; hiring: Hiring | null }

"""
body = ("export const AI_360: Record<string, Entity360> = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n\n"
        "export const file360 = (id: string): Entity360 | undefined => AI_360[id];\n\n"
        "/** How role titles are sorted into hiring themes (first match wins). */\n"
        "export const HIRING_THEMES: { key: string; label: string }[] = " + json.dumps([{"key": k, "label": l} for k, l, _ in THEMES] + [{"key": "other", "label": "Other"}]) + ";\n")
text = HEADER + body
if "--check" in sys.argv:
    cur = open(DEST, encoding="utf8").read() if os.path.exists(DEST) else ""
    print("360 entities", len(data), "up-to-date" if cur == text else "STALE")
    sys.exit(0 if cur == text else 1)
open(DEST, "w", encoding="utf8").write(text)
print(f"wrote {DEST}: " + ", ".join(f"{k}({len(v['people'])}p,{len(v['rounds'])}r,{len(v['legal'])}l,{'h' + str(v['hiring']['open']) if v['hiring'] else '-'})" for k, v in data.items()))
