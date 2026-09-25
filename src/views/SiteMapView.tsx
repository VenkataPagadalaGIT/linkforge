import Link from "next/link";
import type { SectionGroup, SectionId, SectionView, SiteEntry } from "@/lib/siteIndex";

/**
 * The HTML site map: the whole site on /sitemap, one section per
 * /sitemap/<section>. A server component with no client JavaScript at all:
 * every link is in the delivered HTML, so it works behind proxies that block
 * scripts and for any crawler or agent that reads HTML. Big sections fold
 * into <details> on the whole-site page; folded links are still in the page.
 */

// Only the big directories fold on the whole-site page (sessions, encyclopedia,
// systems map, contributors, speakers); everything else reads straight down.
const FOLD_AT = 60;

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "all";

function Row({ e }: { e: SiteEntry }) {
  return (
    <li className="min-w-0">
      <Link
        href={e.href}
        className="flex items-baseline justify-between gap-3 font-mono text-xs text-muted-foreground hover:text-foreground py-1 border-b border-border/40 transition-colors"
      >
        <span className="min-w-0">{e.title}</span>
        {e.note && <span className="shrink-0 text-muted-foreground/70 tabular-nums text-[10px] text-right max-w-[45%] truncate">{e.note}</span>}
      </Link>
    </li>
  );
}

function Group({ g, anchor }: { g: SectionGroup; anchor?: string }) {
  const main = g.entries.filter((e) => !e.minor);
  const minor = g.entries.filter((e) => e.minor);
  return (
    <div id={anchor} className="scroll-mt-28">
      {g.label && (
        <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-5 mb-2">
          {g.label} <span className="text-muted-foreground/70 tabular-nums">· {g.entries.length}</span>
        </h3>
      )}
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8">
        {main.map((e) => (
          <Row key={e.href} e={e} />
        ))}
      </ul>
      {minor.length > 0 && (
        <details className="mt-2">
          <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground">
            Registration, breaks and meals · {minor.length}
          </summary>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 mt-1">
            {minor.map((e) => (
              <Row key={e.href} e={e} />
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function Hubs({ hubs }: { hubs: SiteEntry[] }) {
  if (!hubs.length) return null;
  return (
    <p className="font-mono text-xs text-muted-foreground mb-3 flex flex-wrap gap-x-4 gap-y-1">
      <span className="text-muted-foreground/70 uppercase tracking-widest text-[10px] self-center">Start here</span>
      {hubs.map((h) => (
        <Link key={h.href} href={h.href} className="text-foreground underline decoration-border hover:decoration-foreground underline-offset-4 transition-colors">
          {h.title}
        </Link>
      ))}
    </p>
  );
}

export function SiteMapFilters({ sections, active }: { sections: SectionView[]; active?: SectionId }) {
  const chip = (href: string, label: string, count: number | null, on: boolean) => (
    <Link
      key={href}
      href={href}
      aria-current={on ? "page" : undefined}
      className={`font-mono text-[11px] border px-2.5 py-1 transition-colors ${
        on ? "border-foreground/60 text-foreground bg-foreground/10" : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40"
      }`}
    >
      {label}
      {count !== null && <span className="ml-1.5 text-muted-foreground/70 tabular-nums">{count}</span>}
    </Link>
  );
  const featured = sections.filter((s) => s.meta.featured);
  const rest = sections.filter((s) => !s.meta.featured);
  return (
    <nav aria-label="Filter the site map" className="mb-10 space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {chip("/sitemap", "Whole site", null, !active)}
        {featured.map((s) => chip(`/sitemap/${s.meta.id}`, s.meta.label, s.count, active === s.meta.id))}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/70 mr-1">More</span>
        {rest.map((s) => chip(`/sitemap/${s.meta.id}`, s.meta.label, s.count, active === s.meta.id))}
      </div>
    </nav>
  );
}

export default function SiteMapView({
  sections,
  active,
  pageCount,
  itemCount,
}: {
  sections: SectionView[];
  active?: SectionId;
  /** Pages of the site (the sitemap.xml count). */
  pageCount: number;
  /** Talks, videos, awards and papers that live on a page rather than being one. */
  itemCount: number;
}) {
  const one = active ? sections.find((s) => s.meta.id === active) : undefined;
  const shown = one ? [one] : sections.filter((s) => s.count > 0);

  return (
    <div className="min-h-screen bg-background pt-24 pb-20 px-6">
      <div className="max-w-5xl mx-auto">
        <nav className="font-mono text-xs text-muted-foreground mb-8 flex items-center gap-2 flex-wrap" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-foreground transition-all">Home</Link>
          <span aria-hidden="true">/</span>
          {one ? (
            <>
              <Link href="/sitemap" className="hover:text-foreground transition-all">Site map</Link>
              <span aria-hidden="true">/</span>
              <span className="text-foreground/70">{one.meta.label}</span>
            </>
          ) : (
            <span className="text-foreground/70">Site map</span>
          )}
        </nav>
        <p className="font-mono text-xs tracking-[0.3em] text-muted-foreground mb-4 uppercase">Site map</p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground text-glow mb-6">{one ? one.meta.label : "Site map"}</h1>
        <p className="font-mono text-sm text-muted-foreground leading-relaxed mb-8 max-w-2xl">
          {one
            ? `${one.meta.blurb} ${one.count} ${one.count === 1 ? "entry" : "entries"}.`
            : `Everything on this site in one place: ${pageCount.toLocaleString("en-US")} pages, plus ${itemCount} talks, videos, papers and mentions that live on them, in ${shown.length} sections. Pick a view, or read straight down.`}
        </p>

        <SiteMapFilters sections={sections} active={active} />

        {one && one.groups.length > 4 && (
          <nav aria-label="Jump to group" className="flex flex-wrap gap-1.5 mb-8">
            {one.groups.map((g) => (
              <a
                key={g.label}
                href={`#group-${slug(g.label)}`}
                className="font-mono text-[11px] border border-border px-2 py-1 text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
              >
                {g.label}
              </a>
            ))}
          </nav>
        )}

        <div className="space-y-12">
          {shown.map((s) => {
            const body = (
              <>
                <Hubs hubs={s.hubs} />
                {s.groups.map((g) => (
                  <Group key={g.label} g={g} anchor={one ? `group-${slug(g.label)}` : undefined} />
                ))}
              </>
            );
            return (
              <section key={s.meta.id} id={`section-${s.meta.id}`} className="scroll-mt-28">
                {!one && (
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border pb-2 mb-3">
                    <h2 className="font-display text-2xl font-bold text-foreground">
                      {s.meta.label} <span className="font-mono text-sm text-muted-foreground/70 tabular-nums">{s.count}</span>
                    </h2>
                    <Link href={`/sitemap/${s.meta.id}`} className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
                      Open this view →
                    </Link>
                  </div>
                )}
                {!one && <p className="font-mono text-xs text-muted-foreground/70 mb-3">{s.meta.blurb}</p>}
                {!one && s.count > FOLD_AT ? (
                  <details className="border border-border/60 px-4 py-3">
                    <summary className="cursor-pointer font-mono text-[11px] uppercase tracking-widest text-muted-foreground hover:text-foreground">
                      Show all {s.count}
                    </summary>
                    <div className="mt-3">{body}</div>
                  </details>
                ) : (
                  body
                )}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
