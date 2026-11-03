"use client";
import { useEffect, useState } from "react";

/**
 * "On this page" for the /about profile card. The links are plain anchors,
 * rendered on the server, so they work with scripts off; the script only
 * marks the section currently in view.
 */
export default function AsideToc({ items }: { items: { id: string; label: string }[] }) {
  const [active, setActive] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-25% 0px -65% 0px" },
    );
    for (const { id } of items) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav aria-label="On this page">
      <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest mb-2">On this page</p>
      <ol className="border-l border-border">
        {items.map((it) => (
          <li key={it.id}>
            <a
              href={`#${it.id}`}
              aria-current={active === it.id ? "location" : undefined}
              className={`block font-mono text-[10px] py-1 pl-3 -ml-px border-l-2 transition-colors ${
                active === it.id
                  ? "text-foreground border-foreground/60"
                  : "text-muted-foreground border-transparent hover:text-foreground hover:border-foreground/40"
              }`}
            >
              {it.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
