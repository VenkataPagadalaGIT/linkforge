"use client";

import { useEffect, useMemo, useState } from "react";
import {
  PRESETS,
  STAGES,
  expandedPrompt,
  fanout,
  fanoutAll,
  presetById,
  type FanoutQuestion,
  type Scenario,
  type StageId,
} from "@/data/fanout";
import FanoutMap from "./FanoutMap";
import FanoutMatrix from "./FanoutMatrix";
import ContextLab, { type LensId } from "./ContextLab";
import ScenarioEditor from "./ScenarioEditor";
import QuestionDetail from "./QuestionDetail";
import { HANDOFF_KEY, readHandoff } from "@/data/builder";

type View = "map" | "matrix" | "lab";

interface State {
  presetId: string;
  seed: string;
  product: string;
  budgetPeriod: "one-time" | "monthly";
  scenarios: Scenario[];
  selected: string;
  stage: StageId;
  view: View;
  lens: LensId;
  compare: string[];
}

const STORE = "fanout-journey-v1";

function fromPreset(id: string): State {
  const p = presetById(id);
  return {
    presetId: p.id,
    seed: p.seed,
    product: p.product,
    budgetPeriod: p.budgetPeriod,
    scenarios: p.scenarios.map((s) => ({ ...s })),
    selected: p.scenarios[1]?.id ?? p.scenarios[0].id,
    stage: "compare",
    view: "map",
    lens: "combined",
    compare: p.scenarios.map((s) => s.id),
  };
}

/** Accept a stored state only if it still has the shape this version writes. */
function valid(x: unknown): x is State {
  if (!x || typeof x !== "object") return false;
  const s = x as Partial<State>;
  return (
    typeof s.presetId === "string" &&
    typeof s.seed === "string" &&
    typeof s.product === "string" &&
    Array.isArray(s.scenarios) &&
    s.scenarios.length > 0 &&
    s.scenarios.every((c) => c && typeof c.id === "string" && typeof c.need === "string" && Number.isFinite(Number(c.budget))) &&
    STAGES.some((st) => st.id === s.stage) &&
    ["map", "matrix", "lab"].includes(s.view as string)
  );
}

/** Guard against spreadsheet formula injection: a cell starting =,+,-,@ executes in Excel. */
function csvCell(v: unknown): string {
  let s = String(v ?? "");
  if (/^[\s﻿]*[=+@\-\t\r]/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
}

function download(content: string, type: string, name: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const STORY: { title: string; caption: string; apply: (s: State) => Partial<State> }[] = [
  {
    title: "Start with a single query.",
    caption: "The starting prompt expresses broad intent. It does not tell us what matters to this buyer.",
    apply: () => ({ view: "map" }),
  },
  {
    title: "First, ask what is missing.",
    caption: "Before fanning out, the tool asks for explicit answers: budget, need, constraint, timing. Nothing is inferred from who someone is.",
    apply: () => ({ view: "lab", lens: "none" }),
  },
  {
    title: "Different needs create different questions.",
    caption: "Each scenario is a set of stated inputs. Switch scenario and the same seed produces a different journey.",
    apply: (s) => ({ view: "map", stage: "discover", selected: s.scenarios[0].id }),
  },
  {
    title: "Stages change the job of the question.",
    caption: "Discover clarifies, Explore shortlists, Compare weighs, Decide verifies. Own is where the next purchase begins.",
    apply: () => ({ view: "map", stage: "compare" }),
  },
  {
    title: "Every question can explain itself.",
    caption: "Open one. It shows the inputs it used, the format that tends to answer it, and how to validate it before anyone writes to it.",
    apply: () => ({ view: "map" }),
  },
  {
    title: "See the whole journey at once.",
    caption: "The matrix is the planning view: scenarios across, stages down. An empty column is a buyer you are not talking to.",
    apply: () => ({ view: "matrix" }),
  },
];

/**
 * The tool. State is plain useState, held here and passed down, which is the
 * pattern every other tool on the persona surface uses. It persists to
 * localStorage after mount only: the server renders the default state, and
 * hydration demands the client's first render match it, so stored edits are
 * loaded in an effect rather than in the initial state.
 */
export default function FanoutJourney() {
  const [state, setState] = useState<State>(() => fromPreset("automotive"));
  const [hydrated, setHydrated] = useState(false);
  const [editing, setEditing] = useState(false);
  const [detail, setDetail] = useState<FanoutQuestion | null>(null);
  const [story, setStory] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    try {
      // A persona arriving from /personas/builder wins over whatever was
      // stored: it becomes the first scenario of the blank preset, with the
      // three generic scenarios kept as comparators, and starts at Discover.
      const h = readHandoff();
      if (h) {
        const base = fromPreset("custom");
        setState({
          ...base,
          product: h.product,
          seed: h.seed,
          budgetPeriod: h.budgetPeriod,
          scenarios: [h.scenario, ...base.scenarios.slice(0, 3)],
          selected: h.scenario.id,
          stage: "discover",
        });
        localStorage.removeItem(HANDOFF_KEY);
        setToast("Loaded your persona from the builder. Its inputs are editable here.");
      } else {
        const raw = localStorage.getItem(STORE);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.schema === 1 && valid(parsed.state)) setState(parsed.state);
        }
      }
    } catch {
      /* private mode or blocked storage: the defaults are already right */
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
    const t = setTimeout(() => setToast(null), toast.length > 40 ? 5000 : 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const patch = (p: Partial<State>) => setState((s) => ({ ...s, ...p }));
  const ctx = useMemo(
    () => ({ product: state.product, budgetPeriod: state.budgetPeriod, seed: state.seed }),
    [state.product, state.budgetPeriod, state.seed],
  );
  const scenario = state.scenarios.find((s) => s.id === state.selected) ?? state.scenarios[0];
  const stage = STAGES.find((s) => s.id === state.stage) ?? STAGES[0];
  const questions = useMemo(() => fanout(scenario, stage, ctx, state.seed), [scenario, stage, ctx, state.seed]);
  const all = useMemo(() => fanoutAll(state.scenarios, ctx, state.seed), [state.scenarios, ctx, state.seed]);
  const expanded = expandedPrompt(scenario, ctx, state.seed);

  const openQuestion = (q: FanoutQuestion) => {
    setDetail(q);
    setEditing(false);
    requestAnimationFrame(() => document.getElementById("fanout-detail")?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
  };

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(expanded);
      setToast("Expanded prompt copied");
    } catch {
      setToast("Copy blocked by the browser; select the text in the detail panel instead");
    }
  };

  const exportCsv = () => {
    const cols = ["seed", "product", "scenarioName", "stageName", "question", "type", "format", "rationale", "validation", "evidence"] as const;
    const rows = [cols.join(","), ...all.map((q) => cols.map((c) => csvCell(q[c])).join(","))];
    download(rows.join("\n"), "text/csv", "persona-fanout-journey.csv");
  };

  const exportJson = () => {
    download(
      JSON.stringify(
        {
          tool: "Persona Fanout Journey",
          note: "Illustrative hypotheses generated from explicit scenario inputs. Not measured demand.",
          seed: state.seed,
          product: state.product,
          stages: STAGES.map(({ id, name, goal, type, validation }) => ({ id, name, goal, type, validation })),
          scenarios: state.scenarios,
          questions: all,
        },
        null,
        2,
      ),
      "application/json",
      "persona-fanout-journey.json",
    );
  };

  const stepStory = (i: number) => {
    if (i < 0 || i >= STORY.length) {
      setStory(null);
      return;
    }
    setStory(i);
    patch(STORY[i].apply(state));
  };

  const chip = (on: boolean) =>
    `font-mono text-[10px] uppercase tracking-wider border px-2 py-1 transition-colors ${
      on ? "border-foreground/40 bg-foreground/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground"
    }`;

  return (
    <div className="border border-border bg-card/20">
      {/* Row 1: the seed and the domain */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 border-b border-border">
        {/* basis-full under sm: in a wrapping row the input shrank to nothing
            beside the domain select, and "01 START" ran into "DOMAIN". */}
        <label className="flex items-center gap-2 min-w-0 basis-full sm:basis-auto sm:flex-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground shrink-0">01 Start</span>
          <input
            value={state.seed}
            onChange={(e) => patch({ seed: e.target.value })}
            placeholder="I want to buy a..."
            className="min-w-0 flex-1 font-mono text-xs bg-transparent border border-border text-foreground px-2 py-1.5 placeholder:text-muted-foreground/70 focus:outline-none focus:border-foreground/60"
          />
        </label>
        <label className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Domain</span>
          <select
            value={state.presetId}
            onChange={(e) => {
              setState(fromPreset(e.target.value));
              setDetail(null);
            }}
            className="font-mono text-xs bg-transparent border border-border text-foreground px-2 py-1.5 focus:outline-none focus:border-foreground/60"
          >
            {PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={() => setEditing((e) => !e)} className={chip(editing)} aria-pressed={editing}>
          {editing ? "Editing inputs" : "Edit persona inputs"}
        </button>
        <button type="button" onClick={() => stepStory(story === null ? 0 : story + 1)} className={chip(story !== null)}>
          {story === null ? "▶ Tell the story" : "Next →"}
        </button>
      </div>

      {/* Story caption */}
      {story !== null && (
        <div className="px-4 py-3 border-b border-border bg-background flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground tabular-nums">
            {story + 1} / {STORY.length}
          </p>
          <p className="font-display text-sm font-bold text-foreground">{STORY[story].title}</p>
          <p className="font-mono text-[11px] text-muted-foreground leading-relaxed flex-1 min-w-[240px]">{STORY[story].caption}</p>
          <button type="button" onClick={() => setStory(null)} className={chip(false)}>
            Exit
          </button>
        </div>
      )}

      {/* Row 2: counts and views */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 border-b border-border">
        <p className="font-mono text-[10px] text-muted-foreground tabular-nums">
          1 starting query · {state.scenarios.length} editable scenarios · {STAGES.length} stages · {all.length} questions
        </p>
        <div className="flex gap-1.5 ml-auto" role="group" aria-label="View">
          {(
            [
              ["map", "Fan-out map"],
              ["matrix", "Journey matrix"],
              ["lab", "Context lab"],
            ] as [View, string][]
          ).map(([v, label]) => (
            <button key={v} type="button" onClick={() => patch({ view: v })} className={chip(state.view === v)} aria-pressed={state.view === v}>
              {label}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          <button type="button" onClick={exportCsv} className={chip(false)}>
            CSV ↓
          </button>
          <button type="button" onClick={exportJson} className={chip(false)}>
            JSON ↓
          </button>
          <button
            type="button"
            onClick={() => {
              setState(fromPreset(state.presetId));
              setDetail(null);
              setToast("Scenario inputs reset");
            }}
            className={chip(false)}
          >
            Reset
          </button>
        </div>
      </div>

      {editing && (
        <ScenarioEditor
          scenario={scenario}
          preset={ctx}
          seed={state.seed}
          onSeed={(seed) => patch({ seed })}
          onProduct={(product) => patch({ product })}
          onChange={(next) => patch({ scenarios: state.scenarios.map((s) => (s.id === next.id ? next : s)) })}
          onReset={() => {
            setState(fromPreset(state.presetId));
            setToast("Scenario inputs reset");
          }}
          onClose={() => setEditing(false)}
        />
      )}

      {state.view === "map" && (
        <>
          <p className="font-mono text-[11px] text-muted-foreground px-4 pt-4 lg:px-5">
            <span className="text-foreground">Follow the lit path.</span> Pick a scenario, then a stage. Open a question to see why it exists.
            <span className="text-muted-foreground/80 float-right tabular-nums">{questions.length} shown / {all.length} total</span>
          </p>
          <FanoutMap
            scenarios={state.scenarios}
            selected={state.selected}
            stage={state.stage}
            seed={state.seed}
            preset={ctx}
            questions={questions}
            onSelect={(id) => patch({ selected: id })}
            onStage={(id) => patch({ stage: id })}
            onOpen={openQuestion}
            onContext={(id) => patch({ view: "lab", lens: id })}
          />
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 border-t border-border">
            <p className="font-mono text-[11px] text-foreground">
              {scenario.name} <span className="text-muted-foreground">→</span> {stage.name} <span className="text-muted-foreground">→</span>{" "}
              {questions.length} questions
              <span className="block font-mono text-[10px] text-muted-foreground mt-0.5">Stated need: {scenario.need.trim() || "not yet stated"}</span>
            </p>
            <button type="button" onClick={copyPrompt} className={`${chip(false)} ml-auto`}>
              Copy expanded prompt
            </button>
          </div>
        </>
      )}

      {state.view === "matrix" && (
        <FanoutMatrix
          scenarios={state.scenarios}
          compare={state.compare}
          preset={ctx}
          seed={state.seed}
          onToggle={(id) =>
            patch({ compare: state.compare.includes(id) ? state.compare.filter((c) => c !== id) : [...state.compare, id] })
          }
          onOpen={openQuestion}
        />
      )}

      {state.view === "lab" && (
        <>
          <div className="flex flex-wrap items-center gap-1.5 px-4 pt-4 lg:px-5" role="group" aria-label="Scenario">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mr-2">Scenario</span>
            {state.scenarios.map((s) => (
              <button key={s.id} type="button" onClick={() => patch({ selected: s.id })} className={chip(s.id === state.selected)} aria-pressed={s.id === state.selected}>
                {s.name}
              </button>
            ))}
          </div>
          <ContextLab scenario={scenario} preset={ctx} lens={state.lens} onLens={(lens) => patch({ lens })} />
        </>
      )}

      {detail && (
        <QuestionDetail question={detail} expanded={expanded} extras={scenario.extras} onClose={() => setDetail(null)} />
      )}

      <p className="font-mono text-[10px] text-muted-foreground px-4 py-3 border-t border-border leading-relaxed">
        <span className="text-foreground">What this is:</span> a planning model built from explicit, editable inputs.{" "}
        <span className="text-foreground">What it is not:</span> measured search demand, observed customer behaviour, or an AI engine&apos;s internal
        queries. Edits save only in this browser.
      </p>

      {toast && (
        <div role="status" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 border border-border bg-background px-4 py-2 font-mono text-[11px] text-foreground shadow">
          {toast}
        </div>
      )}
    </div>
  );
}
