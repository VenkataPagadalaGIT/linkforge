"use client";
import { Link } from "@/lib/router-shim";
import { GUIDE_TOPICS } from "@/data/guideTopics";

/**
 * TopicSidebar: the persistent side menu of every guide topic.
 *
 * Rendered on /guides, every /guides/topics/<slug> hub, and nowhere else:
 * a guide's own page links its own tags inline instead of repeating the
 * whole menu. Sticky, from 768px up (a 1,000px laptop window gets the menu, not a
 * dropdown); TopicMobileNav is the phone equivalent.
 * This is the piece that makes "no orphan URLs" true by construction: every
 * topic slug that exists is listed here, and every guide is listed on at
 * least one topic page, so the two together reach every guide from one
 * fixed, unchanging URL (/guides) no matter how many guides get added.
 */
export default function TopicSidebar({ activeSlug }: { activeSlug?: string }) {
  return (
    <aside className="hidden md:block md:w-44 lg:w-52 shrink-0" aria-label="Browse guides by topic">
      <div className="sticky top-28">
        <p className="font-mono text-[9px] text-muted-foreground/70 uppercase tracking-widest mb-3">
          Browse by topic · {GUIDE_TOPICS.length}
        </p>
        <nav className="space-y-0.5 border-l border-border max-h-[60vh] overflow-y-auto pr-2">
          {GUIDE_TOPICS.map((t) => (
            <Link
              key={t.slug}
              to={`/guides/topics/${t.slug}`}
                aria-current={activeSlug === t.slug ? "page" : undefined}
              className={`flex items-baseline justify-between gap-2 font-mono text-[11px] py-1.5 border-l-2 pl-3 -ml-px transition-colors ${
                activeSlug === t.slug
                  ? "text-foreground border-foreground/50"
                  : "text-muted-foreground/70 border-transparent hover:text-foreground hover:border-foreground/40"
              }`}
            >
              <span className="truncate">{t.label}</span>
              <span className="text-muted-foreground/70 tabular-nums shrink-0">{t.guides.length}</span>
            </Link>
          ))}
        </nav>
        <Link
          to="/guides/topics"
          className="block mt-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
        >
          All topics, A to Z →
        </Link>
      </div>
    </aside>
  );
}
