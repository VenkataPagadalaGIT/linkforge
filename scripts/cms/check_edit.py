"""Check a proposed page edit against the owner's rules in cms/rules.json.

Claude runs this on every edit saved in the CMS before changing the repo.

    python scripts/cms/check_edit.py '{"url": "/guides", "title": "Guides", ...}'

Prints the result as JSON. Exits 1 when anything blocks the edit.
"""
import json
import sys
from pathlib import Path

RULES_PATH = Path(__file__).resolve().parents[2] / "cms" / "rules.json"
FIELDS = ("title", "description", "h1", "canonical", "robots")


def load_rules(path=RULES_PATH):
    return json.loads(Path(path).read_text())


def check(edit, rules=None):
    """Return {"block": [...], "warn": [...]} for the fields present in `edit`."""
    rules = rules or load_rules()
    f = rules["fields"]
    site = rules["site"].rstrip("/")
    block, warn = [], []
    values = {k: str(edit[k]).strip() for k in FIELDS if k in edit and edit[k] is not None}

    if "title" in values:
        n = len(values["title"])
        if n < f["title"]["min"]:
            block.append("The title can't be empty.")
        elif n > f["title"]["max"]:
            warn.append(f"Title is {n} characters; your rule is up to {f['title']['max']}.")
    if "description" in values:
        n = len(values["description"])
        if not n:
            warn.append("The meta description is empty.")
        elif not f["description"]["min"] <= n <= f["description"]["max"]:
            warn.append(f"Description is {n} characters; your rule is {f['description']['min']} to {f['description']['max']}.")
    if "h1" in values and not values["h1"]:
        warn.append("The H1 is empty.")
    if values.get("canonical"):
        c = values["canonical"]
        on_site = (c.startswith("/") and not c.startswith("//")) or c == site or c.startswith(site + "/")
        if not on_site or any(ch.isspace() for ch in c):
            block.append("The canonical must be a path on this site, like /guides/what-is-jev.")
    if "robots" in values and values["robots"] not in f["robots"]["allowed"]:
        block.append("Robots must be one of: " + "; ".join(f["robots"]["allowed"]) + ".")
    text = " ".join(values.values()) + " " + str(edit.get("note") or "")
    for rule in rules["forbidden"]:
        if rule["text"] in text and rule["message"] not in block:
            block.append(rule["message"])
    return {"block": block, "warn": warn}


if __name__ == "__main__":
    result = check(json.loads(sys.argv[1]))
    print(json.dumps(result, ensure_ascii=False, indent=2))
    sys.exit(1 if result["block"] else 0)
