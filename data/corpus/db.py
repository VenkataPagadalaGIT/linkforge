"""Shared connection for the research corpus loaders."""
import os, subprocess, json

CONTAINER = os.environ.get("CORPUS_CONTAINER", "vp-research-db")
DB = os.environ.get("CORPUS_DB", "research_corpus")
USER = os.environ.get("CORPUS_USER", "research")


def sql(statements: str, timeout=120):
    """
    Run SQL inside the container over ONE connection.

    Loaders used to open a connection per batch, which wedged the server
    partway through a large load. Everything a loader has to say now goes
    down a single pipe in one transaction: fewer moving parts, and a failure
    rolls the whole load back instead of leaving it half applied.
    """
    p = subprocess.run(
        ["docker", "exec", "-i", CONTAINER, "psql", "-U", USER, "-d", DB,
         "-v", "ON_ERROR_STOP=1", "-q", "--single-transaction"],
        input=statements, capture_output=True, text=True, timeout=timeout,
    )
    if p.returncode != 0:
        raise SystemExit("SQL FAILED:\n" + p.stderr[-3000:])
    return p.stdout


def query(q):
    p = subprocess.run(
        ["docker", "exec", "-i", CONTAINER, "psql", "-U", USER, "-d", DB,
         "-t", "-A", "-F", "\t", "-c", q],
        capture_output=True, text=True,
    )
    if p.returncode != 0:
        raise SystemExit("QUERY FAILED:\n" + p.stderr[-2000:])
    return [l.split("\t") for l in p.stdout.strip().split("\n") if l.strip()]


def q(v):
    """Quote a value for SQL."""
    if v is None or v == "":
        return "NULL"
    if isinstance(v, (int, float)):
        return str(v)
    return "'" + str(v).replace("'", "''") + "'"
