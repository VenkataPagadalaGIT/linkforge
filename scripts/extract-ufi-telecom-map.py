"""
extract-ufi-telecom-map.py: category totals for the industry-map figure in
the User-First Intelligence guide, read from the owner's telecom taxonomy
export (Omniscite, "Telecom_classification.xlsx").

Only aggregates leave the export: per top-level category, its keyword count,
its summed monthly search volume and how many topics sit under it. No
keyword, no topic name below the first level, and no brand is written out.
Topics are counted the way the platform counts them: every node except the
ones pruned as fabricated (42,994 nodes minus 5,282 pruned = 37,712).

Usage: python3 scripts/extract-ufi-telecom-map.py [path/to/Telecom_classification.xlsx]
Writes src/data/ufiTelecomMap.json.
"""
import collections
import json
import os
import sys

import openpyxl

DEFAULT = os.path.expanduser(
    "~/Desktop/iResearch/User First Intelligence/03 Data from outside the project/"
    "Omniscite telecom exports (reviews and taxonomy)/Telecom_classification.xlsx"
)
src = sys.argv[1] if len(sys.argv) > 1 else DEFAULT
out = os.path.join(os.path.dirname(__file__), "..", "src", "data", "ufiTelecomMap.json")

wb = openpyxl.load_workbook(src, read_only=True, data_only=True)
rows = list(wb["Taxonomy"].iter_rows(values_only=True))[1:]
live = [r for r in rows if r[4] != "pruned_fabricated"]
root = next(r for r in rows if r[0] == "telecom")

topics_under = collections.Counter()
second_level = collections.Counter()
for node_id, _label, _kind, depth, *_ in live:
    if depth and depth >= 1:
        top = ".".join(node_id.split(".")[:2])
        if depth >= 2:
            topics_under[top] += 1
        if depth == 2:
            second_level[top] += 1

categories = [
    {
        "label": r[1],
        "keywords": r[5],
        "monthlyVolume": r[6],
        "topics": second_level[r[0]],
        "nodes": topics_under[r[0]],
    }
    for r in rows
    if r[3] == 1 and r[4] != "pruned_fabricated"
]
categories.sort(key=lambda c: -c["keywords"])

data = {
    "_source": "Omniscite telecom taxonomy export (Telecom_classification.xlsx), aggregates only",
    "industry": "Telecommunications",
    "keywords": root[5],
    "monthlyVolume": root[6],
    # Every live node, the way the platform counts topics (it includes the root).
    "topics": len(live),
    "categories": categories,
}
with open(out, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
    f.write("\n")
print(f"wrote {out}: {len(categories)} categories, {data['topics']} topics, {data['keywords']} keywords")
