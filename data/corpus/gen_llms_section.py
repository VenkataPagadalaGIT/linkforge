#!/usr/bin/env python3
"""
Regenerate the Audience Personas block of public/llms.txt from the database.

It was hand-written and went stale: it still told AI clients that gender splits
were excluded because two reads did not reconcile, which stopped being true
when the primary PDF settled it. A description that lies to an answer engine is
worse than no description, so it is generated now and the section is replaced
wholesale rather than edited.
"""
import os, sys, re
sys.path.insert(0, os.path.dirname(__file__))
from db import query

ROOT = os.path.join(os.path.dirname(__file__), "..", "..")
LLMS = os.path.join(ROOT, "public", "llms.txt")
SITE = "https://venkatapagadala.com"

def pad(r, n): return list(r) + [""] * (n - len(r))

obs, mets, segs, docs = (int(query(q)[0][0]) for q in [
    "SELECT count(*) FROM observation",
    "SELECT count(*) FROM metric",
    "SELECT count(*) FROM segment",
    "SELECT count(*) FROM document",
])
year = query("SELECT max(period) FROM observation WHERE period ~ '^[0-9]{4}$'")[0][0]
srcs = query("""SELECT d.title, d.url, d.sample_size, d.moe_overall, d.field_start, d.field_end
                FROM document d ORDER BY d.slug;""")

# Read the generated question list so llms.txt and the site cannot diverge.
qsrc = open(os.path.join(ROOT, "src", "data", "corpusQuestions.ts")).read()
questions = re.findall(r'slug: "([^"]+)", short: "([^"]+)".*?title: "([^"]+)"', qsrc)

L = []
L.append("## Audience Personas")
L.append("")
L.append(
  f"An interactive US audience tool backed only by published research. {obs:,} observations "
  f"across {mets} metrics and {segs} population segments, drawn from {docs} source documents, "
  f"most recently fielded {year}. Every figure is labelled measured (a published cell, cited) or "
  f"estimated (combined from published cells in odds space, with the arithmetic printed), and "
  f"traits that no source measures are shown as gaps rather than filled in. Sample sizes and "
  f"margins of error appear on every row; the tool draws the margin of error as a hundred dots so "
  f"the uncertainty is visible rather than stated. Confidence falls as a persona narrows, per "
  f"Chapman et al. (2008), instead of rising.")
L.append("")
L.append(f"- URL: {SITE}/personas")
L.append(f"- Data and full crosstabs: {SITE}/personas/data")
L.append("")
L.append("### Source documents")
L.append("")
for r in srcs:
    t, u, n, moe, fs, fe = pad(r, 6)
    bits = []
    if n: bits.append(f"n={int(n):,}")
    if moe: bits.append(f"±{moe}pp")
    if fs and fe: bits.append(f"fielded {fs} to {fe}")
    L.append(f"- [{t}]({u}){': ' + ', '.join(bits) if bits else ''}")
L.append("")
L.append("### Questions answered, one page each")
L.append("")
for slug, short, title in questions:
    L.append(f"- [{title}]({SITE}/personas/{slug})")
L.append("")

block = "\n".join(L)
txt = open(LLMS).read()
start = txt.index("## Audience Personas")
nxt = txt.index("\n## ", start + 5)
open(LLMS, "w").write(txt[:start] + block + txt[nxt + 1:])
print(f"llms.txt: {len(questions)} question pages, {len(srcs)} sources, {obs:,} observations")
