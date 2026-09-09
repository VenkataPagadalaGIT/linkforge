import type { Metadata } from "next";
import Link from "next/link";
import { OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/site";
import PersonaExplorer from "@/components/personas/PersonaExplorer";
import {
  EVIDENCE,
  GRADE_META,
  METHOD_LABEL,
  PERSONAS,
  PERSONAS_FIRST_PUBLISHED,
  PERSONAS_LAST_UPDATED,
  PERSONA_CHANGELOG,
  PERSONA_COUNTS,
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
              const inferred = p.traits.filter((t) => t.grade === "inferred").length;
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
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
                    {measured} measured · {inferred} inferred
                  </p>
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

        {/* Evidence table */}
        <section aria-labelledby="e-h" className="mb-14">
          <h2 id="e-h" className="font-display text-2xl font-bold text-foreground mb-2">
            Which age group uses which platform
          </h2>
          <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-4 max-w-3xl">
            Every row below is published by its named source. Gender splits are deliberately absent:
            see the note at the foot of this page.
          </p>
          <div className="border border-border/60 overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-border text-left">
                  {["Metric", "Segment", "Value", "Source"].map((h) => (
                    <th
                      key={h}
                      className="py-2.5 pr-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="[&_td:first-child]:pl-0">
                {EVIDENCE.map((e) => {
                  const s = studyById(e.studyId);
                  return (
                    <tr key={e.id} className="border-b border-border/40 align-top">
                      <td className="py-2.5 pr-4 font-mono text-xs text-muted-foreground">{e.metric}</td>
                      <td className="py-2.5 pr-4 font-mono text-xs text-muted-foreground/80 whitespace-nowrap">
                        {e.segment}
                      </td>
                      <td className="py-2.5 pr-4 font-mono text-sm text-foreground whitespace-nowrap">
                        {e.value}
                      </td>
                      <td className="py-2.5 font-mono text-[10px] text-muted-foreground/80">
                        {s?.publisher}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
