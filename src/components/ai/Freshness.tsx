"use client";
import * as React from "react";
import { freshnessOf, type FreshSource } from "@/data/aiFreshness";
import { DEGREE } from "./intelModel";

/**
 * When each part of a company's file was pulled. Every section of the file carries a stamp (the newest pull among the
 * sources that feed it), and the file ends with a table of every source: its date, when it was pulled, how often it is
 * pulled again, and on localhost a button that pulls it now. The timestamps come from src/data/aiFreshness.ts, which
 * data/corpus/gen_freshness_ts.py writes from the pipeline run log and the rows' own retrieval dates.
 */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const LOCAL_REFRESH = process.env.NEXT_PUBLIC_AI_LOCAL_REFRESH === "1";
const SECTION_LABEL: Record<string, string> = {
  overview: "Overview",
  ipo: "IPO",
  f360: "360",
  connections: "Connections",
  money: "Money",
  financials: "Financials",
  investors: "Investors",
  share: "Market share",
  people: "People and hiring",
  legal: "Legal",
  news: "News",
  earnings: "Earnings",
};

/** "29 Oct 2026, 00:14 EDT": the site's day-month-year order, in New York time. */
export function fmtStamp(iso: string): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZoneName: "short" })
      .formatToParts(new Date(iso))
      .map((p) => [p.type, p.value]),
  );
  return `${Number(parts.day)} ${parts.month} ${parts.year}, ${parts.hour}:${parts.minute} ${parts.timeZoneName}`;
}
export const fmtDay = (d: string) => `${Number(d.slice(8, 10))} ${MONTHS[Number(d.slice(5, 7)) - 1]} ${d.slice(0, 4)}`;
export const pulledText = (s: FreshSource) => (s.pulledAt ? fmtStamp(s.pulledAt) : s.pulledOn ? fmtDay(s.pulledOn) : "not pulled yet");
const pulledMs = (s: FreshSource) => (s.pulledAt ? Date.parse(s.pulledAt) : s.pulledOn ? Date.parse(`${s.pulledOn}T23:59:00Z`) : null);
const every = (h: number | null) =>
  h == null ? "when a new document is filed" : h <= 12 ? `every ${h} h` : h === 24 ? "daily" : h === 168 ? "weekly" : h >= 720 ? "monthly" : `every ${Math.round(h / 24)} days`;

/** The graph's own links: hand-built in July 2026; the deals on them were re-checked against filings on 27 and 28 Oct 2026. */
const graphSource = (id: string): FreshSource => ({
  id: "graph",
  label: "AI Systems Map links",
  detail: `${DEGREE.get(id) ?? 0} links; built July 2026, deals re-checked against filings 27 to 28 Oct 2026`,
  sections: ["connections"],
  dataAsOf: null,
  pulledAt: null,
  pulledOn: "2026-10-28",
  cadenceH: null,
  pipeline: null,
  cost: "manual",
  url: null,
});

export const sourcesFor = (id: string): FreshSource[] => [...freshnessOf(id), graphSource(id)];

/** The newest pull among the sources that feed one section (or the whole file). */
export function newestFor(id: string, section?: string) {
  const xs = sourcesFor(id).filter((s) => (!section || s.sections.includes(section)) && pulledMs(s) != null);
  xs.sort((a, b) => pulledMs(b)! - pulledMs(a)!);
  return { newest: xs[0] ?? null, count: xs.length };
}

/** "Now" only after the page has mounted, so the server and the browser render the same markup. */
function useNow() {
  const [now, setNow] = React.useState<number | null>(null);
  React.useEffect(() => setNow(Date.now()), []);
  return now;
}
const isDue = (s: FreshSource, now: number | null) => now != null && s.cadenceH != null && pulledMs(s) != null && now - pulledMs(s)! > s.cadenceH * 1.5 * 3600e3;

export function FreshStamp({ id, section }: { id: string; section: string }) {
  const now = useNow();
  const { newest, count } = newestFor(id, section);
  if (!newest) return null;
  return (
    <p className="mt-1 font-mono text-[10px] leading-relaxed text-muted-foreground" data-testid={`fresh-${section}`}>
      Pulled {pulledText(newest)} · {newest.label}
      {newest.dataAsOf ? ` · ${newest.cost === "manual" ? "dated" : "data to"} ${fmtDay(newest.dataAsOf)}` : ""}
      {count > 1 && (
        <>
          {" · "}
          <a href="#ai-dash-sources" className="underline decoration-dotted underline-offset-2 hover:text-foreground">
            {count - 1} more {count - 1 === 1 ? "source" : "sources"}
          </a>
        </>
      )}
      {isDue(newest, now) && <span className="ml-2 border border-amber-500/50 px-1 text-amber-700 dark:text-amber-300">due for a refresh</span>}
    </p>
  );
}

type RunState = { state: "running" | "done" | "failed"; note?: string };

/** Every source behind the file, with its dates; on localhost, a button that pulls a free source now. */
export function SourcesPanel({ id }: { id: string }) {
  const now = useNow();
  const xs = sourcesFor(id);
  const [runs, setRuns] = React.useState<Record<string, RunState>>({});
  const running = Object.values(runs).some((r) => r.state === "running");
  React.useEffect(() => {
    if (!LOCAL_REFRESH || !running) return;
    const t = setInterval(async () => {
      try {
        const r = await fetch("/api/ai/refresh", { cache: "no-store" });
        if (!r.ok) return;
        const j = (await r.json()) as Record<string, { finished: number | null; code: number | null; tail: string }>;
        setRuns((cur) => {
          const next = { ...cur };
          for (const [p, v] of Object.entries(j)) if (next[p]?.state === "running" && v.finished) next[p] = { state: v.code === 0 ? "done" : "failed", note: v.tail.trim().split("\n").pop() };
          return next;
        });
      } catch {
        /* the next poll tries again */
      }
    }, 3000);
    return () => clearInterval(t);
  }, [running]);
  const pull = async (pipeline: string) => {
    setRuns((c) => ({ ...c, [pipeline]: { state: "running" } }));
    try {
      const r = await fetch("/api/ai/refresh", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ pipeline }) });
      if (r.status !== 202) {
        const j = (await r.json().catch(() => ({}))) as { error?: string };
        setRuns((c) => ({ ...c, [pipeline]: { state: "failed", note: j.error ?? `HTTP ${r.status}` } }));
      }
    } catch {
      setRuns((c) => ({ ...c, [pipeline]: { state: "failed", note: "the dev server did not answer" } }));
    }
  };
  const status = (s: FreshSource) => {
    if (s.id === "graph") return <span className="text-muted-foreground">hand-built; deals checked against filings</span>;
    if (s.cost === "manual") return <span className="text-muted-foreground">read from the document</span>;
    if (pulledMs(s) == null) return <span className="text-muted-foreground">{s.detail?.startsWith("not collected") ? "not collected yet" : "not pulled yet"}</span>;
    if (s.cost === "paid") return <span className="text-muted-foreground">paid: runs with the owner&apos;s yes</span>;
    return isDue(s, now) ? <span className="text-amber-700 dark:text-amber-300">due for a refresh</span> : <span className="text-emerald-700 dark:text-emerald-300">fresh</span>;
  };
  return (
    <div className="space-y-2" data-testid="ai-sources">
      <div className="overflow-x-auto border border-border">
        <table className="w-full min-w-[860px] border-collapse font-mono text-[11px]">
          <thead>
            <tr className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
              <th className="px-3 py-2 text-left font-normal">Source</th>
              <th className="px-2 py-2 text-left font-normal">Feeds</th>
              <th className="px-2 py-2 text-left font-normal">Data dated</th>
              <th className="px-2 py-2 text-left font-normal">Pulled</th>
              <th className="px-2 py-2 text-left font-normal">Pulled again</th>
              <th className="px-3 py-2 text-left font-normal">Status</th>
              {LOCAL_REFRESH && <th className="px-3 py-2 text-left font-normal">Now</th>}
            </tr>
          </thead>
          <tbody>
            {xs.map((s) => {
              const r = s.pipeline ? runs[s.pipeline] : undefined;
              return (
                <tr key={s.id} className="border-t border-border align-top">
                  <td className="max-w-[22rem] px-3 py-1.5">
                    {s.url ? (
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-foreground hover:underline">
                        {s.label} ↗
                      </a>
                    ) : (
                      <span className="text-foreground">{s.label}</span>
                    )}
                    {s.detail && <span className="block text-[10px] text-muted-foreground">{s.detail}</span>}
                  </td>
                  <td className="px-2 py-1.5 text-foreground/85">{s.sections.map((x) => SECTION_LABEL[x] ?? x).join(", ")}</td>
                  <td className="whitespace-nowrap px-2 py-1.5 text-foreground/85">{s.dataAsOf ? fmtDay(s.dataAsOf) : "·"}</td>
                  <td className="whitespace-nowrap px-2 py-1.5 text-foreground">{pulledText(s)}</td>
                  <td className="whitespace-nowrap px-2 py-1.5 text-foreground/85">{s.id === "graph" ? "when the map is reviewed" : every(s.cadenceH)}</td>
                  <td className="px-3 py-1.5">{status(s)}</td>
                  {LOCAL_REFRESH && (
                    <td className="whitespace-nowrap px-3 py-1.5">
                      {s.cost === "free" && s.pipeline ? (
                        r?.state === "running" ? (
                          <span className="text-muted-foreground">pulling…</span>
                        ) : r?.state === "done" ? (
                          <span className="text-emerald-700 dark:text-emerald-300">pulled; data reloaded</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => pull(s.pipeline!)}
                            disabled={running}
                            title={r?.state === "failed" ? r.note : `Runs the ${s.pipeline} pipeline now and regenerates the data files`}
                            className="border border-border px-1.5 py-0.5 text-foreground hover:border-foreground/50 disabled:opacity-50"
                          >
                            {r?.state === "failed" ? "Failed: retry" : "Pull latest"}
                          </button>
                        )
                      ) : (
                        <span className="text-muted-foreground">·</span>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="font-mono text-[10px] leading-relaxed text-muted-foreground">
        Times are New York time. Free sources are pulled on the schedule shown by the pipeline runner (<code>data/corpus/run_pipelines.py</code>), which logs every run; paid
        sources run only with the owner&apos;s yes; filings and newsroom pages are re-read when a new document is filed.
        {LOCAL_REFRESH ? " On localhost, Pull latest runs one pipeline now and regenerates the data files; the page updates when they change." : ""}
      </p>
    </div>
  );
}
