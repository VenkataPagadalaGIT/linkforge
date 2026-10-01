#!/usr/bin/env python3
"""
Generate the site's entire research data module from research_corpus.

One generator, one output file. Every number the site prints comes through
here, so "where did this figure come from" is always answerable and never
depends on anyone remembering.
"""
import os, sys, json
sys.path.insert(0, os.path.dirname(__file__))
from db import query

DEST = os.path.join(os.path.dirname(__file__), "..", "..", "src", "data", "corpus.ts")

rows = query("""
  SELECT m.slug, m.label, m.definition, COALESCE(o.subject,''),
         COALESCE(sg.slug,''), o.value, o.period, d.slug, d.url, d.published_on
  FROM observation o
  JOIN metric m   ON m.id = o.metric_id
  JOIN document d ON d.id = o.document_id
  LEFT JOIN segment sg ON sg.id = o.segment_id
  WHERE o.period = (SELECT max(o2.period) FROM observation o2
                    WHERE o2.metric_id = o.metric_id AND o2.subject IS NOT DISTINCT FROM o.subject);
""")

segs = query("SELECT slug, dimension, label, n, moe, sort_order, COALESCE(definition,'') FROM segment ORDER BY sort_order, slug;")
docs = query("SELECT slug, title, url, published_on, sample_size, moe_overall, population, field_start, field_end FROM document ORDER BY slug;")

def pad(r, n):
    """psql -A drops trailing empty fields, so short rows are NULLs at the end."""
    return list(r) + [""] * (n - len(r))

metrics = {}
for row in rows:
    slug, label, defn, subj, seg, val, period, dslug, durl, dpub = pad(row, 10)
    m = metrics.setdefault(slug, {"label": label, "definition": defn, "period": period,
                                  "doc": dslug, "url": durl, "subjects": {}})
    m["subjects"].setdefault(subj, {})[seg] = int(float(val))

def js(o): return json.dumps(o, separators=(",", ":"))

out = ["/**",
       " * The research corpus, generated.",
       " *",
       " * Produced by data/corpus/gen_all_ts.py from the research_corpus",
       " * database. Do not hand-edit: re-run the generator. Every figure here",
       " * traces to a document row that records the URL it came from, when it",
       " * was retrieved and how.",
       " */",
       "",
       "export interface CorpusSegment {",
       "  slug: string;",
       "  dimension: string;",
       "  label: string;",
       "  n: number | null;",
       "  moe: number | null;",
       "  /** The source's own category definition, where a bare label loses meaning. */",
       "  definition: string;",
       "}",
       "export interface CorpusDocument {",
       "  slug: string;",
       "  title: string;",
       "  url: string;",
       "  published: string | null;",
       "  sampleSize: number | null;",
       "  moe: number | null;",
       "  population: string | null;",
       "  /** When the data was collected, which is older than when it was published. */",
       "  fieldStart: string | null;",
       "  fieldEnd: string | null;",
       "}",
       "export interface CorpusMetric {",
       "  slug: string;",
       "  label: string;",
       "  definition: string;",
       "  period: string;",
       "  document: string;",
       "  url: string;",
       "  /** subject ('' when the metric stands alone) -> segment ('' = national) -> % */",
       "  values: Record<string, Record<string, number>>;",
       "}",
       "",
       "export const CORPUS_SEGMENTS: CorpusSegment[] = ["]
for row in segs:
    slug, dim, label, n, moe, _, defn = pad(row, 7)
    out.append(f'  {{ slug: {js(slug)}, dimension: {js(dim)}, label: {js(label)}, '
               f'n: {n or "null"}, moe: {moe or "null"}, definition: {js(defn)} }},')
out.append("];")
out.append("")
out.append("export const CORPUS_DOCUMENTS: CorpusDocument[] = [")
for row in docs:
    slug, title, url, pub, n, moe, pop, fs, fe = pad(row, 9)
    out.append(f'  {{ slug: {js(slug)}, title: {js(title)}, url: {js(url)}, '
               f'published: {js(pub) if pub else "null"}, sampleSize: {n or "null"}, '
               f'moe: {moe or "null"}, population: {js(pop) if pop else "null"}, '
               f'fieldStart: {js(fs) if fs else "null"}, fieldEnd: {js(fe) if fe else "null"} }},')
out.append("];")
out.append("")
out.append("export const CORPUS_METRICS: CorpusMetric[] = [")
for slug, m in sorted(metrics.items()):
    out.append(f'  {{ slug: {js(slug)}, label: {js(m["label"])}, definition: {js(m["definition"])}, '
               f'period: {js(m["period"])}, document: {js(m["doc"])}, url: {js(m["url"])}, '
               f'values: {js(m["subjects"])} }},')
out.append("];")
out += ["",
        "export const corpusMetric = (slug: string) => CORPUS_METRICS.find((m) => m.slug === slug);",
        "export const corpusSegment = (slug: string) => CORPUS_SEGMENTS.find((s) => s.slug === slug);",
        "export const corpusDoc = (slug: string) => CORPUS_DOCUMENTS.find((d) => d.slug === slug);",
        "",
        "/**",
        " * How old a figure is, in months, from when its data was COLLECTED",
        " * rather than when it was published. A survey fielded in June and",
        " * published in November is five months old on the day it appears, and",
        " * a page that dates it to November is overstating its freshness.",
        " */",
        "export function ageInMonths(doc: CorpusDocument, now = new Date()): number | null {",
        "  const basis = doc.fieldEnd ?? doc.published;",
        "  if (!basis) return null;",
        "  const d = new Date(basis);",
        "  if (Number.isNaN(d.getTime())) return null;",
        "  return Math.max(0, Math.round((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24 * 30.44)));",
        "}",
        "",
        "export type Freshness = \"current\" | \"aging\" | \"stale\";",
        "",
        "/** Annual surveys: a year old is normal, two years old is a warning. */",
        "export function freshness(doc: CorpusDocument, now = new Date()): Freshness {",
        "  const m = ageInMonths(doc, now);",
        "  if (m === null) return \"aging\";",
        "  return m <= 14 ? \"current\" : m <= 26 ? \"aging\" : \"stale\";",
        "}",
        "",
        "export const FRESHNESS_META: Record<Freshness, { label: string; color: string; note: string }> = {",
        "  current: { label: \"Current\", color: \"#10b981\", note: \"The most recent wave of this survey.\" },",
        "  aging: { label: \"Aging\", color: \"#f59e0b\", note: \"A newer wave may exist. Checked on the date shown.\" },",
        "  stale: { label: \"Stale\", color: \"#ef4444\", note: \"Over two years since collection. Treat as historical.\" },",
        "};",
        "",
        "/** When this corpus was last regenerated from the database. */",
        f"export const CORPUS_GENERATED = {js(__import__('datetime').date.today().isoformat())};",
        "",
        "/** Every figure, flattened. Useful for search and for counting. */",
        "export const CORPUS_CELL_COUNT = CORPUS_METRICS.reduce(",
        "  (n, m) => n + Object.values(m.values).reduce((k, v) => k + Object.keys(v).length, 0),",
        "  0,",
        ");",
        ""]
open(DEST, "w").write("\n".join(out))
cells = sum(len(v) for m in metrics.values() for v in m["subjects"].values())
print(f"metrics {len(metrics)}  segments {len(segs)}  documents {len(docs)}  cells {cells}")
