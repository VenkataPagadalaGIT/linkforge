"use client";
import { useWebGL } from "@/lib/webgl";
/**
 * JevExplorer: the interactive shell around JevScene.
 *
 * Journey (a guided, auto-playable walkthrough of one support ticket through
 * the decision bench and then through an agent harness) and Explore (click
 * any station for its story, mechanism, analogy, the numbers and the
 * source). Same resilience contract as the LLM explorer: lazy 3D, WebGL
 * probe, error boundary. With no WebGL, the guide's text and tables carry
 * everything the scene shows; a poster still sits under the canvas so a
 * reader without JavaScript sees the bench rather than a hole.
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
  KINDS,
  JEV_COUNTS,
  stationById,
  stationsOfKind,
  type JevKind,
} from "@/data/jev";

const JevScene = lazy(() => import("./JevScene"));

export const JEV_POSTER = "/posters/what-is-jev.jpg";
export const JEV_POSTER_ALT =
  "Conceptual Jev workflow as a 3D bench: supplied evidence on the left, the Jev model stamping typed answers (Choice, Score, Noul), the application's rules gate routing the ticket, and the generative model at the next desk.";

class SceneErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <div className="h-full flex flex-col items-center justify-center gap-4 p-8 text-center">
          <p className="font-mono text-xs text-muted-foreground leading-relaxed max-w-sm">The 3D model hit a rendering error.</p>
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
        The 3D model needs WebGL, which this browser or device does not provide. Every station it shows is described in
        the text and tables below.
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
        className={`w-8 h-4 border transition-colors relative ${value ? "border-foreground/70 bg-foreground/20" : "border-border bg-transparent"}`}
      >
        <span className={`absolute top-[2px] w-2.5 h-2.5 transition-all ${value ? "left-[18px] bg-foreground" : "left-[2px] bg-muted-foreground/70"}`} />
      </button>
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
    </label>
  );
}

type Mode = "journey" | "explore";
const AUTOPLAY_MS = 10000;
const DEFAULT_PANEL = 0.42;
const MAX_PANEL = 0.6;
/** Below this share the panel snaps off entirely: no unreadable sliver. */
const SNAP_OFF = 0.12;

export default function JevExplorer() {
  const { ok: webgl, power: glPower } = useWebGL();
  const shellRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>("journey");
  const [stepIdx, setStepIdx] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [running, setRunning] = useState(true);
  const [labels, setLabels] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  // The text panel's share of the width on large screens. Drag the divider to
  // slide the text off (0) for the whole scene, or back in; the focus button
  // does the same in one click. The last open width is remembered.
  const [panelFrac, setPanelFrac] = useState(DEFAULT_PANEL);
  const [dragging, setDragging] = useState(false);
  const lastOpen = useRef(DEFAULT_PANEL);
  const panelOpen = panelFrac > 0;
  const setPanelOpen = (open: boolean) => {
    if (open) setPanelFrac(lastOpen.current || DEFAULT_PANEL);
    else {
      if (panelFrac > 0) lastOpen.current = panelFrac;
      setPanelFrac(0);
    }
  };
  const startDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const shell = shellRef.current;
    if (!shell) return;
    e.preventDefault();
    const rect = shell.getBoundingClientRect();
    setDragging(true);
    const move = (ev: PointerEvent) => {
      let f = 1 - (ev.clientX - rect.left) / rect.width;
      f = Math.max(0, Math.min(MAX_PANEL, f));
      if (f < SNAP_OFF) f = 0;
      if (f > 0) lastOpen.current = f;
      setPanelFrac(f);
    };
    const up = () => {
      setDragging(false);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };
  const keyDrag = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = 0.05;
    if (e.key === "ArrowLeft") setPanelFrac((f) => Math.min(MAX_PANEL, (f || 0) + step));
    else if (e.key === "ArrowRight") setPanelFrac((f) => (f - step < SNAP_OFF ? 0 : f - step));
    else if (e.key === "Home") setPanelOpen(false);
    else if (e.key === "End") setPanelFrac(MAX_PANEL);
    else if (e.key === "Enter" || e.key === " ") setPanelOpen(!panelOpen);
    else return;
    e.preventDefault();
  };

  useEffect(() => {
    const nudge = () => window.dispatchEvent(new Event("resize"));
    const raf = requestAnimationFrame(nudge);
    const timers = [120, 320, 640].map((ms) => window.setTimeout(nudge, ms));
    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
    };
  }, [panelOpen]);

  const step = mode === "journey" ? JOURNEY[stepIdx] : null;
  const selected = selectedId ? stationById(selectedId) : null;

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
  const act2 = step ? step.act === 2 : selected ? selected.act === 2 : false;

  const canvasHeightClass = fullscreen ? "" : "h-[380px] sm:h-[460px] lg:h-[540px]";
  const canvasStyle = fullscreen ? { height: "calc(100vh - 54px)" } : undefined;
  const panelStyle = fullscreen ? { height: "calc(100vh - 54px)" } : undefined;

  return (
    <div ref={shellRef} className={`my-8 border border-border ${fullscreen ? "bg-background" : "bg-card/20"}`} data-testid="jev-explorer">
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
                ? "border-emerald-400/60 text-emerald-700 dark:text-emerald-300 bg-emerald-400/10"
                : "border-foreground/70 text-foreground bg-foreground/10 hover:bg-foreground/20"
            }`}
            title="Follow one ticket through the bench, start to finish"
            data-testid="jev-play"
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
                mode === m ? "border-foreground/60 text-foreground bg-secondary/40" : "border-border text-muted-foreground hover:text-foreground"
              }`}
              data-testid={`jev-mode-${m}`}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Toggle label="Data flow" value={running} onChange={setRunning} />
          <Toggle label="Labels" value={labels} onChange={setLabels} />
          <button
            type="button"
            onClick={() => setPanelOpen(!panelOpen)}
            title={panelOpen ? "Slide the text off for the whole scene (or drag the divider)" : "Slide the text back in"}
            className={`font-mono text-[10px] uppercase tracking-[0.2em] px-3 py-1.5 border transition-colors ${
              panelOpen ? "border-border text-muted-foreground hover:text-foreground" : "border-foreground/50 text-foreground bg-foreground/10"
            }`}
            data-testid="jev-focus"
          >
            {panelOpen ? "⤢ slide text off" : "☰ slide text in"}
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
        className={`lg:grid ${dragging ? "select-none" : "transition-[grid-template-columns] duration-300 ease-in-out"}`}
        style={{ gridTemplateColumns: `minmax(0,${(1 - panelFrac).toFixed(3)}fr) minmax(0,${panelFrac.toFixed(3)}fr)` }}
      >
        <div
          className={`${canvasHeightClass} relative min-w-0 overflow-hidden border-b lg:border-b-0 ${panelOpen ? "lg:border-r" : ""} border-border`}
          style={canvasStyle}
        >
          {/* The poster sits under the opaque canvas: the first frame covers it,
              and a reader whose JavaScript never ran still sees the bench. */}
          <img src={JEV_POSTER} alt={JEV_POSTER_ALT} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0">
            {webgl === false ? (
              <SceneFallback />
            ) : webgl === null ? (
              <div className="h-full w-full" aria-busy="true" />
            ) : (
              <SceneErrorBoundary>
                <Suspense
                  fallback={
                    <div className="h-full flex items-center justify-center">
                      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70 animate-pulse">Loading 3D model…</p>
                    </div>
                  }
                >
                  <JevScene
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
                    running={running}
                    labels={labels}
                    act2={act2}
                    flow={flow}
                    focusStepId={mode === "journey" ? step?.id ?? null : null}
                  />
                </Suspense>
              </SceneErrorBoundary>
            )}
          </div>
          {/* The divider: drag it to slide the text off or back in. Keyboard:
              arrows resize, Home slides it off, End opens it wide, Enter toggles. */}
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Slide the text panel in or out"
            aria-valuemin={0}
            aria-valuemax={Math.round(MAX_PANEL * 100)}
            aria-valuenow={Math.round(panelFrac * 100)}
            tabIndex={0}
            onPointerDown={startDrag}
            onKeyDown={keyDrag}
            onDoubleClick={() => setPanelOpen(!panelOpen)}
            data-testid="jev-splitter"
            className="hidden lg:flex absolute top-0 right-0 h-full w-4 cursor-col-resize items-center justify-end touch-none z-10 group outline-none focus-visible:bg-foreground/10"
          >
            <div className={`h-16 w-1.5 mr-[3px] flex flex-col items-center justify-center gap-1 border border-border bg-background/80 transition-colors ${dragging ? "border-foreground/70" : "group-hover:border-foreground/50"}`}>
              {[0, 1, 2].map((i) => (
                <span key={i} className="block w-[2px] h-[2px] bg-muted-foreground/70" />
              ))}
            </div>
            {!panelOpen && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground border border-border bg-background/85 px-2 py-1 whitespace-nowrap group-hover:text-foreground">
                ‹ slide text in
              </span>
            )}
          </div>
          <p className="absolute bottom-2 left-3 font-mono text-[9px] text-muted-foreground/70 pointer-events-none">
            drag to orbit · scroll to zoom · click a station · drag the divider to slide the text
          </p>
          <p className="absolute bottom-2 right-3 font-mono text-[9px] text-muted-foreground/70 pointer-events-none flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5" style={{ background: "#f59e0b" }} aria-hidden="true" />
            illustration, not a live Jev request
          </p>
        </div>

        <div
          data-testid="jev-explorer-panel"
          className={`min-w-0 transition-opacity duration-200 ${panelOpen ? "p-4 lg:h-[540px] lg:overflow-y-auto" : "h-0 lg:h-[540px] overflow-hidden opacity-0 pointer-events-none"}`}
          style={panelOpen ? panelStyle : undefined}
        >
          {mode === "journey" && step && (
            <div data-testid="jev-journey-panel">
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground/70 mb-2">
                Step {stepIdx + 1} of {JOURNEY.length} · {step.act === 1 ? "the decision bench" : "inside an agent harness"}
              </p>
              <div className="flex gap-1 mb-4">
                {JOURNEY.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    aria-label={s.title}
                    onClick={() => { setAutoPlay(false); setStepIdx(i); }}
                    className={`h-[3px] flex-1 transition-colors ${i < stepIdx ? "bg-foreground/60" : i === stepIdx ? "bg-emerald-400" : "bg-border"}`}
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
                  data-testid="jev-next"
                >
                  Next →
                </button>
              </div>
              {stepIdx === JOURNEY.length - 1 && (
                <p className="font-mono text-[10px] text-muted-foreground/70 mt-4">
                  That is the whole bench. Switch to <span className="text-foreground">Explore</span> and click any station for the
                  mechanism, the numbers and the source behind it.
                </p>
              )}
            </div>
          )}

          {mode === "explore" &&
            (selected ? (
              <div data-testid="jev-detail">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="font-display text-lg font-bold text-foreground">{selected.name}</h3>
                  <button type="button" onClick={() => setSelectedId(null)} className="font-mono text-[10px] text-muted-foreground hover:text-foreground">
                    ✕ close
                  </button>
                </div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] mb-3" style={{ color: KINDS[selected.kind].color }}>
                  {KINDS[selected.kind].label}
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
                        <td className="py-1.5 pr-2 font-mono text-[10px] text-muted-foreground/70 align-top">{n.label}</td>
                        <td className="py-1.5 font-mono text-[11px] text-foreground text-right">{n.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="border border-border/60 bg-card/30 p-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-1.5">Source</p>
                  {selected.source ? (
                    <a
                      href={selected.source.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[11px] text-foreground underline decoration-border hover:decoration-foreground transition-colors"
                    >
                      {selected.source.label} ↗
                    </a>
                  ) : (
                    <p className="font-mono text-[11px] text-muted-foreground leading-relaxed">An illustration in this guide; no Jev request was made.</p>
                  )}
                </div>
              </div>
            ) : (
              <div data-testid="jev-explore-index">
                <h3 className="font-display text-lg font-bold text-foreground mb-1">Every station on the bench</h3>
                <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-4">
                  {JEV_COUNTS.stations} stations across {JEV_COUNTS.kinds} kinds of responsibility. Click one here or in the scene.
                </p>
                {(Object.keys(KINDS) as JevKind[]).map((k) => (
                  <div key={k} className="mb-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: KINDS[k].color }}>
                      {KINDS[k].label}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {stationsOfKind(k).map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSelectedId(s.id)}
                          className="font-mono text-[10px] px-2 py-1 border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
                          data-testid={`jev-chip-${s.id}`}
                        >
                          {s.short}
                          {s.act === 2 && <span className="ml-1 text-muted-foreground/70">· act 2</span>}
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
