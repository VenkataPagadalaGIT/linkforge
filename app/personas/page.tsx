import type { Metadata } from "next";
import Link from "next/link";
import { OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/site";
import PersonaComposer from "@/components/personas/PersonaComposer";
import PersonaExplorer from "@/components/personas/PersonaExplorer";
import ReachMatrix from "@/components/personas/ReachMatrix";
import DailyUsePanel from "@/components/personas/DailyUsePanel";
import PlatformMark from "@/components/personas/PlatformMark";
import {
  CITATIONS,
  USAFACTS_CORPUS,
  US_CONTEXT,
  US_CONTEXT_BUCKETS,
  DATA_LADDER,
  RESEARCH_PAPERS,
  EVIDENCE,
  REACH,
  GRADE_META,
  METHOD_LABEL,
  PERSONAS,
  PERSONAS_FIRST_PUBLISHED,
  PERSONAS_LAST_UPDATED,
  PERSONA_CHANGELOG,
  PERSONA_COUNTS,
  PLATFORMS,
  STUDIES,
  studyById,
} from "@/data/personas";

export const dynamic = "force-static";

const TITLE = "Audience Personas, Graded by Evidence";
const DESCRIPTION =
  "Personas where every trait is labelled measured, derived or inferred, and links to the study behind it. Built from public research: Pew Research Center, DataReportal and Cox Automotive. Updated when the underlying studies are.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/personas" },
  openGraph: {
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
    type: "website",
    url: `${SITE_URL}/personas`,
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${SITE_URL}/personas#page`,
    name: TITLE,
    description: DESCRIPTION,
    dateModified: PERSONAS_LAST_UPDATED,
    datePublished: PERSONAS_FIRST_PUBLISHED,
    citation: STUDIES.map((s) => s.url),
  };

  const grades = ["measured", "derived", "inferred"] as const;

  return (
    <div className="min-h-screen bg-background pt-32 pb-20 px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="max-w-5xl mx-auto">
        <p className="font-mono text-xs tracking-[0.3em] text-muted-foreground mb-4 uppercase">
          Research · Evidence graded · Updated when the studies are
        </p>
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground text-glow mb-4">
          Audience Personas
        </h1>
        <p className="font-mono text-[11px] text-muted-foreground/70 mb-8">
          Last updated {PERSONAS_LAST_UPDATED} · {PERSONA_COUNTS.studies()} studies ·{" "}
          {PERSONA_COUNTS.evidence()} verified evidence rows · {PERSONA_COUNTS.personas()} persona
        </p>

        <p className="font-mono text-sm text-muted-foreground leading-relaxed mb-6 max-w-3xl">
          Most personas state a person&apos;s motivations with the same confidence they state their
          age, when only one of those came from a study. These do not. Every trait carries a grade
          and links to the research behind it, and the traits with no evidence are shown rather than
          hidden, because hiding them is how a persona becomes fiction.
        </p>

        {/* Composer first: the 10,000-foot view, before any percentage. */}
        <section aria-labelledby="c-h" className="mb-14">
          <h2 id="c-h" className="font-display text-2xl font-bold text-foreground mb-2">
            Build a persona from the sources it trusts
          </h2>
          <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-4 max-w-3xl">
            Same product, same city, five different buyers asking five different questions. Drag the
            demand sources a buyer would actually use into the profile, and it identifies which of
            the five they are, or refuses to name one until the mix is strong enough. It never
            invents a person: it reads the sources and names the pattern.
          </p>
          <PersonaComposer />
        </section>

        {/* The explorer goes above the fold: it teaches the method by being used. */}
        <section aria-labelledby="x-h" className="mb-14">
          <h2 id="x-h" className="font-display text-2xl font-bold text-foreground mb-2">
            Build an audience, watch the data respond
          </h2>
          <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-4 max-w-3xl">
            Start wide and add detail. Unlike every other persona tool, this one gets LESS confident
            as you narrow, because that is what the evidence actually does. Add a second lens and it
            will tell you no study measures the overlap.
          </p>
          <PersonaExplorer />
        </section>

        {/* The grading key is the product. Lead with it. */}
        <div className="grid sm:grid-cols-3 gap-3 mb-14">
          {grades.map((g) => (
            <div key={g} className="border border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="inline-block w-2 h-2 rounded-full shrink-0"
                  style={{ background: GRADE_META[g].dot }}
                  aria-hidden="true"
                />
                <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-foreground">
                  {GRADE_META[g].label}
                </p>
              </div>
              <p className="font-mono text-[10px] text-muted-foreground leading-relaxed">
                {GRADE_META[g].note}
              </p>
            </div>
          ))}
        </div>

        {/* Personas */}
        <section aria-labelledby="p-h" className="mb-14">
          <h2 id="p-h" className="font-display text-2xl font-bold text-foreground mb-4">
            The personas
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {PERSONAS.map((p) => {
              const measured = p.traits.filter((t) => t.grade === "measured").length;
              const derived = p.traits.filter((t) => t.grade === "derived").length;
              const inferred = p.traits.filter((t) => t.grade === "inferred").length;
              const total = p.traits.length || 1;
              const mix = [
                { n: measured, c: GRADE_META.measured.dot },
                { n: derived, c: GRADE_META.derived.dot },
                { n: inferred, c: GRADE_META.inferred.dot },
              ];
              return (
                <Link
                  key={p.slug}
                  href={`/personas/${p.slug}`}
                  className="group block border border-border p-6 border-glow-hover transition-all hover:bg-secondary/20"
                >
                  <h3 className="font-display text-lg font-bold text-foreground group-hover:text-glow transition-all mb-2">
                    {p.name}
                  </h3>
                  <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-4">
                    {p.segment}
                  </p>

                  {/* Evidence mix, at a glance */}
                  <div className="flex h-1.5 w-full overflow-hidden mb-2">
                    {mix.map((m, i) =>
                      m.n ? (
                        <span
                          key={i}
                          style={{ width: `${(m.n / total) * 100}%`, background: m.c }}
                          className="block h-full"
                        />
                      ) : null,
                    )}
                  </div>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/80 mb-4">
                    {measured} measured · {derived} derived · {inferred} inferred
                  </p>

                  {/* Top platforms for this persona's primary age cell */}
                  <div className="flex flex-wrap gap-1.5">
                    {PLATFORMS.filter((pl) =>
                      ["youtube", "facebook", "instagram", "tiktok"].includes(pl.id),
                    ).map((pl) => (
                      <span key={pl.id} className="inline-flex items-center gap-1 border border-border/60 px-1.5 py-0.5">
                        <PlatformMark id={pl.id} color={pl.color} size={13} />
                        <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
                          {REACH[pl.id]?.["30-49"] ?? pl.overall}%
                        </span>
                      </span>
                    ))}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Evidence library */}
        <section aria-labelledby="s-h" className="mb-14">
          <h2 id="s-h" className="font-display text-2xl font-bold text-foreground mb-2">
            The studies behind them
          </h2>
          <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-4 max-w-3xl">
            Each one states who was actually surveyed and what it cannot tell you. A persona is only
            ever as good as the population line.
          </p>
          <div className="space-y-3">
            {STUDIES.map((s) => (
              <div key={s.id} className="border border-border/60 p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-display text-base font-bold text-foreground underline decoration-border hover:text-glow transition-all"
                  >
                    {s.publisher}: {s.name}
                  </a>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/80 border border-border/60 px-1.5 py-0.5">
                    {METHOD_LABEL[s.method]}
                  </span>
                </div>
                <p className="font-mono text-[11px] text-muted-foreground mb-2">
                  {s.population}
                  {s.sampleSize ? ` · n=${s.sampleSize.toLocaleString()}` : ""} · fielded {s.fielded}
                </p>
                <p className="font-mono text-[10px] text-muted-foreground/80 leading-relaxed">
                  <span className="text-foreground/70">Cannot tell you: </span>
                  {s.limitation}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Reach matrix: the whole published dataset, one grid */}
        <section aria-labelledby="e-h" className="mb-14">
          <h2 id="e-h" className="font-display text-2xl font-bold text-foreground mb-2">
            Which group uses which platform
          </h2>
          <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-4 max-w-3xl">
            The full published dataset: eight platforms across gender, age, income and education.
            Bar length is the value, the small figure beneath it is the gap from the national
            average, and each column carries its own margin of error.
          </p>
          <ReachMatrix />
        </section>

        {/* Daily use: habit rather than reach */}
        <section aria-labelledby="du-h" className="mb-14">
          <h2 id="du-h" className="font-display text-2xl font-bold text-foreground mb-2">
            Which platforms they open every day
          </h2>
          <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-4 max-w-3xl">
            Reach says a platform can be used. Daily use says it is a habit, and it is the closer
            answer to where an audience actually spends time. A different survey with a different
            sample, so it is kept separate rather than blended. The reversals are the interesting
            part: men out-use women on YouTube daily 58 to 39, while women lead Facebook 60 to 44.
          </p>
          <DailyUsePanel />
        </section>

        {/* Changelog */}
        <section aria-labelledby="c-h" className="mb-14 border border-border/60 p-6">
          <h2 id="c-h" className="font-display text-2xl font-bold text-foreground mb-4">
            What changed, and what was thrown out
          </h2>
          {PERSONA_CHANGELOG.map((c) => (
            <div key={c.date} className="mb-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
                {c.date}
              </p>
              <ul className="space-y-1">
                {c.entries.map((x, i) => (
                  <li key={i} className="font-mono text-xs text-muted-foreground/80 leading-relaxed">
                    {x}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <p className="font-mono text-[11px] text-muted-foreground leading-relaxed mt-4">
            Figures that fail verification are recorded internally and never published, so a later
            refresh cannot quietly reintroduce a number that was already rejected once.
          </p>
        </section>

        {/* The national baseline a persona sits inside. */}
        <section aria-labelledby="us-h" className="mb-14">
          <h2 id="us-h" className="font-display text-2xl font-bold text-foreground mb-2">
            The country a persona lives in
          </h2>
          <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-4 max-w-3xl">
            No persona is credible floating free of its baseline. A household earning $120,000 reads
            differently once you know the median is $81,600. Retrieved from USAFacts, which
            harmonises 70-plus federal agencies, with the agency of record named on every row.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {(["money", "household", "people", "work"] as const).map((b) => (
              <div key={b} className="border border-border/60 p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
                  {US_CONTEXT_BUCKETS[b]}
                </p>
                <div className="space-y-3">
                  {US_CONTEXT.filter((f) => f.bucket === b).map((f) => (
                    <div key={f.id}>
                      <p className="font-mono text-sm text-foreground leading-snug">{f.value}</p>
                      <p className="font-mono text-[10px] text-muted-foreground leading-relaxed mt-0.5">
                        {f.metric} · {f.asOf}
                      </p>
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-[10px] text-muted-foreground underline decoration-border hover:text-foreground transition-colors"
                      >
                        {f.agency}, via USAFacts
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="font-mono text-[10px] text-muted-foreground/90 leading-relaxed mt-4">
            {USAFACTS_CORPUS.note} Collected by direct fetch on 2026-09-09; usafacts.org permits
            ClaudeBot in its robots.txt and every figure above appears in the served HTML, so no paid
            scraper was used or needed.
          </p>
        </section>

        {/* Why the tool behaves as it does, in peer-reviewed terms. */}
        <section aria-labelledby="rf-h" className="mb-14">
          <h2 id="rf-h" className="font-display text-2xl font-bold text-foreground mb-2">
            Why this is built the way it is
          </h2>
          <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-4 max-w-3xl">
            The behaviour that makes this section unusual, losing confidence as a persona narrows,
            is not a stylistic choice. It is the finding of a measured result.
          </p>
          <div className="space-y-3">
            {RESEARCH_PAPERS.map((r) => (
              <div key={r.id} className="border border-border/60 p-5">
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-display text-base font-bold text-foreground underline decoration-border hover:text-glow transition-all"
                >
                  {r.title}
                </a>
                <p className="font-mono text-[11px] text-muted-foreground mt-1 mb-2">
                  {r.authors} · {r.venue} · {r.year}
                </p>
                <p className="font-mono text-[11px] text-muted-foreground/90 leading-relaxed mb-2">
                  {r.finding}
                </p>
                <p className="font-mono text-[11px] text-foreground leading-relaxed">
                  <span className="text-muted-foreground">Applied here: </span>
                  {r.applied}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Which source answers which layer, and what it costs. */}
        <section aria-labelledby="dl-h" className="mb-14">
          <h2 id="dl-h" className="font-display text-2xl font-bold text-foreground mb-2">
            Which source answers which layer
          </h2>
          <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-4 max-w-3xl">
            Four of the six layers below are answered by free public research, most of it federal.
            Paid tooling is justified for collecting what people say and type, never for
            demographics, and nothing at any price answers the last row.
          </p>
          <div className="border border-border/60 overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-border text-left">
                  {["Layer", "The question", "Source", "Cost"].map((h) => (
                    <th key={h} className="py-2.5 pr-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/80">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="[&_td:first-child]:pl-0">
                {DATA_LADDER.map((d) => (
                  <tr key={d.layer} className="border-b border-border/40 align-top">
                    <td className="py-3 pr-4 font-mono text-xs text-foreground whitespace-nowrap">
                      {d.layer}
                    </td>
                    <td className="py-3 pr-4 font-mono text-[11px] text-muted-foreground leading-relaxed">
                      {d.question}
                    </td>
                    <td className="py-3 pr-4 font-mono text-[11px] leading-relaxed">
                      {d.url ? (
                        <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground underline decoration-border hover:text-foreground transition-colors">
                          {d.source}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">{d.source}</span>
                      )}
                      <span className="block text-muted-foreground/90 mt-1">{d.note}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className="font-mono text-[9px] uppercase tracking-wider border px-1.5 py-0.5 whitespace-nowrap"
                        style={{
                          borderColor: d.cost === "free" ? "#10b981" : "#f59e0b",
                          color: d.cost === "free" ? "#10b981" : "#f59e0b",
                        }}
                      >
                        {d.cost}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Full citations. Every number on this page traces to one of these. */}
        <section aria-labelledby="src-h" className="mb-14">
          <h2 id="src-h" className="font-display text-2xl font-bold text-foreground mb-2">
            Sources
          </h2>
          <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-4 max-w-3xl">
            Every figure on this page comes from one of the following. Each entry states what the
            study actually measured, its sample and field dates, and when it was last checked.
          </p>
          <ol className="space-y-4">
            {CITATIONS.map((c, i) => (
              <li key={c.id} className="border border-border/60 p-5">
                <div className="flex gap-3">
                  <span className="font-mono text-[11px] text-muted-foreground/80 tabular-nums shrink-0 pt-0.5">
                    [{i + 1}]
                  </span>
                  <div className="min-w-0">
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-display text-base font-bold text-foreground underline decoration-border hover:text-glow transition-all break-words"
                    >
                      {c.title}
                    </a>
                    <p className="font-mono text-[11px] text-muted-foreground mt-1 mb-2">
                      {c.publisher} · accessed {c.accessed}
                    </p>
                    <p className="font-mono text-[11px] text-muted-foreground/90 leading-relaxed">
                      {c.detail}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <p className="font-mono text-[10px] text-muted-foreground/80 leading-relaxed mt-4">
            No paid audience-intelligence tool was used. Everything here is public research, read at
            the source rather than through an aggregator.
          </p>
        </section>

        <section aria-labelledby="r-h">
          <h2 id="r-h" className="font-display text-2xl font-bold text-foreground mb-4">
            Related
          </h2>
          <ul className="space-y-2 font-mono text-xs">
            <li>
              <Link
                href="/notebook/ai/agents"
                className="text-muted-foreground underline decoration-border hover:text-foreground transition-colors"
              >
                AI Agent Statistics: the same evidence discipline, applied to the agent market
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
