import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import { OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/site";
import PersonaStudio from "@/components/personas/PersonaStudio";
import PlatformMark from "@/components/personas/PlatformMark";
import QuestionDirectory from "@/components/personas/QuestionDirectory";
import Disclaimer from "@/components/personas/Disclaimer";
import {
  CITATIONS,
  RESEARCH_PAPERS,
  EVIDENCE,
  REACH,
  GRADE_META,
  METHOD_LABEL,
  PERSONAS,
  PERSONAS_FIRST_PUBLISHED,
  PERSONAS_LAST_UPDATED,
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
        <Breadcrumbs
          className="mb-4"
          trail={[{ href: "/", label: "Home" }, { label: "Personas" }]}
        />
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

        {/* One tool. Build anyone, get an answer that says how it knows. */}
        <section aria-labelledby="st-h" className="mb-6">
          <h2 id="st-h" className="font-display text-2xl font-bold text-foreground mb-2">
            Build anyone, and see where they actually are
          </h2>
          <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-4 max-w-3xl">
            Click or drag traits into the profile. A woman, 33, Asian, earning $80,000. Every
            platform row answers, and every row says how it knows: <span className="text-foreground">measured</span>{" "}
            means a published figure exists and it is cited, <span className="text-foreground">estimated</span>{" "}
            means it was combined from published figures and the arithmetic is printed when you tap
            the row. Ask for something nothing measures, and it says so instead of inventing it.
          </p>
          <PersonaStudio />
          <Disclaimer variant="short" className="mt-3" />
          <p className="font-mono text-[10px] text-muted-foreground/90 leading-relaxed mt-3 max-w-3xl">
            The estimator works in odds, not percentages. Each trait multiplies the national odds
            by the ratio its own published cell implies, and the result converts back to a
            percentage, so it cannot run past 100 the way multiplied percentages do. It assumes the
            traits shift the odds independently of each other, which is rarely exactly true, so the
            confidence label drops as traits are added rather than rising. Sampling error is
            combined in quadrature and shown per row; model error from the independence assumption
            sits on top of that and is not quantified. The underlying cells are all on the{" "}
            <Link href="/personas/data" className="text-foreground underline decoration-border hover:text-glow transition-all">
              data page
            </Link>.
          </p>
        </section>

        {/* Every question the corpus answers, on its own page and linked from
            here. These existed with nothing pointing at them, which made them
            sitemap-only: crawlable, but unreachable for a reader. */}
        <section aria-labelledby="qd-h" className="mb-14">
          <h2 id="qd-h" className="font-display text-2xl font-bold text-foreground mb-2">
            Every question, answered on its own page
          </h2>
          <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-5 max-w-3xl">
            The studio above answers any combination. These answer one question each, with every
            published cut charted, its margin of error, and what the pages currently ranking for
            it actually measured.
          </p>
          <QuestionDirectory />
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

        {/* One link out to everything the tool reads from. */}
        <section aria-labelledby="dp-h" className="mb-14">
          <h2 id="dp-h" className="font-display text-2xl font-bold text-foreground mb-2">
            The data underneath
          </h2>
          <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-4 max-w-3xl">
            Every cell the studio reads from is printed in full on its own page, with sample sizes
            and margins of error: platform reach by gender, age, income, education and race, daily
            use as a separate survey, the US baseline from USAFacts, and which source answers which
            layer at what cost.
          </p>
          <Link
            href="/personas/data"
            className="inline-block border border-border px-4 py-2.5 font-mono text-xs text-foreground hover:border-foreground/50 hover:bg-foreground/5 transition-all"
          >
            Open the data page
          </Link>
        </section>

        <Disclaimer className="mb-14" />

        {/* Full citations. Every number on this page traces to one of these. */}
        <section aria-labelledby="src-h" className="mb-14">
          <h2 id="src-h" className="font-display text-2xl font-bold text-foreground mb-2">
            Sources
          </h2>
          <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-4 max-w-3xl">
            Every figure the studio produces traces to one of the following. Each entry states what
            the study actually measured, its sample and field dates, and when it was last checked.
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
                href="/personas/data"
                className="text-muted-foreground underline decoration-border hover:text-foreground transition-colors"
              >
                The data behind the personas: every published cell, with its margin of error
              </Link>
            </li>
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
