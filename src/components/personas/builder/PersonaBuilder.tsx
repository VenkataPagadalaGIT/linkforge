"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ABSTAIN,
  BUILDER_PATHS,
  EVIDENCE_STATUSES,
  RECORD_TYPES,
  answeredCount,
  buildBrief,
  buildJson,
  emptyState,
  handlingRollup,
  interviewGuide,
  isAnswered,
  toHandoff,
  validationPlan,
  writeHandoff,
  type Answer,
  type BuilderState,
} from "@/data/builder";
import { FRAMEWORK, frameworkById, type FrameworkDimension } from "@/data/personaFramework";

const STORE = "persona-builder-v1";

const chip = (on: boolean) =>
  `font-mono text-[10px] uppercase tracking-wider border px-2 py-1 transition-colors ${
    on ? "border-foreground/40 bg-foreground/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground"
  }`;
const field =
  "font-mono text-xs bg-transparent border border-border text-foreground px-2 py-1.5 placeholder:text-muted-foreground/70 focus:outline-none focus:border-foreground/60";

function download(content: string, type: string, name: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * One framework dimension, asked. The control follows the workbook's own
 * selection type. Every field also accepts the framework's abstentions and an
 * "other" the person describes themselves, because the rule says every field
 * does, and because a forced choice is how a persona acquires a trait nobody
 * stated.
 */
function Question({
  dim,
  answer,
  onChange,
  onRemove,
}: {
  dim: FrameworkDimension;
  answer: Answer | undefined;
  onChange: (a: Answer | undefined) => void;
  onRemove?: () => void;
}) {
  const a: Answer = answer ?? { value: [], evidence: "Hypothesis" };
  const set = (patch: Partial<Answer>) => onChange({ ...a, ...patch });
  const single = dim.selection === "Single" || dim.selection === "Scale";
  const pick = (v: string) => {
    if (single) set({ value: a.value[0] === v ? [] : [v], abstain: undefined });
    else set({ value: a.value.includes(v) ? a.value.filter((x) => x !== v) : [...a.value, v], abstain: undefined });
  };
  const answered = isAnswered(a);

  return (
    <li id={`q-${dim.id}`} className="py-4 border-t border-border/40 first:border-t-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-2">
        <div className="min-w-0">
          <p className="font-mono text-[10px] text-muted-foreground tabular-nums">
            <Link href={`/personas/framework#${dim.id}`} className="hover:text-foreground transition-colors">
              {dim.id}
            </Link>{" "}
            · {dim.name} · {dim.selection}
          </p>
          <h4 className="font-display text-sm font-bold text-foreground leading-snug mt-0.5">{dim.ask}</h4>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground border border-border/60 px-1.5 py-0.5">
            {dim.handling}
          </span>
          {onRemove && (
            <button type="button" onClick={onRemove} className="font-mono text-[10px] text-muted-foreground hover:text-foreground underline decoration-border">
              Remove
            </button>
          )}
        </div>
      </div>

      {(dim.selection === "Single" || dim.selection === "Scale" || dim.selection === "Multiple") && (
        <div className="flex flex-wrap gap-1.5" role="group" aria-label={dim.ask}>
          {dim.values.map((v) => (
            <button key={v} type="button" onClick={() => pick(v)} aria-pressed={a.value.includes(v)} className={chip(a.value.includes(v))}>
              {v}
            </button>
          ))}
        </div>
      )}
      {dim.selection === "Numeric" && (
        <input
          inputMode="decimal"
          className={`${field} w-56`}
          placeholder={dim.values[0] ?? "Amount and unit"}
          value={a.value[0] ?? ""}
          onChange={(e) => set({ value: e.target.value ? [e.target.value] : [], abstain: undefined })}
        />
      )}
      {dim.selection === "Text" && (
        <input
          className={`${field} w-full max-w-xl`}
          placeholder={dim.values.join("; ")}
          value={a.value[0] ?? ""}
          onChange={(e) => set({ value: e.target.value ? [e.target.value] : [], abstain: undefined })}
        />
      )}
      {dim.selection === "Repeated" && (
        <textarea
          className={`${field} w-full max-w-xl min-h-[64px]`}
          placeholder={`One per line: ${dim.values.join(" · ")}`}
          value={a.value.join("\n")}
          onChange={(e) => set({ value: e.target.value.split("\n").filter((l) => l.trim()), abstain: undefined })}
        />
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2.5">
        <input
          className={`${field} w-64`}
          placeholder="Other / self-describe"
          value={a.other ?? ""}
          onChange={(e) => set({ other: e.target.value || undefined, abstain: undefined })}
        />
        <div className="flex gap-1.5" role="group" aria-label="Abstain">
          {ABSTAIN.map((x) => (
            <button
              key={x}
              type="button"
              onClick={() => set(a.abstain === x ? { abstain: undefined } : { abstain: x, value: [], other: undefined })}
              aria-pressed={a.abstain === x}
              className={chip(a.abstain === x)}
            >
              {x}
            </button>
          ))}
        </div>
        {answered && !a.abstain && (
          <label className="flex items-center gap-2 ml-auto">
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">How known</span>
            <select value={a.evidence} onChange={(e) => set({ evidence: e.target.value })} className={field}>
              {EVIDENCE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <p className="font-mono text-[10px] text-muted-foreground/80 mt-2 leading-snug max-w-2xl">{dim.rule}</p>
    </li>
  );
}

export default function PersonaBuilder() {
  const router = useRouter();
  const [state, setState] = useState<BuilderState>(() => emptyState("consumer"));
  const [hydrated, setHydrated] = useState(false);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.schema === 1 && parsed.state && BUILDER_PATHS.some((p) => p.id === parsed.state.pathId)) setState(parsed.state);
      }
    } catch {
      /* defaults are already right */
    }
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORE, JSON.stringify({ schema: 1, state }));
    } catch {
      /* non-fatal */
    }
  }, [state, hydrated]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const path = BUILDER_PATHS.find((p) => p.id === state.pathId) ?? BUILDER_PATHS[0];
  const ids = useMemo(() => [...path.dimensionIds, ...state.extraIds.filter((id) => !path.dimensionIds.includes(id))], [path, state.extraIds]);
  const dims = ids.map((id) => frameworkById(id)).filter((d): d is FrameworkDimension => Boolean(d));
  const answered = answeredCount(state);
  const flags = handlingRollup(state);
  const brief = buildBrief(state);
  const canHandoff = state.product.trim().length > 0 && answered > 0;

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (q.length < 2) return [];
    return FRAMEWORK.filter((d) => !ids.includes(d.id) && `${d.id} ${d.name} ${d.ask}`.toLowerCase().includes(q)).slice(0, 8);
  }, [search, ids]);

  const setAnswer = (id: string, a: Answer | undefined) =>
    setState((s) => {
      const answers = { ...s.answers };
      if (a && (a.value.length || a.other || a.abstain)) answers[id] = a;
      else delete answers[id];
      return { ...s, answers };
    });

  const handoff = () => {
    try {
      writeHandoff(toHandoff(state));
      router.push("/personas/fanout-journey");
    } catch {
      setToast("Could not hand off: browser storage is blocked. Copy the brief instead.");
    }
  };

  return (
    <div className="border border-border bg-card/20">
      {/* Row 1: the situation */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 border-b border-border">
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Starter path">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mr-1">Path</span>
          {BUILDER_PATHS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setState((s) => ({ ...emptyState(p.id), product: s.product, goal: s.goal, recordType: s.recordType }))}
              aria-pressed={p.id === state.pathId}
              className={chip(p.id === state.pathId)}
            >
              {p.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 basis-full sm:basis-auto sm:flex-1 min-w-0">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground shrink-0">Product or category</span>
          <input
            className={`${field} min-w-0 flex-1`}
            value={state.product}
            onChange={(e) => setState((s) => ({ ...s, product: e.target.value }))}
            placeholder={path.productPlaceholder}
          />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 border-b border-border">
        <label className="flex items-center gap-2 basis-full lg:basis-auto lg:flex-1 min-w-0">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground shrink-0">Stated goal</span>
          <input
            className={`${field} min-w-0 flex-1`}
            value={state.goal}
            onChange={(e) => setState((s) => ({ ...s, goal: e.target.value }))}
            placeholder="What this person is trying to get done, in their words"
          />
        </label>
        <label className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Record type</span>
          <select value={state.recordType} onChange={(e) => setState((s) => ({ ...s, recordType: e.target.value }))} className={field}>
            {RECORD_TYPES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <p className="font-mono text-[10px] text-muted-foreground tabular-nums ml-auto">
          {answered} of {dims.length} answered
          {flags.length ? ` · handling: ${flags.join(", ")}` : ""}
        </p>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {/* Questions */}
        <div className="p-4 lg:p-5 lg:border-r border-border">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">The framework asks</p>
          <p className="font-mono text-[11px] text-muted-foreground leading-relaxed mb-3">
            Answer what the task needs and skip the rest. Every field accepts an answer in the person&apos;s own words, or an
            abstention.
          </p>
          <ol>
            {dims.map((d) => (
              <Question
                key={d.id}
                dim={d}
                answer={state.answers[d.id]}
                onChange={(a) => setAnswer(d.id, a)}
                onRemove={
                  path.dimensionIds.includes(d.id)
                    ? undefined
                    : () => {
                        setAnswer(d.id, undefined);
                        setState((s) => ({ ...s, extraIds: s.extraIds.filter((x) => x !== d.id) }));
                      }
                }
              />
            ))}
          </ol>

          <div className="mt-5 pt-4 border-t border-border/50">
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Add a dimension from the library</span>
              <input
                className={`${field} mt-1 w-full max-w-md`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search 463 dimensions: accessibility, currency, trust..."
              />
            </label>
            {results.length > 0 && (
              <ul className="mt-2 border border-border/60 divide-y divide-border/40 max-w-md">
                {results.map((d) => (
                  <li key={d.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setState((s) => ({ ...s, extraIds: [...s.extraIds, d.id] }));
                        setSearch("");
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-foreground/5 transition-colors"
                    >
                      <span className="font-mono text-[10px] text-muted-foreground tabular-nums mr-2">{d.id}</span>
                      <span className="font-mono text-xs text-foreground">{d.name}</span>
                      <span className="block font-mono text-[10px] text-muted-foreground/80 leading-snug">{d.ask}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* The brief */}
        <div className="p-4 lg:p-5 lg:sticky lg:top-24 lg:self-start">
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Composite persona brief · P460 format</p>
            <p className="font-mono text-[10px] text-muted-foreground">No name. No biography. Only what was stated.</p>
          </div>
          <pre className="font-mono text-[11px] text-foreground/85 leading-relaxed whitespace-pre-wrap border border-border/60 bg-background p-3 max-h-[52vh] overflow-auto">
            {brief}
          </pre>

          <div className="mt-4">
            <button
              type="button"
              onClick={handoff}
              disabled={!canHandoff}
              className={`font-mono text-xs uppercase tracking-wider px-4 py-2.5 border transition-colors ${
                canHandoff
                  ? "border-foreground bg-foreground text-background hover:bg-foreground/90"
                  : "border-border text-muted-foreground cursor-not-allowed"
              }`}
            >
              Open in the Fanout Journey →
            </button>
            {!canHandoff && (
              <p className="font-mono text-[10px] text-muted-foreground mt-1.5">
                Name the product or category and answer at least one question first.
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 mt-4">
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(brief);
                  setToast("Brief copied");
                } catch {
                  setToast("Copy blocked by the browser; select the text instead");
                }
              }}
              className={chip(false)}
            >
              Copy brief
            </button>
            <button type="button" onClick={() => download(buildJson(state), "application/json", "persona-brief.json")} className={chip(false)}>
              JSON ↓
            </button>
            <button type="button" onClick={() => download(interviewGuide(state), "text/markdown", "interview-guide.md")} className={chip(false)}>
              Interview guide ↓
            </button>
            <button type="button" onClick={() => download(validationPlan(state), "text/markdown", "validation-plan.md")} className={chip(false)}>
              Validation plan ↓
            </button>
            <button
              type="button"
              onClick={() => {
                setState(emptyState(state.pathId));
                setToast("Cleared");
              }}
              className={chip(false)}
            >
              Reset
            </button>
          </div>
          <p className="font-mono text-[10px] text-muted-foreground mt-3 leading-relaxed">
            The interview guide lists the questions you skipped, with the evidence each would need. The validation plan is the
            framework&apos;s P463 checklist for this persona.
          </p>
        </div>
      </div>

      <p className="font-mono text-[10px] text-muted-foreground px-4 py-3 border-t border-border leading-relaxed">
        <span className="text-foreground">What this is:</span> what was stated, with how it is known.{" "}
        <span className="text-foreground">What it is not:</span> a measurement of anyone, or a person the tool made up. Edits save only in
        this browser.
      </p>

      {toast && (
        <div role="status" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 border border-border bg-background px-4 py-2 font-mono text-[11px] text-foreground shadow">
          {toast}
        </div>
      )}
    </div>
  );
}
