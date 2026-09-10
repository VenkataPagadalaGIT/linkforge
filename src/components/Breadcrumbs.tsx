import Link from "next/link";
import { SITE_URL } from "@/lib/site";

/**
 * One breadcrumb trail, rendered and marked up from the same array.
 *
 * Every page that used one before this hand-wrote its JSON-LD next to
 * separately hand-written visible links, so the two could disagree and
 * nobody would notice. Here the emitted schema and the thing a reader sees
 * are built from one list, and cannot drift.
 *
 * The last crumb is the current page: not a link, and marked
 * aria-current="page" so a screen reader announces where it is rather than
 * offering a link to the page already open.
 */

export interface Crumb {
  /** Omit href on the final crumb. */
  href?: string;
  label: string;
}

export default function Breadcrumbs({
  trail,
  className = "",
}: {
  trail: Crumb[];
  className?: string;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      ...(c.href ? { item: `${SITE_URL}${c.href}` } : {}),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav aria-label="Breadcrumb" className={className}>
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {trail.map((c, i) => (
            <li key={c.label} className="flex items-center gap-2">
              {i > 0 && (
                <span aria-hidden="true" className="font-mono text-[10px] text-muted-foreground/70">
                  /
                </span>
              )}
              {c.href ? (
                <Link
                  href={c.href}
                  className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
                >
                  {c.label}
                </Link>
              ) : (
                <span
                  aria-current="page"
                  className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground"
                >
                  {c.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
