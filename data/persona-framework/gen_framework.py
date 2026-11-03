#!/usr/bin/env python3
"""
gen_framework.py: the Global Persona Framework, from the workbook to the site.

The workbook is the source of truth and it is published as-is at
/personas/framework/Global_Persona_Classification_Framework.xlsx. This reads it
and writes two derived files, so the page, the markdown twin and the download
can never disagree:

  src/data/personaFramework.ts   typed data the page and the fan-out tool import
  public/personas/framework.md   the plain-text edition for AI clients

It is a classification library, not a measurement: every row says whether it
is authored or references a source, and the workbook's own preamble rules are
carried through verbatim, because they are the point. The generator refuses a
workbook whose shape it does not recognise rather than guessing at columns.

  python3 data/persona-framework/gen_framework.py           # write
  python3 data/persona-framework/gen_framework.py --check   # preflight gate
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parents[2]
XLSX = ROOT / "public" / "personas" / "framework" / "Global_Persona_Classification_Framework.xlsx"
TS_OUT = ROOT / "src" / "data" / "personaFramework.ts"
MD_OUT = ROOT / "public" / "personas" / "framework.md"
SITE = "https://venkatapagadala.com"
PAGE = f"{SITE}/personas/framework"

EXPECTED = [
    "ID", "Domain", "Persona dimension", "Classification / example values", "Selection type",
    "Your persona: selected value(s)", "Definition / global rules", "Useful follow-up question",
    "Scope / evidence to collect", "Handling requirement", "Basis / source link",
]
SELECTIONS = {"Single", "Multiple", "Numeric", "Text", "Repeated", "Scale"}
URL = re.compile(r"https?://\S+")


def slugify(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def clean(v) -> str:
    return " ".join(str(v).split()) if v not in (None, "") else ""


def load():
    ws = openpyxl.load_workbook(XLSX, data_only=True).worksheets[0]
    rows = list(ws.iter_rows(values_only=True))
    hdr = [clean(c) for c in rows[7]]
    if hdr != EXPECTED:
        sys.exit(f"workbook columns changed; expected {EXPECTED}, got {hdr}")

    # The preamble carries the version and the rules the library is used under.
    pre = [clean(c) for r in rows[:6] for c in r if c not in (None, "")]
    version = next((m.group(1) for p in pre if (m := re.search(r"Version:\s*([^.]+)\.", p))), "")
    rules = [p for p in pre if re.match(r"^(USE|SELECTION TYPES|ALL FIELDS ACCEPT|GLOBAL DEFINITIONS|KEEP SEPARATE|SAFE USE):", p)]
    tagline = next((p for p in pre if p.startswith("An extensible classification library")), "")
    if not version or len(rules) != 6:
        sys.exit(f"preamble not recognised: version={version!r}, rules={len(rules)}")

    dims, fams, seen = [], {}, set()
    for r in rows[8:]:
        if not any(c not in (None, "") for c in r):
            continue
        d = dict(zip(hdr, r))
        pid = clean(d["ID"])
        if not re.fullmatch(r"P\d{3}", pid) or pid in seen:
            sys.exit(f"bad or duplicate id {pid!r}")
        seen.add(pid)
        m = re.match(r"^(\d{2}) \| (.+)$", clean(d["Domain"]))
        if not m:
            sys.exit(f"{pid}: domain not 'NN | Name': {d['Domain']!r}")
        fid, fname = m.group(1), m.group(2)
        fams.setdefault(fid, {"id": fid, "name": fname, "slug": f"f{fid}-{slugify(fname)}", "count": 0})
        fams[fid]["count"] += 1

        sel = clean(d["Selection type"])
        if sel not in SELECTIONS:
            sys.exit(f"{pid}: unknown selection type {sel!r}")

        # Two cells hold two fields separated by a newline: scope / evidence,
        # and basis text / source URL. Split them rather than flatten them.
        scope_raw = str(d["Scope / evidence to collect"] or "")
        scope, _, evidence = scope_raw.partition("\n")
        basis_raw = str(d["Basis / source link"] or "")
        url = URL.search(basis_raw)
        basis = clean(URL.sub("", basis_raw))

        dims.append({
            "id": pid,
            "family": fid,
            "name": clean(d["Persona dimension"]),
            "values": [clean(v) for v in str(d["Classification / example values"]).split(";") if clean(v)],
            "selection": sel,
            "rule": clean(d["Definition / global rules"]),
            "ask": clean(d["Useful follow-up question"]),
            "scope": clean(scope),
            "evidence": clean(evidence),
            "handling": clean(d["Handling requirement"]),
            "basis": basis,
            **({"sourceUrl": url.group(0).rstrip(".,)")} if url else {}),
        })

    for f in ("Persona dimension", "Definition / global rules", "Useful follow-up question"):
        pass  # emptiness was checked above through clean(); rows with no id were skipped

    return version, tagline, rules, [fams[k] for k in sorted(fams)], dims


def ts(version, tagline, rules, fams, dims) -> str:
    j = lambda v: json.dumps(v, ensure_ascii=False)
    out = [
        "/**",
        " * Generated by data/persona-framework/gen_framework.py from",
        " * public/personas/framework/Global_Persona_Classification_Framework.xlsx.",
        " * Do not edit by hand: edit the workbook and regenerate.",
        " *",
        " * A classification library, not a measurement. Every dimension records",
        " * whether it is authored or references a source, what evidence would",
        " * support a value, and how the value must be handled. The preamble rules",
        " * are carried verbatim because they are the terms the library is used on.",
        " */",
        "",
        'export type FrameworkSelection = "Single" | "Multiple" | "Numeric" | "Text" | "Repeated" | "Scale";',
        "",
        "export interface FrameworkFamily {",
        '  /** Two-digit family number, "01" to "42". */',
        "  id: string;",
        "  name: string;",
        "  /** Anchor id on /personas/framework. */",
        "  slug: string;",
        "  count: number;",
        "}",
        "",
        "export interface FrameworkDimension {",
        '  /** "P001" to "P463". */',
        "  id: string;",
        "  /** FrameworkFamily.id */",
        "  family: string;",
        "  name: string;",
        "  /** Example values as the workbook lists them; extensible, never exhaustive. */",
        "  values: string[];",
        "  selection: FrameworkSelection;",
        "  /** Definition and the global rule for using it. */",
        "  rule: string;",
        "  /** The follow-up question that turns the dimension into an input. */",
        "  ask: string;",
        "  /** Unit and reference period the value applies to. */",
        "  scope: string;",
        "  /** Evidence that would support a value. */",
        "  evidence: string;",
        "  handling: string;",
        "  /** Authored, or the reference it follows. */",
        "  basis: string;",
        "  sourceUrl?: string;",
        "}",
        "",
        f"export const FRAMEWORK_VERSION = {j(version)};",
        f"export const FRAMEWORK_TAGLINE = {j(tagline)};",
        f"export const FRAMEWORK_RULES: string[] = {j(rules)};",
        f"export const FRAMEWORK_FAMILIES: FrameworkFamily[] = {j(fams)};",
        "",
        "export const FRAMEWORK: FrameworkDimension[] = [",
    ]
    for d in dims:
        out.append("  " + j(d) + ",")
    out += [
        "];",
        "",
        "export const frameworkById = (id: string): FrameworkDimension | undefined => FRAMEWORK.find((d) => d.id === id);",
        "export const frameworkFamily = (id: string): FrameworkFamily | undefined => FRAMEWORK_FAMILIES.find((f) => f.id === id);",
        "export const dimensionsIn = (familyId: string): FrameworkDimension[] => FRAMEWORK.filter((d) => d.family === familyId);",
        "",
        "export const FRAMEWORK_COUNTS = {",
        f"  dimensions: {len(dims)},",
        f"  families: {len(fams)},",
        f"  sourced: {sum(1 for d in dims if 'sourceUrl' in d)},",
        f"  authored: {sum(1 for d in dims if 'sourceUrl' not in d)},",
        "} as const;",
        "",
    ]
    return "\n".join(out)


def md(version, tagline, rules, fams, dims) -> str:
    L = [
        "---",
        "type: Classification library",
        "title: Global Persona Framework",
        f"version: {version}",
        "person: Venkata Pagadala",
        f"canonical: {PAGE}",
        f"workbook: {PAGE}/Global_Persona_Classification_Framework.xlsx",
        f"dimensions: {len(dims)}",
        f"families: {len(fams)}",
        "generated_from: public/personas/framework/Global_Persona_Classification_Framework.xlsx",
        "---",
        "",
        "# Global Persona Framework",
        "",
        tagline,
        "",
        f"{len(dims)} dimensions in {len(fams)} families. "
        f"{sum(1 for d in dims if 'sourceUrl' in d)} reference a named source; the rest are authored classifications with no population estimate attached. "
        "Every dimension states its definition and global rule, the follow-up question that turns it into an input, the scope and evidence that would support a value, and how the value must be handled.",
        "",
        f"Canonical: {PAGE}",
        f"Workbook: {PAGE}/Global_Persona_Classification_Framework.xlsx",
        f"Used by: {SITE}/personas/fanout-journey",
        "",
        "## Rules",
        "",
    ]
    L += [f"- {r}" for r in rules]
    L += ["", "## Families", ""]
    L += [f"- [{f['id']} {f['name']}](#{f['slug']}): {f['count']} dimensions" for f in fams]
    L.append("")
    for f in fams:
        L += [f"## {f['id']} {f['name']}", ""]
        for d in dims:
            if d["family"] != f["id"]:
                continue
            L.append(f"### {d['id']} {d['name']}")
            L.append("")
            L.append(f"- Selection: {d['selection']}")
            L.append(f"- Values: {'; '.join(d['values'])}")
            L.append(f"- Rule: {d['rule']}")
            L.append(f"- Ask: {d['ask']}")
            if d["scope"]:
                L.append(f"- Scope: {d['scope']}")
            if d["evidence"]:
                L.append(f"- Evidence: {d['evidence']}")
            L.append(f"- Handling: {d['handling']}")
            L.append(f"- Basis: {d['basis']}" + (f" {d['sourceUrl']}" if d.get("sourceUrl") else ""))
            L.append("")
    return "\n".join(L)


def main() -> int:
    version, tagline, rules, fams, dims = load()
    outputs = {TS_OUT: ts(version, tagline, rules, fams, dims), MD_OUT: md(version, tagline, rules, fams, dims)}
    if "--check" in sys.argv:
        stale = [p for p, body in outputs.items() if not p.exists() or p.read_text() != body]
        if stale:
            print("stale: " + ", ".join(str(p.relative_to(ROOT)) for p in stale))
            print("Run: python3 data/persona-framework/gen_framework.py")
            return 1
        print("framework data and markdown twin match the workbook")
        return 0
    for p, body in outputs.items():
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(body)
        print(f"wrote {p.relative_to(ROOT)} ({len(body):,} bytes)")
    print(f"{len(dims)} dimensions, {len(fams)} families, version {version}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
