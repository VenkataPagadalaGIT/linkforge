"use client";

/**
 * The corpus explorer: every measured figure the site holds, one surface.
 *
 * Pick a metric, pick a lens, and it draws the published cells side by side
 * with the national figure and the gap between them. Nothing here is
 * estimated. The studio above combines traits and shows its arithmetic; this
 * shows only what somebody actually published, with the document and sample
 * size attached to every view.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CORPUS_METRICS,
  CORPUS_SEGMENTS,
  corpusDoc,
  type CorpusMetric,
} from "@/data/corpus";

const DIM_ORDER = ["gender", "age", "race", "income", "education", "community", "party"];
const DIM_LABEL: Record<string, string> = {
  gender: "Gender", age: "Age", race: "Race", income: "Income",
  education: "Education", community: "Lives in", party: "Leans",
};

/** Group the 31 metrics into the four questions people actually ask. */
const FAMILIES: { id: string; label: string; blurb: string; match: (m: CorpusMetric) => boolean }[] = [
  { id: "platforms", label: "Which platforms", blurb: "Who ever uses each social platform.",
    match: (m) => m.slug === "ever_use" },
  { id: "access", label: "How they get online", blurb: "Connection, device, and who has neither.",
    match: (m) => ["internet_use", "home_broadband", "owns_smartphone", "owns_cellphone",
                   "owns_featurephone", "smartphone_dependent"].includes(m.slug) },
  { id: "news", label: "Where they get news", blurb: "Channel use and channel preference, including AI.",
    match: (m) => m.slug.startsWith("news_") },
  { id: "influencers", label: "Why they follow", blurb: "What people say draws them to news influencers.",
    match: (m) => m.slug.startsWith("influencer_") },
  { id: "context", label: "The country", blurb: "National baseline a persona sits inside.",
    match: (m) => m.slug.startsWith("usafacts-") },
];

export default function CorpusExplorer() {
  const [family, setFamily] = useState("platforms");
  const [dim, setDim] = useState("age");

  const fam = FAMILIES.find((f) => f.id === family)!;
  const metrics = useMemo(() => CORPUS_METRICS.filter(fam.match), [fam]);
  const segs = useMemo(
    () => CORPUS_SEGMENTS.filter((s) => s.dimension === dim && s.n !== null),
    [dim],
  );

  /** Rows are (metric, subject) pairs; a metric with no subject is one row. */
  const rows = useMemo(() => {
    const out: { key: string; label: string; national: number; cells: Record<string, number>; metric: CorpusMetric }[] = [];
    for (const m of metrics) {
      for (const [subject, cells] of Object.entries(m.values)) {
        const national = cells[""];
        if (national === undefined) continue;
        const has = segs.some((s) => cells[s.slug] !== undefined);
        if (!has && metrics.length > 1) continue;
        out.push({
          key: `${m.slug}:${subject}`,
          label: subject ? prettify(subject) : m.label,
          national,
          cells,
          metric: m,
        });
      }
    }
    return out.sort((a, b) => b.national - a.national);
  }, [metrics, segs]);

  const doc = corpusDoc(metrics[0]?.document ?? "");
  const hasSegments = segs.length > 0 && rows.some((r) => segs.some((s) => r.cells[s.slug] !== undefined));

  return (
    <div className="border border-border bg-card/20">
      {/* Which question */}
      <div className="flex flex-wrap gap-1.5 p-4 border-b border-border">
        {FAMILIES.map((f) => (
          <button
            key={f.id}
            onClick={() => setFamily(f.id)}
            aria-pressed={family === f.id}
            className={`font-mono text-[11px] px-2.5 py-1.5 border transition-all ${
              family === f.id
                ? "border-foreground text-foreground bg-foreground/10"
                : "border-border/60 text-muted-foreground hover:text-foreground hover:border-foreground/40"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Which lens */}
      <div className="flex flex-wrap items-center gap-1.5 px-4 py-3 border-b border-border/50">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/80 mr-1">
          Cut by
        </span>
        {DIM_ORDER.map((d) => {
          const n = CORPUS_SEGMENTS.filter((s) => s.dimension === d && s.n !== null).length;
          if (!n) return null;
          return (
            <button
              key={d}
              onClick={() => setDim(d)}
              aria-pressed={dim === d}
              className={`font-mono text-[11px] px-2 py-1 border transition-all ${
                dim === d
                  ? "border-foreground text-foreground bg-foreground/10"
                  : "border-border/60 text-muted-foreground hover:text-foreground hover:border-foreground/40"
              }`}
            >
              {DIM_LABEL[d]}
            </button>
          );
        })}
      </div>

      <p className="font-mono text-[11px] text-muted-foreground px-4 pt-3">{fam.blurb}</p>

      {/* The grid */}
      <div className="p-4 overflow-x-auto">
        <table className="w-full min-w-[620px]">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="pb-2 pr-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/80">
                &nbsp;
              </th>
              <th className="pb-2 pr-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/80 text-right">
                All
              </th>
              {segs.map((s) => (
                <th
                  key={s.slug}
                  className="pb-2 pr-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/80 text-right whitespace-nowrap"
                >
                  {s.label}
                  <span className="block normal-case tracking-normal text-muted-foreground/70">
                    ±{s.moe}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="[&_td:first-child]:pl-0">
            {rows.map((r) => (
              <tr key={r.key} className="border-b border-border/40">
                <td className="py-2 pr-3 font-mono text-[11px] text-foreground whitespace-nowrap">
                  {r.label}
                </td>
                <td className="py-2 pr-3 font-mono text-xs text-foreground text-right tabular-nums">
                  {r.national}
                  {r.metric.slug.startsWith("usafacts-") ? "" : "%"}
                </td>
                {segs.map((s) => {
                  const v = r.cells[s.slug];
                  const d = v === undefined ? 0 : v - r.national;
                  return (
                    <td key={s.slug} className="py-2 pr-3 text-right">
                      {v === undefined ? (
                        <span className="font-mono text-xs text-muted-foreground/70">n/p</span>
                      ) : (
                        <>
                          <span className="font-mono text-xs text-foreground tabular-nums">{v}%</span>
                          <span
                            className="font-mono text-[9px] ml-1 tabular-nums"
                            style={{ color: Math.abs(d) < 3 ? undefined : d > 0 ? "#10b981" : "#f59e0b" }}
                          >
                            {Math.abs(d) < 3 ? "" : `${d > 0 ? "+" : ""}${d}`}
                          </span>
                        </>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {!hasSegments && (
          <p className="font-mono text-[11px] text-muted-foreground mt-3">
            This source does not publish a {DIM_LABEL[dim].toLowerCase()} breakdown. The national
            figures stand on their own; pick another lens to see one that is cut.
          </p>
        )}
      </div>

      {/* Provenance, always visible */}
      {doc && (
        <div className="px-4 py-3 border-t border-border/50">
          <p className="font-mono text-[10px] text-muted-foreground leading-relaxed">
            <a
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline decoration-border hover:text-glow transition-all"
            >
              {doc.title}
            </a>
            {doc.published ? ` · published ${doc.published}` : ""}
            {doc.sampleSize ? ` · n=${doc.sampleSize.toLocaleString()}` : ""}
            {doc.moe ? ` · ±${doc.moe}pp overall` : ""}
            {" · "}
            <span className="text-muted-foreground/80">
              &ldquo;n/p&rdquo; means that source does not publish that cut. Nothing on this
              surface is estimated.
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

function prettify(s: string) {
  const named: Record<string, string> = {
    youtube: "YouTube", tiktok: "TikTok", whatsapp: "WhatsApp", x: "X",
    truthsocial: "Truth Social", ai_chatbots: "AI chatbots", news_sites: "News sites or apps",
    social_media: "Social media", newsletters: "Email newsletters", print: "Print",
    digital: "Digital devices",
  };
  return named[s] ?? s.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
