"use client";

import { STAGES, fanout, type FanoutQuestion, type Preset, type Scenario } from "@/data/fanout";

/**
 * Scenarios across, stages down: the coverage view.
 *
 * The map shows one path at a time; this shows all of them at once, which is
 * the view a content team actually plans from. Every cell is the three
 * questions that scenario asks at that stage, and an empty column is a buyer
 * the plan is not talking to.
 */
export default function FanoutMatrix({
  scenarios,
  compare,
  preset,
  seed,
  onToggle,
  onOpen,
}: {
  scenarios: Scenario[];
  /** Scenario ids currently shown as columns. */
  compare: string[];
  preset: Pick<Preset, "product" | "budgetPeriod" | "seed">;
  seed: string;
  onToggle: (id: string) => void;
  onOpen: (q: FanoutQuestion) => void;
}) {
  const shown = scenarios.filter((s) => compare.includes(s.id));

  return (
    <div className="p-4 lg:p-5">
      <div className="flex flex-wrap items-center gap-1.5 mb-4" role="group" aria-label="Scenarios to compare">
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

      {shown.length === 0 ? (
        <p className="font-mono text-xs text-muted-foreground">Pick at least one scenario to compare.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th scope="col" className="text-left font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground pb-2 pr-3 w-28 align-bottom">
                  Stage
                </th>
                {shown.map((s) => (
                  <th key={s.id} scope="col" className="text-left font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground pb-2 pr-3 align-bottom min-w-[220px]">
                    {s.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {STAGES.map((st) => (
                <tr key={st.id} className="border-t border-border/40 align-top">
                  <th scope="row" className="text-left py-3 pr-3 align-top">
                    <span className="font-mono text-[10px] text-muted-foreground tabular-nums">{String(st.index).padStart(2, "0")}</span>{" "}
                    <span className="font-display text-sm font-bold text-foreground">{st.name}</span>
                    <span className="block font-mono text-[10px] text-muted-foreground mt-0.5">{st.goal}</span>
                  </th>
                  {shown.map((s) => (
                    <td key={s.id} className="py-3 pr-3 align-top">
                      <ol className="space-y-1.5">
                        {fanout(s, st, preset, seed).map((q) => (
                          <li key={q.id}>
                            <button
                              type="button"
                              onClick={() => onOpen(q)}
                              className="text-left font-mono text-[11px] text-foreground/85 hover:text-foreground leading-snug underline decoration-border hover:decoration-foreground underline-offset-2 transition-colors"
                            >
                              {q.question}
                            </button>
                          </li>
                        ))}
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
