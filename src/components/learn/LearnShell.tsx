import Link from "next/link";
import { LEARN_CHAPTERS, LEARN_COUNTS } from "@/data/learn";

/**
 * LearnShell: the W3Schools-style frame for the AI Tutorial.
 *
 * A persistent chapter tree on the left, lesson content on the right.
 * Server-rendered: the sidebar is plain links (SEO-crawlable), the active
 * topic is highlighted from the slug, and on mobile the tree collapses
 * into a <details> disclosure with zero JavaScript.
 */
export default function LearnShell({
  activeSlug,
  children,
}: {
  activeSlug: string | null;
  children: React.ReactNode;
}) {
  const tree = (
    <nav aria-label="Tutorial chapters">
      {LEARN_CHAPTERS.map((ch) => (
        <div key={ch.id} className="mb-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 px-3 mb-1.5">
            {ch.title}
          </p>
          <ul>
            {ch.topics.map((t) => {
              const active = t.slug === activeSlug;
              return (
                <li key={t.slug}>
                  <Link
                    href={`/learn/${t.slug}`}
                    aria-current={active ? "page" : undefined}
                    className={`block px-3 py-1.5 font-mono text-xs border-l-2 transition-colors ${
                      active
                        ? "border-emerald-400 text-foreground bg-secondary/40"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/20"
                    }`}
                  >
                    {t.short}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      <Link
        href="/learn"
        className="block px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
      >
        Tutorial home
      </Link>
    </nav>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-16">
      <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-10">
        {/* mobile: collapsible tree */}
        <details className="lg:hidden mb-6 border border-border bg-card/30">
          <summary className="cursor-pointer list-none px-4 py-3 font-mono text-[11px] uppercase tracking-widest text-muted-foreground hover:text-foreground flex items-center justify-between">
            <span>
              Chapters · {LEARN_COUNTS.topics} lessons
            </span>
            <span aria-hidden="true">▾</span>
          </summary>
          <div className="border-t border-border py-3">{tree}</div>
        </details>

        {/* desktop: sticky tree */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto border border-border bg-card/20 py-4">
            {tree}
          </div>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
