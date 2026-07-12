"use client";
/**
 * LlmExplorer — the interactive shell around LlmScene.
 *
 * Two ways in: Journey (a guided, auto-playable walkthrough of one token's
 * life — the "watch it think" mode) and Explore (click any stage, read what
 * it does, the real numbers, and what changed in 2025-2026). Journey steps
 * drive the scene: highlights, particle flow segment, training-row focus.
 * Same resilience contract as HvacExplorer: lazy 3D, WebGL probe, error
 * boundary — no WebGL degrades to the guide's static content.
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
  JOURNEY,
  STAGES,
  ZONES,
  stageById,
  stagesInZone,
  LLM_COUNTS,
  type LlmZone,
} from "@/data/llm";

const LlmScene = lazy(() => import("./LlmScene"));

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

function useWebGLSupport() {
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => {
    try {
      const c = document.createElement("canvas");
      setOk(!!(c.getContext("webgl2") || c.getContext("webgl")));
    } catch {
      setOk(false);
    }
  }, []);
  return ok;
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
            value ? "left-[18px] bg-foreground" : "left-[2px] bg-muted-foreground/60"
          }`}
        />
      </button>
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
    </label>
  );
}

/* ---------------------------------------------------------------- */

type Mode = "journey" | "explore";
const AUTOPLAY_MS = 9000;

export default function LlmExplorer() {
  const webgl = useWebGLSupport();
  const shellRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>("journey");
  const [stepIdx, setStepIdx] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [running, setRunning] = useState(true);
  const [labels, setLabels] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);

  const step = mode === "journey" ? JOURNEY[stepIdx] : null;
  const selected = selectedId ? stageById(selectedId) : null;

  // autoplay: advance through the journey like a video
  useEffect(() => {
    if (!autoPlay) return;
    const t = setInterval(() => {
      setStepIdx((i) => {
        if (i >= JOURNEY.length - 1) {
          setAutoPlay(false);
          return i;
        }
        return i + 1;
      });
    }, AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [autoPlay]);

  // fullscreen via the browser API, falling back to a fixed shell
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

  const highlightIds = step ? step.highlightIds : selectedId ? [selectedId] : [];
  const flow = step ? step.flow : null;
  const training = step?.training ?? (selected ? selected.zone === "training" : false);

  const canvasHeightClass = fullscreen ? "" : "h-[380px] sm:h-[460px] lg:h-[540px]";
  const canvasStyle = fullscreen ? { height: "calc(100vh - 54px)" } : undefined;
  const panelStyle = fullscreen ? { height: "calc(100vh - 54px)" } : undefined;

  return (
    <div ref={shellRef} className={`my-8 border border-border ${fullscreen ? "bg-background" : "bg-card/20"}`} data-testid="llm-explorer">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-1">
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
                ? "border-emerald-400/60 text-emerald-300 bg-emerald-400/10"
                : "border-foreground/70 text-foreground bg-foreground/10 hover:bg-foreground/20"
            }`}
            title="Watch one token get generated, start to finish"
            data-testid="llm-play"
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
            >
              {m}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <Toggle label="Data flow" value={running} onChange={setRunning} />
          <Toggle label="Labels" value={labels} onChange={setLabels} />
          <button
            type="button"
            onClick={toggleFullscreen}
            className="font-mono text-[10px] uppercase tracking-[0.2em] px-3 py-1.5 border border-border text-muted-foreground hover:text-foreground transition-colors"
          >
            {fullscreen ? "✕ exit" : "⛶ fullscreen"}
          </button>
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[1.4fr_1fr]">
        {/* 3D canvas */}
        <div className={`${canvasHeightClass} relative border-b lg:border-b-0 lg:border-r border-border`} style={canvasStyle}>
          {webgl === false ? (
            <SceneFallback />
          ) : (
            <SceneErrorBoundary>
              <Suspense
                fallback={
                  <div className="h-full flex items-center justify-center">
                    <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/50 animate-pulse">
                      Loading 3D model…
                    </p>
                  </div>
                }
              >
                <LlmScene
                  selectedId={selectedId}
                  highlightIds={highlightIds}
                  onSelect={(id) => {
                    setSelectedId(id);
                    if (id) {
                      setAutoPlay(false);
                      setMode("explore");
                    }
                  }}
                  running={running}
                  labels={labels}
                  training={training}
                  flow={flow}
                />
              </Suspense>
            </SceneErrorBoundary>
          )}
          <p className="absolute bottom-2 left-3 font-mono text-[9px] text-muted-foreground/40 pointer-events-none">
            drag to orbit · scroll to zoom · click a stage
          </p>
        </div>

        {/* side panel */}
        <div className="p-4 lg:h-[540px] lg:overflow-y-auto" style={panelStyle}>
          {mode === "journey" && step && (
            <div data-testid="llm-journey-panel">
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground/60">
                  Step {stepIdx + 1} of {JOURNEY.length}
                  {step.training ? " · training" : " · inference"}
                </p>
              </div>
              {/* progress bars */}
              <div className="flex gap-1 mb-4">
                {JOURNEY.map((s, i) => (
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
                  disabled={stepIdx === JOURNEY.length - 1}
                  onClick={() => { setAutoPlay(false); setStepIdx((i) => Math.min(JOURNEY.length - 1, i + 1)); }}
                  className="font-mono text-[11px] uppercase tracking-wider px-4 py-2 border border-foreground/50 text-foreground hover:bg-secondary/40 disabled:opacity-30 transition-colors"
                  data-testid="llm-next"
                >
                  Next →
                </button>
              </div>
              {stepIdx === JOURNEY.length - 1 && (
                <p className="font-mono text-[10px] text-muted-foreground/60 mt-4">
                  That&apos;s the whole machine. Switch to <span className="text-foreground">Explore</span> and click any
                  part for the deep dive — real parameter counts, the 2026 frontier, the works.
                </p>
              )}
            </div>
          )}

          {mode === "explore" &&
            (selected ? (
              <div data-testid="llm-detail">
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
                  style={{ color: ZONES[selected.zone].color }}
                >
                  {ZONES[selected.zone].label}
                </p>
                <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-4">{selected.story}</p>
                <div className="border border-border/60 p-3 mb-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 mb-1.5">How it works</p>
                  <p className="font-mono text-[11px] text-muted-foreground leading-relaxed">{selected.tech}</p>
                </div>
                <div className="border border-border/60 p-3 mb-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 mb-1.5">Analogy</p>
                  <p className="font-mono text-[11px] text-muted-foreground leading-relaxed italic">{selected.analogy}</p>
                </div>
                <table className="w-full mb-3">
                  <tbody>
                    {selected.numbers.map((n) => (
                      <tr key={n.label} className="border-b border-border/40">
                        <td className="py-1.5 pr-2 font-mono text-[10px] text-muted-foreground/60">{n.label}</td>
                        <td className="py-1.5 font-mono text-[11px] text-foreground text-right">{n.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {selected.now && (
                  <div className="border border-amber-400/30 bg-amber-400/[0.04] p-3">
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-300/80 mb-1.5">2025-2026</p>
                    <p className="font-mono text-[11px] text-muted-foreground leading-relaxed">{selected.now}</p>
                  </div>
                )}
              </div>
            ) : (
              <div data-testid="llm-explore-index">
                <h3 className="font-display text-lg font-bold text-foreground mb-1">Every stage of the machine</h3>
                <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-4">
                  {LLM_COUNTS.stages} stages across {LLM_COUNTS.zones} zones. Click one here or in the 3D scene.
                </p>
                {(Object.keys(ZONES) as LlmZone[]).map((z) => (
                  <div key={z} className="mb-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: ZONES[z].color }}>
                      {ZONES[z].label}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {stagesInZone(z).map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSelectedId(s.id)}
                          className="font-mono text-[10px] px-2 py-1 border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
                          data-testid={`llm-chip-${s.id}`}
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
