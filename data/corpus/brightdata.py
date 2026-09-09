"""
Bright Data transport for the crawler.

Used ONLY for pewresearch.org, and only because their edge throttles direct
fetching to a standstill: three pages in eight minutes with an adaptive
backoff already in play. usafacts.org is crawled free and never touches this.

Money controls are code, not intentions, per the cost-safety rules:
  - HARD_CAP aborts the run, checked before every billable call
  - a lock file makes a second concurrent paid worker impossible
  - only status='pending' rows are ever fetched, so a resume never re-buys
  - cumulative spend is logged every batch, and the rate is asserted

Rate: $1.5 per 1,000 requests, pay-as-you-go, "pay only for success".
Source: https://brightdata.com/pricing/web-unlocker, read 2026-09-09.
There is also a 5,000 request/month free tier, so real spend is likely lower
than the estimate. The estimate does not assume it.
"""
import atexit, json, os, re, sys, time, urllib.request, uuid

COST_PER_REQUEST = 0.0015          # $1.5 / 1,000
HARD_CAP = 12.00                   # approved ceiling
LOCK = "/tmp/corpus.brightdata.lock"

_session = None
_url = None


def _endpoint():
    global _url
    if _url is None:
        cfg = json.load(open(os.path.expanduser("~/.claude.json")))
        _url = cfg["projects"]["/Users/venkatapagadala/Desktop/mono-mind-seo"] \
                  ["mcpServers"]["brightdata"]["url"]
    return _url


def acquire_lock():
    """A second paid worker on the same slice is the $100 bug. Refuse it."""
    if os.path.exists(LOCK):
        pid = open(LOCK).read().strip()
        alive = pid.isdigit() and os.path.exists(f"/proc/{pid}")
        try:
            os.kill(int(pid), 0); alive = True
        except Exception:
            alive = False
        if alive:
            raise SystemExit(f"[LOCK] a paid crawl is already running (pid {pid}). Refusing to duplicate.")
        os.remove(LOCK)
    open(LOCK, "w").write(str(os.getpid()))
    atexit.register(lambda: os.path.exists(LOCK) and os.remove(LOCK))


def _rpc(method, params=None, timeout=420):
    global _session
    body = json.dumps({"jsonrpc": "2.0", "id": str(uuid.uuid4()), "method": method,
                       **({"params": params} if params else {})}).encode()
    h = {"Content-Type": "application/json",
         "Accept": "application/json, text/event-stream"}
    if _session:
        h["Mcp-Session-Id"] = _session
    req = urllib.request.Request(_endpoint(), data=body, headers=h)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        if not _session:
            _session = r.headers.get("Mcp-Session-Id")
        return r.read().decode("utf-8", "replace")


def init():
    global _session
    _session = None
    _rpc("initialize", {"protocolVersion": "2024-11-05", "capabilities": {},
                        "clientInfo": {"name": "corpus-crawler", "version": "1.0"}})


def _payload(raw):
    """Pull the tool result text out of a JSON or SSE-framed response."""
    for line in raw.splitlines():
        line = line[6:] if line.startswith("data: ") else line
        if not line.strip().startswith("{"):
            continue
        try:
            d = json.loads(line)
        except Exception:
            continue
        res = d.get("result") or {}
        parts = res.get("content") or []
        txt = "".join(p.get("text", "") for p in parts if isinstance(p, dict))
        if txt:
            return txt
    return ""


def scrape(urls, spend):
    """
    Fetch up to 10 urls. Returns (list of (url, body_or_None), new_spend).

    The cap is checked BEFORE the call, so it can never be exceeded rather
    than merely detected afterwards.
    """
    if spend + len(urls) * COST_PER_REQUEST > HARD_CAP:
        raise SystemExit(f"[BUDGET] ${HARD_CAP} cap reached at ${spend:.2f}. Stopping.")
    txt = _payload(_rpc("tools/call", {"name": "scrape_batch",
                                       "arguments": {"urls": list(urls)}}))
    spend += len(urls) * COST_PER_REQUEST

    out = []
    try:
        # The tool returns a JSON array of {url, ...} objects, sometimes
        # wrapped in provenance markers. Find the array.
        m = re.search(r"\[\s*\{.*\}\s*\]", txt, re.S)
        items = json.loads(m.group(0)) if m else []
    except Exception:
        items = []
    by_url = {}
    for it in items:
        if isinstance(it, dict):
            u = it.get("url") or it.get("input_url") or ""
            body = it.get("markdown") or it.get("content") or it.get("text") or it.get("body") or ""
            if u:
                by_url[u.rstrip("/")] = body
    for u in urls:
        out.append((u, by_url.get(u.rstrip("/")) or by_url.get(u) or None))
    return out, spend
