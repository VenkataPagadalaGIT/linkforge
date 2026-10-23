"use client";

/**
 * Why the internet's numbers disagree.
 *
 * Search any platform's demographics and you get figures that contradict each
 * other by fifty points, all stated with equal confidence and none saying what
 * they counted. This puts them side by side with what each one actually
 * measured, so the contradiction resolves instead of just sitting there.
 *
 * It is the one thing none of the ranking pages can do, because doing it means
 * showing that your own headline number came from an ad dashboard.
 */

import { useMemo, useState } from "react";
import {
  BASIS_META,
  claimsFor,
  type ClaimBasis,
  type CompetitorClaim,
} from "@/data/competitorClaims";

export interface OurFigure {
  value: number;
  label: string;
  sampleSize: number;
  moe: number;
  source: string;
  url: string;
}

const ORDER: ClaimBasis[] = ["survey", "vendor_panel", "ad_audience", "unstated"];

export default function ClaimComparison({
  subject,
  ours,
}: {
  subject: string;
  ours: OurFigure;
}) {
  const [open, setOpen] = useState<string | null>("survey");
  const claims = useMemo(() => claimsFor(subject), [subject]);

  const grouped = useMemo(() => {
    const g: Record<string, CompetitorClaim[]> = {};
    for (const c of claims) (g[c.basis] ??= []).push(c);
    return g;
  }, [claims]);

  if (!claims.length) return null;

  const counts = ORDER.map((b) => ({ basis: b, n: (grouped[b] ?? []).length }));
  const total = claims.length + 1; // theirs plus ours

  return (
    <div className="border border-border bg-card/20">
      <div className="p-5 border-b border-border">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">
          Why the numbers disagree
        </p>
        <p className="font-mono text-xs text-muted-foreground leading-relaxed max-w-2xl">
          {claims.length + 1} sources answer this question and they do not agree. That is not
          because one is wrong. It is because they counted different things, and almost none of
          them say so. Click a basis to see what it actually measures.
        </p>
      </div>

      {/* The basis bar: how the ranking pages are distributed. */}
      <div className="px-5 pt-4">
        <div className="flex h-3 w-full overflow-hidden">
          <span
            className="block"
            style={{ width: `${(1 / total) * 100}%`, background: BASIS_META.survey.color }}
            title="Probability sample"
          />
          {counts.map(({ basis, n }) =>
            n === 0 ? null : (
              <span
                key={basis}
                className="block border-l border-background"
                style={{ width: `${(n / total) * 100}%`, background: BASIS_META[basis].color, opacity: 0.85 }}
                title={BASIS_META[basis].label}
              />
            ),
          )}
        </div>
        <p className="font-mono text-[10px] text-muted-foreground mt-1.5">
          One probability sample in {total} sources. The rest are ad dashboards, opt-in panels,
          or nothing stated at all.
        </p>
      </div>

      <div className="p-5 space-y-2">
        {/* Ours first, and labelled as ours. */}
        <Row
          basis="survey"
          open={open === "survey"}
          onToggle={() => setOpen(open === "survey" ? null : "survey")}
          heading={`${ours.value}% · ${ours.label}`}
          who="This page"
          detail={`n=${ours.sampleSize.toLocaleString()}, margin of error ±${ours.moe} points. US adults, random sample.`}
          url={ours.url}
          urlLabel={ours.source}
          isOurs
        />

        {ORDER.filter((b) => b !== "survey").map((basis) => {
          const list = grouped[basis] ?? [];
          if (!list.length) return null;
          return (
            <div key={basis}>
              <button
                onClick={() => setOpen(open === basis ? null : basis)}
                aria-expanded={open === basis}
                className="w-full flex items-center gap-3 py-2 px-3 border border-border/60 hover:border-foreground/40 transition-colors text-left"
              >
                <span
                  className="inline-block w-2.5 h-2.5 shrink-0"
                  style={{ background: BASIS_META[basis].color }}
                  aria-hidden="true"
                />
                <span className="font-mono text-[11px] text-foreground flex-1">
                  {BASIS_META[basis].label}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {list.length} source{list.length === 1 ? "" : "s"}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {open === basis ? "−" : "+"}
                </span>
              </button>
              {open === basis && (
                <div className="border-l-2 border-border ml-3 pl-4 py-3 space-y-3">
                  <p className="font-mono text-[11px] text-muted-foreground leading-relaxed">
                    {BASIS_META[basis].what}
                  </p>
                  {list.map((c) => (
                    <div key={c.url + c.claim}>
                      <p className="font-mono text-[11px] text-foreground leading-snug">
                        {c.value ? <span className="mr-1.5">{c.value}</span> : null}
                        <span className="text-muted-foreground">{c.claim}</span>
                      </p>
                      <p className="font-mono text-[10px] text-muted-foreground/90 mt-0.5">
                        <a
                          href={c.url}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="underline decoration-border hover:text-foreground transition-colors"
                        >
                          {c.domain}
                        </a>
                        {c.population && c.population !== "unstated" ? (
                          <span className="ml-2 uppercase tracking-wider">
                            {c.population === "us" ? "US" : c.population}
                          </span>
                        ) : null}
                        {c.citedSource ? <span className="ml-2">via {c.citedSource}</span> : null}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="px-5 pb-5">
        <p className="font-mono text-[10px] text-muted-foreground/90 leading-relaxed">
          Competitor links carry nofollow. They are cited because their numbers are the ones people
          find, not because the numbers are good. None of this is a claim that they are lying: an
          ad-reach figure is a real figure, it just answers a different question than the one being
          asked, and a page that prints it as an audience share has quietly swapped the question.
        </p>
      </div>
    </div>
  );
}

function Row({
  basis, open, onToggle, heading, who, detail, url, urlLabel, isOurs,
}: {
  basis: ClaimBasis; open: boolean; onToggle: () => void; heading: string;
  who: string; detail: string; url: string; urlLabel: string; isOurs?: boolean;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        aria-expanded={open}
        className={`w-full flex items-center gap-3 py-2 px-3 border transition-colors text-left ${
          isOurs ? "border-foreground/40 bg-foreground/5" : "border-border/60 hover:border-foreground/40"
        }`}
      >
        <span
          className="inline-block w-2.5 h-2.5 shrink-0"
          style={{ background: BASIS_META[basis].color }}
          aria-hidden="true"
        />
        <span className="font-mono text-[11px] text-foreground flex-1">{heading}</span>
        <span className="font-mono text-[10px] text-muted-foreground">{who}</span>
        <span className="font-mono text-[10px] text-muted-foreground">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="border-l-2 border-foreground/30 ml-3 pl-4 py-3">
          <p className="font-mono text-[11px] text-muted-foreground leading-relaxed">
            {BASIS_META[basis].what}
          </p>
          <p className="font-mono text-[11px] text-foreground leading-relaxed mt-2">{detail}</p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[10px] text-muted-foreground underline decoration-border hover:text-foreground transition-colors"
          >
            {urlLabel}
          </a>
        </div>
      )}
    </div>
  );
}
