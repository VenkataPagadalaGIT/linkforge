"use client";

/**
 * Where the numbers actually come from.
 *
 * Every page ranking for these questions cites sources, which reads as rigour.
 * Follow the citations and they converge: across nine platform pages, 94
 * outbound links to 58 domains, and two domains appear on all nine. Both are
 * aggregators, and one of them says outright that its figures are what the
 * advertising tools can reach.
 *
 * That is not a scandal, it is just how the market works. But a reader is
 * entitled to see the chain, because a number sourced four hops from an ad
 * dashboard is not independent corroboration of the same ad dashboard.
 */

import { useState } from "react";
import type { CompetitorPage } from "@/data/competitorPages";
import { SHARED_SOURCES } from "@/data/competitorPages";

export default function SourceChain({
  page,
  ourSource,
  ourUrl,
  ourSample,
  ourMoe,
}: {
  page: CompetitorPage;
  ourSource: string;
  ourUrl: string;
  ourSample: number;
  ourMoe: number;
}) {
  const [show, setShow] = useState(false);
  const primary = page.sources.filter((s) => s.kind === "primary");
  const secondary = page.sources.filter((s) => s.kind !== "primary");
  const sharedHere = page.sources.filter((s) =>
    SHARED_SOURCES.some((x) => x.domain === s.domain),
  );

  return (
    <div className="border border-border bg-card/20 p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-3">
        Follow the citations
      </p>

      <div className="grid sm:grid-cols-3 gap-4 mb-4">
        <Stat n={page.claimCount} label="claims on the leading page" />
        <Stat n={page.sources.length} label="sources it cites" />
        <Stat n={sharedHere.length} label="of those cited on every platform page" />
      </div>

      <p className="font-mono text-[11px] text-muted-foreground leading-relaxed mb-3">
        {sharedHere.length > 0 ? (
          <>
            {sharedHere.map((s) => s.domain).slice(0, 2).join(" and ")} appear on every platform
            page in this set. Both are aggregators rather than the organisation that collected
            anything, and the figures they pass along are advertising reach: what a platform&apos;s
            ad tools say they can show an ad to. That is a real number. It is not a count of
            people, and it is not a US number.
          </>
        ) : (
          <>This page&apos;s sources do not overlap the ones cited across the rest of the set.</>
        )}
      </p>

      <div className="border-t border-border/50 pt-3 mb-3">
        <p className="font-mono text-[11px] text-foreground leading-relaxed">
          <span className="inline-block w-2 h-2 mr-2 align-middle" style={{ background: "#10b981" }} aria-hidden="true" />
          This page instead uses{" "}
          <a href={ourUrl} target="_blank" rel="noopener noreferrer" className="underline decoration-border hover:text-glow transition-all">
            {ourSource}
          </a>
          : a random sample of {ourSample.toLocaleString()} US adults, margin of error ±{ourMoe}{" "}
          points, which is one of the 94 links across that whole set.
        </p>
      </div>

      <button
        onClick={() => setShow((v) => !v)}
        aria-expanded={show}
        className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground border border-border px-2.5 py-1 transition-colors"
      >
        {show ? "Hide" : "Show"} all {page.sources.length} sources
      </button>

      {show && (
        <div className="mt-4 grid sm:grid-cols-2 gap-x-6 gap-y-1">
          {[
            { label: "Produced the number", list: primary },
            { label: "Passed it along", list: secondary },
          ].map(({ label, list }) =>
            list.length === 0 ? null : (
              <div key={label}>
                <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-1.5">
                  {label} · {list.length}
                </p>
                <ul className="space-y-0.5">
                  {list.map((s) => (
                    <li key={s.url}>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="font-mono text-[10px] text-muted-foreground underline decoration-border hover:text-foreground transition-colors break-all"
                      >
                        {s.domain}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div>
      <p className="font-display text-2xl font-bold text-foreground tabular-nums leading-none">{n}</p>
      <p className="font-mono text-[10px] text-muted-foreground leading-snug mt-1">{label}</p>
    </div>
  );
}
