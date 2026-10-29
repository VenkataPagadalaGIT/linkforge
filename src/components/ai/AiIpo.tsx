"use client";
import * as React from "react";
import { AI_360 } from "@/data/ai360";
import { getNode } from "@/data/aiOntology";
import { Quotes } from "./Ai360";

/**
 * A company's listing as its own filings tell it: the SEC filing trail newest first (confidential drafts, the public
 * registration statement, amendments, the final prospectus), the offering terms the registration statement states or
 * still leaves blank, each with its exact sentence, and the usual steps that remain. Nothing here is a forecast:
 * a blank in the filing shows as "not set yet" until the company files the number.
 */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const day = (d: string) => `${Number(d.slice(8, 10))} ${MONTHS[Number(d.slice(5, 7)) - 1]} ${d.slice(0, 4)}`;
const daysBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86400e3);

const H = ({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) => (
  <div className="mb-2 flex items-baseline justify-between gap-3">
    <h3 className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{children}</h3>
    {aside && <span className="font-mono text-[10px] text-muted-foreground">{aside}</span>}
  </div>
);

/** The usual US steps after a public S-1. They carry no dates: dates appear above as the company files them. */
const NEXT = [
  "An amended registration statement (S-1/A) fills in the price range and the number of shares.",
  "The roadshow: the company and its underwriters meet investors.",
  "The SEC declares the registration effective; the shares are priced and the final prospectus is filed (Form 424(b)).",
  "The Class A stock starts trading on the exchange under its ticker.",
  "The lock-up ends on the day the prospectus terms set; insiders may then sell.",
];

export function IpoSection({ id }: { id: string }) {
  const ipo = AI_360[id]?.ipo;
  const name = getNode(id)?.name ?? id;
  if (!ipo) return null;
  const term = (k: string) => ipo.terms.find((t) => t.key === k);
  const filings = ipo.filings;
  const publicS1 = filings.find((f) => f.form === "S-1");
  const first = filings[filings.length - 1];
  const amended = filings.filter((f) => f.form === "S-1/A");
  const cards: [string, string, string][] = [
    ["Listing", term("ipo_listing")?.value.replace(/ \(Class A common stock\)$/, "") ?? "·", "applied for"],
    ["Filed publicly", publicS1 ? day(publicS1.filedOn) : "not yet", publicS1 ? "Form S-1" : "drafts are confidential"],
    ["Price range", term("ipo_price_range") && /not set/i.test(term("ipo_price_range")!.value) ? "Not set yet" : term("ipo_price_range")?.value ?? "·", amended.length ? `${amended.length} amendments` : "no amendment filed"],
    ["First trade", term("ipo_delivery") && /not set/i.test(term("ipo_delivery")!.value) ? "Not set yet" : term("ipo_delivery")?.value ?? "·", "delivery date in the filing"],
    ["Lock-up", term("ipo_lockup") ? "180 days" : "·", "after the prospectus date"],
    ["Paper trail", `${filings.length} filings`, first && publicS1 ? `${daysBetween(first.filedOn, publicS1.filedOn)} days from first draft to public S-1` : ""],
  ];
  return (
    <div className="space-y-6" data-testid="ai-ipo">
      <dl className="grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-3 lg:grid-cols-6">
        {cards.map(([label, value, sub]) => (
          <div key={label} className="bg-background p-3">
            <dt className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">{label}</dt>
            <dd className="mt-1 font-display text-lg font-bold leading-tight text-foreground">{value}</dd>
            {sub && <dd className="font-mono text-[10px] text-muted-foreground">{sub}</dd>}
          </div>
        ))}
      </dl>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
        <div>
          <H aside={ipo.readOn ? `EDGAR, read ${day(ipo.readOn)}` : undefined}>The filing trail, newest first</H>
          <ol className="border-l border-border">
            {filings.map((f, i) => (
              <li key={f.accession} className="relative pb-3 pl-4">
                <span className={`absolute -left-[4px] top-1.5 h-[7px] w-[7px] ${i === 0 ? "bg-foreground" : "bg-foreground/40"}`} aria-hidden="true" />
                <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{day(f.filedOn)}</p>
                <p className="font-mono text-[12px] text-foreground">
                  <span className="font-bold">{f.form}</span> · {f.description}
                  {f.size ? <span className="text-muted-foreground"> · {f.size}</span> : null}{" "}
                  <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-muted-foreground underline hover:text-foreground">
                    EDGAR ↗
                  </a>
                </p>
              </li>
            ))}
          </ol>
          <p className="font-mono text-[10px] leading-relaxed text-muted-foreground">
            Draft registration statements are filed in confidence and published once the company files publicly. {name}&apos;s first draft went in on{" "}
            {first ? day(first.filedOn) : "·"}.
          </p>
        </div>
        <div>
          <H aside="each line opens its sentence in the S-1">The offering as filed</H>
          <dl className="divide-y divide-border border border-border">
            {ipo.terms.map((t) => (
              <div key={t.key} className="grid grid-cols-1 gap-1 px-3 py-2 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-3">
                <dt className="font-mono text-[11px] text-muted-foreground">{t.label}</dt>
                <dd className="font-mono text-[11px] leading-relaxed text-foreground">
                  {t.value}
                  <Quotes evidence={t.evidence} label="Exact text in the S-1" />
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="border border-dashed border-border p-4">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-foreground">What usually comes next</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 font-mono text-[11px] leading-relaxed text-muted-foreground">
          {NEXT.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
        <p className="mt-2 font-mono text-[10px] text-muted-foreground">
          The usual steps after a public S-1, with no dates: each appears in the trail above, with its own document, when {name} files it.
        </p>
      </div>
    </div>
  );
}
