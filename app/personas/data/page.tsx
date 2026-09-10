import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import { OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/site";
import PersonaExplorer from "@/components/personas/PersonaExplorer";
import CorpusExplorer from "@/components/personas/CorpusExplorer";
import { CORPUS_SEGMENTS } from "@/data/corpus";
import QuestionDirectory from "@/components/personas/QuestionDirectory";
import Disclaimer from "@/components/personas/Disclaimer";
import ReachMatrix from "@/components/personas/ReachMatrix";
import DailyUsePanel from "@/components/personas/DailyUsePanel";
import {
  CITATIONS,
  DATA_LADDER,
  PERSONAS_LAST_UPDATED,
  PERSONA_CHANGELOG,
  PERSONA_COUNTS,
  RACE_SEGMENTS,
  RACE_REACH,
  SEGMENTS,
  COMMUNITY_SEGMENTS,
  PARTY_SEGMENTS,
  CONTEXT_REACH,
  TECH_ACCESS,
  PLATFORMS,
  STUDIES,
  USAFACTS_CORPUS,
  US_CONTEXT,
  US_CONTEXT_BUCKETS,
} from "@/data/personas";

export const dynamic = "force-static";

/** Columns for the access table: one representative cut per dimension. */
const ACCESS_COLS = [
  ...SEGMENTS.filter((s) => s.dimension === "age"),
  ...RACE_SEGMENTS,
  ...SEGMENTS.filter((s) => s.dimension === "income"),
  ...SEGMENTS.filter((s) => s.dimension === "education"),
  ...COMMUNITY_SEGMENTS,
];

const TITLE = "The Data Behind the Personas";
const DESCRIPTION =
  "Every published figure the persona tool draws on, in full: platform reach by gender, age, income, education and race, daily-use habit, the US baseline from USAFacts, and what each source costs. Sample sizes and margins of error on every row.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/personas/data" },
  openGraph: {
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
    type: "website",
    url: `${SITE_URL}/personas/data`,
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "@id": `${SITE_URL}/personas/data#dataset`,
    name: TITLE,
    description: DESCRIPTION,
    dateModified: PERSONAS_LAST_UPDATED,
    isAccessibleForFree: true,
    citation: STUDIES.map((s) => s.url),
    creator: { "@type": "Person", name: "Venkata Pagadala" },
  };

  return (
    <div className="min-h-screen bg-background pt-32 pb-20 px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="max-w-5xl mx-auto">
        <Breadcrumbs
          className="mb-4"
          trail={[
            { href: "/", label: "Home" },
            { href: "/personas", label: "Personas" },
            { label: "The data" },
          ]}
        />
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground text-glow mb-4">
          The Data Behind the Personas
        </h1>
        <p className="font-mono text-[11px] text-muted-foreground/70 mb-8">
          Last updated {PERSONAS_LAST_UPDATED} · {PERSONA_COUNTS.studies()} studies ·{" "}
          {PERSONA_COUNTS.evidence()} verified evidence rows
        </p>

        <p className="font-mono text-sm text-muted-foreground leading-relaxed mb-10 max-w-3xl">
          Everything the{" "}
          <Link href="/personas" className="text-foreground underline decoration-border hover:text-glow transition-all">
            persona studio
          </Link>{" "}
          reads from, printed in full so you can check its arithmetic rather than trust it. Every
          cell below is a published figure. Nothing here is modelled, combined or inferred: the
          combining happens in the tool, and it shows its working there.
        </p>

        {/* Everything, one surface. */}
        <section aria-labelledby="ce-h" className="mb-14">
          <h2 id="ce-h" className="font-display text-2xl font-bold text-foreground mb-2">
            Every measured figure, one surface
          </h2>
          <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-4 max-w-3xl">
            Pick a question, pick a lens. Platforms, how people get online, where they get news
            including AI chatbots, and the national baseline underneath all of it. Every cell is a
            published figure with its source and sample size attached, and where a source does not
            publish a cut it says so rather than filling the gap.
          </p>
          <CorpusExplorer />
        </section>

        {/* Explorer: one lens at a time, the honest cut of the published data. */}
        <section aria-labelledby="x-h" className="mb-14">
          <h2 id="x-h" className="font-display text-2xl font-bold text-foreground mb-2">
            One lens at a time
          </h2>
          <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-4 max-w-3xl">
            Pick a single dimension and read the published cells straight. Add a second and it tells
            you no study measured the overlap, which is the truthful answer at this level. The
            studio on the main page is where combinations get estimated, with the arithmetic shown.
          </p>
          <PersonaExplorer />
        </section>

        {/* Reach matrix */}
        <section aria-labelledby="e-h" className="mb-14">
          <h2 id="e-h" className="font-display text-2xl font-bold text-foreground mb-2">
            Which group uses which platform
          </h2>
          <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-4 max-w-3xl">
            Eight platforms across gender, age, income and education. Bar length is the value, the
            small figure beneath it is the gap from the national average, and each column carries
            its own margin of error.
          </p>
          <ReachMatrix />
        </section>

        {/* Race and ethnicity */}
        <section aria-labelledby="race-h" className="mb-14">
          <h2 id="race-h" className="font-display text-2xl font-bold text-foreground mb-2">
            The same eight platforms by race and ethnicity
          </h2>
          <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-4 max-w-3xl">
            Published in the same survey, kept in its own table because the sample sizes are much
            smaller and the error bars much wider. The Asian sample is 211 people at plus or minus
            8.9 points, so a nine-point difference in that column may be nothing at all. Pew notes
            its Asian adult estimates represent English speakers only.
          </p>
          {/* The labels are one word; the categories are not. Printed rather
              than left to a footnote, because "Black" and "Hispanic" are built
              differently from each other and that changes how they read. */}
          <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 mb-5">
            {RACE_SEGMENTS.map((sg) => {
              const d = CORPUS_SEGMENTS.find((c) => c.slug === sg.id)?.definition;
              if (!d) return null;
              return (
                <div key={sg.id}>
                  <dt className="font-mono text-[11px] text-foreground">{sg.label}</dt>
                  <dd className="font-mono text-[10px] text-muted-foreground leading-relaxed">{d}</dd>
                </div>
              );
            })}
          </dl>
          <div className="border border-border/60 overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-2.5 pr-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/80">
                    Platform
                  </th>
                  {RACE_SEGMENTS.map((s) => (
                    <th
                      key={s.id}
                      className="py-2.5 pr-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/80 whitespace-nowrap"
                    >
                      {s.label}
                      <span className="block normal-case tracking-normal text-muted-foreground/70">
                        n={s.n.toLocaleString()} ±{s.moe}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="[&_td:first-child]:pl-0">
                {PLATFORMS.map((p) => (
                  <tr key={p.id} className="border-b border-border/40">
                    <td className="py-2.5 pr-4 font-mono text-xs text-foreground whitespace-nowrap">
                      <span
                        className="inline-block w-2 h-2 mr-2 align-middle"
                        style={{ background: `var(--pf-${p.id}, ${p.color})` }}
                        aria-hidden="true"
                      />
                      {p.name}
                    </td>
                    {RACE_SEGMENTS.map((s) => {
                      const v = RACE_REACH[p.id]?.[s.id];
                      return (
                        <td key={s.id} className="py-2.5 pr-4 font-mono text-xs text-muted-foreground tabular-nums">
                          {v === undefined ? "—" : `${v}%`}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>


        {/* Community and party */}
        <section aria-labelledby="ctx-h" className="mb-14">
          <h2 id="ctx-h" className="font-display text-2xl font-bold text-foreground mb-2">
            Where they live, and how they lean
          </h2>
          <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-4 max-w-3xl">
            Two dimensions the same survey publishes that most persona work ignores. Community type
            separates WhatsApp more sharply than income does: 44% urban against 17% rural. Party
            barely moves YouTube or Snapchat, and almost entirely determines Bluesky and Truth
            Social.
          </p>
          <div className="border border-border/60 overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-2.5 pr-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/80">
                    Platform
                  </th>
                  {[...COMMUNITY_SEGMENTS, ...PARTY_SEGMENTS].map((sg) => (
                    <th
                      key={sg.id}
                      className="py-2.5 pr-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/80 whitespace-nowrap"
                    >
                      {sg.label}
                      <span className="block normal-case tracking-normal text-muted-foreground/70">
                        n={sg.n.toLocaleString()} ±{sg.moe}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="[&_td:first-child]:pl-0">
                {PLATFORMS.map((p) => (
                  <tr key={p.id} className="border-b border-border/40">
                    <td className="py-2.5 pr-4 font-mono text-xs text-foreground whitespace-nowrap">
                      <span
                        className="inline-block w-2 h-2 mr-2 align-middle"
                        style={{ background: `var(--pf-${p.id}, ${p.color})` }}
                        aria-hidden="true"
                      />
                      {p.name}
                    </td>
                    {[...COMMUNITY_SEGMENTS, ...PARTY_SEGMENTS].map((sg) => {
                      const v = CONTEXT_REACH[p.id]?.[sg.id];
                      return (
                        <td key={sg.id} className="py-2.5 pr-4 font-mono text-xs text-muted-foreground tabular-nums">
                          {v === undefined ? "—" : `${v}%`}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Access layer */}
        <section aria-labelledby="ac-h" className="mb-14">
          <h2 id="ac-h" className="font-display text-2xl font-bold text-foreground mb-2">
            How they get online at all
          </h2>
          <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-4 max-w-3xl">
            The layer that decides what you can build, not just where to show up. 16% of US adults
            are smartphone-only: they own a smartphone and have no home broadband. That is 34% of
            adults in households under $30,000, 28% of Hispanic adults and 27% of those with a high
            school education or less. Blank cells mean that fact sheet does not publish that cut,
            which is why the party columns are empty for internet and broadband.
          </p>
          <div className="border border-border/60 overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-2.5 pr-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/80">
                    Measure
                  </th>
                  <th className="py-2.5 pr-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/80 text-right">
                    All
                  </th>
                  {ACCESS_COLS.map((sg) => (
                    <th
                      key={sg.id}
                      className="py-2.5 pr-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/80 text-right whitespace-nowrap"
                    >
                      {sg.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="[&_td:first-child]:pl-0">
                {TECH_ACCESS.map((m) => (
                  <tr key={m.id} className="border-b border-border/40">
                    <td className="py-2.5 pr-3 font-mono text-[11px] text-foreground leading-snug">
                      {m.label}
                    </td>
                    <td className="py-2.5 pr-3 font-mono text-xs text-foreground text-right tabular-nums">
                      {m.overall}%
                    </td>
                    {ACCESS_COLS.map((sg) => (
                      <td
                        key={sg.id}
                        className="py-2.5 pr-3 font-mono text-xs text-muted-foreground text-right tabular-nums"
                      >
                        {m.by[sg.id] === undefined ? "—" : `${m.by[sg.id]}%`}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Daily use */}
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

        {/* US baseline */}
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

        {/* Data ladder */}
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

        {/* Changelog */}
        <section aria-labelledby="cl-h" className="mb-14 border border-border/60 p-6">
          <h2 id="cl-h" className="font-display text-2xl font-bold text-foreground mb-4">
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

        {/* Sources */}
        <section aria-labelledby="src-h" className="mb-14">
          <h2 id="src-h" className="font-display text-2xl font-bold text-foreground mb-2">
            Sources
          </h2>
          <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-4 max-w-3xl">
            Every figure on this page and in the studio comes from one of the following. Each entry
            states what the study actually measured, its sample and field dates, and when it was
            last checked.
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

        <Disclaimer className="mb-14" />

        <section aria-labelledby="qd-h" className="mb-14">
          <h2 id="qd-h" className="font-display text-2xl font-bold text-foreground mb-4">
            One page per question
          </h2>
          <QuestionDirectory />
        </section>

        <section aria-labelledby="r-h">
          <h2 id="r-h" className="font-display text-2xl font-bold text-foreground mb-4">
            Related
          </h2>
          <ul className="space-y-2 font-mono text-xs">
            <li>
              <Link
                href="/personas"
                className="text-muted-foreground underline decoration-border hover:text-foreground transition-colors"
              >
                Back to the persona studio: build an audience and see where it spends time
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
