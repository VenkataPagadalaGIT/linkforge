#!/usr/bin/env python3
"""
Daily market quotes for every listed company in the graph: last price, market
cap, day change and 52-week range, from Yahoo Finance through yfinance (free,
unofficial; fine for a localhost dashboard, a licensed feed before anything
public). Tickers come from ontology.entity.ticker; exchange prefixes are turned
into Yahoo symbols (TWSE:2330 -> 2330.TW). Non-tickers (gov, macro, benchmark)
are skipped.

Run: python3 collect_market.py [--only slug,slug]
"""
import datetime as dt, os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
from db import sql, query

SUFFIX = {"TWSE": ".TW", "TSE": ".T", "SZSE": ".SZ", "SSE": ".SS", "AMS": ".AS", "ETR": ".DE", "VIE": ".VI", "LON": ".L", "HKG": ".HK", "KRX": ".KS"}
SKIP = {"private", "nonprofit", "gov", "macro", "benchmark", "emerging", "open-source", "open-standard", "paradigm", "structure"}


def yahoo_symbol(t):
    t = (t or "").strip()
    if not t or t.lower() in SKIP or re.search(r"proposed", t, re.I):
        return None
    if ":" in t:
        ex, code = t.split(":", 1)
        return code + SUFFIX.get(ex.upper(), "") if ex.upper() in SUFFIX else None
    return t


def lit(v):
    return "NULL" if v is None else ("'" + str(v).replace("'", "''") + "'")


def main():
    import yfinance as yf
    only = set(sys.argv[sys.argv.index("--only") + 1].split(",")) if "--only" in sys.argv else None
    rows = [(s, t) for s, t in query("SELECT slug, ticker FROM ontology.entity WHERE ticker IS NOT NULL ORDER BY slug") if (not only or s in only)]
    pairs = [(s, yahoo_symbol(t)) for s, t in rows]
    pairs = [(s, y) for s, y in pairs if y]
    print(f"{len(pairs)} symbols for {len(rows)} tickered entities")
    today = dt.date.today().isoformat()
    st, ok, bad = [], 0, []
    tk = yf.Tickers(" ".join(sorted({y for _, y in pairs})))
    for slug, y in pairs:
        try:
            fi = tk.tickers[y].fast_info
            price, cap, cur = fi.last_price, fi.market_cap, fi.currency
            prev = fi.previous_close
            chg = (price / prev - 1) * 100 if price and prev else None
            hi, lo = fi.year_high, fi.year_low
            if price is None:
                raise ValueError("no price")
        except Exception as e:  # noqa: BLE001
            bad.append(f"{slug}:{y}")
            continue
        st.append("INSERT INTO ontology.market_quote (entity_id, symbol, day, price, currency, market_cap, change_1d_pct, year_high, year_low)"
                  f" VALUES ((SELECT id FROM ontology.entity WHERE slug={lit(slug)}), {lit(y)}, {lit(today)}, {lit(round(price, 4))}, {lit(cur)}, {lit(cap)}, {lit(round(chg, 3) if chg is not None else None)}, {lit(hi)}, {lit(lo)})"
                  " ON CONFLICT (entity_id, symbol, day) DO UPDATE SET price=EXCLUDED.price, currency=EXCLUDED.currency, market_cap=EXCLUDED.market_cap, change_1d_pct=EXCLUDED.change_1d_pct, year_high=EXCLUDED.year_high, year_low=EXCLUDED.year_low, retrieved_at=now();")
        ok += 1
    if st:
        sql("\n".join(st))
    print(f"quotes written: {ok}; no quote: {len(bad)} ({', '.join(bad[:12])}{'...' if len(bad) > 12 else ''})")


if __name__ == "__main__":
    main()
