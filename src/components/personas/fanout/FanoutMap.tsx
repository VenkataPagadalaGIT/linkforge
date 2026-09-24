"use client";

import { useLayoutEffect, useRef, useState } from "react";
import {
  DIMENSIONS,
  STAGES,
  formatBudget,
  type DimensionId,
  type FanoutQuestion,
  type Preset,
  type Scenario,
  type StageId,
} from "@/data/fanout";
import { stageVar } from "./StageColors";

/**
 * The fan-out, drawn.
 *
 * Four columns: the seed with the context questions under it, the scenarios,
 * the stages, and the questions the lit scenario asks at the lit stage. One
 * path is lit at a time, on purpose: eighty questions at once is a wall,
 * four with their provenance traced back to the seed is an argument. The
 * first version gave the seed and the context a column each and left both
 * mostly empty below the fold; stacking them is what the space was for.
 *
 * Each stage owns a colour. The stage node, the wires into its questions and
 * the bar on each question card share it, so which stage a question belongs
 * to is legible before the label is read. The wires are measured after
 * layout and redrawn on resize; everything that carries meaning is also in
 * the DOM as text, so the SVG is decoration a crawler never needs.
 */
export default function FanoutMap({
  scenarios,
  selected,
  stage,
  seed,
  preset,
  questions,
  onSelect,
  onStage,
  onOpen,
  onContext,
}: {
  scenarios: Scenario[];
  selected: string;
  stage: StageId;
  seed: string;
  preset: Pick<Preset, "product" | "budgetPeriod">;
  questions: FanoutQuestion[];
  onSelect: (id: string) => void;
  onStage: (id: StageId) => void;
  onOpen: (q: FanoutQuestion) => void;
  onContext: (id: DimensionId) => void;
}) {
  const root = useRef<HTMLDivElement | null>(null);
  const [paths, setPaths] = useState<{ d: string; stage?: boolean }[]>([]);
  const color = stageVar(stage);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const draw = () => {
      const base = el.getBoundingClientRect();
      const box = (id: string) => {
        const n = el.querySelector<HTMLElement>(`[data-node="${id}"]`);
        if (!n) return null;
        const r = n.getBoundingClientRect();
        return { l: r.left - base.left, r: r.right - base.left, t: r.top - base.top, b: r.bottom - base.top, y: r.top - base.top + r.height / 2, x: r.left - base.left + r.width / 2 };
      };
      const across = (a: string, b: string) => {
        const A = box(a), B = box(b);
        if (!A || !B) return null;
        const dx = Math.max(24, (B.l - A.r) / 2);
        return `M${A.r},${A.y} C${A.r + dx},${A.y} ${B.l - dx},${B.y} ${B.l},${B.y}`;
      };
      const down = (a: string, b: string) => {
        const A = box(a), B = box(b);
        if (!A || !B) return null;
        return `M${A.x},${A.b} L${B.x},${B.t}`;
      };
      setPaths(
        [
          { d: down("seed", "context") },
          { d: across("context", `scenario-${selected}`) },
          { d: across(`scenario-${selected}`, `stage-${stage}`) },
          ...questions.map((q) => ({ d: across(`stage-${stage}`, `q-${q.id}`), stage: true })),
        ].filter((p): p is { d: string; stage?: boolean } => p.d !== null),
      );
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(el);
    return () => ro.disconnect();
  }, [selected, stage, questions, scenarios.length]);

  const head = "font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1";
  const node = "border p-3 text-left transition-colors w-full";
  const lit = "border-foreground bg-foreground/10";
  const dim = "border-border hover:border-foreground/40";

  return (
    <div className="overflow-x-auto">
      <div ref={root} className="relative p-4 lg:p-5 min-w-[960px]">
        <svg className="absolute inset-0 w-full h-full pointer-events-none text-muted-foreground" aria-hidden="true">
          {paths.map((p, i) => (
            <path key={i} d={p.d} fill="none" stroke={p.stage ? color : "currentColor"} strokeOpacity={p.stage ? 0.9 : 0.5} strokeWidth={p.stage ? 2 : 1.5} />
          ))}
        </svg>

        <div className="relative grid grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_minmax(0,0.9fr)_minmax(0,1.6fr)] gap-x-10 items-start">
          {/* 01 seed, with the context questions under it */}
          <div className="flex flex-col gap-4 min-w-[190px]">
            <div>
              <p className={head}>01 Starting query</p>
              <div data-node="seed" className="border border-foreground bg-foreground/10 p-3">
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-1">Starting intent</p>
                <p className="font-display text-lg font-bold text-foreground leading-snug">{seed || "A broad request"}</p>
                <p className="font-mono text-[10px] text-muted-foreground mt-1">One broad request. Many possible contexts.</p>
              </div>
            </div>
            <div>
              <p className={head}>02 Clarify context</p>
              <div data-node="context" className="border border-border border-dashed p-3">
                <p className="font-display text-sm font-bold text-foreground mb-2">What do we need to know?</p>
                <ul className="space-y-1">
                  {DIMENSIONS.map((d) => (
                    <li key={d.id}>
                      <button
                        type="button"
                        onClick={() => onContext(d.id)}
                        aria-label={`${d.prompt} See what adding this input changes`}
                        className="w-full text-left font-mono text-[11px] text-foreground/85 border border-border/60 px-2 py-1 hover:border-foreground/40 hover:bg-foreground/5 hover:text-foreground transition-colors"
                      >
                        {d.prompt}
                        <span className="float-right text-muted-foreground" aria-hidden="true">→</span>
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="font-mono text-[10px] text-muted-foreground mt-2">Explicit answers, not inferred traits. Click one to see what it changes.</p>
              </div>
            </div>
          </div>

          {/* 03 scenarios */}
          <div className="flex flex-col gap-2 min-w-[210px]">
            <p className={head}>03 Persona scenarios</p>
            {scenarios.map((s) => {
              const on = s.id === selected;
              return (
                <button key={s.id} type="button" data-node={`scenario-${s.id}`} onClick={() => onSelect(s.id)} aria-pressed={on} className={`${node} ${on ? lit : dim}`}>
                  <p className="font-display text-base font-bold text-foreground leading-snug">{s.name}</p>
                  <p className="font-mono text-[11px] text-foreground/85 mt-1 leading-snug">{s.need.trim() || "Need not yet stated"}</p>
                  <p className="font-mono text-[10px] text-muted-foreground mt-1 tabular-nums leading-snug">
                    {formatBudget(s.budget, preset.budgetPeriod)}
                    {s.constraint.trim() ? ` · ${s.constraint}` : ""}
                  </p>
                  <p className={`font-mono text-[10px] mt-1.5 ${on ? "text-foreground" : "text-muted-foreground"}`}>
                    {on ? "● Exploring this scenario" : "Explore this scenario →"}
                  </p>
                </button>
              );
            })}
          </div>

          {/* 04 stages, each in its colour */}
          <div className="flex flex-col gap-2 min-w-[170px]">
            <p className={head}>04 Buying stage</p>
            {STAGES.map((st) => {
              const on = st.id === stage;
              return (
                <button
                  key={st.id}
                  type="button"
                  data-node={`stage-${st.id}`}
                  onClick={() => onStage(st.id)}
                  aria-pressed={on}
                  className={`${node} border-l-4 ${on ? lit : dim}`}
                  style={{ borderLeftColor: stageVar(st.id) }}
                >
                  <p className="font-display text-base font-bold text-foreground">
                    <span className="font-mono text-[10px] text-muted-foreground tabular-nums mr-1.5">{String(st.index).padStart(2, "0")}</span>
                    {st.name}
                  </p>
                  <p className="font-mono text-[10px] text-muted-foreground mt-0.5">{st.goal}</p>
                </button>
              );
            })}
          </div>

          {/* 05 questions, the payoff */}
          <div className="flex flex-col gap-2 min-w-[300px]">
            <p className={head}>05 Fan-out questions</p>
            {questions.map((q) => (
              <button key={q.id} type="button" data-node={`q-${q.id}`} onClick={() => onOpen(q)} className={`${node} ${dim} group relative pt-4`}>
                <span className="absolute left-0 top-0 h-[3px] w-full" style={{ background: color }} aria-hidden="true" />
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-1">
                  {q.qtype} · {q.format}
                </p>
                <p className="font-display text-[15px] font-bold text-foreground leading-snug group-hover:underline decoration-border underline-offset-2">{q.question}</p>
                <p className="font-mono text-[10px] text-muted-foreground mt-1.5">Why this question? →</p>
              </button>
            ))}
            <p className="font-mono text-[10px] text-muted-foreground flex items-center gap-1.5 mt-1">
              <span className="inline-block w-2 h-2" style={{ background: "#f59e0b" }} aria-hidden="true" />
              Illustrative hypotheses, not measured demand
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
