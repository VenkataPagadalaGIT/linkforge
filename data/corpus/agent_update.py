#!/usr/bin/env python3
"""
The AI agent that keeps a company file current: it reads what the pipelines
brought in since the last run (new pages on the company's sites, new posts,
new filings), asks Claude to extract dated facts, people changes, deals and
legal events from that text, checks every quote it returns against the source
text word for word, and writes the survivors as DRAFT rows in a proposals file
for the owner to approve. Nothing it writes reaches the site until approved:
the loaders read only the curated 360 and company files.

Spend rules (paid-api-cost-safety): it prints the token estimate and refuses
to call the model unless AI_AGENT_APPROVED=1 is set and an API key is present
(ANTHROPIC_API_KEY, or OPENROUTER_API_KEY for the OpenRouter route). The cap is
in code: AI_AGENT_CAP_USD (default 2.00) at the model's published prices.

  python3 agent_update.py --entity anthropic --since 2026-10-21            dry run: shows what would be sent and the estimate
  AI_AGENT_APPROVED=1 python3 agent_update.py --entity anthropic --since 2026-10-21

Output: data/corpus/proposals/<entity>_<date>.json with items like
  {"kind": "event"|"person"|"deal"|"legal"|"fact", "fields": {...}, "quote": "...", "url": "...", "verified": true}
"""
import datetime as dt, json, os, re, sys, urllib.request
sys.path.insert(0, os.path.dirname(__file__))
from db import query

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "proposals")
MODEL = os.environ.get("AI_AGENT_MODEL", "claude-sonnet-5-5")
PRICE_IN, PRICE_OUT = 3.0 / 1e6, 15.0 / 1e6   # USD per token, Sonnet-class list prices; Haiku is cheaper, Opus dearer
CAP = float(os.environ.get("AI_AGENT_CAP_USD", "2.00"))
SYSTEM = """You extract facts about one company from its own published text. Return only JSON: a list of items.
Each item: {"kind": "event|person|deal|legal|fact", "fields": {...}, "quote": "<an exact sentence copied verbatim from the text>", "url": "<the page url>"}.
Kinds: event (date, headline), person (name, role, change: joined|left|promoted), deal (counterparty, instrument, amount, date), legal (name, court, status), fact (key, value, as_of).
Rules: only what the text states; dates as YYYY-MM-DD when the text gives a day; never infer amounts; one exact quote per item, copied character for character; no em dashes."""


def lit(v):
    return "NULL" if v is None else ("'" + str(v).replace("'", "''") + "'")


def new_text(entity, since):
    pages = query(f"""SELECT sp.url, sp.title, sp.published_on, sp.content FROM ontology.site_page sp JOIN ontology.entity e ON e.id = sp.entity_id
                      WHERE e.slug={lit(entity)} AND sp.content IS NOT NULL AND (sp.published_on >= {lit(since)} OR sp.retrieved_at >= {lit(since)}) AND sp.published_on >= {lit(since)}
                      ORDER BY sp.published_on DESC LIMIT 60""")
    return [{"url": u, "title": t, "date": d, "text": c[:12000]} for u, t, d, c in pages]


def norm(t):
    return re.sub(r"\s+", " ", (t or "").replace(" ", " ")).strip()


def ask(prompt_pages):
    key = os.environ.get("ANTHROPIC_API_KEY")
    body = {"model": MODEL, "max_tokens": 4000, "system": SYSTEM,
            "messages": [{"role": "user", "content": "\n\n".join(f"URL: {p['url']}\nTITLE: {p['title']}\nDATE: {p['date']}\nTEXT:\n{p['text']}" for p in prompt_pages)}]}
    if key:
        req = urllib.request.Request("https://api.anthropic.com/v1/messages", data=json.dumps(body).encode(),
                                     headers={"x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json"})
        with urllib.request.urlopen(req, timeout=300) as r:
            d = json.loads(r.read())
        text = "".join(c.get("text", "") for c in d.get("content", []))
        usage = d.get("usage", {})
        return text, usage.get("input_tokens", 0), usage.get("output_tokens", 0)
    okey = os.environ.get("OPENROUTER_API_KEY")
    if not okey:
        raise SystemExit("no ANTHROPIC_API_KEY or OPENROUTER_API_KEY in the environment")
    ob = {"model": "anthropic/" + MODEL, "max_tokens": 4000, "messages": [{"role": "system", "content": SYSTEM}] + body["messages"]}
    req = urllib.request.Request("https://openrouter.ai/api/v1/chat/completions", data=json.dumps(ob).encode(), headers={"Authorization": f"Bearer {okey}", "content-type": "application/json"})
    with urllib.request.urlopen(req, timeout=300) as r:
        d = json.loads(r.read())
    u = d.get("usage", {})
    return d["choices"][0]["message"]["content"], u.get("prompt_tokens", 0), u.get("completion_tokens", 0)


def main():
    a = sys.argv
    entity = a[a.index("--entity") + 1]
    since = a[a.index("--since") + 1] if "--since" in a else (dt.date.today() - dt.timedelta(days=7)).isoformat()
    pages = new_text(entity, since)
    chars = sum(len(p["text"]) for p in pages)
    est_in = chars / 4 + 400 * max(1, len(pages) // 8)
    est_cost = est_in * PRICE_IN + 3000 * max(1, len(pages) // 8) * PRICE_OUT
    print(f"{entity}: {len(pages)} new pages since {since}, {chars:,} characters, estimate {est_in:,.0f} input tokens, about ${est_cost:.2f} at {MODEL} list prices (cap ${CAP:.2f})")
    if not pages:
        return
    if os.environ.get("AI_AGENT_APPROVED") != "1":
        print("dry run: set AI_AGENT_APPROVED=1 (and a key) to extract; nothing sent")
        return
    if est_cost > CAP:
        raise SystemExit(f"[BUDGET] estimate ${est_cost:.2f} is above the cap ${CAP:.2f}; raise AI_AGENT_CAP_USD or narrow --since")
    os.makedirs(OUT, exist_ok=True)
    proposals, spent = [], 0.0
    for i in range(0, len(pages), 8):
        batch = pages[i:i + 8]
        text, tin, tout = ask(batch)
        spent += tin * PRICE_IN + tout * PRICE_OUT
        if spent > CAP:
            print(f"[BUDGET] stopped at ${spent:.2f}")
            break
        m = re.search(r"\[.*\]", text, re.S)
        items = json.loads(m.group(0)) if m else []
        by_url = {p["url"]: norm(p["text"]) for p in batch}
        for it in items:
            q = norm(it.get("quote", ""))
            it["verified"] = bool(q) and q in by_url.get(it.get("url", ""), "")
            proposals.append(it)
    path = os.path.join(OUT, f"{entity}_{dt.date.today().isoformat()}.json")
    json.dump({"entity": entity, "since": since, "model": MODEL, "spent_usd": round(spent, 4), "items": proposals}, open(path, "w", encoding="utf8"), ensure_ascii=False, indent=1)
    ok = sum(1 for p in proposals if p["verified"])
    print(f"wrote {path}: {len(proposals)} proposals, {ok} with a verified quote, ${spent:.3f} spent")


if __name__ == "__main__":
    main()
