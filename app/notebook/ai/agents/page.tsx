import type { Metadata } from "next";
import Link from "next/link";
import { OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/site";
import {
  AGENTS_FIRST_PUBLISHED,
  AGENTS_HEADLINE,
  AGENTS_HERO,
  AGENTS_LAST_UPDATED,
  AGENTS_MONTHS,
  AGENTS_TABLES,
  KIND_LABEL,
  type AgentStat,
} from "@/data/aiAgentsStats";

export const dynamic = "force-static";

const TITLE = "AI Agent Statistics (2026): Adoption, Funding, Benchmarks";
const DESCRIPTION =
  "The state of AI agents in verified numbers, updated monthly: enterprise adoption, funding and valuations, product scale, capability benchmarks, and forecasts. Every figure links to its source and says what kind of number it is.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/notebook/ai/agents" },
  openGraph: {
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
    type: "article",
    url: `${SITE_URL}/notebook/ai/agents`,
    title: TITLE,
    description: DESCRIPTION,
  },
};

/** One source-linked stat row. The kind chip is the honesty layer. */
function StatRow({ row }: { row: AgentStat }) {
  return (
    <tr className="border-b border-border/40 align-top">
      <td className="py-3 pr-4 font-mono text-xs text-muted-foreground leading-relaxed">
        {row.stat}
      </td>
      <td className="py-3 pr-4 font-mono text-sm text-foreground whitespace-nowrap">{row.value}</td>
      <td className="py-3 pr-4 font-mono text-[10px] text-muted-foreground/70 whitespace-nowrap">
        {row.asOf}
      </td>
      <td className="py-3 pr-4">
        <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/80 border border-border/60 px-1.5 py-0.5 whitespace-nowrap">
          {KIND_LABEL[row.kind]}
        </span>
      </td>
      <td className="py-3 font-mono text-[10px] leading-relaxed">
        <a
          href={row.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground underline decoration-border hover:text-foreground transition-colors"
        >
          {row.source}
        </a>
      </td>
    </tr>
  );
}

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${SITE_URL}/notebook/ai/agents#article`,
    headline: TITLE,
    description: DESCRIPTION,
    datePublished: AGENTS_FIRST_PUBLISHED,
    dateModified: AGENTS_LAST_UPDATED,
    author: { "@type": "Person", name: "Venkata Pagadala", url: `${SITE_URL}/about` },
    mainEntityOfPage: `${SITE_URL}/notebook/ai/agents`,
    about: { "@type": "Thing", name: "AI agents" },
    citation: AGENTS_TABLES.flatMap((t) => t.rows.map((r) => r.url)).filter(
      (u, i, a) => a.indexOf(u) === i,
    ),
  };

  return (
    <div className="min-h-screen bg-background pt-32 pb-20 px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-5xl mx-auto">
        <p className="font-mono text-xs tracking-[0.3em] text-muted-foreground mb-4 uppercase">
          AI Notebook · Living reference · Updated monthly
        </p>
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground text-glow mb-4">
          AI Agent Statistics
        </h1>
        <p className="font-mono text-[11px] text-muted-foreground/70 mb-8">
          Last updated {AGENTS_LAST_UPDATED} · First published {AGENTS_FIRST_PUBLISHED} · Every
          number verified against its source
        </p>

        {/* The snippet-shaped answer, before anything else. */}
        <p className="font-mono text-sm text-muted-foreground leading-relaxed mb-12 max-w-3xl">
          {AGENTS_HEADLINE}
        </p>

        {/* Hero numbers */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-14">
          {AGENTS_HERO.map((h) => (
            <a
              key={h.label}
              href={h.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block border border-border p-4 hover:bg-secondary/20 border-glow-hover transition-all"
            >
              <p className="font-display text-2xl sm:text-3xl font-bold text-foreground text-glow mb-1">
                {h.value}
              </p>
              <p className="font-mono text-[10px] text-muted-foreground leading-relaxed mb-2">
                {h.label}
              </p>
              <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/70">
                {h.source} · {h.asOf}
              </p>
            </a>
          ))}
        </div>

        {/* What happened this month */}
        {AGENTS_MONTHS.length > 0 && (
          <section aria-labelledby="month-h" className="mb-14">
            <h2
              id="month-h"
              className="font-display text-2xl font-bold text-foreground mb-4"
            >
              What happened in {AGENTS_MONTHS[0].month}
            </h2>
            {AGENTS_MONTHS[0].narrative.map((p, i) => (
              <p
                key={i}
                className="font-mono text-sm text-muted-foreground leading-relaxed mb-4 max-w-3xl"
              >
                {p}
              </p>
            ))}
          </section>
        )}

        {/* The tables */}
        {AGENTS_TABLES.map((t) => (
          <section key={t.id} aria-labelledby={`${t.id}-h`} className="mb-14">
            <h2
              id={t.id}
              className="font-display text-2xl font-bold text-foreground mb-2"
            >
              {t.question}
            </h2>
            {t.blurb && (
              <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-4 max-w-3xl">
                {t.blurb}
              </p>
            )}
            <div className="border border-border/60 overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="py-2.5 pr-4 pl-0 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
                      Statistic
                    </th>
                    <th className="py-2.5 pr-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
                      Value
                    </th>
                    <th className="py-2.5 pr-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
                      As of
                    </th>
                    <th className="py-2.5 pr-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
                      Kind
                    </th>
                    <th className="py-2.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
                      Source
                    </th>
                  </tr>
                </thead>
                <tbody className="[&_td:first-child]:pl-0">
                  {t.rows.map((r) => (
                    <StatRow key={r.stat} row={r} />
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}

        {/* Methodology: the reason to cite this page instead of a listicle. */}
        <section aria-labelledby="method-h" className="mb-14 border border-border/60 p-6">
          <h2 id="method-h" className="font-display text-2xl font-bold text-foreground mb-4">
            How these numbers are chosen
          </h2>
          <ul className="space-y-2 font-mono text-xs text-muted-foreground leading-relaxed max-w-3xl">
            <li>
              Every figure was verified by opening the source and seeing the number. Nothing is
              quoted from an aggregator or from an AI model&apos;s memory.
            </li>
            <li>
              Every figure carries the date it refers to, and a label for what kind of number it
              is: a <em>survey</em> measured something, a <em>forecast</em> predicts something, a{" "}
              <em>company claim</em> is the company talking about itself, a <em>benchmark</em> is a
              published leaderboard score, and a <em>market estimate</em> is an analyst firm&apos;s
              model. They are not interchangeable, and this page never pretends they are.
            </li>
            <li>
              Statistics that failed verification are recorded internally and never published, so a
              future update cannot quietly resurrect a bad number.
            </li>
            <li>The page is refreshed monthly; the changelog below records every change.</li>
          </ul>
        </section>

        {/* Changelog */}
        {AGENTS_MONTHS.length > 0 && (
          <section aria-labelledby="log-h" className="mb-14">
            <h2 id="log-h" className="font-display text-2xl font-bold text-foreground mb-4">
              Changelog
            </h2>
            {AGENTS_MONTHS.map((m) => (
              <div key={m.month} className="mb-6">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
                  {m.month}
                </p>
                <ul className="space-y-1">
                  {m.changes.map((c, i) => (
                    <li key={i} className="font-mono text-xs text-muted-foreground/80 leading-relaxed">
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        )}

        {/* Related */}
        <section aria-labelledby="rel-h">
          <h2 id="rel-h" className="font-display text-2xl font-bold text-foreground mb-4">
            Go deeper
          </h2>
          <ul className="space-y-2 font-mono text-xs">
            <li>
              <Link href="/notebook/ai/encyclopedia" className="text-muted-foreground underline decoration-border hover:text-foreground transition-colors">
                The AI Encyclopedia: 187 concepts, including agents, tool use, and orchestration
              </Link>
            </li>
            <li>
              <Link href="/guides/how-llms-work" className="text-muted-foreground underline decoration-border hover:text-foreground transition-colors">
                How LLMs Work: the 3D interactive guide to the models underneath every agent
              </Link>
            </li>
            <li>
              <Link href="/notebook/ai/map" className="text-muted-foreground underline decoration-border hover:text-foreground transition-colors">
                Map of the AI Economy: 455 companies and who depends on whom
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
