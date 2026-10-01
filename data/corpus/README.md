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
