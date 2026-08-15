import Link from "next/link";
import { LEARN_CHAPTERS, LEARN_COUNTS } from "@/data/learn";

/**
 * LearnShell: the W3Schools-style frame for the AI Tutorial and Reference.
 *
 * A persistent tree on the left, lesson content on the right. Server-
 * rendered: the tree is plain links (SEO-crawlable), the active item is
 * highlighted, and on mobile it collapses into a <details> disclosure
 * with zero JavaScript.
 *
 * Two callers: the Tutorial (default tree, built from LEARN_CHAPTERS)
 * and the Reference (passes its own category groups via props).
 */

export interface ShellGroup {
  title: string;
  /** Optional accent for the group heading (category color). */
  color?: string;
  items: { href: string; label: string }[];
}

const tutorialGroups = (): ShellGroup[] =>
  LEARN_CHAPTERS.map((ch) => ({
    title: ch.title,
    items: ch.topics.map((t) => ({ href: `/learn/${t.slug}`, label: t.short })),
  }));

export default function LearnShell({
  activeSlug,
  activeHref,
  groups,
  treeLabel,
  homeHref = "/notebook/ai/encyclopedia",
  homeLabel = "Encyclopedia home",
  crossLink,
  children,
}: {
  /** Tutorial API: active topic slug (builds default tree). */
  activeSlug?: string | null;
  /** Generic API: active href, used with custom groups. */
  activeHref?: string | null;
  groups?: ShellGroup[];
  treeLabel?: string;
  homeHref?: string;
  homeLabel?: string;
  /** The sibling section, linked at the bottom of the tree. */
  crossLink?: { href: string; label: string };
  children: React.ReactNode;
}) {
  const g = groups ?? tutorialGroups();
  const active = activeHref ?? (activeSlug ? `/learn/${activeSlug}` : null);
  const label = treeLabel ?? `Chapters · ${LEARN_COUNTS.topics} lessons`;

  const tree = (
    <nav aria-label={treeLabel ?? "Tutorial chapters"}>
      {g.map((group) => (
        <div key={group.title} className="mb-5">
          <p
            className="font-mono text-[10px] uppercase tracking-[0.2em] px-3 mb-1.5"
            style={group.color ? { color: group.color } : undefined}
          >
            {group.color ? group.title : <span className="text-muted-foreground/70">{group.title}</span>}
          </p>
          <ul>
            {group.items.map((it) => {
              const isActive = it.href === active;
              return (
                <li key={it.href}>
                  <Link
                    href={it.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`block px-3 py-1.5 font-mono text-xs border-l-2 transition-colors truncate ${
                      isActive
                        ? "border-emerald-400 text-foreground bg-secondary/40"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/20"
                    }`}
                  >
                    {it.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      <div className="border-t border-border/60 pt-3 mt-3">
        <Link
          href={homeHref}
          className="block px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
        >
          {homeLabel}
        </Link>
        {crossLink && (
          <Link
            href={crossLink.href}
            className="block px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
          >
            {crossLink.label}
          </Link>
        )}
      </div>
    </nav>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-16">
      <div className="lg:grid lg:grid-cols-[250px_1fr] lg:gap-10">
        {/* mobile: collapsible tree */}
        <details className="lg:hidden mb-6 border border-border bg-card/30">
          <summary className="cursor-pointer list-none px-4 py-3 font-mono text-[11px] uppercase tracking-widest text-muted-foreground hover:text-foreground flex items-center justify-between">
            <span>{label}</span>
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
