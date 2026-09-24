"use client";

import { useLayoutEffect, useRef, useState } from "react";
import {
  DIMENSIONS,
  STAGES,
  formatBudget,
  type FanoutQuestion,
  type Preset,
  type Scenario,
  type StageId,
} from "@/data/fanout";

/**
 * The fan-out, drawn.
 *
 * Five columns: the seed, the questions the tool has to ask before it can do
 * anything, the scenarios, the stages, and the questions the highlighted
 * scenario asks at the highlighted stage. Only one path is lit at a time, on
 * purpose: sixty questions at once is a wall, three with their provenance
 * traced back to the seed is an argument.
 *
 * The wires are measured after layout and redrawn on resize. They connect the
 * lit nodes only. Everything that carries meaning is also in the DOM as text,
 * so the SVG is decoration a screen reader can skip and a crawler never needs.
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
}: {
  scenarios: Scenario[];
  selected: string;
  stage: StageId;
  seed: string;
  preset: Pick<Preset, "product" | "budgetPeriod">;
  /** The three questions for the lit scenario at the lit stage. */
  questions: FanoutQuestion[];
  onSelect: (id: string) => void;
  onStage: (id: StageId) => void;
  onOpen: (q: FanoutQuestion) => void;
}) {
  const root = useRef<HTMLDivElement | null>(null);
  const [paths, setPaths] = useState<string[]>([]);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;

    const draw = () => {
      const base = el.getBoundingClientRect();
      const box = (id: string) => {
        const n = el.querySelector<HTMLElement>(`[data-node="${id}"]`);
        if (!n) return null;
        const r = n.getBoundingClientRect();
        return { l: r.left - base.left, r: r.right - base.left, y: r.top - base.top + r.height / 2 };
      };
      const wire = (a: string, b: string) => {
        const A = box(a), B = box(b);
        if (!A || !B) return null;
        const dx = Math.max(24, (B.l - A.r) / 2);
        return `M${A.r},${A.y} C${A.r + dx},${A.y} ${B.l - dx},${B.y} ${B.l},${B.y}`;
      };
      setPaths(
        [
          wire("seed", "context"),
          wire("context", `scenario-${selected}`),
          wire(`scenario-${selected}`, `stage-${stage}`),
          ...questions.map((q) => wire(`stage-${stage}`, `q-${q.id}`)),
        ].filter((p): p is string => p !== null),
      );
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(el);
    return () => ro.disconnect();
  }, [selected, stage, questions, scenarios.length]);

  const col = "flex flex-col gap-2 min-w-[190px]";
  const head = "font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1";
  const node = "border p-3 text-left transition-colors";
  const lit = "border-foreground/50 bg-foreground/10";
  const dim = "border-border hover:border-foreground/30";

  return (
    <div className="overflow-x-auto">
      <div ref={root} className="relative p-4 lg:p-5 min-w-[1040px]">
        <svg className="absolute inset-0 w-full h-full pointer-events-none text-muted-foreground" aria-hidden="true">
          {paths.map((d, i) => (
            <path key={i} d={d} fill="none" stroke="currentColor" strokeOpacity={0.55} strokeWidth={1.5} />
          ))}
        </svg>

        <div className="relative grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,1.5fr)] gap-x-10 items-start">
          {/* 01 seed */}
          <div className={col}>
            <p className={head}>01 Starting query</p>
            <div data-node="seed" className="border border-foreground/50 bg-foreground/10 p-3 mt-auto">
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-1">Starting intent</p>
              <p className="font-display text-base font-bold text-foreground leading-snug">{seed || "A broad request"}</p>
              <p className="font-mono text-[10px] text-muted-foreground mt-1">One broad request. Many possible contexts.</p>
            </div>
          </div>

          {/* 02 clarify */}
          <div className={col}>
            <p className={head}>02 Clarify context</p>
            <div data-node="context" className="border border-border border-dashed p-3">
              <p className="font-display text-sm font-bold text-foreground mb-2">What do we need to know?</p>
              <ul className="space-y-1">
                {DIMENSIONS.map((d) => (
                  <li key={d.id} className="font-mono text-[11px] text-foreground/85 border border-border/60 px-2 py-1">
                    {d.prompt}
                  </li>
                ))}
              </ul>
              <p className="font-mono text-[10px] text-muted-foreground mt-2">Explicit answers, not inferred traits.</p>
            </div>
          </div>

          {/* 03 scenarios */}
          <div className={col}>
            <p className={head}>03 Persona scenarios</p>
            {scenarios.map((s) => {
              const on = s.id === selected;
              return (
                <button
                  key={s.id}
                  type="button"
                  data-node={`scenario-${s.id}`}
                  onClick={() => onSelect(s.id)}
                  aria-pressed={on}
                  className={`${node} ${on ? lit : dim}`}
                >
                  <p className="font-display text-sm font-bold text-foreground leading-snug">{s.name}</p>
                  <p className="font-mono text-[10px] text-muted-foreground mt-0.5 tabular-nums">
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

          {/* 04 stages */}
          <div className={col}>
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
                  className={`${node} ${on ? lit : dim}`}
                >
                  <p className="font-display text-sm font-bold text-foreground">
                    <span className="font-mono text-[10px] text-muted-foreground tabular-nums mr-1.5">{String(st.index).padStart(2, "0")}</span>
                    {st.name}
                  </p>
                  <p className="font-mono text-[10px] text-muted-foreground mt-0.5">{st.goal}</p>
                </button>
              );
            })}
          </div>

          {/* 05 questions */}
          <div className={col}>
            <p className={head}>05 Fan-out questions</p>
            {questions.map((q) => (
              <button
                key={q.id}
                type="button"
                data-node={`q-${q.id}`}
                onClick={() => onOpen(q)}
                className={`${node} ${dim} group`}
              >
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-1">{q.type} · {q.format}</p>
                <p className="font-mono text-xs text-foreground leading-snug group-hover:underline decoration-border underline-offset-2">
                  {q.question}
                </p>
                <p className="font-mono text-[10px] text-muted-foreground mt-1.5">Why this question? →</p>
              </button>
            ))}
            <p className="font-mono text-[10px] text-muted-foreground flex items-center gap-1.5 mt-1">
              <span className="inline-block w-2 h-2" style={{ background: "#f59e0b" }} aria-hidden="true" />
              Illustrative hypotheses
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
