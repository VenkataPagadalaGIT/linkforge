#!/usr/bin/env python3
"""The attester: deterministic, no model in the loop.

Takes a receipt from okf_corpus_counts.py and answers one question: do the
numbers this site publishes match the numbers its own data produces? It
re-derives the counts itself rather than trusting the receipt's values, so a
doctored receipt fails, and it greps the published surfaces (llms.txt, the
OKF datasets, the rendered pages' source) for the claims they state.

Exit code 0 means every published claim matches the data. Non-zero means at
least one number on the site is a lie, which is the only outcome worth
having a checker for.

Usage:
  python3 scripts/okf_corpus_counts.py > /tmp/receipt.json
  python3 scripts/okf_attest.py /tmp/receipt.json
  python3 scripts/okf_attest.py /tmp/receipt.json --live   # also check the live domain
"""
import json
import os
import re
import subprocess
import sys
import urllib.request

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LIVE = "https://venkatapagadala.com"
UA = {"User-Agent": "okf-attester/1.0"}

# Where each claim is published, and the pattern that carries the number.
# (surface, path-or-url, regex with one capturing group, receipt key)
CLAIMS = [
    ("public/llms.txt", r"(\d+) AI concepts across 10 categories", "concepts"),
    ("public/llms-full.txt", r"(\d+) AI concepts across 10 categories", "concepts"),
    ("public/okf/datasets/ai-encyclopedia.md", r"description: (\d+) AI concepts", "concepts"),
    ("public/okf/datasets/index.md", r"(\d+) concepts across 10 categories", "concepts"),
    ("public/okf/datasets/ai-roadmap.md", r"(\d+) topics", "topics"),
    ("public/okf/datasets/index.md", r"(\d+) resources across", "resources"),
    ("public/okf/datasets/ai-ontology.md", r"(\d+) entities across 7 layers", "entities"),
    ("public/okf/datasets/index.md", r"(\d+) entities,", "entities"),
    ("src/components/Navbar.tsx", r'note: "(\d+) concepts, one page each"', "concepts"),
    ("app/notebook/ai/encyclopedia/page.tsx", r"(\d+) AI concepts across 10 categories", "concepts"),
    ("app/projects/page.tsx", r"(\d+)-entity map of the AI economy", "entities"),
    ("app/notebook/ai/map/page.tsx", r"(\d+) Entities, 7 Layers", "entities"),
]

LIVE_CLAIMS = [
    ("/llms.txt", r"(\d+) AI concepts across 10 categories", "concepts"),
    ("/okf/datasets/index.md", r"(\d+) concepts across 10 categories", "concepts"),
    ("/okf/datasets/ai-ontology.md", r"(\d+) entities across 7 layers", "entities"),
    ("/notebook/ai/encyclopedia", r"(\d+) concepts explained", "concepts"),
]


def rederive():
    out = subprocess.run(
        [sys.executable, os.path.join(REPO, "scripts", "okf_corpus_counts.py")],
        capture_output=True, text=True, timeout=600,
    )
    if out.returncode != 0:
        raise RuntimeError("re-derivation failed: " + out.stderr[-2000:])
    return json.loads(out.stdout)


def read_local(rel):
    with open(os.path.join(REPO, rel), encoding="utf-8") as fh:
        return fh.read()


def read_live(path):
    req = urllib.request.Request(LIVE + path, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r:
        body = r.read().decode("utf-8", "ignore")
    return re.sub(r"<!--.*?-->", "", body, flags=re.S)


def main():
    if len(sys.argv) < 2:
        print("usage: okf_attest.py <receipt.json> [--live]")
        return 2
    receipt = json.load(open(sys.argv[1], encoding="utf-8"))
    check_live = "--live" in sys.argv

    truth = rederive()["values"]

    # A receipt whose values disagree with a fresh derivation is not evidence.
    if receipt.get("values") != truth:
        print("VERDICT: FAIL, receipt values do not match a fresh derivation")
        for k in sorted(set(list(truth) + list(receipt.get("values", {})))):
            a, b = receipt.get("values", {}).get(k), truth.get(k)
            if a != b:
                print(f"  {k}: receipt={a} rederived={b}")
        return 1

    print("ok:   receipt matches a fresh derivation")
    print("      " + ", ".join(f"{k}={v}" for k, v in sorted(truth.items())))

    failures = []

    # A hand-listed claim table only checks the places someone remembered to
    # list. Three OKF files kept stale counts (471 entities, twenty-eight
    # volumes) straight through a release because they were not on it. So
    # also sweep the whole bundle for numbers that LOOK like our headline
    # counts but are not the current ones.
    stale = {
        "471": "entities (now %d)" % truth["entities"],
        "1,245": "edges (now %d, 1,245 was the candidate count)" % truth["edges"],
        "twenty-eight": "roadmap volumes (now %d)" % truth["topics"],
        "123 concepts": "concepts (now %d)" % truth["concepts"],
        "154 concepts": "concepts (now %d)" % truth["concepts"],
        "420 resources": "resources (now %d)" % truth["resources"],
    }
    okf_root = os.path.join(REPO, "public", "okf")
    for dirpath, _, filenames in os.walk(okf_root):
        for fn in filenames:
            if not fn.endswith(".md"):
                continue
            full = os.path.join(dirpath, fn)
            rel = os.path.relpath(full, REPO)
            text = open(full, encoding="utf-8").read()
            # log.md is a history; old numbers there are the point.
            if fn == "log.md":
                continue
            for needle, meaning in stale.items():
                for line in text.splitlines():
                    if needle not in line:
                        continue
                    # An old number is fine when the prose is explicitly
                    # about the past: "1,245 candidate edges, 84 were cut".
                    if re.search(r"candidate|was |were |previously|before|superseded|historic",
                                 line, re.I):
                        continue
                    failures.append(f"{rel}: stale {needle} for {meaning} -> {line.strip()[:90]}")

    for rel, pattern, key in CLAIMS:
        try:
            text = read_local(rel)
        except FileNotFoundError:
            failures.append(f"{rel}: missing")
            continue
        m = re.search(pattern, text)
        if not m:
            failures.append(f"{rel}: claim pattern not found ({pattern})")
            continue
        stated, actual = int(m.group(1)), truth[key]
        if stated != actual:
            failures.append(f"{rel}: states {key}={stated}, data says {actual}")
        else:
            print(f"ok:   {rel} {key}={stated}")

    if check_live:
        for path, pattern, key in LIVE_CLAIMS:
            try:
                text = read_live(path)
            except Exception as exc:
                failures.append(f"LIVE {path}: {exc}")
                continue
            m = re.search(pattern, text)
            if not m:
                failures.append(f"LIVE {path}: claim pattern not found")
                continue
            stated, actual = int(m.group(1)), truth[key]
            if stated != actual:
                failures.append(f"LIVE {path}: states {key}={stated}, data says {actual}")
            else:
                print(f"ok:   LIVE {path} {key}={stated}")

    print()
    if failures:
        print(f"VERDICT: FAIL ({len(failures)})")
        for f in failures:
            print("  x " + f)
        return 1
    print("VERDICT: PASS, every published count matches the data it claims to describe")
    return 0


if __name__ == "__main__":
    sys.exit(main())
