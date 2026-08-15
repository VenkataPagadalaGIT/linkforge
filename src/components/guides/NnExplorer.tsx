"use client";
import { useWebGL } from "@/lib/webgl";
/**
 * NnExplorer: the interactive shell around NnScene.
 *
 * Three ways in: Journey (a guided, auto-playable 16-step walkthrough),
 * Explore (click any station for mechanism, analogy, and primary source),
 * and Train (the same 784-16-16-10 network REALLY training in the browser
 * on 10,000 genuine MNIST digits; the scene shows the actual pixels,
 * activations, beliefs, weights, and a live accuracy log). Same resilience
 * contract as LlmExplorer: lazy 3D, WebGL probe, error boundary; no WebGL
 * degrades to the guide's static content.
 */
import {
  Component,
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  NN_ACTS,
  NN_JOURNEY,
  NN_COUNTS,
  NN_STAGES,
  nnStageById,
  nnStagesInAct,
  type NnAct,
} from "@/data/nn";
import { NnTrainer, parseMnist } from "@/lib/nnTrain";
import type { NnProgram } from "./NnScene";

const NnScene = lazy(() => import("./NnScene"));

/* ---------------------------------------------------------------- */

class SceneErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <div className="h-full flex flex-col items-center justify-center gap-4 p-8 text-center">
          <p className="font-mono text-xs text-muted-foreground leading-relaxed max-w-sm">
            The 3D model hit a rendering error.
          </p>
          <button
            type="button"
            onClick={() => this.setState({ failed: false })}
            className="font-mono text-[11px] uppercase tracking-wider px-4 py-2 border border-foreground/50 text-foreground hover:bg-secondary/40 transition-colors"
          >
            Reload 3D model
          </button>
        </div>
      );
    return this.props.children;
  }
}

function SceneFallback() {
  return (
    <div className="h-full flex items-center justify-center p-8 text-center">
      <p className="font-mono text-xs text-muted-foreground leading-relaxed max-w-sm">
        The 3D model needs WebGL, which this browser or device doesn&apos;t provide.
        Every stage it visualizes is described in the text and tables below.
      </p>
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`w-8 h-4 border transition-colors relative ${
          value ? "border-foreground/70 bg-foreground/20" : "border-border bg-transparent"
        }`}
      >
        <span
          className={`absolute top-[2px] w-2.5 h-2.5 transition-all ${
            value ? "left-[18px] bg-foreground" : "left-[2px] bg-muted-foreground/70"
          }`}
        />
      </button>
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
    </label>
  );
}

/* ---------------------------------------------------------------- */

type Mode = "journey" | "explore" | "train";
const AUTOPLAY_MS = 9000;

/** Program for a stage id (explore mode animates the same beat). */
const stageProgram = (stageId: string): NnProgram | null => {
  const step = NN_JOURNEY.find((j) => j.stageId === stageId);
  return (step?.program as NnProgram) ?? null;
};

type DataState = "idle" | "loading" | "ready" | "error";

interface TrainStats {
  step: number;
  epoch: number;
  lossEma: number;
  acc: number | null;
  best: number;
  pred: number;
  label: number;
}

export default function NnExplorer() {
  const { ok: webgl, power: glPower } = useWebGL();
  const shellRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>("journey");
  const [stepIdx, setStepIdx] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [running, setRunning] = useState(true);
  const [labels, setLabels] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);

  // live training
  const trainerRef = useRef<NnTrainer | null>(null);
  const [dataState, setDataState] = useState<DataState>("idle");
  const [training, setTraining] = useState(false);
  const trainingRef = useRef(false);
  const [turbo, setTurbo] = useState(false);
  const turboRef = useRef(false);
  const seedRef = useRef(1337);
  const [stats, setStats] = useState<TrainStats | null>(null);
  const bestRef = useRef(0);

  useEffect(() => {
    const nudge = () => window.dispatchEvent(new Event("resize"));
    const raf = requestAnimationFrame(nudge);
    const timers = [120, 320, 640].map((ms) => window.setTimeout(nudge, ms));
    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
    };
  }, [panelOpen]);

  const step = mode === "journey" ? NN_JOURNEY[stepIdx] : null;
  const selected = selectedId ? nnStageById(selectedId) : null;

  useEffect(() => {
    if (!autoPlay) return;
    const t = setInterval(() => {
      setStepIdx((i) => {
        if (i >= NN_JOURNEY.length - 1) {
          setAutoPlay(false);
          return i;
        }
        return i + 1;
      });
    }, AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [autoPlay]);

  /* ---------------- live training machinery ---------------- */

  const loadData = useCallback(async () => {
    if (trainerRef.current || dataState === "loading") return;
    setDataState("loading");
    try {
      const res = await fetch("/data/mnist-live.bin");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = await res.arrayBuffer();
      const data = parseMnist(buf);
      trainerRef.current = new NnTrainer(data, seedRef.current);
      trainerRef.current.showTestSample(0);
      bestRef.current = 0;
      setDataState("ready");
    } catch {
      setDataState("error");
    }
  }, [dataState]);

  useEffect(() => {
    if (mode === "train") void loadData();
  }, [mode, loadData]);

  // training loop: a few Adam steps per animation frame, honest and smooth
  useEffect(() => {
    trainingRef.current = training;
    if (!training) return;
    let raf = 0;
    const tick = () => {
      const tr = trainerRef.current;
      if (!tr || !trainingRef.current) return;
      const steps = turboRef.current ? 10 : 3;
      for (let s = 0; s < steps; s++) tr.trainStep();
      if (tr.step % 100 < steps) {
        const acc = tr.evaluate();
        if (acc > bestRef.current) bestRef.current = acc;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [training]);

  useEffect(() => {
    turboRef.current = turbo;
  }, [turbo]);

  // UI stats at 4 Hz, decoupled from the hot loop
  useEffect(() => {
    if (mode !== "train") return;
    const t = setInterval(() => {
      const tr = trainerRef.current;
      if (!tr) return;
      const last = tr.accHistory[tr.accHistory.length - 1];
      setStats({
        step: tr.step,
        epoch: tr.epoch,
        lossEma: tr.lossEma,
        acc: last ? last.acc : null,
        best: bestRef.current,
        pred: tr.lastPred,
        label: tr.lastLabel,
      });
    }, 250);
    return () => clearInterval(t);
  }, [mode]);

  const resetTraining = () => {
    const tr = trainerRef.current;
    if (!tr) return;
    setTraining(false);
    seedRef.current += 1;
    // re-init on the same loaded data with a fresh seed
    trainerRef.current = new NnTrainer(tr.data, seedRef.current);
    trainerRef.current.showTestSample(0);
    bestRef.current = 0;
    setStats(null);
  };

  /* ---------------------------------------------------------- */

  const toggleFullscreen = () => {
    const el = shellRef.current;
    if (!el) return;
    if (!fullscreen) {
      el.requestFullscreen?.().catch(() => undefined);
      setFullscreen(true);
    } else {
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => undefined);
      setFullscreen(false);
    }
  };
  useEffect(() => {
    const onChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const highlightIds = step ? [step.stageId] : selectedId ? [selectedId] : [];
  const program =
    mode === "train" ? null : step ? (step.program as NnProgram) : selectedId ? stageProgram(selectedId) : null;
  const flow = mode === "train" ? null : step ? step.flow : null;

  const canvasHeightClass = fullscreen ? "" : "h-[380px] sm:h-[460px] lg:h-[540px]";
  const canvasStyle = fullscreen ? { height: "calc(100vh - 54px)" } : undefined;
  const panelStyle = fullscreen ? { height: "calc(100vh - 54px)" } : undefined;

  return (
    <div ref={shellRef} className={`my-8 border border-border ${fullscreen ? "bg-background" : "bg-card/20"}`} data-testid="nn-explorer">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => {
              if (autoPlay) {
                setAutoPlay(false);
              } else {
                setTraining(false);
                setMode("journey");
                setSelectedId(null);
                setStepIdx(0);
                setAutoPlay(true);
              }
            }}
            className={`font-mono text-[11px] uppercase tracking-wider px-3 py-1.5 border transition-colors mr-2 ${
              autoPlay
                ? "border-emerald-400/60 text-emerald-700 dark:text-emerald-300 bg-emerald-400/10"
                : "border-foreground/70 text-foreground bg-foreground/10 hover:bg-foreground/20"
            }`}
            title="Watch a digit get recognized and the network get trained, start to finish"
            data-testid="nn-play"
          >
            {autoPlay ? "⏸ playing…" : "▶ play the journey"}
          </button>
          {(["journey", "explore", "train"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setAutoPlay(false);
                if (m !== "train") setTraining(false);
                setMode(m);
                setSelectedId(null);
              }}
              className={`font-mono text-[11px] uppercase tracking-wider px-3 py-1.5 border transition-colors ${
                mode === m
                  ? "border-foreground/60 text-foreground bg-secondary/40"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
              data-testid={`nn-mode-${m}`}
            >
              {m}
              {m === "train" && (
                <span className="ml-1.5 font-mono text-[9px] uppercase tracking-wider px-1 py-px border border-emerald-400/50 text-emerald-700 dark:text-emerald-300">
                  live
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Toggle label="Signal flow" value={running} onChange={setRunning} />
          <Toggle label="Labels" value={labels} onChange={setLabels} />
          <button
            type="button"
            onClick={() => setPanelOpen((v) => !v)}
            title={panelOpen ? "Hide the text: full-width animation" : "Show the text panel"}
            className={`font-mono text-[10px] uppercase tracking-[0.2em] px-3 py-1.5 border transition-colors ${
              panelOpen
                ? "border-border text-muted-foreground hover:text-foreground"
                : "border-foreground/50 text-foreground bg-foreground/10"
            }`}
            data-testid="nn-focus"
          >
            {panelOpen ? "⤢ focus" : "☰ text"}
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="font-mono text-[10px] uppercase tracking-[0.2em] px-3 py-1.5 border border-border text-muted-foreground hover:text-foreground transition-colors"
          >
            {fullscreen ? "✕ exit" : "⛶ fullscreen"}
          </button>
        </div>
      </div>

      <div
        className={`lg:grid transition-[grid-template-columns] duration-300 ease-in-out ${
          panelOpen ? "lg:grid-cols-[1.4fr_1fr]" : "lg:grid-cols-[1fr_0fr]"
        }`}
      >
        {/* 3D canvas */}
        <div className={`${canvasHeightClass} relative min-w-0 overflow-hidden border-b lg:border-b-0 ${panelOpen ? "lg:border-r" : ""} border-border`} style={canvasStyle}>
          {webgl === false ? (
            <SceneFallback />
          ) : webgl === null ? (
            <div className="h-full w-full" aria-busy="true" />
          ) : (
            <SceneErrorBoundary>
              <Suspense
                fallback={
                  <div className="h-full flex items-center justify-center">
                    <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70 animate-pulse">
                      Loading 3D model…
                    </p>
                  </div>
                }
              >
                <NnScene
                  glPower={glPower}
                  selectedId={selectedId}
                  highlightIds={highlightIds}
                  onSelect={(id) => {
                    setSelectedId(id);
                    if (id) {
                      setAutoPlay(false);
                      setTraining(false);
                      setMode("explore");
                    }
                  }}
                  running={running}
                  labels={mode === "train" ? false : labels}
                  flow={flow}
                  program={program}
                  focusStepId={mode === "journey" ? step?.id ?? null : mode === "train" ? "live-train" : null}
                  trainMode={mode === "train" && dataState === "ready"}
                  live={trainerRef}
                />
              </Suspense>
            </SceneErrorBoundary>
          )}
          <p className="absolute bottom-2 left-3 font-mono text-[9px] text-muted-foreground/70 pointer-events-none">
            {mode === "train"
              ? "real MNIST digits · real activations · nothing staged"
              : "drag to orbit · scroll to zoom · click a station"}
          </p>
        </div>

        {/* side panel */}
        <div
          className={`min-w-0 transition-opacity duration-200 ${
            panelOpen
              ? "p-4 lg:h-[540px] lg:overflow-y-auto"
              : "h-0 lg:h-[540px] overflow-hidden opacity-0 pointer-events-none"
          }`}
          style={panelOpen ? panelStyle : undefined}
        >
          {mode === "journey" && step && (
            <div data-testid="nn-journey-panel">
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground/70">
                  Step {stepIdx + 1} of {NN_JOURNEY.length}
                  {" · "}
                  {NN_ACTS[nnStageById(step.stageId)!.act].label}
                </p>
              </div>
              <div className="flex gap-1 mb-4">
                {NN_JOURNEY.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    aria-label={s.title}
                    onClick={() => { setAutoPlay(false); setStepIdx(i); }}
                    className={`h-[3px] flex-1 transition-colors ${
                      i < stepIdx ? "bg-foreground/60" : i === stepIdx ? "bg-emerald-400" : "bg-border"
                    }`}
                  />
                ))}
              </div>
              <h3 className="font-display text-lg font-bold text-foreground mb-2">{step.title}</h3>
              <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-5">{step.narration}</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={stepIdx === 0}
                  onClick={() => { setAutoPlay(false); setStepIdx((i) => Math.max(0, i - 1)); }}
                  className="font-mono text-[11px] uppercase tracking-wider px-4 py-2 border border-border text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  disabled={stepIdx === NN_JOURNEY.length - 1}
                  onClick={() => { setAutoPlay(false); setStepIdx((i) => Math.min(NN_JOURNEY.length - 1, i + 1)); }}
                  className="font-mono text-[11px] uppercase tracking-wider px-4 py-2 border border-foreground/50 text-foreground hover:bg-secondary/40 disabled:opacity-30 transition-colors"
                  data-testid="nn-next"
                >
                  Next →
                </button>
              </div>
              {stepIdx === NN_JOURNEY.length - 1 && (
                <p className="font-mono text-[10px] text-muted-foreground/70 mt-4">
                  That&apos;s the whole machine, honestly told. Now open{" "}
                  <span className="text-foreground">Train</span> and watch this exact network
                  really learn, or <span className="text-foreground">Explore</span> any station
                  for the mechanism and the primary source behind it.
                </p>
              )}
            </div>
          )}

          {mode === "explore" &&
            (selected ? (
              <div data-testid="nn-detail">
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground/70 mb-2">
                  Station {NN_STAGES.findIndex((s) => s.id === selected.id) + 1} of {NN_STAGES.length}
                </p>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="font-display text-lg font-bold text-foreground">{selected.name}</h3>
                  <button
                    type="button"
                    onClick={() => setSelectedId(null)}
                    className="font-mono text-[10px] text-muted-foreground hover:text-foreground"
                  >
                    ✕ close
                  </button>
                </div>
                <p
                  className="font-mono text-[10px] uppercase tracking-[0.2em] mb-3"
                  style={{ color: NN_ACTS[selected.act].color }}
                >
                  {NN_ACTS[selected.act].label}
                </p>
                <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-4">{selected.story}</p>
                <div className="border border-border/60 p-3 mb-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-1.5">How it works</p>
                  <p className="font-mono text-[11px] text-muted-foreground leading-relaxed">{selected.tech}</p>
                </div>
                <div className="border border-border/60 p-3 mb-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-1.5">Analogy</p>
                  <p className="font-mono text-[11px] text-muted-foreground leading-relaxed italic">{selected.analogy}</p>
                </div>
                <table className="w-full mb-3">
                  <tbody>
                    {selected.numbers.map((n) => (
                      <tr key={n.label} className="border-b border-border/40">
                        <td className="py-1.5 pr-2 font-mono text-[10px] text-muted-foreground/70">{n.label}</td>
                        <td className="py-1.5 font-mono text-[11px] text-foreground text-right">{n.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {selected.paper && (
                  <div className="border border-emerald-400/30 bg-emerald-400/[0.04] p-3">
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-700/80 dark:text-emerald-300/80 mb-1.5">
                      Primary source
                    </p>
                    <p className="font-mono text-[11px] text-muted-foreground leading-relaxed">{selected.paper}</p>
                  </div>
                )}
                {(() => {
                  const idx = NN_STAGES.findIndex((s) => s.id === selected.id);
                  return (
                    <div className="flex items-center gap-2 mt-4">
                      <button
                        type="button"
                        disabled={idx <= 0}
                        onClick={() => setSelectedId(NN_STAGES[idx - 1].id)}
                        className="font-mono text-[11px] uppercase tracking-wider px-4 py-2 border border-border text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                        data-testid="nn-station-back"
                      >
                        ← Back
                      </button>
                      <button
                        type="button"
                        disabled={idx >= NN_STAGES.length - 1}
                        onClick={() => setSelectedId(NN_STAGES[idx + 1].id)}
                        className="font-mono text-[11px] uppercase tracking-wider px-4 py-2 border border-foreground/50 text-foreground hover:bg-secondary/40 disabled:opacity-30 transition-colors"
                        data-testid="nn-station-next"
                      >
                        Next →
                      </button>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div data-testid="nn-explore-index">
                <h3 className="font-display text-lg font-bold text-foreground mb-1">Every station of the machine</h3>
                <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-4">
                  {NN_COUNTS.stages} stations across {NN_COUNTS.acts} acts. Click one here or in the 3D scene.
                </p>
                {(Object.keys(NN_ACTS) as NnAct[]).map((a) => (
                  <div key={a} className="mb-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: NN_ACTS[a].color }}>
                      {NN_ACTS[a].label}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {nnStagesInAct(a).map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSelectedId(s.id)}
                          className="font-mono text-[10px] px-2 py-1 border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
                          data-testid={`nn-chip-${s.id}`}
                        >
                          {s.short}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}

          {mode === "train" && (
            <div data-testid="nn-train-panel">
              <h3 className="font-display text-lg font-bold text-foreground mb-2">
                Train it yourself. For real.
              </h3>
              <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-4">
                This is not an animation. Press train and the exact 13,002-parameter network from
                this guide runs Adam on <span className="text-foreground">10,000 genuine MNIST digits</span> in
                your browser: the wall shows the digit being learned, neurons glow with its real
                activations, the bars are the network&apos;s actual belief, the fibers brighten with
                learned weight strength, and the curve is a live log of accuracy on 1,000 held-out
                digits it never trains on.
              </p>

              {dataState === "loading" && (
                <p className="font-mono text-[11px] text-muted-foreground animate-pulse mb-4" data-testid="nn-train-loading">
                  Fetching 10,000 real MNIST digits (about 1.8 MB)…
                </p>
              )}
              {dataState === "error" && (
                <div className="mb-4">
                  <p className="font-mono text-[11px] text-muted-foreground mb-2">
                    Could not fetch the MNIST data file.
                  </p>
                  <button
                    type="button"
                    onClick={() => { setDataState("idle"); void loadData(); }}
                    className="font-mono text-[11px] uppercase tracking-wider px-4 py-2 border border-foreground/50 text-foreground hover:bg-secondary/40 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              )}

              {dataState === "ready" && (
                <>
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <button
                      type="button"
                      onClick={() => setTraining((v) => !v)}
                      className={`font-mono text-[11px] uppercase tracking-wider px-4 py-2 border transition-colors ${
                        training
                          ? "border-amber-400/60 text-amber-700 dark:text-amber-300 bg-amber-400/10"
                          : "border-emerald-400/60 text-emerald-700 dark:text-emerald-300 bg-emerald-400/10 hover:bg-emerald-400/20"
                      }`}
                      data-testid="nn-train-toggle"
                    >
                      {training ? "⏸ pause" : "▶ train"}
                    </button>
                    <Toggle label="Turbo" value={turbo} onChange={setTurbo} />
                    <button
                      type="button"
                      onClick={resetTraining}
                      className="font-mono text-[11px] uppercase tracking-wider px-3 py-2 border border-border text-muted-foreground hover:text-foreground transition-colors"
                      data-testid="nn-train-reset"
                    >
                      ↺ reset
                    </button>
                  </div>

                  <table className="w-full mb-4" data-testid="nn-train-stats">
                    <tbody>
                      <tr className="border-b border-border/40">
                        <td className="py-1.5 font-mono text-[10px] text-muted-foreground/70">Epoch · step</td>
                        <td className="py-1.5 font-mono text-[11px] text-foreground text-right">
                          {stats ? `${stats.epoch} · ${stats.step.toLocaleString("en-US")}` : "0 · 0"}
                        </td>
                      </tr>
                      <tr className="border-b border-border/40">
                        <td className="py-1.5 font-mono text-[10px] text-muted-foreground/70">Training loss (EMA)</td>
                        <td className="py-1.5 font-mono text-[11px] text-foreground text-right">
                          {stats && !Number.isNaN(stats.lossEma) ? stats.lossEma.toFixed(3) : "…"}
                        </td>
                      </tr>
                      <tr className="border-b border-border/40">
                        <td className="py-1.5 font-mono text-[10px] text-muted-foreground/70">Held-out accuracy (1,000 digits)</td>
                        <td className="py-1.5 font-mono text-[11px] text-foreground text-right" data-testid="nn-train-acc">
                          {stats?.acc != null ? `${(stats.acc * 100).toFixed(1)}%` : "untested"}
                        </td>
                      </tr>
                      <tr className="border-b border-border/40">
                        <td className="py-1.5 font-mono text-[10px] text-muted-foreground/70">Best so far</td>
                        <td className="py-1.5 font-mono text-[11px] text-foreground text-right">
                          {stats && stats.best > 0 ? `${(stats.best * 100).toFixed(1)}%` : "…"}
                        </td>
                      </tr>
                      <tr className="border-b border-border/40">
                        <td className="py-1.5 font-mono text-[10px] text-muted-foreground/70">Current digit: truth vs guess</td>
                        <td className="py-1.5 font-mono text-[11px] text-foreground text-right">
                          {stats && stats.label >= 0 ? (
                            <>
                              {stats.label} vs {stats.pred}{" "}
                              {stats.label === stats.pred ? (
                                <span className="text-emerald-700 dark:text-emerald-300">✓</span>
                              ) : (
                                <span className="text-amber-700 dark:text-amber-300">✗</span>
                              )}
                            </>
                          ) : "…"}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <p className="font-mono text-[10px] text-muted-foreground/70 leading-relaxed">
                    Honest expectations: this trains on a 10,000-digit subset (of MNIST&apos;s 60,000),
                    so the seeded reference run reaches 92.8% held-out accuracy after 20 epochs,
                    versus the 96%+ Nielsen reports with the full set. The amber dot on the belief
                    board marks the true answer; watch early chaos become confident agreement.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
