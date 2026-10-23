"use client";

/**
 * Side nav for a question page.
 *
 * These pages run long: the answer, every published cut, the reported totals,
 * the two-questions toggle, the source chain, the claim comparison. A reader
 * arriving from search wants one of those, not all six, and a list of headings
 * that tracks position is the cheapest way to let them jump.
 *
 * Sticky on wide screens, a plain list on narrow ones, and it reads the
 * headings out of the DOM so it cannot list a section that is not there.
 */

import { useEffect, useState } from "react";

export default function PageNav() {
  const [items, setItems] = useState<{ id: string; label: string }[]>([]);
  const [active, setActive] = useState("");

  useEffect(() => {
    const hs = [...document.querySelectorAll("main h2, article h2, h2")]
      .filter((h) => (h.textContent || "").trim().length > 2)
      .map((h, i) => {
        if (!h.id) h.id = `s-${i}-${(h.textContent || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}`;
        return { id: h.id, label: (h.textContent || "").trim() };
      });
    setItems(hs);

    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setActive(vis[0].target.id);
      },
      { rootMargin: "-80px 0px -70% 0px" },
    );
    hs.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  if (items.length < 3) return null;

  return (
    <nav aria-label="On this page" className="lg:sticky lg:top-28">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
        On this page
      </p>
      <ul className="space-y-1 border-l border-border">
        {items.map((it) => (
          <li key={it.id}>
            <a
              href={`#${it.id}`}
              aria-current={active === it.id ? "location" : undefined}
              className={`block pl-3 -ml-px border-l font-mono text-[10px] leading-snug py-0.5 transition-colors ${
                active === it.id
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {it.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
