"use client";
import { useWebGL } from "@/lib/webgl";
/**
 * QuantumExplorer: the interactive shell around QuantumScene.
 *
 * Two ways in: Journey (a guided, auto-playable 16-step walkthrough from a
 * single qubit down the dilution refrigerator to the honest scoreboard) and
 * Explore (click any station for mechanism, analogy, and primary source).
 * Same resilience contract as NnExplorer and LlmExplorer: lazy 3D, WebGL
 * probe, error boundary; no WebGL degrades to the guide's static content.
 */
import {
  Component,
  Suspense,
  lazy,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  QC_ACTS,
  QC_JOURNEY,
  QC_COUNTS,
  QC_STAGES,
  qcStageById,
  type QcAct,
} from "@/data/quantum";
import type { QcProgram } from "./QuantumScene";

const QuantumScene = lazy(() => import("./QuantumScene"));

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
        Every station it visualizes is described in the text and tables below.
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

type Mode = "journey" | "explore";
const AUTOPLAY_MS = 9000;

const stageProgram = (stageId: string): QcProgram | null => {
  const step = QC_JOURNEY.find((j) => j.stageId === stageId);
  return (step?.program as QcProgram) ?? null;
};

const stagesInAct = (a: QcAct) => QC_STAGES.filter((s) => s.act === a);

export default function QuantumExplorer() {
  const { ok: webgl, power: glPower } = useWebGL();
  const shellRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>("journey");
  const [stepIdx, setStepIdx] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [labels, setLabels] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);

  useEffect(() => {
    const nudge = () => window.dispatchEvent(new Event("resize"));
    const raf = requestAnimationFrame(nudge);
    const timers = [120, 320, 640].map((ms) => window.setTimeout(nudge, ms));
    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
    };
  }, [panelOpen]);

  const step = mode === "journey" ? QC_JOURNEY[stepIdx] : null;
  const selected = selectedId ? qcStageById(selectedId) : null;

  useEffect(() => {
    if (!autoPlay) return;
    const t = setInterval(() => {
      setStepIdx((i) => {
        if (i >= QC_JOURNEY.length - 1) {
          setAutoPlay(false);
          return i;
        }
        return i + 1;
      });
    }, AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [autoPlay]);

  const journeyBack = () => { setAutoPlay(false); setStepIdx((i) => Math.max(0, i - 1)); };
  const journeyNext = () => { setAutoPlay(false); setStepIdx((i) => Math.min(QC_JOURNEY.length - 1, i + 1)); };
  const stationIdx = selectedId ? QC_STAGES.findIndex((s) => s.id === selectedId) : -1;
  const stationBack = () => { if (stationIdx > 0) setSelectedId(QC_STAGES[stationIdx - 1].id); };
  const stationNext = () => {
    if (stationIdx < 0) setSelectedId(QC_STAGES[0].id);
    else if (stationIdx < QC_STAGES.length - 1) setSelectedId(QC_STAGES[stationIdx + 1].id);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const el = document.activeElement;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) return;
      e.preventDefault();
      if (mode === "journey") (e.key === "ArrowRight" ? journeyNext : journeyBack)();
      else (e.key === "ArrowRight" ? stationNext : stationBack)();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, selectedId, stationIdx]);

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
  const program = step ? (step.program as QcProgram) : selectedId ? stageProgram(selectedId) : null;

  const canvasHeightClass = fullscreen ? "" : "h-[380px] sm:h-[460px] lg:h-[540px]";
  const canvasStyle = fullscreen ? { height: "calc(100vh - 54px)" } : undefined;
  const panelStyle = fullscreen ? { height: "calc(100vh - 54px)" } : undefined;

  return (
    <div ref={shellRef} className={`my-8 border border-border ${fullscreen ? "bg-background" : "bg-card/20"}`} data-testid="qc-explorer">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => {
              if (autoPlay) {
                setAutoPlay(false);
              } else {
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
            title="From one qubit down the refrigerator to the honest scoreboard, start to finish"
            data-testid="qc-play"
          >
            {autoPlay ? "⏸ playing…" : "▶ play the journey"}
          </button>
          {(["journey", "explore"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setAutoPlay(false);
                setMode(m);
                setSelectedId(null);
              }}
              className={`font-mono text-[11px] uppercase tracking-wider px-3 py-1.5 border transition-colors ${
                mode === m
                  ? "border-foreground/60 text-foreground bg-secondary/40"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
              data-testid={`qc-mode-${m}`}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
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
            data-testid="qc-focus"
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
                <QuantumScene
                  glPower={glPower}
                  selectedId={selectedId}
                  highlightIds={highlightIds}
                  onSelect={(id) => {
                    setSelectedId(id);
                    if (id) {
                      setAutoPlay(false);
                      setMode("explore");
                    }
                  }}
                  labels={labels}
                  program={program}
                  focusStepId={mode === "journey" ? step?.id ?? null : null}
                />
              </Suspense>
            </SceneErrorBoundary>
          )}
          <p className="absolute bottom-2 left-3 font-mono text-[9px] text-muted-foreground/70 pointer-events-none">
            drag to orbit · scroll to zoom · click a station
          </p>

          {!panelOpen && (
            <div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 border border-border bg-background/85 backdrop-blur px-3 py-2 max-w-[92%]"
              data-testid="qc-overlay-nav"
            >
              <button
                type="button"
                disabled={mode === "journey" ? stepIdx === 0 : stationIdx <= 0}
                onClick={mode === "journey" ? journeyBack : stationBack}
                aria-label="Previous"
                className="font-mono text-[12px] px-3 py-1.5 border border-border text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                data-testid="qc-overlay-back"
              >
                ←
              </button>
              <div className="min-w-0 text-center">
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/70">
                  {mode === "journey"
                    ? `Step ${stepIdx + 1} of ${QC_JOURNEY.length}`
                    : stationIdx >= 0
                      ? `Station ${stationIdx + 1} of ${QC_STAGES.length}`
                      : "Explore"}
                </p>
                <p className="font-mono text-[11px] text-foreground truncate" data-testid="qc-overlay-title">
                  {mode === "journey"
                    ? QC_JOURNEY[stepIdx].title
                    : stationIdx >= 0
                      ? QC_STAGES[stationIdx].name
                      : "press → to begin the station walk"}
                </p>
              </div>
              <button
                type="button"
                disabled={mode === "journey" ? stepIdx === QC_JOURNEY.length - 1 : stationIdx >= QC_STAGES.length - 1}
                onClick={mode === "journey" ? journeyNext : stationNext}
                aria-label="Next"
                className="font-mono text-[12px] px-3 py-1.5 border border-foreground/50 text-foreground hover:bg-secondary/40 disabled:opacity-30 transition-colors"
                data-testid="qc-overlay-next"
              >
                →
              </button>
            </div>
          )}
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
            <div data-testid="qc-journey-panel">
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground/70">
                  Step {stepIdx + 1} of {QC_JOURNEY.length}
                  {" · "}
                  {QC_ACTS[qcStageById(step.stageId)!.act].label}
                </p>
              </div>
              <div className="flex gap-1 mb-4">
                {QC_JOURNEY.map((s, i) => (
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
                  onClick={journeyBack}
                  className="font-mono text-[11px] uppercase tracking-wider px-4 py-2 border border-border text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  disabled={stepIdx === QC_JOURNEY.length - 1}
                  onClick={journeyNext}
                  className="font-mono text-[11px] uppercase tracking-wider px-4 py-2 border border-foreground/50 text-foreground hover:bg-secondary/40 disabled:opacity-30 transition-colors"
                  data-testid="qc-next"
                >
                  Next →
                </button>
              </div>
              {stepIdx === QC_JOURNEY.length - 1 && (
                <p className="font-mono text-[10px] text-muted-foreground/70 mt-4">
                  That&apos;s the whole machine, honestly told. Now open{" "}
                  <span className="text-foreground">Explore</span> and click any station
                  for the mechanism and the primary source behind it.
                </p>
              )}
            </div>
          )}

          {mode === "explore" &&
            (selected ? (
              <div data-testid="qc-detail">
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground/70 mb-2">
                  Station {QC_STAGES.findIndex((s) => s.id === selected.id) + 1} of {QC_STAGES.length}
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
                  style={{ color: QC_ACTS[selected.act].color }}
                >
                  {QC_ACTS[selected.act].label}
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
                  const idx = QC_STAGES.findIndex((s) => s.id === selected.id);
                  return (
                    <div className="flex items-center gap-2 mt-4">
                      <button
                        type="button"
                        disabled={idx <= 0}
                        onClick={() => setSelectedId(QC_STAGES[idx - 1].id)}
                        className="font-mono text-[11px] uppercase tracking-wider px-4 py-2 border border-border text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                        data-testid="qc-station-back"
                      >
                        ← Back
                      </button>
                      <button
                        type="button"
                        disabled={idx >= QC_STAGES.length - 1}
                        onClick={() => setSelectedId(QC_STAGES[idx + 1].id)}
                        className="font-mono text-[11px] uppercase tracking-wider px-4 py-2 border border-foreground/50 text-foreground hover:bg-secondary/40 disabled:opacity-30 transition-colors"
                        data-testid="qc-station-next"
                      >
                        Next →
                      </button>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div data-testid="qc-explore-index">
                <h3 className="font-display text-lg font-bold text-foreground mb-1">Every station of the machine</h3>
                <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-4">
                  {QC_COUNTS.stages} stations across {QC_COUNTS.acts} acts. Click one here or in the 3D scene.
                </p>
                {(Object.keys(QC_ACTS) as QcAct[]).map((a) => (
                  <div key={a} className="mb-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: QC_ACTS[a].color }}>
                      {QC_ACTS[a].label}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {stagesInAct(a).map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSelectedId(s.id)}
                          className="font-mono text-[10px] px-2 py-1 border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
                          data-testid={`qc-chip-${s.id}`}
                        >
                          {s.short}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
