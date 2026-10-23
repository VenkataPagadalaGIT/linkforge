# Pew fact sheet corpus

Raw source for every reach and access figure on /personas and /personas/data.

## Where it came from

Pew's robots.txt publishes `Content-Signal: ai-train=yes, search=yes, ai-input=yes`
and machine-readable endpoints. Every post has a `.md` twin:

    https://www.pewresearch.org/internet/fact-sheet/social-media.md
    https://www.pewresearch.org/internet/fact-sheet/mobile.md
    https://www.pewresearch.org/internet/fact-sheet/internet-broadband.md
    https://www.pewresearch.org/internet/2025/11/20/social-media-use-2025-methodology.md

No scraper, paid or otherwise, was used or needed. The bare
`/internet/fact-sheet/` index 301s to an unrelated block module, which is a
Pew site bug; the individual sheets resolve fine.

## Pipeline

    parse.py   ->  pew.json     44 tables, structurally extracted
    diff.py    ->  reconciles against what is already shipped
    gen.py     ->  built.json   the reach and access grids
    emit.py    ->  blocks.ts    the TypeScript, generated not typed

Numbers are never hand-transcribed. Every figure in src/data/personas.ts that
comes from Pew was emitted by this pipeline.

## The reconciliation that licensed this

Before ingesting anything new, all 136 reach cells already shipped were
compared cell by cell against the fresh pull. 136 of 136 matched exactly,
zero drift. The earlier pdftotext extraction and this endpoint agree
completely, so the remaining 106 cells were taken from here.

Sample sizes and margins of error are published by Pew only as a PNG
(method.md links it). That image was read directly. All 17 previously
shipped n/MOE pairs were confirmed exact.

## Refresh

Pew updates these sheets roughly annually, most recently 2025-11-20. To
refresh: re-run the four curl commands above into this directory, then
`python3 parse.py && python3 diff.py`. Read the diff before regenerating.
A non-zero mismatch count means Pew revised a figure, and that belongs in
PERSONA_CHANGELOG, not silently in the data.
