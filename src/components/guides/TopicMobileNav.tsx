"use client";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { Link } from "@/lib/router-shim";
import { GUIDE_TOPICS } from "@/data/guideTopics";

/**
 * TopicMobileNav: the collapsible topic menu for phones and tablets.
 * Same data as TopicSidebar, same role: closed by default, so it never
 * pushes the actual content below the fold on a 12-word connection.
 */
export default function TopicMobileNav({ activeSlug }: { activeSlug?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <nav aria-label="Browse guides by topic" className="lg:hidden border border-border bg-card/40 mb-10">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
      >
        <span>
          Browse by topic <span className="text-muted-foreground/70">· {GUIDE_TOPICS.length}</span>
        </span>
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul className="border-t border-border px-2 py-2 max-h-[50vh] overflow-y-auto">
          {GUIDE_TOPICS.map((t) => (
            <li key={t.slug}>
              <Link
                to={`/guides/topics/${t.slug}`}
                aria-current={activeSlug === t.slug ? "page" : undefined}
                onClick={() => setOpen(false)}
                className={`flex items-baseline justify-between gap-2 font-mono text-xs py-2 px-2 transition-colors ${
                  activeSlug === t.slug ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>{t.label}</span>
                <span className="text-muted-foreground/70 tabular-nums">{t.guides.length}</span>
              </Link>
            </li>
          ))}
          <li className="border-t border-border mt-2 pt-2">
            <Link to="/guides/topics" onClick={() => setOpen(false)} className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground py-2 px-2 transition-colors">
              All topics, A to Z →
            </Link>
          </li>
        </ul>
      )}
    </nav>
  );
}
