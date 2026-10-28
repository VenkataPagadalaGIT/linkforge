"use client";
import * as React from "react";
import { KPI_PRIORITY } from "./intelModel";
import { Link } from "@/lib/router-shim";
import type { EntityIntel, IntelDeal, IntelEvidence, IntelSeries } from "@/data/aiIntel";
import { entityPath } from "@/lib/graph-urls";

// Drafts (forecasts and implications in the owner's voice) render only where
// NEXT_PUBLIC_SHOW_DRAFTS=1, i.e. on a localhost review build, never on the live site.
const SHOW_DRAFTS = process.env.NEXT_PUBLIC_SHOW_DRAFTS === "1";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const LABEL = "font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70";

function usd(v: number): string {
  const a = Math.abs(v);
  const s = v < 0 ? "-" : "";
  if (a >= 1e12) return `${s}$${(a / 1e12).toFixed(2)}T`;
  if (a >= 1e9) return `${s}$${(a / 1e9).toFixed(1)}B`;
  if (a >= 1e6) return `${s}$${Math.round(a / 1e6).toLocaleString("en-US")}M`;
  return `${s}$${Math.round(a).toLocaleString("en-US")}`;
}

function fmtValue(v: number, unit: string | null, series?: { points: { value: number }[] }): string {
  if (unit === "USD") return usd(v);
  if (unit === "pct") {
    // A series keeps one precision: 75.0% beside 74.9%, as the filing prints it.
    const frac = (x: number) => Math.abs(x - Math.round(x)) > 1e-9;
    return `${frac(v) || (series?.points ?? []).some((p) => frac(p.value)) ? v.toFixed(1) : v.toLocaleString("en-US")}%`;
  }
  return Math.round(v).toLocaleString("en-US");
}

/** Series labels carry the filing's qualifier in brackets: "(more than)", "(approximately)". */
function splitLabel(label: string): { name: string; qualifier: string | null } {
  const m = label.match(/^(.*?)\s*\((more than|approximately)\)$/);
  return m ? { name: m[1], qualifier: m[2] } : { name: label, qualifier: null };
}

function withQualifier(value: string, qualifier: string | null): string {
  if (qualifier === "more than") return `${value}+`;
  if (qualifier === "approximately") return `about ${value}`;
  return value;
}

function monthYear(iso: string | null): string {
  if (!iso) return "";
  const [y, m] = iso.split("-");
  return m ? `${MONTHS[Number(m) - 1]} ${y}` : y;
}

function periodLabel(p: string): string {
  const d = p.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (d) return `${Number(d[3])} ${MONTHS[Number(d[2]) - 1]} ${d[1]}`;
  const ym = p.match(/^(\d{4})-(\d{2})$/);
  if (ym) return `${MONTHS[Number(ym[2]) - 1]} ${ym[1]}`;
  return p;
}

function termLabel(d: IntelDeal): string {
  const s = d.termStart, e = d.termEnd;
  const yearOnly = (iso: string, start: boolean) => (start ? iso.endsWith("-01-01") : iso.endsWith("-12-31"));
  if (s && e) {
    if (yearOnly(s, true) && yearOnly(e, false)) return `${s.slice(0, 4)} to ${e.slice(0, 4)}`;
    return `${monthYear(s)} to ${monthYear(e)}`;
  }
  if (e) return `into ${e.slice(0, 4)}`;
  if (s) return `from ${yearOnly(s, true) ? s.slice(0, 4) : monthYear(s)}`;
  return "";
}

const INSTRUMENT: Record<string, string> = {
  compute_commitment: "Compute commitment",
  lease: "Equipment lease",
  supply_agreement: "Supply agreement",
  convertible_note: "Convertible notes",
  equity: "Equity",
  guarantee: "Guarantee",
  warrant: "Warrant",
  debt: "Debt",
  grant: "Grant",
  acquisition: "Acquisition",
};

function amountText(d: IntelDeal): string {
  if (d.amount == null) return "Amount not disclosed";
  if (d.amountHigh != null) return `${usd(d.amount)} to ${usd(d.amountHigh)}${d.basis === "estimate" ? " (estimate)" : ""}`;
  const q = d.qualifier ? `${d.qualifier} ` : "";
  return `${q}${usd(d.amount)}${d.basis === "estimate" ? " (estimate)" : d.basis === "cap" && !d.qualifier ? " (cap)" : ""}`;
}

const Receipts = ({ evidence }: { evidence: IntelEvidence[] }) => {
  if (!evidence.length) return null;
  return (
    <details className="mt-2 group">
      <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 hover:text-foreground">
        Exact text in the filing
      </summary>
      <div className="mt-2 space-y-2">
        {evidence.map((e, i) => (
          <blockquote key={i} className="border-l-2 border-border pl-3">
            <p className="font-mono text-[11px] leading-relaxed text-foreground/90">“{e.quote}”</p>
            <p className="font-mono text-[10px] text-muted-foreground/70 mt-1">
              {e.locator ? `${e.locator} · ` : ""}
              {e.url ? (
                <a href={e.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                  {e.source || "Source"} ↗
                </a>
              ) : (
                e.source
              )}
              {e.secondary ? " · news report, not a filing" : ""}
            </p>
          </blockquote>
        ))}
      </div>
    </details>
  );
};

const Draft = () => (
  <span className="ml-2 font-mono text-[9px] uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300 border border-amber-400/40 px-1.5 py-0.5">
    Draft, not public
  </span>
);

const KPI_ORDER = KPI_PRIORITY;

function DealRow({ d, max, tone }: { d: IntelDeal; max: number; tone: string }) {
  const lo = d.amount ?? 0;
  const hi = d.amountHigh ?? lo;
  const w1 = max > 0 ? Math.max(1.5, (lo / max) * 100) : 0;
  const w2 = max > 0 && hi > lo ? ((hi - lo) / max) * 100 : 0;
  const term = termLabel(d);
  return (
    <li className="border border-border p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <Link to={entityPath(d.counterparty)} className="font-display text-sm font-bold text-foreground hover:text-glow">
          {d.counterpartyName}
        </Link>
        <span className="font-mono text-xs text-foreground">{amountText(d)}</span>
      </div>
      {d.amount != null && (
        <div className="mt-2 flex h-2 w-full" aria-hidden="true">
          <span className={tone} style={{ width: `${w1}%` }} />
          {w2 > 0 && <span className={`${tone} opacity-40`} style={{ width: `${w2}%` }} />}
        </div>
      )}
      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/70">
        {INSTRUMENT[d.instrument] ?? d.instrument}
        {term ? ` · ${term}` : ""}
        {d.stage === "loi" ? " · letter of intent" : ""}
      </p>
      <p className="mt-1 font-mono text-[11px] leading-relaxed text-muted-foreground">{d.summary}</p>
      <Receipts evidence={d.evidence} />
    </li>
  );
}

function FinancialsTable({ series }: { series: IntelSeries[] }) {
  const order = ["2023", "2024", "2025", "H1 2025", "H1 2026"];
  const rows = series.filter((s) => s.points.length > 1 && s.points.every((p) => order.includes(p.period)));
  if (!rows.length) return null;
  const cols = order.filter((c) => rows.some((r) => r.points.some((p) => p.period === c)));
  return (
    <div className="overflow-x-auto border border-border">
      <table className="w-full font-mono text-xs">
        <caption className="sr-only">Financial results by period, from the filing</caption>
        <thead>
          <tr className="border-b border-border">
            <th scope="col" className="text-left font-normal text-muted-foreground/70 px-3 py-2">Measure</th>
            {cols.map((c) => (
              <th key={c} scope="col" className="text-right font-normal text-muted-foreground/70 px-3 py-2 whitespace-nowrap">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.metric} className="border-b border-border last:border-0">
              <th scope="row" className="text-left font-normal text-foreground px-3 py-2">{splitLabel(r.label).name}</th>
              {cols.map((c) => {
                const p = r.points.find((x) => x.period === c);
                return (
                  <td key={c} className="text-right text-foreground px-3 py-2 whitespace-nowrap">
                    {p ? fmtValue(p.value, r.unit, r) : ""}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SeriesCard({ s }: { s: IntelSeries }) {
  const { name, qualifier } = splitLabel(s.label);
  const max = Math.max(...s.points.map((p) => Math.abs(p.value)));
  const first = s.points.find((p) => p.url);
  return (
    <div className="border border-border p-4">
      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-3">{name}</p>
      <ul className="space-y-1.5">
        {s.points.map((p) => (
          <li key={p.period} className="grid grid-cols-[6.5rem_1fr_auto] items-center gap-2">
            <span className="font-mono text-[10px] text-muted-foreground/70">{periodLabel(p.period)}</span>
            <span className="h-1.5 bg-border" aria-hidden="true">
              <span className="block h-1.5 bg-foreground/70" style={{ width: `${max ? (Math.abs(p.value) / max) * 100 : 0}%` }} />
            </span>
            <span className="font-mono text-xs text-foreground">{withQualifier(fmtValue(p.value, s.unit, s), qualifier)}</span>
          </li>
        ))}
      </ul>
      {first?.quote && <Receipts evidence={[{ quote: first.quote, url: first.url, locator: null, source: "Read in the filing", publisher: null, publishedOn: null, secondary: false }]} />}
    </div>
  );
}

/** hidePeople, hideDeals and hideEvents leave out what the entity's file already shows in its own sections. */
export default function AiCompanyFile({ name, intel, hidePeople = false, hideDeals = false, hideEvents = false }: { name: string; intel: EntityIntel; hidePeople?: boolean; hideDeals?: boolean; hideEvents?: boolean }) {
  const primary = intel.sources.find((s) => !s.secondary) ?? intel.sources[0];
  const kpis = KPI_ORDER.map((m) => intel.series.find((s) => s.metric === m)).filter((s): s is IntelSeries => !!s);
  const buys = intel.deals.filter((d) => d.side === "buys");
  const sells = intel.deals.filter((d) => d.side === "sells");
  const receives = intel.deals.filter((d) => d.side === "receives");
  const provides = intel.deals.filter((d) => d.side === "provides");
  const rounds = intel.series.find((s) => s.metric === "equity_round_usd");
  const maxOf = (ds: IntelDeal[]) => Math.max(0, ...ds.map((d) => d.amountHigh ?? d.amount ?? 0));
  const tableMetrics = new Set(["revenue_usd", "compute_infrastructure_usd", "adjusted_operating_margin_pct"]);
  const financial = intel.series.filter((s) => tableMetrics.has(s.metric));
  const shownElsewhere = new Set([...tableMetrics, "equity_round_usd", "capital_raised_total_usd", "cash_and_equivalents_usd", "funding_round_committed_capital_usd", "post_money_valuation_usd"]);
  // Market shares have their own section on the page (EntityShares), with their estimator.
  const other = intel.series.filter((s) => !shownElsewhere.has(s.metric) && !s.metric.startsWith("share_") && s.points.length > 1);
  const forecasts = intel.forecasts.filter((f) => f.approved || SHOW_DRAFTS);
  const implications = intel.implications.filter((i) => i.approved || SHOW_DRAFTS);
  const AUD: Record<string, string> = { marketers: "Marketers", seo: "SEO and AI search", developers: "Developers", everyone: "Everyone" };

  return (
    <section className="mb-14" aria-labelledby="company-file">
      <div className="border-t border-border pt-8 mb-8">
        <p className={LABEL}>Company file</p>
        <h2 id="company-file" className="font-display text-2xl sm:text-3xl font-bold text-foreground mt-2">
          {hideDeals ? `${name}: figures from its filings` : `${name}: money, compute${hidePeople ? "" : " and people"}`}
        </h2>
        {primary && (
          <p className="font-mono text-xs text-muted-foreground leading-relaxed mt-2 max-w-3xl">
            Built from{" "}
            <a href={primary.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
              {primary.title}
            </a>
            {primary.publishedOn ? `, ${periodLabel(primary.publishedOn)}` : ""}. Every figure opens the exact text it comes from.
          </p>
        )}
      </div>

      {kpis.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-12">
          {kpis.map((s) => {
            const p = s.points[s.points.length - 1];
            const { name: label, qualifier } = splitLabel(s.label);
            return (
              <div key={s.metric} className="border border-border p-4">
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-1">{label}</p>
                <p className="font-display text-2xl font-bold text-foreground">{withQualifier(fmtValue(p.value, s.unit, s), qualifier)}</p>
                <p className="font-mono text-[10px] text-muted-foreground/70 mt-1">
                  {periodLabel(p.period)}
                  {p.url && (
                    <>
                      {" · "}
                      <a href={p.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                        source ↗
                      </a>
                    </>
                  )}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {!hideDeals && buys.length > 0 && (
        <div className="mb-12">
          <h3 className="font-display text-xl font-bold text-foreground">Who supplies its compute</h3>
          <p className="font-mono text-xs text-muted-foreground/70 leading-relaxed mt-1 mb-4 max-w-3xl">
            Commitments as the filing states them. Some are minimums, some caps and some the company&apos;s own estimates, so they are not added up. The pale part of a bar is the top of an estimated range.
          </p>
          <ul className="space-y-2">
            {buys.map((d) => (
              <DealRow key={`${d.id}-buys`} d={d} max={maxOf(buys)} tone="bg-emerald-700 dark:bg-emerald-300" />
            ))}
          </ul>
        </div>
      )}

      {!hideDeals && (receives.length > 0 || rounds) && (
        <div className="mb-12">
          <h3 className="font-display text-xl font-bold text-foreground">Who funds it</h3>
          <p className="font-mono text-xs text-muted-foreground/70 leading-relaxed mt-1 mb-4 max-w-3xl">
            Equity rounds and investor deals named in the filing.
          </p>
          {rounds && (
            <ul className="grid sm:grid-cols-2 gap-3 mb-3">
              {rounds.points.map((p) => (
                <li key={p.period} className="border border-border p-4">
                  <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-1">{p.period}</p>
                  <p className="font-display text-xl font-bold text-foreground">{usd(p.value)}</p>
                  {p.quote && <Receipts evidence={[{ quote: p.quote, url: p.url, locator: null, source: "Read in the filing", publisher: null, publishedOn: null, secondary: false }]} />}
                </li>
              ))}
            </ul>
          )}
          <ul className="space-y-2">
            {receives.map((d) => (
              <DealRow key={`${d.id}-receives`} d={d} max={maxOf(receives)} tone="bg-amber-700 dark:bg-amber-300" />
            ))}
          </ul>
        </div>
      )}

      {!hideDeals && (sells.length > 0 || provides.length > 0) && (
        <div className="mb-12">
          <h3 className="font-display text-xl font-bold text-foreground">Who it supplies and backs</h3>
          <ul className="space-y-2 mt-4">
            {[...sells, ...provides].map((d) => (
              <DealRow key={`${d.id}-${d.side}`} d={d} max={maxOf([...sells, ...provides])} tone="bg-sky-700 dark:bg-sky-300" />
            ))}
          </ul>
        </div>
      )}

      {financial.length > 0 && (
        <div className="mb-12">
          <h3 className="font-display text-xl font-bold text-foreground mb-4">Revenue, compute cost and margin</h3>
          <FinancialsTable series={financial} />
          <div className="grid sm:grid-cols-2 gap-3 mt-3">
            {financial.map((s) => (
              <SeriesCard key={s.metric} s={s} />
            ))}
          </div>
        </div>
      )}

      {other.length > 0 && (
        <div className="mb-12">
          <h3 className="font-display text-xl font-bold text-foreground mb-4">Growth and distribution</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {other.map((s) => (
              <SeriesCard key={s.metric} s={s} />
            ))}
          </div>
        </div>
      )}

      {!hidePeople && intel.people.length > 0 && (
        <div className="mb-12">
          <h3 className="font-display text-xl font-bold text-foreground mb-4">People named in the filing</h3>
          <ul className="grid sm:grid-cols-2 gap-2">
            {intel.people.map((p) => (
              <li key={p.name} className="border border-border px-3 py-2 flex items-baseline justify-between gap-3">
                <span>
                  {p.sitePath ? (
                    <Link to={p.sitePath} className="font-display text-sm font-bold text-foreground hover:text-glow">
                      {p.name}
                    </Link>
                  ) : (
                    <span className="font-display text-sm font-bold text-foreground">{p.name}</span>
                  )}
                  <span className="block font-mono text-[11px] text-muted-foreground">{p.role}</span>
                </span>
                <a href={p.sourceUrl} target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] text-muted-foreground/70 underline hover:text-foreground shrink-0">
                  source ↗
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!hideEvents && intel.events.length > 0 && (
        <div className="mb-12">
          <h3 className="font-display text-xl font-bold text-foreground mb-4">Timeline</h3>
          <ol className="border-l border-border ml-1 space-y-3">
            {intel.events.map((e, i) => (
              <li key={i} className="pl-4 relative">
                <span className="absolute -left-[3px] top-1.5 h-1.5 w-1.5 bg-foreground/70" aria-hidden="true" />
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">{e.dateLabel ?? periodLabel(e.date)}</p>
                <p className="font-mono text-xs text-foreground leading-relaxed">
                  {e.headline}
                  {e.url && (
                    <>
                      {" "}
                      <a href={e.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground/70 underline hover:text-foreground">
                        source ↗
                      </a>
                    </>
                  )}
                </p>
              </li>
            ))}
          </ol>
        </div>
      )}

      {implications.length > 0 && (
        <div className="mb-12">
          <h3 className="font-display text-xl font-bold text-foreground mb-4">What it means</h3>
          <div className="grid md:grid-cols-3 gap-3">
            {implications.map((im, i) => (
              <div key={i} className="border border-border p-4">
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-2">
                  For {AUD[im.audience] ?? im.audience}
                  {!im.approved && <Draft />}
                </p>
                <p className="font-display text-sm font-bold text-foreground mb-1">{im.headline}</p>
                <p className="font-mono text-[11px] leading-relaxed text-muted-foreground">{im.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {forecasts.length > 0 && (
        <div className="mb-12">
          <h3 className="font-display text-xl font-bold text-foreground">What to watch</h3>
          <p className="font-mono text-xs text-muted-foreground/70 leading-relaxed mt-1 mb-4 max-w-3xl">
            Our calls, each with the date it resolves. Every call is scored when it resolves, right or wrong.
          </p>
          <ul className="space-y-2">
            {forecasts.map((f, i) => (
              <li key={i} className="border border-border p-4">
                <p className="font-display text-sm font-bold text-foreground">
                  {f.statement}
                  {!f.approved && <Draft />}
                </p>
                <p className="font-mono text-[11px] leading-relaxed text-muted-foreground mt-1">Why: {f.basis}</p>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mt-2">
                  Made {periodLabel(f.madeOn)} · resolves by {periodLabel(f.resolvesOn)} · {f.outcome}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {intel.pages.length > 0 && (
        <div className="mb-12">
          <h3 className="font-display text-xl font-bold text-foreground mb-4">Read more on this site</h3>
          <ul className="space-y-2">
            {intel.pages.map((p) => (
              <li key={p.path}>
                <Link to={p.path} className="group block border border-border px-3 py-2 hover:border-foreground/30 transition-all">
                  <span className="font-display text-sm font-bold text-foreground group-hover:text-glow">{p.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {intel.sources.length > 0 && (
        <div>
          <p className={`${LABEL} mb-3`}>Sources · {intel.sources.length}</p>
          <ul className="space-y-1">
            {intel.sources.map((s) => (
              <li key={s.url} className="font-mono text-[11px] text-muted-foreground">
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                  {s.title}
                </a>
                {s.publishedOn ? `, ${periodLabel(s.publishedOn)}` : ""} · {s.quotes} quoted passage{s.quotes === 1 ? "" : "s"}
                {s.secondary ? " · news report" : ""}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
