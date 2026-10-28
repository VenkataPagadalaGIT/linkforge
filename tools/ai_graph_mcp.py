#!/usr/bin/env python3
"""
An MCP server for the AI Intelligence Graph (stdio, JSON-RPC), so agents and
trading or research bots can ask the graph what the page shows: search
entities, read a company file with its sources, ask who is exposed if an
entity fails, what it depends on, how two entities connect, and list deals.

It reads the site's public API (GET /api/ai/graph and /api/ai/entity/<id>),
caches the graph for an hour, and needs no key. Every answer carries the
notice: facts and links from public filings, not investment advice.

Run:   python3 tools/ai_graph_mcp.py            (AI_GRAPH_BASE overrides the site, e.g. http://localhost:3470)
Claude Desktop / Claude Code config:
  {"mcpServers": {"ai-graph": {"command": "python3", "args": ["/path/to/tools/ai_graph_mcp.py"]}}}
"""
import json, os, sys, time, urllib.request
from collections import deque

BASE = os.environ.get("AI_GRAPH_BASE", "https://venkatapagadala.com").rstrip("/")
UP = {"depends_on", "uses", "sources", "customer_of"}
DOWN = {"supplies", "manufactures", "powers", "hosts", "used_by", "leases_to", "licenses"}
CAPITAL = {"invests_in", "guarantees", "acquired"}
_cache = {"at": 0.0, "graph": None}


def fetch(path):
    req = urllib.request.Request(BASE + path, headers={"User-Agent": "ai-graph-mcp/1.0", "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())


def graph():
    if _cache["graph"] is None or time.time() - _cache["at"] > 3600:
        _cache["graph"] = fetch("/api/ai/graph")
        _cache["at"] = time.time()
    return _cache["graph"]


def node(gid):
    return next((n for n in graph()["nodes"] if n["id"] == gid), None)


def fold(s):
    return (s or "").lower()


def search(q, limit=10):
    s = fold(q).strip()
    out = []
    for n in graph()["nodes"]:
        name, al = fold(n["name"]), [fold(a) for a in n.get("aliases", [])]
        tier = 4 if (name == s or s in al or n["id"] == s) else 3 if name.startswith(s) else 2 if s in name else 1 if s in fold(n["tagline"]) else 0
        if tier:
            out.append((tier, n))
    out.sort(key=lambda x: -x[0])
    return [n for _, n in out[:limit]]


def reach(start, kind, hops):
    g = graph()
    ids, used, frontier = {start}, [], [start]
    for _ in range(hops):
        nxt = []
        for x in frontier:
            for e in g["edges"]:
                r = e["relation"]
                y = None
                if kind == "exposed":
                    if r in UP and e["to"] == x: y = e["from"]
                    elif r in DOWN and e["from"] == x: y = e["to"]
                    elif r in CAPITAL and e["to"] == x: y = e["from"]
                else:
                    if r in UP and e["from"] == x: y = e["to"]
                    elif r in DOWN and e["to"] == x: y = e["from"]
                    elif r in CAPITAL and e["to"] == x: y = e["from"]
                if y and y not in ids:
                    ids.add(y); nxt.append(y); used.append(e)
        frontier = nxt
        if not frontier:
            break
    ids.discard(start)
    return ids, used


def path(a, b):
    g = graph()
    adj = {}
    for e in g["edges"]:
        adj.setdefault(e["from"], []).append((e["to"], e))
        adj.setdefault(e["to"], []).append((e["from"], e))
    prev, seen, q = {}, {a}, deque([a])
    while q:
        x = q.popleft()
        for y, e in adj.get(x, []):
            if y in seen:
                continue
            seen.add(y); prev[y] = (x, e)
            if y == b:
                chain, cur = [], b
                while cur != a:
                    px, pe = prev[cur]
                    chain.append({"from": pe["from"], "relation": pe["relation"], "to": pe["to"], "note": pe.get("note")})
                    cur = px
                return list(reversed(chain))
            q.append(y)
    return None


TOOLS = [
    {"name": "search_entities", "description": "Find entities (companies, chips, minerals, policies) by name, alias or description.",
     "inputSchema": {"type": "object", "properties": {"query": {"type": "string"}}, "required": ["query"]}},
    {"name": "entity", "description": "One entity's record, links, group and company file: deals with the filing's wording and quotes, figures, people, events, approved forecasts.",
     "inputSchema": {"type": "object", "properties": {"id": {"type": "string"}}, "required": ["id"]}},
    {"name": "exposed_if_fails", "description": "Who is hurt if this entity fails: its dependents and backers within N steps (default 1).",
     "inputSchema": {"type": "object", "properties": {"id": {"type": "string"}, "hops": {"type": "integer", "minimum": 1, "maximum": 3}}, "required": ["id"]}},
    {"name": "depends_on", "description": "What this entity depends on: its suppliers and backers within N steps (default 1).",
     "inputSchema": {"type": "object", "properties": {"id": {"type": "string"}, "hops": {"type": "integer", "minimum": 1, "maximum": 3}}, "required": ["id"]}},
    {"name": "connect", "description": "The shortest chain of links between two entities.",
     "inputSchema": {"type": "object", "properties": {"from": {"type": "string"}, "to": {"type": "string"}}, "required": ["from", "to"]}},
    {"name": "deals", "description": "Deals from filings (amount with the filing's own qualifier, instrument, term, summary), all or for one entity.",
     "inputSchema": {"type": "object", "properties": {"id": {"type": "string"}}}},
]


def call(name, args):
    g = graph()
    notice = g["notice"]
    if name == "search_entities":
        return {"notice": notice, "results": [{k: n[k] for k in ("id", "name", "typeLabel", "layer", "tagline", "ticker", "chokepoint")} for n in search(args["query"])]}
    if name == "entity":
        return fetch("/api/ai/entity/" + args["id"])
    if name in ("exposed_if_fails", "depends_on"):
        ids, used = reach(args["id"], "exposed" if name == "exposed_if_fails" else "depends", int(args.get("hops") or 1))
        return {"notice": notice, "entity": args["id"], "count": len(ids),
                "entities": [{"id": i, "name": (node(i) or {}).get("name"), "layer": (node(i) or {}).get("layer")} for i in sorted(ids)],
                "links": [{"from": e["from"], "relation": e["relation"], "to": e["to"]} for e in used]}
    if name == "connect":
        p = path(args["from"], args["to"])
        return {"notice": notice, "steps": len(p) if p else None, "chain": p, "none": p is None}
    if name == "deals":
        ds = g["deals"]
        if args.get("id"):
            ds = [d for d in ds if d["from"] == args["id"] or d["to"] == args["id"]]
        return {"notice": notice, "count": len(ds), "deals": ds}
    raise ValueError("unknown tool " + name)


def main():
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            msg = json.loads(line)
        except json.JSONDecodeError:
            continue
        mid, method, params = msg.get("id"), msg.get("method"), msg.get("params") or {}
        if method == "initialize":
            res = {"protocolVersion": params.get("protocolVersion", "2024-11-05"), "capabilities": {"tools": {}}, "serverInfo": {"name": "ai-graph", "version": "1.0"}}
        elif method == "tools/list":
            res = {"tools": TOOLS}
        elif method == "tools/call":
            try:
                out = call(params["name"], params.get("arguments") or {})
                res = {"content": [{"type": "text", "text": json.dumps(out, ensure_ascii=False)}]}
            except Exception as e:  # noqa: BLE001
                res = {"content": [{"type": "text", "text": f"error: {e}"}], "isError": True}
        elif method == "ping":
            res = {}
        else:
            if mid is None:
                continue  # a notification
            sys.stdout.write(json.dumps({"jsonrpc": "2.0", "id": mid, "error": {"code": -32601, "message": "method not found"}}) + "\n")
            sys.stdout.flush()
            continue
        if mid is not None:
            sys.stdout.write(json.dumps({"jsonrpc": "2.0", "id": mid, "result": res}) + "\n")
            sys.stdout.flush()


if __name__ == "__main__":
    main()
