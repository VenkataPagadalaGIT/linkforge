"use client";
import ScrollReveal from "@/components/ScrollReveal";
import PageSidebar from "@/components/PageSidebar";
import RichText, { HIGHLIGHT_CLASS } from "@/components/business/RichText";
import { Link } from "@/lib/router-shim";
import { ArrowLeft, BookMarked, Calendar } from "lucide-react";
import type { Fact, Picture, Section, Source, Stat } from "@/lib/business-validate";
import type { NameMap } from "@/lib/business-paths";

/** One related group under the summary: the people on a call, a person's company, and so on. */
export type RelatedGroup = { title: string; links: { href: string; label: string; note?: string; picture?: Picture; initials?: string }[] };

export type BusinessEntryProps = {
  back: { href: string; label: string };
  eyebrow: string;
  title: string;
  /** A logo or photo beside the title, or initials when there is no licensed picture. */
  picture?: Picture;
  initials?: string;
  date?: string;
  summary: string;
  legend?: string;
  stats?: Stat[];
  facts?: Fact[];
  related?: RelatedGroup[];
  sections: Section[];
  sources: Source[];
  names: NameMap;
};

const longDate = (d: string) =>
  new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });

/**
 * The page for an article, a company or a person in the Business Notebook.
 * Green highlights mark what a source said about AI and digital, so a reader
 * (or a video walkthrough) can find those lines at a glance; every line
 * carries a numbered source, listed at the end with its link.
 */
export default function BusinessEntry(p: BusinessEntryProps) {
  const toc = [
    ...(p.facts?.length ? [{ label: "Key facts", id: "key-facts" }] : []),
    ...p.sections.map((s) => ({ label: s.title, id: s.id })),
    { label: "Sources", id: "sources" },
  ];
  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6 lg:flex lg:gap-10">
        <article className="flex-1 min-w-0 max-w-3xl">
          <ScrollReveal>
            <Link to={p.back.href} className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors mb-8">
              <ArrowLeft size={12} /> {p.back.label}
            </Link>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 border border-border text-muted-foreground">{p.eyebrow}</span>
              {p.date && (
                <span className="font-mono text-[10px] text-muted-foreground flex items-center gap-1">
                  <Calendar size={10} /> {longDate(p.date)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 mb-4">
              {(p.picture || p.initials) && <Avatar picture={p.picture} initials={p.initials} size="lg" />}
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground leading-tight">{p.title}</h1>
            </div>
            {p.picture && <p className="font-mono text-[10px] text-muted-foreground/70 -mt-2 mb-4">{p.picture.credit}</p>}
            <p className="font-mono text-sm text-muted-foreground leading-relaxed mb-6 border-l-2 border-foreground/20 pl-4">
              <RichText text={p.summary} names={p.names} />
            </p>
            {p.legend && (
              <p className="font-mono text-xs text-muted-foreground mb-8 flex items-center gap-2">
                <span className={`${HIGHLIGHT_CLASS} inline-block w-6 h-3`} aria-hidden="true" />
                {p.legend}
              </p>
            )}
          </ScrollReveal>

          {p.stats && p.stats.length > 0 && (
            <ScrollReveal>
              <section aria-label="Key numbers" className="mb-10">
                <StatGrid stats={p.stats} />
              </section>
            </ScrollReveal>
          )}

          {p.related && p.related.length > 0 && (
            <ScrollReveal>
              <section aria-label="Related" className="mb-10 grid gap-4 sm:grid-cols-2">
                {p.related.map((g) => (
                  <div key={g.title} className="border border-border p-4">
                    <h2 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">{g.title}</h2>
                    <ul className="space-y-2">
                      {g.links.map((l) => (
                        <li key={l.href} className="flex items-center gap-3">
                          {(l.picture || l.initials) && <Avatar picture={l.picture} initials={l.initials} size="sm" />}
                          <span>
                            <Link to={l.href} className="font-display text-sm font-bold text-foreground underline decoration-foreground/30 underline-offset-2 hover:decoration-foreground">
                              {l.label}
                            </Link>
                            {l.note && <span className="block font-mono text-[11px] text-muted-foreground">{l.note}</span>}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </section>
            </ScrollReveal>
          )}

          {p.facts && p.facts.length > 0 && (
            <ScrollReveal>
              <section id="key-facts" className="scroll-mt-28 mb-10">
                <h2 className="font-display text-xl font-bold text-foreground mb-4">Key facts</h2>
                <dl className="border border-border divide-y divide-border">
                  {p.facts.map((f) => (
                    <div key={f.label} className="grid sm:grid-cols-3 gap-1 sm:gap-4 p-3">
                      <dt className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">{f.label}</dt>
                      <dd className="sm:col-span-2 font-mono text-xs text-foreground leading-relaxed">
                        <RichText text={f.value} names={p.names} />
                        {f.cite !== undefined && (
                          <sup className="ml-0.5">
                            <a href={`#source-${f.cite}`} className="font-mono text-[10px] text-muted-foreground hover:text-foreground">[{f.cite}]</a>
                          </sup>
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            </ScrollReveal>
          )}

          {p.sections.map((s) => (
            <ScrollReveal key={s.id}>
              <section id={s.id} className="scroll-mt-28 mb-10">
                <h2 className="font-display text-xl font-bold text-foreground mb-4">{s.title}</h2>
                <div className="space-y-4">
                  {s.blocks.map((b, i) =>
                    b.type === "stats" ? (
                      <StatGrid key={i} stats={b.items} />
                    ) : b.type === "p" ? (
                      <p key={i} className="font-mono text-[13px] text-muted-foreground leading-relaxed">
                        <RichText text={b.text} names={p.names} />
                      </p>
                    ) : b.ordered ? (
                      <ol key={i} className="list-decimal pl-5 space-y-3 font-mono text-[13px] text-muted-foreground leading-relaxed marker:text-muted-foreground">
                        {b.items.map((t, j) => <li key={j}><RichText text={t} names={p.names} /></li>)}
                      </ol>
                    ) : (
                      <ul key={i} className="list-disc pl-5 space-y-3 font-mono text-[13px] text-muted-foreground leading-relaxed marker:text-muted-foreground">
                        {b.items.map((t, j) => <li key={j}><RichText text={t} names={p.names} /></li>)}
                      </ul>
                    ),
                  )}
                </div>
              </section>
            </ScrollReveal>
          ))}

          <ScrollReveal>
            <section id="sources" className="scroll-mt-28 mb-10 border-t border-border pt-8">
              <div className="flex items-center gap-2 mb-4">
                <BookMarked size={14} className="text-muted-foreground" />
                <h2 className="font-display text-xl font-bold text-foreground">Sources</h2>
              </div>
              <ol className="space-y-3">
                {p.sources.map((src) => (
                  <li key={src.id} id={`source-${src.id}`} className="scroll-mt-28 font-mono text-xs text-muted-foreground leading-relaxed flex gap-3">
                    <span className="shrink-0 text-muted-foreground">[{src.id}]</span>
                    <span>
                      <a href={src.url} target="_blank" rel="noopener noreferrer" className="text-foreground underline decoration-foreground/30 underline-offset-2 hover:decoration-foreground">
                        {src.title}
                      </a>
                      . {src.publisher}, {longDate(src.date)}.{src.note ? ` ${src.note}` : ""}
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          </ScrollReveal>
        </article>

        <PageSidebar sections={toc} shareTitle={p.title} />
      </div>
    </div>
  );
}

/** A grid of numbers, each with its source; green when the number is about AI or digital. */
function StatGrid({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border border border-border">
      {stats.map((s) => (
        <div key={s.label} className={`p-4 sm:p-5 ${s.highlight ? "bg-emerald-500/10 dark:bg-emerald-400/15" : "bg-background"}`}>
          <div className="font-display text-xl sm:text-2xl font-bold text-foreground leading-none mb-2">{s.value}</div>
          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wide leading-snug">
            {s.label}
            {s.cite !== undefined && (
              <a href={`#source-${s.cite}`} className="ml-1 normal-case text-muted-foreground hover:text-foreground">[{s.cite}]</a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/** A logo on a white tile (logos are drawn for light backgrounds), a photo, or initials. */
function Avatar({ picture, initials, size }: { picture?: Picture; initials?: string; size: "sm" | "lg" }) {
  const box = size === "lg" ? "w-16 h-16" : "w-10 h-10";
  if (picture?.url.endsWith(".svg")) {
    return (
      <span className={`${box} shrink-0 flex items-center justify-center rounded border border-border bg-white p-1.5`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={picture.url} alt={picture.alt} className="max-w-full max-h-full object-contain" />
      </span>
    );
  }
  if (picture) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={picture.url} alt={picture.alt} className={`${box} shrink-0 rounded-full object-cover border border-border`} />;
  }
  return (
    <span aria-hidden="true" className={`${box} shrink-0 flex items-center justify-center rounded-full border border-border bg-foreground/[0.04] font-display ${size === "lg" ? "text-lg" : "text-xs"} font-bold text-foreground`}>
      {initials}
    </span>
  );
}
