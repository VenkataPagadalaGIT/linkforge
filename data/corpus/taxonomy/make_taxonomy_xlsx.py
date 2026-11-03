"""The subject taxonomy as a UICF workbook (the owner's canonical classification format; template
~/Downloads/UICF_Finance_Taxonomy.xlsx): Overview, Full Taxonomy (L1..L10, one row per node), L1-L2 Summary.

  python3 taxonomy/make_taxonomy_xlsx.py [out.xlsx]

Reads taxonomy/subjects.json, which build_taxonomy.py writes from subjects.outline (the same data it loads into
Postgres), so the workbook and the site cannot drift. No em dashes, by the owner's rule, even where the template has one.
"""
import json, os, sys
from collections import Counter, OrderedDict
import openpyxl
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser("~/Desktop/mono-mind-seo/KnowledgeGraphFeeds_Subject_Taxonomy.xlsx")
DATE, DATE_LONG = "2026-10-31", "October 31, 2026"

TEAL, DEEP, INK, GREY, BAND = "01696F", "0C4E54", "28251D", "7A7974", "F9F8F5"
HEAD_FILL, BAND_FILL = PatternFill("solid", fgColor=TEAL), PatternFill("solid", fgColor=BAND)
HEAD_FONT = Font(bold=True, size=11, color="FFFFFF")
THIN = Border(bottom=Side(style="thin", color="E5E2DA"))
LEVEL_NAMES = ["Domains", "Subjects", "Topics", "Subtopics", "Story Types", "Story Facets", "Micro-Topics", "Nano-Topics", "Atomic Topics", "Leaf Topics"]

data = json.load(open(os.path.join(HERE, "subjects.json"), encoding="utf-8"))
nodes = data["subjects"]
total = len(nodes)
by_level = Counter(n["level"] for n in nodes)
max_level = max(by_level)
pairs = OrderedDict()
for n in nodes:
    if n["level"] >= 2:
        key = (n["path"][0], n["path"][1])
        pairs[key] = pairs.get(key, 0) + 1

wb = openpyxl.Workbook()

# ---- Overview
ov = wb.active
ov.title = "Overview"
for col, w in zip("ABCDEFG", [3, 40, 18, 18, 25, 25, 20]):
    ov.column_dimensions[col].width = w
ov["B2"] = "Knowledge Graph Feeds: Subject Taxonomy"
ov["B2"].font = Font(bold=True, size=20, color=DEEP)
ov["B3"] = f"Complete L1-L10 Classification System  |  UICF v1.0  |  {DATE_LONG}"
ov["B3"].font = Font(size=12, color=GREY)


def section(row, title):
    ov.cell(row=row, column=2, value=title).font = Font(bold=True, size=14, color=DEEP)


def header(ws, row, col, labels):
    for i, label in enumerate(labels):
        c = ws.cell(row=row, column=col + i, value=label)
        c.fill, c.font = HEAD_FILL, HEAD_FONT


section(5, "Taxonomy Statistics")
header(ov, 7, 2, ["Metric", "Count"])
stats = [(f"L{i} {LEVEL_NAMES[i - 1]}", by_level.get(i, 0)) for i in range(1, 11)] + [("Total Entries", total), ("Maximum Depth", f"L{max_level}")]
r = 8
for i, (metric, value) in enumerate(stats):
    a = ov.cell(row=r, column=2, value=metric)
    b = ov.cell(row=r, column=3, value=value)
    a.font, b.font = Font(bold=True, size=10, color=INK), Font(bold=True, size=10, color=DEEP)
    if isinstance(value, int):
        b.number_format = "#,##0"
    if i % 2:
        a.fill = b.fill = BAND_FILL
    r += 1

r += 2
section(r, "Depth Distribution")
r += 2
header(ov, r, 2, ["Depth Level", "Entry Count", "% of Total"])
r += 1
for i in range(1, 11):
    cells = [ov.cell(row=r, column=2, value=f"L{i}"), ov.cell(row=r, column=3, value=by_level.get(i, 0)), ov.cell(row=r, column=4, value=by_level.get(i, 0) / total)]
    cells[0].font = Font(bold=True, size=10, color=DEEP)
    cells[1].font = cells[2].font = Font(size=10, color=INK)
    cells[1].number_format, cells[2].number_format = "#,##0", "0.0%"
    if (i - 1) % 2:
        for c in cells:
            c.fill = BAND_FILL
    r += 1

r += 2
section(r, "L1-L2 Breakdown")
r += 2
header(ov, r, 2, ["L1", "L2", "Total Entries"])
r += 1
for i, ((l1, l2), count) in enumerate(pairs.items()):
    cells = [ov.cell(row=r, column=2, value=l1), ov.cell(row=r, column=3, value=l2), ov.cell(row=r, column=4, value=count)]
    for c in cells:
        c.font = Font(size=10, color=INK)
    cells[2].number_format = "#,##0"
    if i % 2:
        for c in cells:
            c.fill = BAND_FILL
    r += 1

r += 2
section(r, "Workbook Navigation")
r += 2
header(ov, r, 2, ["Sheet Name", "Contents"])
r += 1
nav = [("Overview", "This sheet: taxonomy stats, depth distribution, L1-L2 breakdown"),
       ("Full Taxonomy", f"Complete L1-L10 taxonomy data ({total:,} entries)"),
       ("L1-L2 Summary", "Summary table with entry counts per L1-L2 combination")]
for i, (name, what) in enumerate(nav):
    a, b = ov.cell(row=r, column=2, value=name), ov.cell(row=r, column=3, value=what)
    a.font, b.font = Font(bold=True, size=10, color=TEAL), Font(size=10, color=INK)
    if i % 2:
        a.fill = b.fill = BAND_FILL
    r += 1
r += 2
ov.cell(row=r, column=2, value=f"Generated: {DATE}  |  Framework: UICF v1.0  |  Source: IPTC Media Topics top level (CC BY 4.0) + Knowledge Graph Feeds L2 to L4 for AI, cybersecurity, crypto, companies, markets, policy and search").font = Font(size=9, color=GREY)

# ---- Full Taxonomy
ft = wb.create_sheet("Full Taxonomy")
for col, w in zip("ABCDEFGHIJ", [25, 25, 30, 30, 32, 32, 35, 35, 38, 38]):
    ft.column_dimensions[col].width = w
header(ft, 1, 1, [f"L{i}" for i in range(1, 11)])
for row, n in enumerate(nodes, start=2):
    for col, label in enumerate(n["path"], start=1):
        ft.cell(row=row, column=col, value=label).font = Font(size=10, color=INK)
ft.freeze_panes = "A2"

# ---- L1-L2 Summary
sm = wb.create_sheet("L1-L2 Summary")
for col, w in zip("ABCDE", [3, 30, 35, 15, 15]):
    sm.column_dimensions[col].width = w
sm["B2"] = "L1-L2 Summary"
sm["B2"].font = Font(bold=True, size=14, color=DEEP)
header(sm, 4, 2, ["L1", "L2", "Entry Count", "% of Total"])
for i, ((l1, l2), count) in enumerate(pairs.items()):
    row = 5 + i
    cells = [sm.cell(row=row, column=2, value=l1), sm.cell(row=row, column=3, value=l2), sm.cell(row=row, column=4, value=count), sm.cell(row=row, column=5, value=count / total)]
    for c in cells:
        c.font, c.border = Font(size=10, color=INK), THIN
    cells[2].number_format, cells[3].number_format = "#,##0", "0.0%"
    if i % 2:
        for c in cells:
            c.fill = BAND_FILL
sm.freeze_panes = "B5"

wb.save(OUT)
print(f"wrote {OUT}: {total} entries, L1 {by_level[1]}, max depth L{max_level}, {len(pairs)} L1-L2 pairs")
