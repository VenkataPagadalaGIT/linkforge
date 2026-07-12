"use client";
/**
 * HvacExplorer — the interactive shell around HvacScene.
 *
 * Three modes: Explore (click parts, read what they do and how they fail),
 * Diagnose (pick observed symptoms, get ranked faults; suspects glow in 3D),
 * and Scenarios (real service calls replayed step-by-step — each step drives
 * the scene: highlights, system on/off, drain drip). The 3D canvas is
 * lazy-loaded and guarded, so no WebGL / no JS degrades to the guide's
 * static content rather than a broken page.
 */
import {
  Component,
  Suspense,
  lazy,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  COMPONENTS,
  FAULTS,
  PATHS,
  SCENARIOS,
  SYMPTOMS,
  SEVERITY_META,
  componentById,
  faultsForComponent,
  pathsForFault,
  rankFaults,
  scoreTier,
  symptomById,
  type HvacFault,
  type HvacPath,
  type HvacScenario,
} from "@/data/hvac";

const HvacScene = lazy(() => import("./HvacScene"));

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
        The 3D model needs WebGL, which this browser or device doesn't provide.
        Every component, symptom, scenario, and fault it visualizes is covered
        in the text and tables below.
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

/* ---------------------------------------------------------------- */

function PathBadge({ path }: { path: HvacPath }) {
  const meta = PATHS[path];
  return (
    <span
      className="font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 border inline-flex items-center gap-1.5"
      style={{ color: meta.color, borderColor: `${meta.color}55` }}
    >
      <span className="w-1.5 h-1.5 inline-block" style={{ background: meta.color }} />
      {meta.label.replace(" path", "").replace(" & control", "")}
    </span>
  );
}

function SeverityBadge({ severity }: { severity: HvacFault["severity"] }) {
  const meta = SEVERITY_META[severity];
  return (
    <span
      className="font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 border"
      style={{ color: meta.color, borderColor: `${meta.color}66` }}
    >
      {meta.label}
    </span>
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
        className={`w-7 h-3.5 border transition-colors relative ${
          value ? "border-foreground/60 bg-foreground/20" : "border-border bg-transparent"
        }`}
      >
        <span className={`absolute top-0.5 w-2 h-2 bg-foreground transition-all ${value ? "left-4" : "left-0.5"}`} />
      </button>
      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
    </label>
  );
}

function FaultCard({
  ranked,
  open,
  onToggle,
  onHover,
}: {
  ranked: { fault: HvacFault; score: number; matched: string[] };
  open: boolean;
  onToggle: () => void;
  onHover: (ids: string[] | null) => void;
}) {
  const { fault, score } = ranked;
  const pct = Math.round(Math.min(1, score) * 100);
  const tier = scoreTier(score);
  return (
    <div
      className="border border-border/70 hover:border-foreground/30 transition-colors"
      onMouseEnter={() => onHover(fault.components)}
      onMouseLeave={() => onHover(null)}
    >
      <button type="button" onClick={onToggle} className="w-full text-left p-3">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="font-mono text-xs text-foreground font-semibold">{fault.name}</span>
          <SeverityBadge severity={fault.severity} />
        </div>
        <div className="flex flex-wrap gap-1 mb-1.5">
          {pathsForFault(fault).map((p) => (
            <PathBadge key={p} path={p} />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="h-1 flex-1 bg-secondary/60">
            <div className="h-full bg-foreground/60" style={{ width: `${pct}%` }} />
          </div>
          <span className={`font-mono text-[10px] w-20 text-right ${tier.strong ? "text-foreground/90" : "text-muted-foreground/70"}`}>{tier.label}</span>
        </div>
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-3">
          <p className="font-mono text-[11px] text-muted-foreground leading-relaxed">{fault.cause}</p>
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/50 mb-1.5">
              Check in this order
            </p>
            <ol className="space-y-1.5">
              {fault.checks.map((c, i) => (
                <li key={i} className="font-mono text-[11px] text-muted-foreground leading-relaxed flex gap-2">
                  <span className="text-foreground/40">{i + 1}.</span>
                  <span>{c}</span>
                </li>
              ))}
            </ol>
          </div>
          <p className="font-mono text-[11px] text-foreground/85 leading-relaxed">
            <span className="text-muted-foreground/50 uppercase text-[9px] tracking-[0.2em] mr-2">Fix</span>
            {fault.fix}
          </p>
          <p className="font-mono text-[10px] text-muted-foreground/70">
            <span className="uppercase text-[9px] tracking-[0.2em] mr-2">Typical cost</span>
            {fault.costHint}
          </p>
          <p className="font-mono text-[10px] text-muted-foreground/50">
            Involves: {fault.components.map((c) => componentById(c)?.name ?? c).join(" · ")}
          </p>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- */

const HvacExplorer = () => {
  const [mode, setMode] = useState<"explore" | "diagnose" | "scenarios">("explore");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [openFault, setOpenFault] = useState<string | null>(null);
  const [hoverHighlight, setHoverHighlight] = useState<string[] | null>(null);
  const [running, setRunning] = useState(true);
  const [exploded, setExploded] = useState(false);
  const [labels, setLabels] = useState(true);
  const [scenario, setScenario] = useState<HvacScenario | null>(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [systemType, setSystemType] = useState<"any" | "gas" | "heatpump">("any");
  const [showReport, setShowReport] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);
  const webgl = useWebGLSupport();

  // ▶ Power-on demo: auto-plays the cooling start-up sequence step by step.
  const startDemo = () => {
    const seq = SCENARIOS.find((s) => s.id === "cooling-startup");
    if (!seq) return;
    setMode("scenarios");
    setSelectedId(null);
    setScenario(seq);
    setStepIdx(0);
    setAutoPlay(true);
  };

  useEffect(() => {
    if (!autoPlay || !scenario) return;
    if (stepIdx >= scenario.steps.length - 1) {
      setAutoPlay(false);
      return;
    }
    const t = setTimeout(() => setStepIdx((i) => i + 1), 7000);
    return () => clearTimeout(t);
  }, [autoPlay, stepIdx, scenario]);

  useEffect(() => {
    const onChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void shellRef.current?.requestFullscreen?.();
    }
  };

  const ranked = useMemo(
    () => rankFaults(symptoms, systemType === "any" ? undefined : systemType),
    [symptoms, systemType]
  );
  const emergencySelected = symptoms.some((id) => symptomById(id)?.emergency);
  const top = ranked.slice(0, 5);

  const step = mode === "scenarios" && scenario ? scenario.steps[stepIdx] : null;

  // What glows amber: the scenario step's parts; else hovered/opened/top fault.
  const highlightIds = useMemo(() => {
    if (step) return step.highlight;
    if (mode !== "diagnose") return [];
    if (hoverHighlight) return hoverHighlight;
    if (openFault) {
      const f = ranked.find((r) => r.fault.id === openFault);
      if (f) return f.fault.components;
    }
    return top.length > 0 ? top[0].fault.components : [];
  }, [step, mode, hoverHighlight, openFault, ranked, top]);

  const effectiveRunning = step ? step.running : running;
  const drip = step?.drip ?? false;
  const panWater = step?.panWater ?? 0;
  const floatTripped = step?.floatTripped ?? false;

  const toggleSymptom = (id: string) => {
    setOpenFault(null);
    setSymptoms((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  const openScenario = (s: HvacScenario) => {
    setAutoPlay(false);
    setScenario(s);
    setStepIdx(0);
    setSelectedId(null);
  };

  const selected = selectedId ? componentById(selectedId) : undefined;
  const selectedFaults = selectedId ? faultsForComponent(selectedId) : [];

  const [copied, setCopied] = useState(false);
  const reportText = useMemo(() => {
    const sysLabel =
      systemType === "gas" ? "Gas furnace + AC" : systemType === "heatpump" ? "Heat pump" : "Unknown / not sure";
    return [
      `HVAC INTAKE REPORT — ${new Date().toISOString().slice(0, 10)}`,
      `System type: ${sysLabel}`,
      `Nameplate (fill in): Make ______  Model # ______  Serial # ______  Refrigerant ______`,
      `  (furnace: sticker inside the blower door · AC/heat pump: side panel of the outdoor unit;`,
      `   serial date also determines 10-year parts-warranty status)`,
      ``,
      `REPORTED SYMPTOMS`,
      ...symptoms.map((id) => `- ${symptomById(id)?.label ?? id}`),
      ``,
      `RANKED PROBABLE CAUSES`,
      ...top.flatMap((r, i) => [
        `${i + 1}. ${r.fault.name} — ${scoreTier(r.score).label} — ${SEVERITY_META[r.fault.severity].label}`,
        `   System paths: ${pathsForFault(r.fault).map((p) => PATHS[p].label).join(", ")}`,
        `   Suspect parts: ${r.fault.components.map((c) => componentById(c)?.name ?? c).join(", ")}`,
        `   First check: ${r.fault.checks[0]}`,
        `   Typical cost: ${r.fault.costHint}`,
      ]),
      ``,
      `SAFETY: Refrigerant, gas, and line-voltage work require licensed professionals (EPA 608).`,
      `If gas is smelled or a CO alarm sounds: evacuate first, call after.`,
      ``,
      `Generated by the 3D HVAC Troubleshooter`,
      `https://venkatapagadala.com/guides/hvac-system-troubleshooting`,
    ].join("\n");
  }, [symptoms, top, systemType]);

  const copyIntakeReport = () => {
    setShowReport(true); // always render on screen — clipboard can silently fail on http/mobile
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(reportText).then(
        () => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        },
        () => undefined
      );
    }
  };

  const canvasHeightClass = fullscreen
    ? ""
    : "h-[380px] sm:h-[460px] lg:h-[540px]";
  const canvasStyle = fullscreen ? { height: "calc(100vh - 54px)" } : undefined;
  const panelStyle = fullscreen ? { height: "calc(100vh - 54px)" } : undefined;

  return (
    <div ref={shellRef} className={`my-8 border border-border ${fullscreen ? "bg-background" : "bg-card/20"}`}>
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => (autoPlay ? setAutoPlay(false) : startDemo())}
            className={`font-mono text-[11px] uppercase tracking-wider px-3 py-1.5 border transition-colors mr-2 ${
              autoPlay
                ? "border-emerald-400/60 text-emerald-300 bg-emerald-400/10"
                : "border-foreground/70 text-foreground bg-foreground/10 hover:bg-foreground/20"
            }`}
            title="Watch the whole system power on, from breaker to cold air"
          >
            {autoPlay ? "⏸ playing…" : "▶ power on"}
          </button>
          {(["explore", "diagnose", "scenarios"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setAutoPlay(false);
                setMode(m);
                setSelectedId(null);
                if (m !== "scenarios") setScenario(null);
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
          <Toggle label="Running" value={effectiveRunning} onChange={step ? () => undefined : setRunning} />
          <Toggle label="Exploded" value={exploded} onChange={setExploded} />
          <Toggle label="Labels" value={labels} onChange={setLabels} />
          <button
            type="button"
            onClick={toggleFullscreen}
            className="font-mono text-[10px] uppercase tracking-wider px-2.5 py-1.5 border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
            title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {fullscreen ? "✕ Exit" : "⛶ Fullscreen"}
          </button>
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[1.4fr_1fr]">
        {/* 3D canvas */}
        <div
          className={`${canvasHeightClass} relative min-w-0 overflow-hidden border-b lg:border-b-0 lg:border-r border-border`}
          style={canvasStyle}
        >
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
                <HvacScene
                  selectedId={selectedId}
                  highlightIds={highlightIds}
                  onSelect={(id) => {
                    setSelectedId(id);
                    if (id && mode !== "scenarios") setMode("explore");
                  }}
                  running={effectiveRunning}
                  exploded={exploded}
                  labels={labels}
                  drip={drip}
                  panWater={panWater}
                  floatTripped={floatTripped}
                />
              </Suspense>
            </SceneErrorBoundary>
          )}
          <p className="absolute bottom-2 left-3 font-mono text-[9px] text-muted-foreground/40 pointer-events-none">
            drag to orbit · scroll to zoom · click a part
          </p>
        </div>

        {/* side panel */}
        <div className="p-4 min-w-0 lg:h-[540px] lg:overflow-y-auto" style={panelStyle}>
          {mode === "explore" &&
            (selected ? (
              <div>
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
                <div className="flex items-center gap-2 mb-4">
                  <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground/50">
                    {selected.zone} unit
                  </p>
                  <PathBadge path={selected.path} />
                </div>
                <p className="font-mono text-xs text-foreground/85 leading-relaxed border-l-2 border-foreground/30 pl-3 mb-4">
                  {selected.role}
                </p>
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/50 mb-1.5">
                  When it's the problem
                </p>
                <p className="font-mono text-[11px] text-muted-foreground leading-relaxed mb-5">
                  {selected.failureSigns}
                </p>
                {selectedFaults.length > 0 && (
                  <>
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/50 mb-2">
                      Faults involving this part
                    </p>
                    <div className="space-y-1.5">
                      {selectedFaults.map((f) => (
                        <div
                          key={f.id}
                          className="flex items-center justify-between gap-2 border border-border/50 px-2.5 py-1.5"
                        >
                          <span className="font-mono text-[11px] text-muted-foreground">{f.name}</span>
                          <SeverityBadge severity={f.severity} />
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div>
                <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-4">
                  Click any part in the model — or in this list — to see what it does and how it fails.
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {COMPONENTS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedId(c.id)}
                      className="font-mono text-[10px] text-left text-muted-foreground hover:text-foreground border border-border/50 hover:border-foreground/30 px-2 py-1.5 transition-colors"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}

          {mode === "diagnose" && (
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/50 mb-2">
                My system is
              </p>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {(
                  [
                    ["gas", "Gas furnace + AC"],
                    ["heatpump", "Heat pump"],
                    ["any", "Not sure"],
                  ] as const
                ).map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setSystemType(val)}
                    className={`font-mono text-[10px] px-2 py-1.5 border transition-colors ${
                      systemType === val
                        ? "border-foreground/70 text-foreground bg-secondary/50"
                        : "border-border/60 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/50 mb-2">
                What are you seeing? Pick all that apply
              </p>
              <div className="flex flex-wrap gap-1.5 mb-5">
                {SYMPTOMS.map((s) => {
                  const on = symptoms.includes(s.id);
                  const danger = !!s.emergency;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleSymptom(s.id)}
                      title={s.hint}
                      className={`font-mono text-[10px] px-2 py-1.5 border transition-colors text-left ${
                        danger
                          ? on
                            ? "border-red-400 text-red-300 bg-red-500/15"
                            : "border-red-400/40 text-red-300/80 hover:border-red-400"
                          : on
                            ? "border-foreground/70 text-foreground bg-secondary/50"
                            : "border-border/60 text-muted-foreground hover:text-foreground hover:border-foreground/30"
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>

              {emergencySelected ? (
                <div className="border-2 border-red-500/70 bg-red-500/10 p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-red-300 mb-3">
                    ⚠ Stop — this is not a troubleshooting moment
                  </p>
                  <ol className="space-y-2 mb-3">
                    {[
                      "Leave the house NOW. Take everyone, including pets. Don't flip switches, don't unplug anything, don't start the car in an attached garage — a spark is the danger.",
                      "From OUTSIDE: gas smell → call your gas utility's emergency line (free, 24/7) or 911. CO alarm → call 911. Both will come out immediately.",
                      "Don't go back in until they clear the house. The furnace stays off until a professional finds the source.",
                    ].map((t, i) => (
                      <li key={i} className="font-mono text-[11px] text-red-100/90 leading-relaxed flex gap-2">
                        <span className="text-red-300 flex-shrink-0">{i + 1}.</span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ol>
                  <p className="font-mono text-[10px] text-red-200/60 leading-relaxed">
                    Once you're cleared and safe, come back — the fault library below covers what they
                    likely found (cracked heat exchanger, gas leak at a fitting).
                  </p>
                </div>
              ) : symptoms.length === 0 ? (
                <div>
                  <p className="font-mono text-[11px] text-muted-foreground/60 leading-relaxed mb-4">
                    Select symptoms above and ranked causes appear here, with suspect parts glowing
                    amber in the model.
                  </p>
                  <div className="border border-emerald-400/30 bg-emerald-400/5 p-4">
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-emerald-300/80 mb-2">
                      System completely dead? Five $0 checks first
                    </p>
                    <ol className="space-y-1.5">
                      {[
                        "Thermostat screen on? Batteries + mode (HEAT/COOL) + set point past room temp.",
                        "Breakers: AC and furnace are on separate ones. Fully OFF, then ON — once.",
                        "The 'light switch' on or near the furnace (garage/attic) — someone flipped it.",
                        "Blower door seated? Press it firmly inward after any filter change.",
                        "Water in the drain pan? A tripped float switch plays dead on purpose.",
                      ].map((t, i) => (
                        <li key={i} className="font-mono text-[11px] text-muted-foreground leading-relaxed flex gap-2">
                          <span className="text-emerald-300/70 flex-shrink-0">{i + 1}.</span>
                          <span>{t}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/50">
                      Most likely causes
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSymptoms([]);
                        setOpenFault(null);
                      }}
                      className="font-mono text-[10px] text-muted-foreground hover:text-foreground"
                    >
                      reset
                    </button>
                  </div>
                  <div className="space-y-2">
                    {top.map((r) => (
                      <FaultCard
                        key={r.fault.id}
                        ranked={r}
                        open={openFault === r.fault.id}
                        onToggle={() => setOpenFault(openFault === r.fault.id ? null : r.fault.id)}
                        onHover={setHoverHighlight}
                      />
                    ))}
                  </div>
                  <p className="font-mono text-[10px] text-muted-foreground/50 leading-relaxed mt-3">
                    None of these fit? Zoned systems (dampers), mini-splits, whole-home humidifiers,
                    and standing-pilot furnaces aren't modeled yet — for those, copy the report below
                    and book a pro intake.
                  </p>
                  <button
                    type="button"
                    onClick={copyIntakeReport}
                    className="mt-4 w-full font-mono text-[10px] uppercase tracking-wider px-3 py-2 border border-foreground/40 text-foreground hover:bg-secondary/40 transition-colors"
                  >
                    {copied ? "✓ Copied — paste into your work order / email" : "⧉ Copy intake report"}
                  </button>
                  {showReport && (
                    <pre className="mt-3 border border-border/60 bg-card/40 p-3 font-mono text-[10px] text-muted-foreground leading-relaxed whitespace-pre-wrap max-h-56 overflow-y-auto select-all">
                      {reportText}
                    </pre>
                  )}
                  <p className="font-mono text-[10px] text-muted-foreground/50 leading-relaxed mt-3">
                    The report packages your symptoms, ranked causes, suspect parts, and costs — ready to
                    hand to a technician or attach to a service request. Refrigerant, gas, and high
                    voltage are licensed-pro work; gas smell or CO alarm means leave first, call after.
                  </p>
                </>
              )}
            </div>
          )}

          {mode === "scenarios" &&
            (!scenario ? (
              <div>
                <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-4">
                  Start with how the machine is <em>supposed</em> to run — then watch real failures break
                  that chain. Each step lights up the parts involved and drives the model.
                </p>
                {(
                  [
                    ["How it's supposed to work", SCENARIOS.filter((s) => s.kind === "healthy")],
                    ["Real failures, replayed", SCENARIOS.filter((s) => s.kind !== "healthy")],
                  ] as const
                ).map(([groupTitle, group]) => (
                  <div key={groupTitle} className="mb-5">
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/50 mb-2">
                      {groupTitle}
                    </p>
                    <div className="space-y-2">
                      {group.map((s) => {
                        const fault = FAULTS.find((f) => f.id === s.faultId);
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => openScenario(s)}
                            className="block w-full text-left border border-border/70 hover:border-foreground/40 p-3 transition-colors"
                          >
                            <p className="font-mono text-xs text-foreground font-semibold mb-1.5">{s.title}</p>
                            {fault && (
                              <div className="flex flex-wrap gap-1 mb-1.5">
                                {pathsForFault(fault).map((p) => (
                                  <PathBadge key={p} path={p} />
                                ))}
                              </div>
                            )}
                            <p className="font-mono text-[11px] text-muted-foreground leading-relaxed">
                              {s.symptomSummary}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between gap-2 mb-4">
                  <p className="font-mono text-xs text-foreground font-semibold leading-relaxed">
                    {scenario.title}
                  </p>
                  <button
                    type="button"
                    onClick={() => { setAutoPlay(false); setScenario(null); }}
                    className="font-mono text-[10px] text-muted-foreground hover:text-foreground whitespace-nowrap"
                  >
                    ✕ all scenarios
                  </button>
                </div>

                {/* step progress */}
                <div className="flex items-center gap-1 mb-4">
                  {scenario.steps.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => { setAutoPlay(false); setStepIdx(i); }}
                      className={`h-1 flex-1 transition-colors ${
                        i <= stepIdx ? "bg-foreground/70" : "bg-secondary/60"
                      }`}
                      aria-label={`Step ${i + 1}`}
                    />
                  ))}
                </div>

                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/50 mb-1.5">
                  Step {stepIdx + 1} of {scenario.steps.length}
                  {scenario.steps[stepIdx].running ? " · system running" : " · system OFF"}
                  {scenario.steps[stepIdx].drip ? " · drain dripping" : ""}
                </p>
                <h4 className="font-display text-base font-semibold text-foreground mb-2">
                  {scenario.steps[stepIdx].title}
                </h4>
                <p className="font-mono text-[11px] text-muted-foreground leading-relaxed mb-4">
                  {scenario.steps[stepIdx].text}
                </p>

                <div className="flex items-center gap-2 mb-5">
                  <button
                    type="button"
                    disabled={stepIdx === 0}
                    onClick={() => { setAutoPlay(false); setStepIdx((i) => Math.max(0, i - 1)); }}
                    className="font-mono text-[10px] uppercase tracking-wider px-3 py-1.5 border border-border text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    ← Back
                  </button>
                  {stepIdx < scenario.steps.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => { setAutoPlay(false); setStepIdx((i) => Math.min(scenario.steps.length - 1, i + 1)); }}
                      className="font-mono text-[10px] uppercase tracking-wider px-3 py-1.5 border border-foreground/60 text-foreground bg-secondary/40 hover:bg-secondary/60 transition-colors"
                    >
                      Next →
                    </button>
                  ) : (
                    <span className="font-mono text-[10px] uppercase tracking-wider px-3 py-1.5 border border-emerald-400/40 text-emerald-300">
                      {scenario.kind === "healthy" ? "Cycle complete" : "Solved"}
                    </span>
                  )}
                </div>

                {stepIdx === scenario.steps.length - 1 && (
                  <div className="border border-foreground/20 bg-foreground/[0.03] p-4">
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/60 mb-2">
                      {scenario.kind === "healthy" ? "The takeaway" : "The verdict"}
                    </p>
                    <p className="font-mono text-[11px] text-foreground/90 leading-relaxed">
                      {scenario.verdict}
                    </p>
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default HvacExplorer;
