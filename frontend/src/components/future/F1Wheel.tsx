/**
 * F1Wheel: a generic Formula-1 style cockpit rim for the drive HUD.
 *
 * PRESENTATIONAL. It imports nothing from the scene, nothing from
 * react-three-fiber and nothing from three. Discrete human decisions arrive
 * as props; continuous chassis state arrives once per animation frame through
 * the imperative handle, so a car at full slip costs zero React renders. That
 * split is the whole design: React owns what a person changed a few times a
 * second, refs own what the physics changed 60 times a second, and the two
 * never write the same pixel.
 *
 * The rim rotates. The centre plate does not. A child counter-rotated by the
 * same angle stays upright but its POSITION still orbits, so the hit targets
 * would swim under the finger; instead the plate is a separate fixed layer
 * carrying the console, the four caps and both dials, which is also what
 * makes the assembly read as one column-mounted module rather than three
 * floating boxes.
 *
 * Nothing on that fixed layer is allowed to sit over the moulded grips. The
 * grips are the only part of the object that moves visibly with the steering
 * at rest, so an opaque panel parked on top of them turned the whole thing
 * back into a ring around a slab, and made the grips look like they were
 * sliding out from under the dash every time the player steered. The caps
 * therefore live on the console face flanking the display, exactly where a
 * real rim puts them, and the grips are narrower so there is room.
 *
 * Every mark here is either structure (fasteners, vents, weave, seams, grip
 * ridges) or a live readout. There are no decorative rotaries with invented
 * legends and no ambient shimmer: one fake gauge poisons the honest ones, and
 * the grip dial and the GRIP/LOOSE/SLIP ladder are the only two things in this
 * cockpit that teach a driver where the limit is.
 *
 * IP: this rim carries no manufacturer shield, badge, crest or wordmark, and
 * no peripheral-maker name in any label, class name, ref name or comment. The
 * butterfly silhouette, carbon twill, rev-LED strip, centre LCD and coloured
 * button pods are functional racing-rim vocabulary shared across every
 * builder; they are not any one company's trade dress. The only mark permitted
 * anywhere on the assembly is the site's own VP_ etch.
 */

"use client";

import * as React from "react";
import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from "react";

/** Which way the accelerator points. NOT the gearbox: the chassis owns the
 *  real gear and the LCD echoes that, never this. */
export type WheelDir = "FRONT" | "BACK";

/** Chassis state the rim displays. All primitives. The caller owns ONE
 *  instance of this object and mutates it in place before each sync(), so the
 *  per-frame path allocates nothing on either side of the boundary. */
export interface F1WheelFrame {
  /** Rim angle in DEGREES, already computed by the caller as
   *  (rig.steer / rig.spec.SIG_HI) * SWEEP_DEG. Signed, +/- SWEEP_DEG. */
  rimDeg: number;
  /** Raw steer REQUEST in degrees on the same scale, before the rate limit and
   *  the speed-faded lock. Drives the ghost tick, which is how a driver sees
   *  that the car is refusing input rather than that the HUD is lagging. */
  reqDeg: number;
  /** Speedometer value in km/h, already smoothed by the caller so this readout
   *  and the telemetry panel cannot disagree by a frame. */
  kmh: number;
  /** Real gearbox state, not the request. */
  gear: "D" | "N" | "R";
  /** 0..1 rev-strip fill. The caller must divide by the BOOSTED VMAX, not by
   *  spec.VMAX, or the strip saturates the instant BOOSTER is pressed. */
  rev: number;
  /** True while the chassis is against its speed clamp and not boosting.
   *  Blinks the whole strip. A real state, not decoration. */
  limiter: boolean;
  /** 0..1 rear-axle saturation. Drives the GRIP dial and the state line. */
  gripLoss: number;
  /** 0..1 drift heat. Drives the LCD bar. */
  driftHeat: number;
  /** 0..1 remaining booster charge. Drives the BOOST dial and the meter. */
  boost: number;
  /** Seconds of hard lockout remaining after a full drain; 0 when armed. */
  boostCool: number;
  /** True while the booster is ACTUALLY applying force (held AND charged AND
   *  not locked out). Distinct from the `boosting` prop, which is only the
   *  button being held. */
  boostActive: boolean;
  /** True only once the autopilot owns the lane. Distinct from the `auto`
   *  prop: the gap between them is the handoff blend, and it is shown. */
  autoActive: boolean;
  /** 1 while the handbrake is armed. */
  hb: 0 | 1;
  /** Monotonic seconds, for the override telltale's hold. Never used to fake a
   *  measurement. */
  t: number;
}

export interface F1WheelHandle {
  /**
   * Called exactly once per animation frame from the caller's existing rAF
   * loop. Does not allocate meaningfully, does not setState and does not read
   * layout. Writes at most one custom property per rotating layer plus any
   * LED, dial or text node whose quantized value actually changed.
   */
  sync(f: F1WheelFrame): void;
}

export interface F1WheelProps {
  /** Latched throttle direction. Renders as REQUESTED; the ENGAGED ring is
   *  driven separately from frame.gear inside sync(). */
  dir: WheelDir;
  onDir: (d: WheelDir) => void;

  /** Momentary. True only while the control is physically held. The caller
   *  must pair onPointerUp AND onPointerLeave or it latches. */
  boosting: boolean;
  onBoosting: (held: boolean) => void;

  /** Latched autopilot REQUEST. Engagement is confirmed by frame.autoActive. */
  auto: boolean;
  onAuto: (on: boolean) => void;

  /** Steering. The rim writes a normalised -1..1 value on drag and 0 on
   *  release. It never writes throttle or brake: one writer per field. */
  onSteer: (st: number) => void;

  /** Any manual input must be able to drop autopilot. Called on drag start and
   *  on any button press while `auto` is true. */
  onOverride: () => void;

  /** Set false until the booster / autopilot rig fields are published. Renders
   *  the control explicitly disabled rather than animating against a field
   *  that is always zero. Default true. */
  boostReady?: boolean;
  autoReady?: boolean;

  /** Phone / narrow reflow. The caller computes this from ONE matchMedia
   *  listener; it changes at most on resize, never per frame. Default false. */
  compact?: boolean;

  /** CSS px of horizontal drag for full lock. Default 104 on a fine pointer,
   *  72 on a coarse one. The caller measures pointer coarseness once. */
  steerPx?: number;

  /** Kills the limiter blink and the AUTO pulse. Colour state changes survive.
   *  Wire to the existing usePrefersReducedMotion(). */
  stillMotion?: boolean;

  /** Reset display refs and clear the drag when the machine changes. */
  machineId: string;
}

/* ---------------------------------------------------------------------- */
/* Constants                                                               */
/* ---------------------------------------------------------------------- */

/** Identical to the sweep the old rim used, so the rate limit, the speed-faded
 *  lock and the countersteer assist read exactly as they did before. */
const SWEEP_DEG = 120;
const STEER_PX_FINE = 104;
const ROT_GATE = 0.15;
const DIAL_GATE = 2;
/** Below this much requested lock the ghost tick would sit under the index
 *  stripe and read as a rendering seam, so it is simply invisible. */
const GHOST_MIN_DEG = 0.02 * SWEEP_DEG;
const OVERRIDE_HOLD = 0.6;

/** Single light origin. Every cap, knob and bevel gradient in this component
 *  uses this literal so the key light cannot drift between parts, which is the
 *  cheapest thing that separates a rendered object from a pile of CSS. */
const KEY = "32% 26%";

const LED_N_WIDE = 15;
const LED_N_COMPACT = 11;

const C_TEXT = "#cfe4ff";
const C_SEL = "#e6f0ff";
const C_MUTE = "#9a9aa3";
const C_DIM = "#6b6b74";
const C_STEEL = "#9fb4d0";
const C_AMBER = "#d9a860";
const C_WARM = "#e2c07e";
const C_RED = "#e2573e";
const C_SALMON = "#e2937e";
const C_GREEN = "#9fd0b4";
const C_BORDER = "#2c2e35";
const C_LINE = "#3a3d44";
const C_HUB = "#23252b";
const C_EDGE = "#4a4e56";
const C_OCC = "#0a0a0b";

/** Flat-top / flat-bottom annulus with two thumb openings. Every point lies
 *  within r 116 of (120, 116), which is the invariant that lets the rim sweep
 *  a full +/-120 degrees inside a bottom-docked strip without the frame's
 *  overflow-hidden clipping it into a stump. Re-verify after any edit. */
export const RIM_PATH =
  "M 58 18 L 182 18 A 116 116 0 0 1 198 202 L 42 202 A 116 116 0 0 1 58 18 Z " +
  "M 56 44 L 100 44 Q 100 44 100 62 L 100 152 Q 100 170 82 170 " +
  "L 56 170 Q 38 170 38 152 L 38 62 Q 38 44 56 44 Z " +
  "M 184 44 L 202 44 Q 202 44 202 62 L 202 152 Q 202 170 184 170 " +
  "L 140 170 Q 140 170 140 152 L 140 62 Q 140 44 158 44 Z";

const cl = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

/** Blend two hex colours. Used only at render time to build cap gradients, so
 *  its cost never lands in the per-frame path. */
function mix(a: string, b: string, k: number) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const r = Math.round(((pa >> 16) & 255) * (1 - k) + ((pb >> 16) & 255) * k);
  const g = Math.round(((pa >> 8) & 255) * (1 - k) + ((pb >> 8) & 255) * k);
  const bl = Math.round((pa & 255) * (1 - k) + (pb & 255) * k);
  return `#${((1 << 24) | (r << 16) | (g << 8) | bl).toString(16).slice(1)}`;
}

/** Every layer of the component that changes appearance from CHASSIS state is
 *  driven by a data attribute, never by className or by an inline style. React
 *  renders neither, so a re-render triggered by a prop change can never clobber
 *  a write that sync() made, and sync() never has to fight the reconciler. */
const CSS = `
.vpw-root { position: relative; font-family: monospace; color: ${C_TEXT};
  user-select: none; touch-action: none; flex-shrink: 0;
  display: flex; flex-direction: column; align-items: center; }
.vpw-box { position: relative; overflow: hidden; }
.vpw-rim { position: absolute; left: 0; pointer-events: none;
  transform: rotate(var(--rim, 0deg)); will-change: transform; }
.vpw-ghost { position: absolute; left: 0; pointer-events: none;
  transform: rotate(var(--req, 0deg)); opacity: var(--ghostA, 0);
  will-change: transform; }
.vpw-plate { position: absolute; inset: 0; pointer-events: none; }

.vpw-btn { position: relative; display: block; padding: 0; margin: 0;
  pointer-events: auto; cursor: pointer; font-family: monospace;
  background: transparent; text-align: center;
  border: 1px solid ${C_BORDER}; border-radius: 6px;
  color: ${C_MUTE}; touch-action: none;
  transition: border-color 90ms linear, color 90ms linear, box-shadow 90ms linear; }
.vpw-btn[data-req="1"] { border: 1px dashed ${C_AMBER}; color: ${C_AMBER}; }
.vpw-btn[data-req="1"][data-eng="1"] { border: 1px solid ${C_STEEL}; color: ${C_SEL};
  box-shadow: 0 0 9px rgba(159,180,208,0.45); }
.vpw-btn[data-act="1"] { border: 1px solid ${C_RED}; color: ${C_SEL};
  box-shadow: 0 0 11px rgba(226,87,62,0.5); }
.vpw-btn[data-off="1"] { opacity: 0.4; cursor: not-allowed; }
.vpw-btn:focus-visible { outline: 1px solid ${C_STEEL}; outline-offset: 2px; }

.vpw-cap { position: absolute; inset: 2px; border-radius: 5px; pointer-events: none; }
.vpw-lab { position: relative; z-index: 1; text-shadow: 0 1px 0 rgba(207,228,255,0.07); }
.vpw-hint { position: absolute; top: 2px; right: 3px; z-index: 1; color: ${C_DIM}; }

.vpw-btn[data-req="1"][data-eng="0"] { animation: none; }
.vpw-auto[data-req="1"][data-eng="0"] { animation: vpw-req 0.33s ease-in-out infinite; }
.vpw-auto[data-eng="1"] { border: 1px solid ${C_GREEN}; color: ${C_SEL};
  animation: vpw-eng 1.1s ease-in-out infinite; }
.vpw-auto[data-ovr="1"] { border: 1px solid ${C_SALMON}; color: ${C_SALMON}; animation: none; }

.vpw-leds[data-blink="lim"] { animation: vpw-lim 0.125s steps(1, end) infinite; }
.vpw-leds[data-blink="boost"] .vpw-led[data-band="r"] {
  animation: vpw-strobe 0.125s steps(1, end) infinite; }

@keyframes vpw-lim { 0%, 49% { opacity: 1 } 50%, 100% { opacity: 0.22 } }
@keyframes vpw-strobe { 0%, 49% { background: ${C_TEXT} } 50%, 100% { background: ${C_RED} } }
@keyframes vpw-req { 0%, 100% { box-shadow: 0 0 0 rgba(217,168,96,0) }
  50% { box-shadow: 0 0 10px rgba(217,168,96,0.7) } }
@keyframes vpw-eng { 0%, 100% { box-shadow: 0 0 3px rgba(159,208,180,0.3) }
  50% { box-shadow: 0 0 11px rgba(159,208,180,0.75) } }

@media (prefers-reduced-motion: reduce) {
  .vpw-leds, .vpw-led, .vpw-auto { animation: none !important; }
}
`;

/* ---------------------------------------------------------------------- */
/* Sub-parts                                                               */
/* ---------------------------------------------------------------------- */

/** Carbon twill, an edge stack and one key-light gradient. The twill is
 *  checkerboarded so the tow direction alternates: a single diagonal hatch
 *  reads as wallpaper, and the alternation is the thing people actually
 *  recognise as carbon. */
function RimDefs() {
  return (
    <defs>
      <pattern id="vpwTowA" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="6" height="6" fill="#17181c" />
        <rect width="6" height="1" fill="#23252b" />
        <rect y="3" width="6" height="1" fill="#1b1c21" />
      </pattern>
      <pattern id="vpwTowB" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
        <rect width="6" height="6" fill="#151619" />
        <rect width="6" height="1" fill="#212329" />
        <rect y="3" width="6" height="1" fill="#191a1f" />
      </pattern>
      {/* A 6px tow is about 2.5x oversized against a real 3mm tow at this rim
          scale. Deliberate: at true scale it aliases into grey mush on a 240px
          element. Do not "fix" this. */}
      <pattern id="vpwWeave" width="12" height="12" patternUnits="userSpaceOnUse">
        <rect width="6" height="6" fill="url(#vpwTowA)" />
        <rect x="6" y="6" width="6" height="6" fill="url(#vpwTowA)" />
        <rect x="6" width="6" height="6" fill="url(#vpwTowB)" />
        <rect y="6" width="6" height="6" fill="url(#vpwTowB)" />
      </pattern>
      {/* One light direction, from top-left, obeyed by every gradient, bevel
          and shadow in this component. */}
      <linearGradient id="vpwSpec" x1="0" y1="0" x2="0.72" y2="1">
        <stop offset="0%" stopColor={C_TEXT} stopOpacity="0.1" />
        <stop offset="22%" stopColor={C_TEXT} stopOpacity="0.03" />
        <stop offset="46%" stopColor={C_TEXT} stopOpacity="0" />
      </linearGradient>
      {/* The carbon face gets a narrow bright specular and the grips get a wide
          dim one. That contrast is what makes two materials read as two. */}
      <linearGradient id="vpwGripGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#0d0e11" />
        <stop offset="55%" stopColor="#1c1e23" />
        <stop offset="100%" stopColor="#101114" />
      </linearGradient>
    </defs>
  );
}

/** The rotating layer: shell, grips, hardware and the 12 o'clock index. No
 *  legends live here, because a legend that rotates is a legend nobody reads
 *  mid-corner. */
function RimShell() {
  const ridges = [0, 1, 2, 3, 4];
  return (
    <>
      <path d={RIM_PATH} fillRule="evenodd" fill="url(#vpwWeave)" />
      {/* Never one flat outline: a dark occlusion stroke under a light catch
          stroke is what separates an object from a UI circle. */}
      <path d={RIM_PATH} fillRule="evenodd" fill="none" stroke={C_OCC} strokeWidth="3" />
      <path d={RIM_PATH} fillRule="evenodd" fill="none" stroke={C_LINE} strokeWidth="1" />
      <path d={RIM_PATH} fillRule="evenodd" fill="url(#vpwSpec)" />

      <g>
        <rect x="6" y="70" width="34" height="94" rx="15" fill="url(#vpwGripGrad)" stroke={C_OCC} strokeWidth="1" />
        <rect x="200" y="70" width="34" height="94" rx="15" fill="url(#vpwGripGrad)" stroke={C_OCC} strokeWidth="1" />
        {ridges.map((i) => (
          <g key={`ridge-${i}`}>
            <line x1="10" y1={92 + i * 8} x2="36" y2={92 + i * 8} stroke="#0d0e11" strokeWidth="1" />
            <line x1="204" y1={92 + i * 8} x2="230" y2={92 + i * 8} stroke="#0d0e11" strokeWidth="1" />
          </g>
        ))}
        {/* Rub streaks across the ridges. Worn grips are the single detail that
            says this object has been held before. */}
        <rect x="10" y="104" width="26" height="18" fill={C_TEXT} opacity="0.04" />
        <rect x="204" y="104" width="26" height="18" fill={C_TEXT} opacity="0.04" />
      </g>

      <g>
        {[
          [62, 26],
          [178, 26],
          [50, 190],
          [190, 190],
          [70, 178],
          [170, 178],
        ].map(([x, y], i) => (
          <g key={`boss-${i}`}>
            <circle cx={x + 0.6} cy={y + 0.6} r="2" fill={C_OCC} opacity="0.9" />
            <circle cx={x} cy={y} r="2" fill={C_HUB} stroke={C_LINE} strokeWidth="1" />
          </g>
        ))}
        <rect x="98" y="186" width="14" height="3" rx="1.5" fill={C_OCC} />
        <rect x="128" y="186" width="14" height="3" rx="1.5" fill={C_OCC} />
        <line x1="46" y1="176" x2="86" y2="176" stroke={C_BORDER} strokeWidth="1" />
        <line x1="154" y1="176" x2="194" y2="176" stroke={C_BORDER} strokeWidth="1" />
        <line x1="104" y1="20" x2="136" y2="20" stroke={C_BORDER} strokeWidth="1" />
      </g>

      <rect x="114" y="24" width="12" height="20" rx="2" fill={C_STEEL} />
    </>
  );
}

/** Eleven ticks over 270 degrees plus a knurled collar. The knurl is one
 *  dashed circle and it is the single cheapest mark that makes a control read
 *  as a machined part rather than a coloured disc. */
function DialFace({ size, colour }: { size: number; colour: string }) {
  const c = size / 2;
  const ticks: React.ReactElement[] = [];
  for (let i = 0; i < 11; i++) {
    const a = -135 + i * 27;
    const end = i === 0 || i === 10;
    ticks.push(
      <rect
        key={`t-${i}`}
        x={c - (end ? 0.75 : 0.5)}
        y={c - 14.5}
        width={end ? 1.5 : 1}
        height="3"
        fill={end ? C_DIM : C_EDGE}
        transform={`rotate(${a} ${c} ${c})`}
      />,
    );
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: "absolute", inset: 0 }}>
      {ticks}
      <circle cx={c} cy={c} r="12" fill="none" stroke={C_OCC} strokeWidth="1" />
      <circle cx={c} cy={c} r="11" fill="none" stroke={C_LINE} strokeWidth="1" />
      <circle cx={c} cy={c} r="10.5" fill="none" stroke={C_BORDER} strokeWidth="2" strokeDasharray="1.6 1.6" />
      <circle cx={c} cy={c} r="9.5" fill={mix(colour, C_OCC, 0.78)} />
    </svg>
  );
}

/* ---------------------------------------------------------------------- */
/* Component                                                               */
/* ---------------------------------------------------------------------- */

const F1Wheel = forwardRef<F1WheelHandle, F1WheelProps>(function F1Wheel(
  {
    dir,
    onDir,
    boosting,
    onBoosting,
    auto,
    onAuto,
    onSteer,
    onOverride,
    boostReady = true,
    autoReady = true,
    compact = false,
    steerPx,
    stillMotion = false,
    machineId,
  },
  ref,
) {
  // The component's entire React state. Everything else is a prop or a ref.
  const [dragging, setDragging] = useState(false);

  const k = compact ? 0.7333 : 1;
  const px = (n: number) => Math.round(n * k * 100) / 100;
  const fs = (n: number) => Math.max(6, Math.round(n * k));
  const ledN = compact ? LED_N_COMPACT : LED_N_WIDE;
  const dragPx = steerPx ?? STEER_PX_FINE;

  const rootRef = useRef<HTMLDivElement | null>(null);
  const ghostRef = useRef<HTMLDivElement | null>(null);
  const stripRef = useRef<HTMLDivElement | null>(null);
  const ledsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const gearRef = useRef<HTMLSpanElement | null>(null);
  const stateRef = useRef<HTMLSpanElement | null>(null);
  const spdRef = useRef<HTMLSpanElement | null>(null);
  const heatRef = useRef<HTMLDivElement | null>(null);
  const boostBarRef = useRef<HTMLDivElement | null>(null);
  const gripPtrRef = useRef<HTMLDivElement | null>(null);
  const boostPtrRef = useRef<HTMLDivElement | null>(null);
  const frontRef = useRef<HTMLButtonElement | null>(null);
  const backRef = useRef<HTMLButtonElement | null>(null);
  const boostBtnRef = useRef<HTMLButtonElement | null>(null);
  const autoBtnRef = useRef<HTMLButtonElement | null>(null);

  const dragStart = useRef<number | null>(null);
  const lastSt = useRef(0);
  /** The pointer that owns the current drag, so a second touch cannot steal it. */
  const dragId = useRef<number | null>(null);
  /** Whether autopilot was already on when this press started. Release acts on
   *  this, never on the live prop, which the press itself may have flipped. */
  const autoAtPress = useRef(false);

  // Live mirror of the props sync() needs. Reading props through a ref keeps
  // the handle stable across renders, so the caller never re-binds it.
  const p = useRef({ auto, stillMotion, boostReady, autoReady });
  p.current.auto = auto;
  p.current.stillMotion = stillMotion;
  p.current.boostReady = boostReady;
  p.current.autoReady = autoReady;

  // Per-channel change gates. Every one of these exists so that a car cruising
  // in a straight line costs two custom-property writes per frame and nothing
  // else, which is strictly less than the wheel it replaces.
  const prev = useRef({
    rim: NaN,
    req: NaN,
    ghostOn: -1,
    led: [] as string[],
    kmh: -1,
    gear: "",
    state: "",
    heat: -1,
    boostW: -1,
    boostCol: "",
    grip: NaN,
    boostDial: NaN,
    eng: "",
    act: -1,
    autoEng: -1,
    blink: "",
    overrideUntil: 0,
    wasAutoActive: false,
  });

  const sync = useCallback((f: F1WheelFrame) => {
    const root = rootRef.current;
    if (!root) return;
    const q = prev.current;
    const pr = p.current;

    // Rim and ghost: one custom property each, substituted as text by an
    // unregistered property, so no @property registration is needed.
    if (!(Math.abs(f.rimDeg - q.rim) <= ROT_GATE)) {
      q.rim = f.rimDeg;
      root.style.setProperty("--rim", `${f.rimDeg.toFixed(2)}deg`);
    }
    if (!(Math.abs(f.reqDeg - q.req) <= ROT_GATE)) {
      q.req = f.reqDeg;
      root.style.setProperty("--req", `${f.reqDeg.toFixed(2)}deg`);
    }
    const ghostOn = Math.abs(f.reqDeg) > GHOST_MIN_DEG ? 1 : 0;
    if (ghostOn !== q.ghostOn) {
      q.ghostOn = ghostOn;
      root.style.setProperty("--ghostA", ghostOn ? "0.85" : "0");
    }

    // Rev strip. Written per segment, so a full acceleration sweep costs
    // fifteen writes in total rather than fifteen every frame.
    const lit = Math.round(cl(f.rev, 0, 1) * ledN);
    const forceRed = f.limiter && pr.stillMotion;
    for (let i = 0; i < ledN; i++) {
      const on = forceRed || i < lit;
      const band = i < Math.round(ledN / 3) ? C_GREEN : i < Math.round((ledN * 2) / 3) ? C_AMBER : C_RED;
      const key = on ? band : "off";
      if (q.led[i] === key) continue;
      q.led[i] = key;
      const el = ledsRef.current[i];
      if (!el) continue;
      if (on) {
        // The bloom plus the inset lens highlight is the entire difference
        // between an LED and a segment of a progress bar.
        el.style.background = band;
        el.style.boxShadow = `0 0 6px ${band}, 0 0 2px ${band}, inset 0 1px 0 rgba(255,255,255,0.45)`;
      } else {
        el.style.background = "#16171b";
        el.style.boxShadow = "inset 0 1px 0 rgba(207,228,255,0.04)";
      }
    }
    const blink = pr.stillMotion ? "" : f.boostActive ? "boost" : f.limiter ? "lim" : "";
    if (blink !== q.blink) {
      q.blink = blink;
      if (stripRef.current) stripRef.current.dataset.blink = blink;
    }

    // LCD.
    const kmh = Math.round(f.kmh);
    if (kmh !== q.kmh) {
      q.kmh = kmh;
      if (spdRef.current) spdRef.current.textContent = String(kmh);
    }
    const word = f.gear === "D" ? "FWD" : f.gear === "R" ? "REV" : "NEU";
    if (word !== q.gear) {
      q.gear = word;
      if (gearRef.current) gearRef.current.textContent = word;
    }

    // Autopilot telltale. The handoff is not instant and the button must not
    // pretend it is, so REQUESTED and ENGAGED are two different states from
    // two different sources, and dropping out shows a brief OVERRIDE.
    if (q.wasAutoActive && !f.autoActive && !pr.auto) q.overrideUntil = f.t + OVERRIDE_HOLD;
    q.wasAutoActive = f.autoActive;
    const inOverride = f.t < q.overrideUntil;

    let txt: string;
    let col: string;
    if (inOverride) {
      txt = "OVERRIDE";
      col = C_SALMON;
    } else if (f.autoActive) {
      txt = "AUTO";
      col = C_GREEN;
    } else if (pr.auto) {
      txt = "ENGAGING";
      col = C_AMBER;
    } else if (f.boostActive) {
      txt = "BOOST";
      col = C_RED;
    } else if (f.hb) {
      txt = "HANDBRAKE";
      col = C_RED;
    } else if (f.gripLoss > 0.85) {
      txt = "SLIP";
      col = C_RED;
    } else if (f.gripLoss > 0.6) {
      txt = "LOOSE";
      col = C_AMBER;
    } else {
      txt = "GRIP";
      col = C_STEEL;
    }
    if (txt !== q.state) {
      q.state = txt;
      const s = stateRef.current;
      if (s) {
        s.textContent = txt;
        s.style.color = col;
      }
    }

    const heat = Math.round(cl(f.driftHeat, 0, 1) * 100);
    if (heat !== q.heat) {
      q.heat = heat;
      const b = heatRef.current;
      if (b) {
        b.style.width = `${heat}%`;
        b.style.background = f.gripLoss > 0.85 ? C_RED : f.gripLoss > 0.6 ? C_AMBER : C_STEEL;
      }
    }

    // A player who never presses BOOSTER pays nothing for the meter.
    if (!(f.boost === 1 && f.boostCool === 0)) {
      const bw = Math.round(cl(f.boost, 0, 1) * 100);
      const bc = f.boostCool > 0 ? C_DIM : f.boostActive ? C_WARM : C_STEEL;
      if (bw !== q.boostW || bc !== q.boostCol) {
        q.boostW = bw;
        q.boostCol = bc;
        const b = boostBarRef.current;
        if (b) {
          b.style.width = `${bw}%`;
          b.style.background = bc;
        }
      }
    }

    // Dials. Quantized to two degrees, which is under a pixel of pointer tip
    // travel at this radius and therefore invisible.
    const gripDeg = -135 + cl(1 - f.gripLoss, 0, 1) * 270;
    if (!(Math.abs(gripDeg - q.grip) < DIAL_GATE)) {
      q.grip = gripDeg;
      const el = gripPtrRef.current;
      if (el) {
        el.style.transform = `rotate(${gripDeg.toFixed(0)}deg)`;
        el.style.background = f.gripLoss > 0.85 ? C_RED : f.gripLoss > 0.6 ? C_AMBER : C_SEL;
      }
    }
    const boostDeg = -135 + cl(f.boost, 0, 1) * 270;
    if (!(Math.abs(boostDeg - q.boostDial) < DIAL_GATE)) {
      q.boostDial = boostDeg;
      const el = boostPtrRef.current;
      if (el) {
        el.style.transform = `rotate(${boostDeg.toFixed(0)}deg)`;
        el.style.background = !pr.boostReady || f.boostCool > 0 ? C_DIM : f.boostActive ? C_WARM : C_SEL;
      }
    }

    // Requested versus engaged. Holding BACK while still rolling forward sits
    // amber and dashed, then snaps to filled steel the instant the gearbox
    // actually takes reverse. That is the machine explaining itself, for one
    // attribute write on a state change.
    if (f.gear !== q.eng) {
      q.eng = f.gear;
      if (frontRef.current) frontRef.current.dataset.eng = f.gear === "D" ? "1" : "0";
      if (backRef.current) backRef.current.dataset.eng = f.gear === "R" ? "1" : "0";
    }
    const act = f.boostActive ? 1 : 0;
    if (act !== q.act) {
      q.act = act;
      if (boostBtnRef.current) boostBtnRef.current.dataset.act = act ? "1" : "0";
    }
    const ae = (f.autoActive ? 1 : 0) + (inOverride ? 2 : 0);
    if (ae !== q.autoEng) {
      q.autoEng = ae;
      const el = autoBtnRef.current;
      if (el) {
        el.dataset.eng = f.autoActive ? "1" : "0";
        el.dataset.ovr = inOverride ? "1" : "0";
      }
    }
  }, [ledN]);

  useImperativeHandle(ref, () => ({ sync }), [sync]);

  // A new machine means new limits, so every gate is invalidated rather than
  // carried across. Cheaper and safer than trying to reconcile the old values.
  const lastMachine = useRef(machineId);
  if (lastMachine.current !== machineId) {
    lastMachine.current = machineId;
    prev.current.rim = NaN;
    prev.current.req = NaN;
    prev.current.ghostOn = -1;
    prev.current.led = [];
    prev.current.kmh = -1;
    prev.current.gear = "";
    prev.current.state = "";
    prev.current.heat = -1;
    prev.current.boostW = -1;
    prev.current.grip = NaN;
    prev.current.boostDial = NaN;
    prev.current.eng = "";
    prev.current.act = -1;
    prev.current.autoEng = -1;
    prev.current.blink = "";
    prev.current.overrideUntil = 0;
    prev.current.wasAutoActive = false;
    dragStart.current = null;
    lastSt.current = 0;
  }

  /* ------------------------------ steering ---------------------------- */

  // Capture on currentTarget, never on target: the old rim had children nobody
  // pressed, this one has ten, and capture taken on a child that re-renders
  // drops the drag mid-corner.
  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // One drag at a time. A second thumb landing anywhere on the rim used to
    // reset the start point or zero the steer, which threw away a held lock
    // in the middle of a corner on a phone.
    if (dragId.current !== null) return;
    dragId.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStart.current = e.clientX - lastSt.current * dragPx;
    setDragging(true);
    if (auto) onOverride();
  };
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStart.current === null || e.pointerId !== dragId.current) return;
    const st = cl((e.clientX - dragStart.current) / dragPx, -1, 1);
    lastSt.current = st;
    onSteer(st);
  };
  const onUp = (e?: React.PointerEvent<HTMLDivElement>) => {
    if (e && dragId.current !== null && e.pointerId !== dragId.current) return;
    dragId.current = null;
    if (dragStart.current === null) return;
    dragStart.current = null;
    lastSt.current = 0;
    onSteer(0);
    setDragging(false);
  };

  /* ------------------------------- buttons ---------------------------- */

  // Every button stops propagation, or every press starts a steer drag from
  // that button's x position and yanks the wheel.
  const stop = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const capStyle = useCallback((colour: string, on: boolean, momentary: boolean): React.CSSProperties => {
    return {
      background: `radial-gradient(circle at ${KEY}, ${mix(colour, on ? C_SEL : C_OCC, on ? 0.5 : 0.45)} 0%, ${
        on ? colour : mix(colour, C_OCC, 0.55)
      } 46%, ${mix(colour, C_OCC, on ? 0.3 : 0.7)} 100%)`,
      boxShadow: [
        "inset 0 1px 0 rgba(255,255,255,0.22)",
        "inset 0 -1px 2px rgba(10,10,11,0.85)",
        // Two physical types, and they must read as different switches with
        // the colour removed: a proud dome versus a countersunk collar.
        momentary ? "0 2px 0 rgba(10,10,11,0.9)" : "inset 0 0 6px rgba(10,10,11,0.6)",
      ].join(","),
      transform: on && momentary ? "translateY(1px)" : "none",
      transition: "background 90ms linear, box-shadow 90ms linear",
    };
  }, []);

  const btnBox = (w: number | string, h: number): React.CSSProperties => ({
    width: w,
    height: h,
    lineHeight: `${h}px`,
    fontSize: compact ? 9 : fs(9),
    letterSpacing: "0.04em",
    background: "rgba(16,17,20,0.92)",
  });

  type BtnSpec = {
    label: string;
    hint: string;
    colour: string;
    momentary: boolean;
    on: boolean;
    req: boolean;
    off: boolean;
    cls: string;
    r: React.MutableRefObject<HTMLButtonElement | null>;
    press: () => void;
    release?: () => void;
    engageOnUp?: boolean;
  };

  const specs: BtnSpec[] = useMemo(
    () => [
      {
        label: "FRONT",
        hint: "1",
        colour: C_STEEL,
        momentary: false,
        on: dir === "FRONT",
        req: dir === "FRONT",
        off: false,
        cls: "",
        r: frontRef,
        press: () => {
          if (auto) onOverride();
          onDir("FRONT");
        },
      },
      {
        // Reverse is a caution state and reads like one, the way the handbrake
        // already does.
        label: "BACK",
        hint: "2",
        colour: C_AMBER,
        momentary: false,
        on: dir === "BACK",
        req: dir === "BACK",
        off: false,
        cls: "",
        r: backRef,
        press: () => {
          if (auto) onOverride();
          onDir("BACK");
        },
      },
      {
        label: "BOOSTER",
        hint: "B",
        colour: C_RED,
        momentary: true,
        on: boosting,
        req: false,
        off: !boostReady,
        cls: "",
        r: boostBtnRef,
        press: () => {
          if (!boostReady) return;
          if (auto) onOverride();
          onBoosting(true);
        },
        release: () => {
          if (!boostReady) return;
          onBoosting(false);
        },
      },
      {
        label: "AUTO",
        hint: "T",
        colour: C_GREEN,
        momentary: false,
        on: auto,
        req: auto,
        off: !autoReady,
        cls: "vpw-auto",
        r: autoBtnRef,
        // Engaging on pointer-up is the one deliberate exception to this
        // codebase's pointer-down rule: AUTO is the only control that changes
        // what the pedals mean and BOOSTER is adjacent to it, so a slip off
        // the cap should cancel the press. Disengaging stays immediate.
        engageOnUp: true,
        press: () => {
          if (!autoReady) return;
          autoAtPress.current = auto;
          if (auto) onAuto(false);
        },
        release: () => {
          if (!autoReady) return;
          // Decided at press time. Reading `auto` here would see the value this
          // very press just changed, and re-engage what the player turned off.
          if (!autoAtPress.current) onAuto(true);
        },
      },
    ],
    [dir, boosting, auto, boostReady, autoReady, onDir, onBoosting, onAuto, onOverride],
  );

  const renderBtn = (s: BtnSpec, w: number | string, h: number) => (
    <button
      key={s.label}
      ref={s.r}
      type="button"
      className={`vpw-btn ${s.cls}`}
      data-req={s.req ? "1" : "0"}
      data-eng="0"
      data-act="0"
      data-ovr="0"
      data-off={s.off ? "1" : "0"}
      aria-pressed={s.momentary ? undefined : s.on}
      aria-disabled={s.off || undefined}
      style={btnBox(w, h)}
      onPointerDown={(e) => {
        stop(e);
        if (s.off) return;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        s.press();
      }}
      onPointerUp={(e) => {
        stop(e);
        if (s.off) return;
        s.release?.();
      }}
      onPointerLeave={(e) => {
        if (s.off) return;
        // Momentary controls latch on forever without this: a pointer dragged
        // off the cap never sends pointerup over the button.
        if (s.momentary) {
          stop(e);
          s.release?.();
        }
      }}
      onPointerCancel={() => {
        if (s.momentary) s.release?.();
      }}
    >
      <span className="vpw-cap" style={capStyle(s.colour, s.on, s.momentary)} />
      <span className="vpw-lab">{s.label}</span>
      <span className="vpw-hint" style={{ fontSize: 7, lineHeight: "9px" }}>
        {s.hint}
      </span>
    </button>
  );

  /* -------------------------------- layout ---------------------------- */

  const boxW = px(240);
  // Tall enough to contain the rotating rim rather than guillotine it: the rim
  // layer is 232 tall, offset -16, and sweeps about a centre 132 down, so the
  // painted geometry reaches roughly 119 from that centre in every direction.
  const boxH = px(252);
  const conL = px(48);
  const conT = px(44);
  const conW = px(144);
  const conH = px(108);
  const lcdW = px(76);
  const lcdH = px(52);
  const dialSize = px(28);
  const ledW = compact ? 5 : 6;
  const ledH = compact ? 7 : 8;

  const panel: React.CSSProperties = {
    background: "rgba(13,14,17,0.96)",
    border: `1px solid ${C_BORDER}`,
    // Never one flat outline, on any panel in this component.
    boxShadow: "inset 0 1px 0 rgba(207,228,255,0.07), inset 0 -1px 0 rgba(10,10,11,0.9), 0 3px 12px rgba(0,0,0,0.6)",
  };

  const dial = (
    which: "GRIP" | "BOOST",
    left: number,
    ptr: React.MutableRefObject<HTMLDivElement | null>,
    colour: string,
  ) => (
    <div style={{ position: "absolute", left, top: px(18), width: dialSize, pointerEvents: "none" }}>
      <div style={{ position: "relative", width: dialSize, height: dialSize }}>
        <DialFace size={dialSize} colour={colour} />
        <div
          style={{
            position: "absolute",
            left: dialSize / 2 - 1,
            top: dialSize / 2 - px(8),
            width: 2,
            height: px(8),
            borderRadius: 1,
            background: C_SEL,
            transformOrigin: "50% 100%",
            transform: "rotate(-135deg)",
          }}
          ref={ptr}
        />
        {/* Anodised cap, lit from the one key direction. */}
        <div
          style={{
            position: "absolute",
            left: dialSize / 2 - px(5),
            top: dialSize / 2 - px(5),
            width: px(10),
            height: px(10),
            borderRadius: "50%",
            background: `radial-gradient(circle at ${KEY}, ${mix(colour, C_SEL, 0.35)} 0%, ${mix(
              colour,
              C_OCC,
              0.55,
            )} 44%, ${mix(colour, C_OCC, 0.82)} 100%)`,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2), 0 1px 0 rgba(10,10,11,0.9)",
          }}
        />
      </div>
      <div
        style={{
          fontSize: 7,
          letterSpacing: "0.18em",
          color: C_DIM,
          textAlign: "center",
          marginTop: 2,
          textShadow: "0 1px 0 rgba(207,228,255,0.07)",
        }}
      >
        {which}
      </div>
    </div>
  );

  return (
    <div
      ref={rootRef}
      className="vpw-root"
      style={{
        width: compact ? Math.max(boxW, 208) : boxW,
        cursor: dragging ? "grabbing" : "grab",
        pointerEvents: "auto",
        gap: compact ? 6 : 0,
      }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* Thumb reach inverts on a phone: bottom-centre is the worst zone for a
          two-thumb grip and the corners are the best, so the function bar goes
          above the rim at full width rather than being squashed into pods. */}
      {compact && (
        <div
          style={{
            width: "100%",
            display: "grid",
            gridTemplateColumns: "1fr 1fr 8px 1fr 1fr",
            gap: 4,
            pointerEvents: "none",
          }}
        >
          {renderBtn(specs[0], "100%", 46)}
          {renderBtn(specs[1], "100%", 46)}
          <span />
          {renderBtn(specs[2], "100%", 46)}
          {renderBtn(specs[3], "100%", 46)}
        </div>
      )}

      <div className="vpw-box" style={{ width: boxW, height: boxH }}>
        <svg
          className="vpw-rim"
          width={px(240)}
          height={px(232)}
          viewBox="0 -16 240 232"
          style={{ top: -px(16), transformOrigin: `${px(120)}px ${px(132)}px` }}
          aria-hidden="true"
        >
          <RimDefs />
          <RimShell />
        </svg>

        {/* The ghost tick is the requested lock. When the two separate, the car
            is refusing input; without it that reads as HUD lag. */}
        <div
          ref={ghostRef}
          className="vpw-ghost"
          style={{
            top: -px(16),
            width: px(240),
            height: px(232),
            transformOrigin: `${px(120)}px ${px(132)}px`,
          }}
          aria-hidden="true"
        >
          <div
            style={{
              position: "absolute",
              left: px(118),
              top: px(28),
              width: px(4),
              height: px(14),
              borderRadius: 2,
              background: C_DIM,
            }}
          />
        </div>

        <div className="vpw-plate">
          {!compact && (
            <>
              <div
                style={{
                  ...panel,
                  position: "absolute",
                  left: 0,
                  top: px(170),
                  width: px(50),
                  height: px(76),
                  borderRadius: 8,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: px(8),
                }}
              >
                {renderBtn(specs[0], px(46), px(34))}
                {renderBtn(specs[1], px(46), px(34))}
              </div>
              <div
                style={{
                  ...panel,
                  position: "absolute",
                  left: px(190),
                  top: px(170),
                  width: px(50),
                  height: px(76),
                  borderRadius: 8,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: px(8),
                }}
              >
                {renderBtn(specs[2], px(46), px(34))}
                {renderBtn(specs[3], px(46), px(34))}
              </div>
            </>
          )}

          {/* The console overlaps both pods by two pixels, which is what makes
              the plate read as one continuous machined part. */}
          <div
            style={{
              ...panel,
              position: "absolute",
              left: conL,
              top: conT,
              width: conW,
              height: conH,
              borderRadius: 6,
            }}
          >
            <div
              ref={stripRef}
              className="vpw-leds"
              data-blink=""
              style={{
                position: "absolute",
                left: px(11.5),
                top: px(4),
                display: "flex",
                alignItems: "center",
                padding: 2,
                borderRadius: 3,
                background: "#0d0e11",
                boxShadow: "inset 0 1px 0 rgba(0,0,0,0.9)",
              }}
            >
              {Array.from({ length: ledN }, (_, i) => (
                <span
                  key={`led-${i}`}
                  className="vpw-led"
                  data-band={i < Math.round(ledN / 3) ? "g" : i < Math.round((ledN * 2) / 3) ? "a" : "r"}
                  ref={(el) => {
                    ledsRef.current[i] = el;
                  }}
                  style={{
                    width: ledW,
                    height: ledH,
                    borderRadius: 1.5,
                    background: "#16171b",
                    boxShadow: "inset 0 1px 0 rgba(207,228,255,0.04)",
                    // A wider gap at the two colour boundaries. Nothing in this
                    // component lands on a round number everywhere.
                    marginRight: i === ledN - 1 ? 0 : i === Math.round(ledN / 3) - 1 || i === Math.round((ledN * 2) / 3) - 1 ? 3 : 2,
                  }}
                />
              ))}
            </div>

            {!compact && dial("GRIP", px(3), gripPtrRef, C_STEEL)}
            {!compact && dial("BOOST", px(113), boostPtrRef, C_RED)}

            <div
              style={{
                position: "absolute",
                left: compact ? px(24) : px(34),
                top: px(20),
                width: lcdW,
                height: lcdH,
                borderRadius: 4,
                background: "linear-gradient(180deg,#141a22 0%,#0b0e12 100%)",
                border: `1px solid ${C_OCC}`,
                boxShadow:
                  "inset 0 0 0 1px rgba(74,78,86,0.5), inset 0 0 14px rgba(159,180,208,0.06), 0 1px 0 rgba(207,228,255,0.05)",
                overflow: "hidden",
              }}
            >
              <span
                ref={gearRef}
                style={{ position: "absolute", left: 5, top: 4, fontSize: fs(9), letterSpacing: "0.18em", color: C_STEEL }}
              >
                NEU
              </span>
              <span
                ref={stateRef}
                style={{ position: "absolute", right: 5, top: 4, fontSize: fs(8), letterSpacing: "0.14em", color: C_DIM }}
              >
                GRIP
              </span>
              <span
                ref={spdRef}
                style={{ position: "absolute", right: px(22), top: px(16), fontSize: fs(22), lineHeight: 1, color: C_SEL }}
              >
                0
              </span>
              <span
                style={{ position: "absolute", right: 5, top: px(24), fontSize: 6, letterSpacing: "0.2em", color: C_DIM }}
              >
                KM/H
              </span>
              <div
                style={{
                  position: "absolute",
                  left: 5,
                  right: 5,
                  bottom: px(9),
                  height: 3,
                  borderRadius: 1.5,
                  background: C_OCC,
                }}
              >
                <div ref={heatRef} style={{ width: "0%", height: "100%", borderRadius: 1.5, background: C_STEEL }} />
              </div>
              <div
                style={{ position: "absolute", left: 5, right: 5, bottom: px(4), height: 2, borderRadius: 1, background: C_OCC }}
              >
                <div ref={boostBarRef} style={{ width: "100%", height: "100%", borderRadius: 1, background: C_STEEL }} />
              </div>
              {/* Scanlines and one diagonal glass reflection. Without them this
                  is a text box with a border. */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  pointerEvents: "none",
                  background: "repeating-linear-gradient(0deg, transparent 0 2px, rgba(0,0,0,0.22) 2px 3px)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  pointerEvents: "none",
                  background:
                    "linear-gradient(133deg, rgba(207,228,255,0.13) 0%, rgba(207,228,255,0.02) 34%, transparent 55%)",
                }}
              />
            </div>

            {/* The only mark on the assembly, and it is the site's own. */}
            <span
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 3,
                textAlign: "center",
                fontSize: 7,
                letterSpacing: "0.3em",
                color: C_EDGE,
                textShadow: "0 1px 0 rgba(207,228,255,0.07)",
              }}
            >
              VP_
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default F1Wheel;
