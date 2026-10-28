# research_corpus

Every external figure this site publishes lives here, not in a web page read
once at authoring time.

## Why a database

Numbers used to go straight from a fact sheet into a TypeScript file. That
meant provenance lived in a code comment, and a refresh was a diff against
memory. Now every value carries the document it came from, when it was
retrieved, and how.

## Siloed on purpose

This container is for venkatapagadala.com research data ONLY. No client data
ever goes in it, and this never goes in a client's container. Each project gets
its own database, volume, port and credentials.

## Run it

    cd data/corpus && docker compose up -d
    docker exec -i vp-research-db psql -U research -d research_corpus < schema.sql
    python3 load_pew.py
    python3 load_others.py

Port 5440. Postgres 18. Note the volume mounts at `/var/lib/postgresql`, not
`/var/lib/postgresql/data`: pg18 changed the convention and the old path
restart-loops the container.

## Shape

A narrow star with one grain:

    (document, metric, subject, segment, period) -> value

That single fact table holds platform reach, access rates, news habits,
national statistics and full time series without a table per source.

`observation.basis` is constrained to `'measured'`. Nothing derived is ever
stored, so a modelled number cannot later be mistaken for one somebody
published. The estimator combines at read time and shows its arithmetic there.

## The site does not query this

The site ships static TypeScript. This database GENERATES that file. A build
never depends on a live database, and there is still exactly one place a number
can come from.

## Refresh

The loaders read the archived markdown in `../pew/`, never the network, so a
reload is deterministic. To take a new Pew wave: re-fetch the `.md` files, run
`../pew/diff.py`, READ THE DIFF, then reload. A non-zero mismatch means Pew
revised a figure, and that belongs in the changelog, never silently in the data.

## Crosscheck

    docker exec -i vp-research-db psql -U research -d research_corpus -f /dev/stdin < coverage.sql

## ontology schema (the AI Systems Map as data)

The map at /notebook/ai/map used to live only in `src/data/aiOntologyData.ts`.
Its source of truth is now the `ontology` schema in this database: entities,
typed relations, and a `deal` row for every money figure, with `evidence`
quotes, `event`, `claim` (forward-looking statements from earnings calls),
`signal` (measured series) and `prediction` (our scored calls).

    docker exec -i vp-research-db psql -U research -d research_corpus -v ON_ERROR_STOP=1 -q --single-transaction < ontology_schema.sql
    python3 load_ontology_seed.py          # seeds from the July 2026 file, verification = unverified
    python3 gen_ontology_ts.py --check     # proves the generated file equals the current one
    python3 gen_ontology_ts.py             # writes src/data/aiOntologyData.ts

Rules: nothing in `src/data/aiOntologyData.ts` is hand-edited; a relation's
note changes only after its `deal` and `evidence` rows exist; `person` rows
come from company sites, filings, papers and talks only (the `source_kind`
check enforces it).
