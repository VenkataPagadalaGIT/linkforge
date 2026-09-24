"use client";

import { STAGES, fanout, type FanoutQuestion, type Preset, type Scenario } from "@/data/fanout";
import { stageVar } from "./StageColors";

export type Coverage = "have" | "gap";

/**
 * Scenarios across, stages down: the planning view, and now the gap map.
 *
 * Every cell is a scenario's questions at a stage. Each question can be
 * marked have (content answers it) or gap (nothing does), and the marks feed
 * a gap list you can export. Eighty questions is a list; eighty questions with
 * the gaps marked is a content plan. The marks live in the browser with the
 * rest of the state and never touch the questions themselves.
 */
export default function FanoutMatrix({
  scenarios,
  compare,
  preset,
  seed,
  coverage,
  onToggle,
  onOpen,
  onCoverage,
}: {
  scenarios: Scenario[];
  compare: string[];
  preset: Pick<Preset, "product" | "budgetPeriod" | "seed">;
  seed: string;
  coverage: Record<string, Coverage>;
  onToggle: (id: string) => void;
  onOpen: (q: FanoutQuestion) => void;
  onCoverage: (id: string, next: Coverage | undefined) => void;
}) {
  const shown = scenarios.filter((s) => compare.includes(s.id));
  const cycle = (id: string) => {
    const cur = coverage[id];
    onCoverage(id, cur === undefined ? "have" : cur === "have" ? "gap" : undefined);
  };
  const mark = (c: Coverage | undefined) =>
    c === "have" ? { label: "have", bg: "#10b981" } : c === "gap" ? { label: "gap", bg: "#ef4444" } : { label: "unmarked", bg: "transparent" };

  const column = (s: Scenario) => {
    const all = STAGES.flatMap((st) => fanout(s, st, preset, seed));
    const have = all.filter((q) => coverage[q.id] === "have").length;
    const gap = all.filter((q) => coverage[q.id] === "gap").length;
    return { have, gap, total: all.length };
  };

  return (
    <div className="p-4 lg:p-5">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-4">
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Scenarios to compare">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mr-2">Compare</span>
          {scenarios.map((s) => {
            const on = compare.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onToggle(s.id)}
                aria-pressed={on}
                className={`font-mono text-[10px] uppercase tracking-wider border px-2 py-1 transition-colors ${
                  on ? "border-foreground/40 bg-foreground/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {s.name}
              </button>
            );
          })}
        </div>
        <p className="font-mono text-[10px] text-muted-foreground leading-relaxed">
          Click the square by a question to mark it: <span className="inline-block w-2 h-2 align-middle" style={{ background: "#10b981" }} /> have ·{" "}
          <span className="inline-block w-2 h-2 align-middle" style={{ background: "#ef4444" }} /> gap · click again to clear.
        </p>
      </div>

      {shown.length === 0 ? (
        <p className="font-mono text-xs text-muted-foreground">Pick at least one scenario to compare.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th scope="col" className="text-left font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground pb-2 pr-3 w-32 align-bottom">
                  Stage
                </th>
                {shown.map((s) => {
                  const c = column(s);
                  return (
                    <th key={s.id} scope="col" className="text-left pb-2 pr-3 align-bottom min-w-[240px]">
                      <span className="font-display text-sm font-bold text-foreground">{s.name}</span>
                      <span className="block font-mono text-[10px] text-muted-foreground tabular-nums mt-0.5">
                        {c.have} have · {c.gap} gaps · {c.total - c.have - c.gap} unmarked
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {STAGES.map((st) => (
                <tr key={st.id} className="border-t border-border/40 align-top">
                  <th scope="row" className="text-left py-3 pr-3 align-top border-l-4" style={{ borderLeftColor: stageVar(st.id) }}>
                    <span className="pl-2 font-mono text-[10px] text-muted-foreground tabular-nums">{String(st.index).padStart(2, "0")}</span>{" "}
                    <span className="font-display text-sm font-bold text-foreground">{st.name}</span>
                    <span className="block pl-2 font-mono text-[10px] text-muted-foreground mt-0.5">{st.goal}</span>
                  </th>
                  {shown.map((s) => (
                    <td key={s.id} className="py-3 pr-3 align-top">
                      <ol className="space-y-2">
                        {fanout(s, st, preset, seed).map((q) => {
                          const m = mark(coverage[q.id]);
                          return (
                            <li key={q.id} className="flex items-start gap-2">
                              <button
                                type="button"
                                onClick={() => cycle(q.id)}
                                aria-label={`Mark "${q.question}": currently ${m.label}`}
                                className="mt-1 h-3 w-3 shrink-0 border border-border"
                                style={{ background: m.bg }}
                                data-coverage={coverage[q.id] ?? "none"}
                              />
                              <button
                                type="button"
                                onClick={() => onOpen(q)}
                                className={`text-left font-mono text-[11px] leading-snug underline decoration-border hover:decoration-foreground underline-offset-2 transition-colors ${
                                  coverage[q.id] === "have" ? "text-muted-foreground" : "text-foreground/85 hover:text-foreground"
                                }`}
                              >
                                <span className="text-muted-foreground/80">{q.qtype} · </span>
                                {q.question}
                              </button>
                            </li>
                          );
                        })}
                      </ol>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
