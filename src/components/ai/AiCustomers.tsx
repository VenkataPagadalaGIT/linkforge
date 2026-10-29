"use client";
import * as React from "react";
import { AI_360 } from "@/data/ai360";
import { getNode } from "@/data/aiOntology";

/**
 * Customers a company names itself, one per customer story on its own site, with the product the story is about.
 * Every name links to its story, the primary source; nothing here comes from inference or third-party lists.
 */
export function CustomersSection({ id }: { id: string }) {
  const c = AI_360[id]?.customers;
  const name = getNode(id)?.name ?? id;
  const [product, setProduct] = React.useState<string | null>(null);
  const [q, setQ] = React.useState("");
  if (!c) return null;
  const items = c.items.filter((x) => (!product || (x.product ?? "Not stated") === product) && (!q.trim() || x.name.toLowerCase().includes(q.trim().toLowerCase())));
  const max = Math.max(1, ...c.products.map(([, n]) => n));
  const host = (() => {
    try {
      return new URL(c.items[0]?.url ?? "").host;
    } catch {
      return null;
    }
  })();
  return (
    <div className="space-y-4" data-testid="ai-customers">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">By product in the story</p>
          <ul className="space-y-1">
            {c.products.map(([p, n]) => (
              <li key={p}>
                <button
                  type="button"
                  onClick={() => setProduct(product === p ? null : p)}
                  aria-pressed={product === p}
                  className={`grid w-full grid-cols-[minmax(0,1fr)_2.5rem_30%] items-center gap-2 px-1 py-0.5 text-left font-mono text-[11px] ${product === p ? "bg-foreground/[0.08] text-foreground" : "text-foreground/85 hover:bg-foreground/[0.04]"}`}
                >
                  <span className="truncate">{p}</span>
                  <span className="text-right tabular-nums">{n}</span>
                  <span className="block h-1.5 bg-foreground/10" aria-hidden="true">
                    <span className="block h-full bg-foreground/60" style={{ width: `${Math.max(2, (n / max) * 100)}%` }} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={`Search ${c.total} customers`}
              aria-label="Search customers"
              className="w-full max-w-xs border border-border bg-transparent px-3 py-1.5 font-mono text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-foreground/40"
            />
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              {items.length} shown{product ? ` · ${product}` : ""}
              {product && (
                <button type="button" onClick={() => setProduct(null)} className="ml-2 underline decoration-dotted hover:text-foreground">
                  all products
                </button>
              )}
            </span>
          </div>
          <ul className="grid max-h-[28rem] grid-cols-1 gap-px overflow-auto border border-border bg-border sm:grid-cols-2 xl:grid-cols-3">
            {items.map((x) => (
              <li key={x.url} className="bg-background">
                <a href={x.url} target="_blank" rel="noopener noreferrer" className="block px-3 py-1.5 hover:bg-foreground/[0.04]">
                  <span className="block truncate font-mono text-[11px] font-bold text-foreground">{x.name} ↗</span>
                  <span className="block truncate font-mono text-[10px] text-muted-foreground">{x.product ?? "product not stated"}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="font-mono text-[10px] leading-relaxed text-muted-foreground">
        Every customer {name} names in a customer story on its own site{host ? ` (${host}/customers)` : ""}, one per story, with the product the story names in its title. Each
        name opens its story. A story is the company&apos;s own account, not an audited customer list.
      </p>
    </div>
  );
}
