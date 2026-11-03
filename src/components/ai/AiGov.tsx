"use client";
import * as React from "react";
import { AI_360 } from "@/data/ai360";
import { getNode } from "@/data/aiOntology";

/**
 * A company and government, from public records: lobbying disclosures where it is the client (its own in-house
 * reports give total lobbying expenses; outside firms report what the company paid them), and federal awards where
 * it is the recipient. Amounts are as filed; an amended report replaces the one it amends.
 */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const day = (d: string | null) => (d ? `${Number(d.slice(8, 10))} ${MONTHS[Number(d.slice(5, 7)) - 1]} ${d.slice(0, 4)}` : "·");
const usd = (v: number) => (v >= 1e6 ? `$${(v / 1e6).toFixed(v >= 1e7 ? 1 : 2).replace(/\.?0+$/, "")}M` : v >= 1e3 ? `$${Math.round(v / 1e3)}K` : `$${Math.round(v)}`);
const title = (s: string) => s.toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase()).replace(/\bLlc\b/g, "LLC").replace(/\bDc\b/g, "DC");

const H = ({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) => (
  <div className="mb-2 flex items-baseline justify-between gap-3">
    <h3 className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{children}</h3>
    {aside && <span className="font-mono text-[10px] text-muted-foreground">{aside}</span>}
  </div>
);

export function GovSection({ id }: { id: string }) {
  const g = AI_360[id]?.gov;
  const name = getNode(id)?.name ?? id;
  if (!g) return null;
  const l = g.lobbying;
  const last = l?.quarters[l.quarters.length - 1];
  const maxQ = Math.max(1, ...(l?.quarters ?? []).map((q) => q.inHouse + q.outside));
  const cards: [string, string, string][] = [];
  if (last) cards.push([`Lobbying, ${last.q}`, usd(last.inHouse + last.outside), `${usd(last.inHouse)} in-house, ${usd(last.outside)} to ${last.firms} firms`]);
  if (l) cards.push(["Lobbying since " + (l.quarters[0]?.q.slice(0, 4) ?? ""), usd(l.inHouseTotal + l.outsideTotal), `${l.counted} reports counted of ${l.filings} filed`]);
  if (l) cards.push(["Outside firms", String(l.firms.length), `${l.lobbyists} lobbyists named in the filings`]);
  cards.push(["Federal awards", usd(g.awardTotal), `${g.awards.length} ${g.awards.length === 1 ? "award" : "awards"} as recipient`]);
  return (
    <div className="space-y-6" data-testid="ai-gov">
      <dl className="grid grid-cols-2 gap-px border border-border bg-border lg:grid-cols-4">
        {cards.map(([label, value, sub]) => (
          <div key={label} className="bg-background p-3">
            <dt className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">{label}</dt>
            <dd className="mt-1 font-display text-2xl font-bold tabular-nums text-foreground">{value}</dd>
            <dd className="font-mono text-[10px] text-muted-foreground">{sub}</dd>
          </div>
        ))}
      </dl>

      {l && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div>
            <H aside="in-house expenses + paid to outside firms">Lobbying by quarter</H>
            <div className="flex h-40 items-end gap-1 border-b border-border" role="img" aria-label={`Lobbying by quarter, ${l.quarters[0]?.q} to ${last?.q}`}>
              {l.quarters.map((q) => (
                <div key={q.q} className="flex h-full flex-1 flex-col justify-end" title={`${q.q}: ${usd(q.inHouse)} in-house, ${usd(q.outside)} to ${q.firms} firms`}>
                  <span className="block bg-foreground/35" style={{ height: `${(q.outside / maxQ) * 100}%` }} />
                  <span className="block bg-foreground/80" style={{ height: `${(q.inHouse / maxQ) * 100}%` }} />
                </div>
              ))}
            </div>
            <div className="mt-1 flex justify-between font-mono text-[9px] text-muted-foreground">
              <span>{l.quarters[0]?.q}</span>
              <span>
                <i className="mr-1 inline-block h-2 w-2 bg-foreground/80 align-middle" />
                in-house <i className="ml-2 mr-1 inline-block h-2 w-2 bg-foreground/35 align-middle" />
                outside firms
              </span>
              <span>{last?.q}</span>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <H aside="reports naming the issue">Issues lobbied</H>
              <div className="flex flex-wrap gap-1">
                {l.issues.map(([k, n]) => (
                  <span key={k} className="border border-border px-1.5 py-0.5 font-mono text-[10px] text-foreground/90">
                    {k} <span className="text-muted-foreground">{n}</span>
                  </span>
                ))}
              </div>
            </div>
            <div>
              <H aside="reports naming it">Who they lobbied</H>
              <div className="flex flex-wrap gap-1">
                {l.entities.map(([k, n]) => (
                  <span key={k} className="border border-border px-1.5 py-0.5 font-mono text-[10px] text-foreground/90">
                    {k} <span className="text-muted-foreground">{n}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {l && l.firms.length > 0 && (
        <div>
          <H aside="what each firm reported receiving">Outside lobbying firms</H>
          <div className="overflow-x-auto border border-border">
            <table className="w-full min-w-[560px] font-mono text-[11px]">
              <thead>
                <tr className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
                  <th className="px-3 py-2 text-left font-normal">Firm</th>
                  <th className="px-2 py-2 text-right font-normal">Paid, as filed</th>
                  <th className="px-2 py-2 text-left font-normal">Quarters</th>
                  <th className="px-3 py-2 text-right font-normal">Reports</th>
                </tr>
              </thead>
              <tbody>
                {l.firms.map((f) => (
                  <tr key={f.name} className="border-t border-border">
                    <td className="px-3 py-1.5 text-foreground">{title(f.name)}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-foreground">{usd(f.total)}</td>
                    <td className="px-2 py-1.5 text-foreground/85">{f.first === f.last ? f.first : `${f.first} to ${f.last}`}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-foreground/85">{f.filings}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div>
        <H aside={g.readOn ? `USAspending.gov, read ${day(g.readOn)}` : undefined}>Federal awards</H>
        {g.awards.length ? (
          <div className="overflow-x-auto border border-border">
            <table className="w-full min-w-[640px] font-mono text-[11px]">
              <thead>
                <tr className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
                  <th className="px-3 py-2 text-left font-normal">Agency</th>
                  <th className="px-2 py-2 text-left font-normal">What for</th>
                  <th className="px-2 py-2 text-right font-normal">Obligated</th>
                  <th className="px-3 py-2 text-left font-normal">Period</th>
                </tr>
              </thead>
              <tbody>
                {g.awards.map((a) => (
                  <tr key={a.id} className="border-t border-border align-top">
                    <td className="px-3 py-1.5 text-foreground">
                      {a.agency}
                      {a.subAgency && a.subAgency !== a.agency && <span className="block text-[10px] text-muted-foreground">{a.subAgency}</span>}
                    </td>
                    <td className="px-2 py-1.5 text-foreground/85">
                      {a.url ? (
                        <a href={a.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {a.description ?? a.id} ↗
                        </a>
                      ) : (
                        a.description
                      )}
                    </td>
                    <td className="whitespace-nowrap px-2 py-1.5 text-right tabular-nums text-foreground">{a.amount != null ? `$${a.amount.toLocaleString("en-US")}` : "·"}</td>
                    <td className="whitespace-nowrap px-3 py-1.5 text-foreground/85">
                      {day(a.start)} to {day(a.end)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="font-mono text-[11px] text-muted-foreground">No federal award names {name} as the recipient.</p>
        )}
      </div>

      <p className="font-mono text-[10px] leading-relaxed text-muted-foreground">
        Lobbying comes from the Senate&apos;s Lobbying Disclosure Act filings where {name} is the client: its own reports state total lobbying expenses for the quarter, and each
        outside firm reports what {name} paid it. When a report is amended, only the latest version counts. Awards come from USAspending.gov, matched on the recipient&apos;s own name,
        with the amount obligated so far. Amounts are as filed and are not adjusted.
      </p>
    </div>
  );
}
