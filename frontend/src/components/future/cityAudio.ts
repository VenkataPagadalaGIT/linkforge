/**
 * cityAudio: the procedural sound engine for FutureCityScene.
 *
 * Everything here is synthesised in code. There is no asset, no fetch and no
 * dependency, which is the same claim the scene already makes about its
 * geometry and its environment map, so the audio had to hold the same line.
 * White and pink noise are generated into two shared AudioBuffers, the
 * powertrain is an oscillator stack driven by PeriodicWaves built from
 * hand-authored harmonic tables, and impacts are impulses through narrow
 * bandpasses, which is what a damped panel mode actually is.
 *
 * This module imports nothing: no React, no three, no r3f. It is a plain
 * class plus a module singleton, so it is testable without a renderer and it
 * structurally cannot hold a scene reference across an unmount.
 *
 * Three rules govern every line below, and breaking any of them is audible:
 *
 *  1. Nothing is constructed until enable(), and enable() may only be called
 *     from a trusted user gesture. A page that builds an AudioContext on
 *     mount gets a suspended context and, on some browsers, a console
 *     warning. Every failure path here is silent by design: an unavailable
 *     or blocked context degrades to nothing and never logs.
 *
 *  2. Every node is created once, at graph-build time. The per-frame path
 *     allocates nothing and writes AudioParams through setTargetAtTime only.
 *     linearRampToValueAtTime appends an event to the param's automation
 *     timeline, so one per param per frame builds an unbounded queue that
 *     degrades measurably after a few minutes. setTargetAtTime replaces, and
 *     called repeatedly with a fresh currentTime it behaves as a one-pole
 *     filter, which is exactly what a smoothed control wants.
 *
 *  3. setTargetAtTime asymptotes and never reaches its target. For a hard
 *     gate (engine off, boost off, alert off) that leaves a residual tone
 *     floor forever, so those are snapped with a single setValueAtTime once
 *     the estimate is inaudible. The opposite mistake is worse: writing
 *     setValueAtTime to a continuous gain every frame steps it at 60 Hz,
 *     which is an audible buzz. Smooth below encodes both halves.
 *
 * The frequency mapping is the design's centre. Pitch tracks road speed and
 * timbre tracks torque, and the two deliberately diverge, because the
 * chassis applies a torque droop of 1 - vf / VMAX: at top speed the drive
 * force is zero. So flat out the machine is high and thin, and hard out of a
 * corner it is low and snarling. That inversion is not an effect, it falls
 * straight out of physics the scene already runs.
 */

/* ---------------------------------------------------------------- *
 *  Public surface
 * ---------------------------------------------------------------- */

export type AudioState = "idle" | "live" | "suspended" | "dead";

/** Which powertrain voice a machine uses. Mirrors the chassis TUNE_KEYS. */
export type SpecKey = "truck" | "sedan" | "tourer" | "podbus" | "pod" | "semi";

/** Cockpit one-shots the DOM overlay fires directly. Everything else is an
 *  edge the engine derives for itself from the frame. */
export type UiSound = "click" | "exit";

/**
 * Everything the graph needs from one animation frame. Preallocated by the
 * caller with createAudioFrame(), mutated in place, never reallocated. This
 * mirrors the F1WheelFrame contract the cockpit already uses.
 *
 * impact, landing and scrub are audio-owned event accumulators. The chassis
 * raises them by max and never clears them, because resolveContacts runs up
 * to twelve times per frame and a car merely resting against a bollard is in
 * contact on every substep. The caller clears impact and landing after
 * sync() returns.
 */
export interface CityAudioFrame {
  /** True only while a real machine is under the player. A humanoid has no
   *  rig at all, so the powertrain must never key off rig.driven alone. */
  driven: boolean;
  kind: "car" | "boat" | "bot";
  /** Rider id. A change here is what re-voices the engine. */
  machineId: string;
  specKey: SpecKey;
  /** Half wheelbase, world units. Sets the impact body resonance. */
  halfWB: number;
  VMAX: number;
  ACCEL: number;
  vf: number;
  speed: number;
  beta: number;
  r: number;
  load: number;
  slipDrive: number;
  aBrake: number;
  gripLoss: number;
  driftHeat: number;
  hb: number;
  gear: "D" | "N" | "R";
  boost: number;
  boostK: number;
  boostActive: boolean;
  boostCool: number;
  autoActive: boolean;
  airborne: boolean;
  /** 0 grade, 1 flyover deck, 2 water. */
  surface: 0 | 1 | 2;
  impact: number;
  landing: number;
  scrub: number;
  limiter: boolean;
}

export interface CityAudioHandle {
  readonly state: AudioState;
  readonly muted: boolean;
  readonly volume: number;
  /**
   * The ONLY construction site in the codebase. Must be called from a user
   * gesture that grants activation on every pointer type, which pointerdown
   * does NOT on touch: activation arrives at pointerup there, so a
   * pointerdown handler builds a context the browser will keep suspended.
   * Creates the context, generates the noise buffers and builds the graph.
   *
   * Never throws and never logs. A blocked context returns false and leaves
   * the engine retryable, because a gesture that arrived before activation
   * is a timing accident and the next tap normally works. Only a browser
   * with no AudioContext constructor at all latches "dead". Overlapping
   * calls (a double click) are latched out and the loser returns false.
   */
  enable(): Promise<boolean>;
  /** User-facing mute. Fades out and suspends; the graph is retained so
   *  unmuting is instant and needs no new gesture. */
  setMuted(v: boolean): void;
  /** 0..1, applied after the limiter so the slider cannot change limiting. */
  setVolume(v: number): void;
  /** Page hidden or window blurred. rAF stops but an AudioContext does not,
   *  so without this a machine left at full throttle roars in a background
   *  tab with no loop running to update it. */
  suspend(): void;
  /** Page visible again, or any later user gesture. Resumes only if the user
   *  has not muted. Never constructs, so it is safe to call from anywhere. */
  resume(): void;
  /** One frame of chassis state. Allocates nothing, sets no React state,
   *  reads no layout. A no-op unless the engine is live. */
  sync(f: CityAudioFrame, dt: number): void;
  /** A cockpit control was pressed. Rate limited internally. */
  ui(kind: UiSound): void;
  /** Player left the machine. Silences the self and powertrain layers
   *  without tearing anything down. */
  release(): void;
  /** Fade, stop every source, close the context, drop the singleton.
   *  Idempotent. Belongs in the scene root's effect cleanup, because a route
   *  change unmounts the tree and a leaked context keeps a hardware audio
   *  unit open. */
  dispose(): void;
}

/* ---------------------------------------------------------------- *
 *  Small maths, local so this module stays dependency free
 * ---------------------------------------------------------------- */

const cl = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
const smooth = (t: number) => t * t * (3 - 2 * t);
/** Smoothstep between two thresholds, clamped. */
const ss = (x: number, a: number, b: number) => smooth(cl((x - a) / (b - a), 0, 1));

/** Fastest machine in the fleet. Loudness and brightness are ABSOLUTE speed
 *  cues, so they normalise against this rather than against each machine's
 *  own VMAX: a semi flat out at 7.5 u/s and a monopod flat out at 12.5 both
 *  read 1.0 on rig.norm, which would cancel a 67% real speed difference at
 *  exactly the moment the player perceives it. The chase camera made the
 *  same call for the same reason. Pitch is the one axis that is correctly
 *  per-machine, because there the question is "am I at MY limit". */
const FLEET_VMAX = 12.5;

/** Booster charge at which re-engagement arms, mirrored from the chassis so
 *  the arming chirp lands on the frame the button would actually work. */
const BOOST_ARM = 0.15;

/* ---------------------------------------------------------------- *
 *  Smoothed AudioParam
 * ---------------------------------------------------------------- */

/**
 * One AudioParam with a one-pole smoother and an epsilon gate.
 *
 * The gate is not an approximation: a setTargetAtTime already scheduled
 * keeps converging on its own, so re-writing an unchanged target every frame
 * is pure waste. At a steady cruise this skips roughly two thirds of the
 * writes, the same trick the chassis uses when it quantizes visible steer.
 */
class Smooth {
  private tgt: number;
  private v0: number;
  private t0 = 0;
  private tau = 0.05;
  /** True when the param is known to be sitting exactly on its target. */
  private settled = true;

  constructor(private readonly p: AudioParam, private readonly eps: number, init = 0) {
    p.value = init;
    this.tgt = init;
    this.v0 = init;
  }

  /** Where the one-pole has got to by time t. Only the zero snap needs it. */
  private at(t: number): number {
    if (this.settled) return this.tgt;
    return this.tgt + (this.v0 - this.tgt) * Math.exp(-Math.max(0, t - this.t0) / this.tau);
  }

  set(target: number, tau: number, t: number): void {
    if (Math.abs(target - this.tgt) >= this.eps) {
      this.v0 = this.at(t);
      this.tgt = target;
      this.tau = tau;
      this.t0 = t;
      this.settled = false;
      this.p.setTargetAtTime(target, t, tau);
      return;
    }
    // Target has not moved, so the scheduled approach is still running and
    // needs no help. The one case that does need help is a hard zero: the
    // exponential never arrives, and a gain stuck at 1e-5 leaves a tone
    // floor under a machine that is supposed to be silent.
    if (!this.settled && target === 0 && Math.abs(this.at(t)) < 1e-4) {
      this.p.setValueAtTime(0, t);
      this.v0 = 0;
      this.settled = true;
    }
  }

  /** Discontinuous jump. Used only where a glide would be a lie: swapping
   *  machines changes the gear-mesh constant by up to 60%, and sliding into
   *  the new value sounds like a tape slowing down rather than like getting
   *  into a different vehicle. */
  jump(value: number, t: number): void {
    this.p.cancelScheduledValues(t);
    this.p.setValueAtTime(value, t);
    this.tgt = value;
    this.v0 = value;
    this.t0 = t;
    this.settled = true;
  }
}

/* ---------------------------------------------------------------- *
 *  Shared noise, generated once
 * ---------------------------------------------------------------- */

interface NoisePair {
  white: AudioBuffer;
  pink: AudioBuffer;
  rate: number;
}

let _noise: NoisePair | null = null;

/**
 * Two looping noise buffers, shared by every voice in the graph.
 *
 * Four seconds because below about two the loop period is audible as a
 * flutter in a sustained bed. Native sample rate because a resampled buffer
 * source costs interpolation for no benefit. Pink as well as white because
 * real tyre noise concentrates between roughly 500 Hz and 2 kHz, and pink
 * gets most of the way there before any filter runs; white on its own is
 * too hissy to sit under a car.
 */
function noiseBuffers(ac: BaseAudioContext): NoisePair {
  if (_noise && _noise.rate === ac.sampleRate) return _noise;
  const sr = ac.sampleRate;
  const N = Math.floor(sr * 4);
  const white = ac.createBuffer(1, N, sr);
  const pink = ac.createBuffer(1, N, sr);
  const w = white.getChannelData(0);
  const p = pink.getChannelData(0);

  for (let i = 0; i < N; i++) w[i] = Math.random() * 2 - 1;

  // Paul Kellett's six-pole approximation, about -3 dB per octave across the
  // audible band.
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let b3 = 0;
  let b4 = 0;
  let b5 = 0;
  let b6 = 0;
  for (let i = 0; i < N; i++) {
    const x = w[i];
    b0 = 0.99886 * b0 + x * 0.0555179;
    b1 = 0.99332 * b1 + x * 0.0750759;
    b2 = 0.969 * b2 + x * 0.153852;
    b3 = 0.8665 * b3 + x * 0.3104856;
    b4 = 0.55 * b4 + x * 0.5329522;
    b5 = -0.7616 * b5 - x * 0.016898;
    p[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + x * 0.5362) * 0.11;
    b6 = x * 0.115926;
  }

  // The six-pole chain wanders, and a DC offset in a LOOPED buffer is both a
  // step at the wrap and a constant bias into every downstream filter. The
  // textbook version of this algorithm leaves it in.
  let dc = 0;
  for (let i = 0; i < N; i++) dc += p[i];
  dc /= N;
  let peak = 1e-6;
  for (let i = 0; i < N; i++) {
    p[i] -= dc;
    const a = Math.abs(p[i]);
    if (a > peak) peak = a;
  }
  const g = 0.9 / peak;
  for (let i = 0; i < N; i++) p[i] *= g;

  // Seam. White needs none, because independent samples make the wrap look
  // like every other transition. Pink does: its low band is correlated, so
  // the join is a sub-100 Hz discontinuity that thumps once every four
  // seconds. Equal power, so the crossfade does not dip.
  const X = 2048;
  for (let i = 0; i < X; i++) {
    const k = i / X;
    const a = Math.cos(k * Math.PI * 0.5);
    const c = Math.sin(k * Math.PI * 0.5);
    p[i] = p[i] * c + p[N - X + i] * a;
  }

  _noise = { white, pink, rate: sr };
  return _noise;
}

/* ---------------------------------------------------------------- *
 *  Per-machine voice tables
 * ---------------------------------------------------------------- */

/**
 * kMesh is the gear-mesh frequency per unit of forward speed, derived as
 * finalDrive * pinionTeeth / (2 * PI * wheelR). The scene's metres-per-unit
 * constant cancels out of that expression, which is why the table can be
 * authored directly against chassis numbers. teeth sets the shaft order, so
 * the imbalance sidebands land where a real gearbox puts them.
 *
 * bed and inv are voice trims. The monopod has almost no bodywork so you
 * hear its electronics; the semi has two drive units, and one extra
 * oscillator half a percent off its twin gives the slow throb that is what a
 * heavy multi-motor machine actually sounds like. The shuttle pod needs no
 * authoring at all to sound over-geared: its TRAC of 0.65 means drive clips
 * the traction cap almost permanently, so load pins at 1, the filter opens
 * wide and the pitch sits above what road speed implies. It sounds gutless
 * because it is.
 */
interface Voice {
  kMesh: number;
  teeth: number;
  bed: number;
  inv: number;
  avas: number;
  avasLvl: number;
  twin: boolean;
}

const VOICES: Record<SpecKey, Voice> = {
  truck: { kMesh: 117.0, teeth: 21, bed: 0.9, inv: 0.85, avas: 165, avasLvl: 1.0, twin: false },
  sedan: { kMesh: 188.5, teeth: 25, bed: 0.62, inv: 1.0, avas: 220, avasLvl: 1.0, twin: false },
  tourer: { kMesh: 165.0, teeth: 24, bed: 0.7, inv: 0.9, avas: 196, avasLvl: 1.0, twin: false },
  podbus: { kMesh: 138.6, teeth: 19, bed: 1.0, inv: 0.7, avas: 262, avasLvl: 1.6, twin: false },
  pod: { kMesh: 185.0, teeth: 31, bed: 0.45, inv: 1.25, avas: 294, avasLvl: 0.8, twin: false },
  semi: { kMesh: 126.2, teeth: 17, bed: 1.15, inv: 0.8, avas: 131, avasLvl: 1.8, twin: true },
};

/**
 * Harmonic tables for the four powertrain PeriodicWaves. Index 0 is DC and
 * is always zero; the rest are sine amplitudes.
 *
 * COAST is thin and glassy: zero torque, the mesh idling through. DRIVE
 * holds its odd harmonics ABOVE their even neighbours, and that reedy third
 * and fifth is what reads as strain. REGEN suppresses the fundamental and
 * lets the second dominate, because the same gearset on the coast flank is a
 * different tooth face, and that single change is what makes lift-off
 * recognisable as regeneration rather than as a fade. REVERSE is the wrong
 * flank entirely, even and odd near equal with a slow rolloff, which is why
 * real electric vehicles are uglier backing up.
 */
const WAVE_COAST = [0, 1.0, 0.28, 0.11, 0.05, 0.02, 0.01, 0.006, 0.003];
const WAVE_DRIVE = [
  0, 1.0, 0.62, 0.74, 0.38, 0.44, 0.24, 0.26, 0.15, 0.14, 0.09, 0.08, 0.05, 0.045, 0.03, 0.025, 0.018,
];
const WAVE_REGEN = [0, 0.42, 0.95, 0.78, 0.3, 0.2, 0.12, 0.07, 0.04, 0.025, 0.015];
const WAVE_REVERSE = [0, 0.88, 0.9, 0.55, 0.62, 0.34, 0.4, 0.22, 0.26, 0.16, 0.18, 0.11, 0.12];

/**
 * Normalization stays ON. With it off the seventeen-partial drive wave is
 * about 8 dB hotter than the nine-partial coast wave, so every throttle
 * application would land as a volume jump rather than a change of character.
 */
function wave(ac: BaseAudioContext, imag: number[]): PeriodicWave {
  const im = new Float32Array(imag);
  const re = new Float32Array(imag.length);
  return ac.createPeriodicWave(re, im, { disableNormalization: false });
}

/* ---------------------------------------------------------------- *
 *  The engine
 * ---------------------------------------------------------------- */

class CityAudio implements CityAudioHandle {
  private ac: AudioContext | null = null;
  private st: AudioState = "idle";
  /** True from the moment enable() starts until it settles. enable() is
   *  async and cannot publish a usable context before its first await, so
   *  this is the only thing standing between a double click and two live
   *  AudioContexts. */
  private pending = false;
  /** Bumped by dispose(). An enable() that was awaiting resume() across the
   *  bump has been orphaned and must close its own context rather than build
   *  a graph on an instance nothing references. */
  private gen = 0;
  /** True once build() has run. dispose() must not touch the node fields
   *  before that: they are declared with definite assignment and are still
   *  undefined while a construction is in flight. */
  private built = false;
  private isMuted = true;
  private active = true;
  private vol = 0.55;
  private suspendTimer: number | null = null;

  /* buses */
  private master!: GainNode;
  private preGain!: GainNode;
  private duck!: GainNode;
  private busSelf!: GainNode;
  private busPT!: GainNode;
  private busHit!: GainNode;
  private busUi!: GainNode;
  private ptGate!: GainNode;

  /* item 1: motion bed */
  private rollLP!: BiquadFilterNode;
  private rollSurf!: BiquadFilterNode;
  private rollSrc!: AudioBufferSourceNode;
  private sRollGain!: Smooth;
  private sRollLP!: Smooth;
  private sRollRate!: Smooth;
  private sSurfF!: Smooth;
  private sSurfG!: Smooth;
  private sWindGain!: Smooth;
  private sWindHP!: Smooth;

  /* item 2: powertrain */
  private revHz!: ConstantSourceNode;
  private gShaftTap!: GainNode;
  private oscCoast!: OscillatorNode;
  private oscDrive!: OscillatorNode;
  private oscRegen!: OscillatorNode;
  private oscTwin!: OscillatorNode;
  private oscShaft!: OscillatorNode;
  private oscHalf!: OscillatorNode;
  private sRev!: Smooth;
  private sCoast!: Smooth;
  private sDrive!: Smooth;
  private sRegen!: Smooth;
  private sTwin!: Smooth;
  private sHalf!: Smooth;
  private sShaftDepth!: Smooth;
  private sLpF!: Smooth;
  private sLpQ!: Smooth;
  private sPeakF!: Smooth;
  private sPeakG!: Smooth;
  private sBedF!: Smooth;
  private sBedG!: Smooth;
  private sInvF!: Smooth;
  private sInvG!: Smooth;
  private sPtGate!: Smooth;
  private wCoast!: PeriodicWave;
  private wDrive!: PeriodicWave;
  private wRegen!: PeriodicWave;
  private wReverse!: PeriodicWave;

  /* item 4: squeal, lockup, scrape */
  private sSqF1!: Smooth;
  private sSqF2!: Smooth;
  private sSqQ1!: Smooth;
  private sSqQ2!: Smooth;
  private sSqGain!: Smooth;
  private sqCur = 0;

  /* item 5: boost */
  private sBoostF!: Smooth;
  private sBoostG!: Smooth;
  private sRailF!: Smooth;
  private sRailG!: Smooth;

  /* item 7: limiter flutter */
  private sLimDepth!: Smooth;

  /* item 8: pedestrian alert */
  private avasA!: OscillatorNode;
  private avasB!: OscillatorNode;
  private sAvasA!: Smooth;
  private sAvasB!: Smooth;
  private sAvasGain!: Smooth;
  private sAvasLfoF!: Smooth;
  private sAvasTrem!: Smooth;
  private sAvasDepth!: Smooth;

  /* item 10: barge hull */
  private sHullG!: Smooth;

  /* mix */
  private sDuck!: Smooth;
  private sMaster!: Smooth;

  /* per-frame state, all scalars so the loop allocates nothing */
  private machineId = "";
  private key: SpecKey = "sedan";
  private v: Voice = VOICES.sedan;
  private duckLvl = 0;
  private duckPrev = 1;
  private jointAcc = 0;
  private prevGear: "D" | "N" | "R" = "N";
  private prevAuto = false;
  private prevBoostActive = false;
  private prevBoostCool = 0;
  private prevBoostArmed = true;
  private lashPrev = 0;
  private lashT = 0;
  private lastHitT = 0;
  private lastUiT = 0;
  private transient = 0;
  /** Machine-change state machine. 0 idle, 1 fading out, 2 fading back in. */
  private swapPhase = 0;
  private swapT = 0;
  private swapTo = "";

  get state(): AudioState {
    return this.st;
  }
  get muted(): boolean {
    return this.isMuted;
  }
  get volume(): number {
    return this.vol;
  }

  async enable(): Promise<boolean> {
    if (this.st === "dead") return false;
    // The latch is checked BEFORE the already-built shortcut, and that order
    // is deliberate: mid-construction this.ac is published but the graph is
    // not, so testing this.ac first would report success to a second press
    // and light the button up over a context that cannot yet make a sound.
    // Constructing and resuming takes upwards of 100 ms whenever the output
    // device has to be opened (a Bluetooth headset, WASAPI on Windows), which
    // is comfortably inside a double click, so this window is reachable by
    // hand. Without the latch two presses build two full graphs that play at
    // once and only the second is reachable by dispose().
    if (this.pending) return false;
    if (this.ac && this.built) {
      this.isMuted = false;
      this.applyAudible();
      return true;
    }
    this.pending = true;
    const gen = this.gen;
    try {
      const w = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
      const AC = w.AudioContext ?? w.webkitAudioContext;
      if (!AC) {
        // The one genuinely permanent failure. Everything else below is a
        // timing accident that a later gesture can still win.
        this.st = "dead";
        return false;
      }
      const ac = new AC({ latencyHint: "interactive" });
      // Published before the await, so the early return above is load bearing
      // for any caller that arrives later and so dispose() has something to
      // close instead of walking away from a running context.
      this.ac = ac;
      await ac.resume();
      if (gen !== this.gen) {
        // dispose() ran while we were suspended on resume(). Nothing
        // references this instance any more, so building the graph here would
        // leave oscillators and noise beds running with no loop driving them
        // and no handle able to stop them. Close and leave.
        await ac.close().catch(() => undefined);
        return false;
      }
      if (ac.state !== "running") {
        // Safari can resolve resume() with the context still suspended, and a
        // gesture that did not carry user activation lands here too. Close
        // this attempt but stay retryable: a blocked context is recoverable
        // on the next real activation, and latching "dead" here used to
        // strand touch users whose first tap simply arrived too early.
        this.ac = null;
        await ac.close().catch(() => undefined);
        return false;
      }
      this.build(ac);
      this.built = true;
      this.isMuted = false;
      this.st = "live";
      this.applyAudible();
      // An interruption on iOS (a call, or Siri) parks the context. Attempt
      // exactly one recovery and then fall silent rather than polling.
      ac.addEventListener("statechange", () => {
        if (!this.ac) return;
        if (this.ac.state === "running") this.st = this.audible() ? "live" : "suspended";
        else if (this.audible()) this.ac.resume().catch(() => undefined);
      });
      return true;
    } catch {
      // A dispose() mid-flight closes the context under us and resume() then
      // rejects. That is an orderly teardown, not a broken browser, so it must
      // not poison the state of an instance that may be enabled again later.
      if (gen === this.gen) {
        // Anything else genuinely failed mid-construction. this.ac is
        // published by now and the graph is half built, so it has to be
        // dropped AND closed: leaving it would make the early return at the
        // top of enable() hand back a broken graph on the next press.
        const bad = this.ac;
        this.ac = null;
        this.st = "dead";
        if (bad) bad.close().catch(() => undefined);
      }
      return false;
    } finally {
      this.pending = false;
    }
  }

  setMuted(v: boolean): void {
    if (this.isMuted === v) return;
    this.isMuted = v;
    this.applyAudible();
  }

  setVolume(v: number): void {
    this.vol = cl(v, 0, 1);
    // built, not just ac: the volume slider and the page lifecycle listeners
    // can both fire inside the window where enable() has published its
    // context but has not run build() yet, and the smoothers do not exist
    // until it does. The stored value below is applied by applyAudible() the
    // moment the graph comes up, so nothing is lost by skipping here.
    if (this.ac && this.built && this.audible()) this.sMaster.set(this.vol, 0.06, this.ac.currentTime);
  }

  suspend(): void {
    if (!this.active) return;
    this.active = false;
    this.applyAudible();
  }

  resume(): void {
    this.active = true;
    if (!this.ac || this.st === "dead") return;
    this.applyAudible();
  }

  private audible(): boolean {
    return !this.isMuted && this.active;
  }

  /** The one place mute, page visibility and browser suspension converge. */
  private applyAudible(): void {
    const ac = this.ac;
    // See setVolume: between the context being published and build() running
    // there is a real context but no sMaster, and blur, visibilitychange and
    // the mute button can all land in there.
    if (!ac || !this.built) return;
    if (this.suspendTimer !== null) {
      window.clearTimeout(this.suspendTimer);
      this.suspendTimer = null;
    }
    if (this.audible()) {
      this.st = "live";
      ac.resume()
        .then(() => this.sMaster.set(this.vol, 0.06, ac.currentTime))
        .catch(() => undefined);
      return;
    }
    // Fade THEN suspend. Suspending under a live gain is a step to zero at
    // the render quantum boundary, which is a click.
    this.st = "suspended";
    this.sMaster.set(0, 0.035, ac.currentTime);
    this.suspendTimer = window.setTimeout(() => {
      this.suspendTimer = null;
      if (!this.audible()) ac.suspend().catch(() => undefined);
    }, 150);
  }

  release(): void {
    // Exiting a machine is a click, so it can arrive while a context is still
    // being constructed by an earlier one. No graph means nothing to silence.
    if (!this.ac || !this.built || this.st === "dead") return;
    const t = this.ac.currentTime;
    this.sRollGain.set(0, 0.08, t);
    this.sWindGain.set(0, 0.1, t);
    this.sSqGain.set(0, 0.1, t);
    this.sPtGate.set(0, 0.08, t);
    this.sHullG.set(0, 0.1, t);
    this.machineId = "";
    this.jointAcc = 0;
    this.sqCur = 0;
  }

  dispose(): void {
    const ac = this.ac;
    // Bump first, and unconditionally. An enable() parked on resume() reads
    // this after its await: without the bump it would wake up, find nothing
    // amiss and build a complete graph on an instance that has already been
    // dropped from the singleton, which is a running context per unmount and
    // silence for the session once the browser's context cap is reached.
    this.gen++;
    if (this.suspendTimer !== null) {
      window.clearTimeout(this.suspendTimer);
      this.suspendTimer = null;
    }
    if (ac) {
      // Guarded on built, because dispose can land on an in-flight
      // construction: the node fields use definite assignment and are still
      // undefined until build() returns, so reaching into them would throw
      // before the close that actually matters.
      if (this.built) {
        try {
          this.master.gain.cancelScheduledValues(ac.currentTime);
          this.master.gain.setValueAtTime(0, ac.currentTime);
          this.revHz.stop();
          this.oscCoast.stop();
          this.oscDrive.stop();
          this.oscRegen.stop();
          this.oscTwin.stop();
          this.oscShaft.stop();
          this.oscHalf.stop();
          this.avasA.stop();
          this.avasB.stop();
          this.rollSrc.stop();
        } catch {
          // A source that was never started, or a context already closing.
          // Either way the close below is what actually matters.
        }
      }
      ac.close().catch(() => undefined);
    }
    this.built = false;
    this.ac = null;
    this.st = this.st === "dead" ? "dead" : "idle";
    if (_singleton === this) _singleton = null;
  }

  /* -------------------------------------------------------------- *
   *  Graph construction, once, inside the enabling gesture
   * -------------------------------------------------------------- */

  private build(ac: AudioContext): void {
    const noise = noiseBuffers(ac);
    const t = ac.currentTime;

    const gain = (v: number) => {
      const g = ac.createGain();
      g.gain.value = v;
      return g;
    };
    const filt = (type: BiquadFilterType, f: number, q: number, dbGain = 0) => {
      const b = ac.createBiquadFilter();
      b.type = type;
      b.frequency.value = f;
      b.Q.value = q;
      b.gain.value = dbGain;
      return b;
    };
    /** A looping noise source. Each consumer gets its own start offset and
     *  rate so the shared buffer decorrelates instead of phasing. */
    const src = (buf: AudioBuffer, rate: number, offset: number) => {
      const s = ac.createBufferSource();
      s.buffer = buf;
      s.loop = true;
      s.playbackRate.value = rate;
      s.start(t, offset % buf.duration);
      return s;
    };

    /* ---- mix bus ---- */
    this.master = gain(0);
    this.master.connect(ac.destination);
    this.sMaster = new Smooth(this.master.gain, 0.002, 0);

    // A safety net, not a colour: hard knee, high ratio, and it should never
    // engage in normal play. A limiter that is always working means the gain
    // staging upstream is already wrong.
    const lim = ac.createDynamicsCompressor();
    lim.threshold.value = -6;
    lim.knee.value = 0;
    lim.ratio.value = 20;
    lim.attack.value = 0.003;
    lim.release.value = 0.12;
    lim.connect(this.master);

    this.preGain = gain(0.9);
    this.preGain.connect(lim);

    this.duck = gain(1);
    this.duck.connect(this.preGain);
    this.sDuck = new Smooth(this.duck.gain, 0.004, 1);

    this.busSelf = gain(0.5);
    this.busSelf.connect(this.duck);
    this.busPT = gain(0.46);
    this.busPT.connect(this.duck);
    // Impacts and cockpit clicks bypass the duck deliberately. An impact
    // must not be attenuated by the thing that caused it, and a UI click
    // that can be swallowed by engine noise is a control that feels broken.
    this.busHit = gain(0.85);
    this.busHit.connect(this.preGain);
    this.busUi = gain(0.16);
    this.busUi.connect(this.preGain);

    /* ---- item 1: rolling bed and wind ---- */
    this.rollSrc = src(noise.pink, 1, 0);
    // 120 Hz high pass: the sub-band under a rolling bed is inaudible on a
    // laptop and buzzes a phone speaker, so it is energy spent on distortion.
    const rollHP = filt("highpass", 120, 0.7);
    this.rollLP = filt("lowpass", 500, 0.7);
    this.rollSurf = filt("peaking", 900, 1.2, 2);
    const rollGain = gain(0);
    this.rollSrc.connect(rollHP).connect(this.rollLP).connect(this.rollSurf).connect(rollGain).connect(this.busSelf);
    this.sRollGain = new Smooth(rollGain.gain, 0.003, 0);
    this.sRollLP = new Smooth(this.rollLP.frequency, 4, 500);
    this.sRollRate = new Smooth(this.rollSrc.playbackRate, 0.004, 1);
    this.sSurfF = new Smooth(this.rollSurf.frequency, 6, 900);
    this.sSurfG = new Smooth(this.rollSurf.gain, 0.05, 2);

    const windSrc = src(noise.white, 1, 1.7);
    const windHP = filt("highpass", 700, 0.5);
    // The band has to be closed at BOTH ends. A highpass on white noise
    // leaves a spectrum that keeps rising to Nyquist, so half the layer's
    // power sat above 12 kHz, where nothing about a car lives and where the
    // sound of it is indistinguishable from tape hiss. Real cabin wind noise
    // rolls off hard above about 4 kHz.
    const windLP = filt("lowpass", 6000, 0.7);
    const windGain = gain(0);
    windSrc.connect(windHP).connect(windLP).connect(windGain).connect(this.busSelf);
    this.sWindGain = new Smooth(windGain.gain, 0.003, 0);
    this.sWindHP = new Smooth(windHP.frequency, 8, 700);

    /* ---- item 2: powertrain ---- */
    this.ptGate = gain(0);
    this.ptGate.connect(this.busPT);
    this.sPtGate = new Smooth(this.ptGate.gain, 0.004, 0);

    // One frequency source drives every tonal voice. Two oscillators cannot
    // share a frequency param, but frequency is a-rate and connectable and a
    // connected signal ADDS to the intrinsic value, so leaving each
    // oscillator at 0 Hz and feeding it a scaled tap means one param write
    // moves the whole stack and the harmonic ratios can never drift apart
    // the way independent per-oscillator ramps do.
    this.revHz = ac.createConstantSource();
    this.revHz.offset.value = 0;
    this.revHz.start(t);
    this.sRev = new Smooth(this.revHz.offset, 0.5, 0);

    const tap = (ratio: number) => {
      const g = gain(ratio);
      this.revHz.connect(g);
      return g;
    };
    const gMesh = tap(1);
    const gHalfTap = tap(0.5);
    // 1.6, not the 3.15 this started at. The boost layer is a bare sawtooth
    // with a peaking boost on its own fundamental, and at 3.15x mesh a sedan
    // held near VMAX put that fundamental at 7.4 kHz and a monopod at 9.1,
    // which broke the "nothing above 8 kHz" line the inverter comment below
    // draws and, worse, arrived louder than the entire normalized tonal stack
    // it is supposed to sit on top of. At 1.6 the whine tops out around 3.7
    // kHz, where a supercharger whine actually lives.
    const gBoostTap = tap(1.6);
    const gTwinTap = tap(1.0075);
    this.gShaftTap = tap(1 / VOICES.sedan.teeth);

    this.wCoast = wave(ac, WAVE_COAST);
    this.wDrive = wave(ac, WAVE_DRIVE);
    this.wRegen = wave(ac, WAVE_REGEN);
    this.wReverse = wave(ac, WAVE_REVERSE);

    const tonal = gain(1);
    const lpf = filt("lowpass", 900, 0.9);
    // Silent under drive, wide open on lift. This is the tooth flank change
    // made spectral, and it is what stops regeneration sounding like a fade.
    const peaker = filt("peaking", 2000, 6, 0);
    tonal.connect(lpf).connect(peaker).connect(this.ptGate);
    this.sLpF = new Smooth(lpf.frequency, 6, 900);
    this.sLpQ = new Smooth(lpf.Q, 0.02, 0.9);
    this.sPeakF = new Smooth(peaker.frequency, 8, 2000);
    this.sPeakG = new Smooth(peaker.gain, 0.05, 0);

    const osc = (w: PeriodicWave, freqTap: GainNode) => {
      const o = ac.createOscillator();
      o.setPeriodicWave(w);
      o.frequency.value = 0;
      freqTap.connect(o.frequency);
      o.start(t);
      return o;
    };
    this.oscCoast = osc(this.wCoast, gMesh);
    this.oscDrive = osc(this.wDrive, gMesh);
    this.oscRegen = osc(this.wRegen, gMesh);
    this.oscTwin = osc(this.wDrive, gTwinTap);
    const gCoast = gain(0);
    const gDrive = gain(0);
    const gRegen = gain(0);
    const gTwin = gain(0);
    this.oscCoast.connect(gCoast).connect(tonal);
    this.oscDrive.connect(gDrive).connect(tonal);
    this.oscRegen.connect(gRegen).connect(tonal);
    this.oscTwin.connect(gTwin).connect(tonal);
    this.sCoast = new Smooth(gCoast.gain, 0.002, 0);
    this.sDrive = new Smooth(gDrive.gain, 0.002, 0);
    this.sRegen = new Smooth(gRegen.gain, 0.002, 0);
    this.sTwin = new Smooth(gTwin.gain, 0.002, 0);

    // Half-order rattle, reverse only. A reduction gear optimised for
    // forward runs on the wrong flank backing up and throws a subharmonic.
    this.oscHalf = ac.createOscillator();
    this.oscHalf.type = "sine";
    this.oscHalf.frequency.value = 0;
    gHalfTap.connect(this.oscHalf.frequency);
    this.oscHalf.start(t);
    const gHalf = gain(0);
    this.oscHalf.connect(gHalf).connect(tonal);
    this.sHalf = new Smooth(gHalf.gain, 0.002, 0);

    // Order-one imbalance, amplitude modulating the whole tonal bus. Two
    // nodes, and they are the highest realism per cycle in the module: a 6%
    // ripple at shaft rate puts sidebands around every mesh partial, which
    // is what a real gearbox looks like on a spectrogram. It converts a tone
    // into a thing that is visibly spinning.
    this.oscShaft = ac.createOscillator();
    this.oscShaft.type = "sine";
    this.oscShaft.frequency.value = 0;
    this.gShaftTap.connect(this.oscShaft.frequency);
    this.oscShaft.start(t);
    const gShaftDepth = gain(0);
    this.oscShaft.connect(gShaftDepth).connect(tonal.gain);
    this.sShaftDepth = new Smooth(gShaftDepth.gain, 0.003, 0);

    // Motor rush. A tone standing alone is the single clearest tell of a
    // synthesised engine, so the bed never drops out entirely.
    const ptNoise = src(noise.white, 1, 2.9);
    const bpBed = filt("bandpass", 400, 1.1);
    const gBed = gain(0);
    ptNoise.connect(bpBed).connect(gBed).connect(this.ptGate);
    this.sBedF = new Smooth(bpBed.frequency, 5, 400);
    this.sBedG = new Smooth(gBed.gain, 0.002, 0);

    // Inverter. Tracks CURRENT, not road speed: real pulse-width modulation
    // does not rise with velocity, and a whine that does is instantly wrong.
    // Nothing above 8 kHz, because laptop speakers roll off hard there and a
    // sustained 10 kHz tone on headphones is genuinely fatiguing.
    const bpInv = filt("bandpass", 6200, 7.5);
    const gInv = gain(0);
    ptNoise.connect(bpInv).connect(gInv).connect(this.ptGate);
    this.sInvF = new Smooth(bpInv.frequency, 12, 6200);
    this.sInvG = new Smooth(gInv.gain, 0.001, 0);

    // Micro-jitter into detune. Nothing mechanical holds pitch to the cent,
    // and perfect pitch stability is the other standard tell.
    //
    // The gain is large because it has to be, and reading it as cents is the
    // trap. Filtering noise does not preserve its amplitude, it preserves its
    // power density: white noise through this 2-pole lowpass keeps only
    // ENBW / Nyquist of its power, so the output RMS is 0.577 * sqrt(8.9 /
    // 24000), about 0.011. A gain of 9 on that is 0.1 cents of detune, two
    // orders of magnitude under the roughly 5 cent just-noticeable
    // difference, which is to say the layer cost three permanently running
    // nodes and did nothing at all. 600 puts it near 7 cents RMS, which is
    // mechanical wander rather than vibrato.
    //
    // The corner moved from 2.5 Hz to 8 for a second reason: at 2.5 Hz the
    // biquad's poles sit within 5e-5 of the unit circle, which is numerically
    // marginal at single precision and can drop the filter into denormal
    // arithmetic. 8 Hz is still far below hearing and comfortably stable.
    const jitSrc = src(noise.white, 1, 3.4);
    const jitLP = filt("lowpass", 8, 0.7);
    const gJit = gain(600);
    jitSrc.connect(jitLP).connect(gJit);
    gJit.connect(this.oscCoast.detune);
    gJit.connect(this.oscDrive.detune);
    gJit.connect(this.oscRegen.detune);
    gJit.connect(this.oscTwin.detune);

    /* ---- item 5: boost whine and rail sag ---- */
    const oscBoost = ac.createOscillator();
    oscBoost.type = "sawtooth";
    oscBoost.frequency.value = 0;
    gBoostTap.connect(oscBoost.frequency);
    oscBoost.start(t);
    const boostPeak = filt("peaking", 3000, 9, 8);
    const gBoost = gain(0);
    oscBoost.connect(boostPeak).connect(gBoost).connect(this.ptGate);
    this.sBoostF = new Smooth(boostPeak.frequency, 10, 3000);
    this.sBoostG = new Smooth(gBoost.gain, 0.002, 0);

    // The rail sags from 92 Hz to about 83 across the drain, so "you are
    // running out" is learnable without a glance at the HUD.
    const oscRail = ac.createOscillator();
    oscRail.type = "triangle";
    oscRail.frequency.value = 92;
    oscRail.start(t);
    const gRail = gain(0);
    oscRail.connect(gRail).connect(this.ptGate);
    this.sRailF = new Smooth(oscRail.frequency, 0.2, 92);
    this.sRailG = new Smooth(gRail.gain, 0.002, 0);

    /* ---- item 7: limiter flutter ---- */
    // Not a beep. A beep says a number crossed a threshold; a flutter on the
    // engine's own top resonance says the MACHINE is at its ceiling, and it
    // is delivered by the thing already making the sound. Routed into the
    // peaking filter's dB gain rather than a volume, so it wobbles timbre
    // instead of pumping level.
    const limLfo = ac.createOscillator();
    limLfo.type = "sine";
    limLfo.frequency.value = 3.2;
    limLfo.start(t);
    const gLimDepth = gain(0);
    limLfo.connect(gLimDepth).connect(peaker.gain);
    this.sLimDepth = new Smooth(gLimDepth.gain, 0.02, 0);

    /* ---- item 4: squeal, lockup, scrape ---- */
    // Two bandpasses at a non-integer ratio. One alone reads as filtered
    // wind; a formant pair reads as rubber.
    const sqSrc = src(noise.white, 1, 0.6);
    const sqBP1 = filt("bandpass", 1200, 8);
    const sqBP2 = filt("bandpass", 1776, 6.2);
    const sqGain = gain(0);
    sqSrc.connect(sqBP1).connect(sqGain);
    sqSrc.connect(sqBP2).connect(sqGain);
    sqGain.connect(this.busSelf);
    this.sSqF1 = new Smooth(sqBP1.frequency, 6, 1200);
    this.sSqF2 = new Smooth(sqBP2.frequency, 8, 1776);
    this.sSqQ1 = new Smooth(sqBP1.Q, 0.05, 8);
    this.sSqQ2 = new Smooth(sqBP2.Q, 0.05, 6.2);
    this.sSqGain = new Smooth(sqGain.gain, 0.003, 0);

    /* ---- item 8: pedestrian alert ---- */
    // At walking pace the dominant sound of a real electric vehicle is the
    // mandated alert, not the motor, and its absence is much of why silent
    // machines read as props. It crossfades out between 4.2 and 5.6 u/s,
    // which is where the mesh whine crossfades in, so low speed stops being
    // a hole in the mix.
    this.avasA = ac.createOscillator();
    this.avasA.type = "sawtooth";
    this.avasA.frequency.value = 220;
    this.avasA.start(t);
    this.avasB = ac.createOscillator();
    this.avasB.type = "sawtooth";
    this.avasB.frequency.value = 330;
    this.avasB.start(t);
    const avasMix = gain(0.5);
    this.avasA.connect(avasMix);
    this.avasB.connect(avasMix);
    const avasLP = filt("lowpass", 1600, 0.7);
    const avasTrem = gain(1);
    const gAvas = gain(0);
    avasMix.connect(avasLP).connect(avasTrem).connect(gAvas).connect(this.ptGate);
    this.sAvasA = new Smooth(this.avasA.frequency, 0.5, 220);
    this.sAvasB = new Smooth(this.avasB.frequency, 0.8, 330);
    this.sAvasGain = new Smooth(gAvas.gain, 0.002, 0);
    // One LFO with two personalities: a slow deep gate in reverse, a fast
    // shallow shimmer in drive. The tremolo gain is written as (1 - depth)
    // with the LFO adding up to depth, which keeps the multiplier positive:
    // letting it swing negative would phase-invert the alert rather than
    // silence it between beeps.
    const avasLfo = ac.createOscillator();
    avasLfo.type = "sine";
    avasLfo.frequency.value = 4.5;
    avasLfo.start(t);
    const gAvasDepth = gain(0);
    avasLfo.connect(gAvasDepth).connect(avasTrem.gain);
    this.sAvasLfoF = new Smooth(avasLfo.frequency, 0.05, 4.5);
    this.sAvasTrem = new Smooth(avasTrem.gain, 0.005, 1);
    this.sAvasDepth = new Smooth(gAvasDepth.gain, 0.005, 0);

    /* ---- item 10: barge hull thrum ---- */
    const hull = ac.createOscillator();
    hull.type = "sine";
    hull.frequency.value = 34;
    hull.start(t);
    const hullLP = filt("lowpass", 90, 0.7);
    const gHull = gain(0);
    hull.connect(hullLP).connect(gHull).connect(this.busSelf);
    this.sHullG = new Smooth(gHull.gain, 0.002, 0);

    this.applyVoice("sedan", t);
  }

  /** Swap the per-machine constants. Called on a machine change, inside the
   *  silent window of the fade so no discontinuity is audible. */
  private applyVoice(key: SpecKey, t: number): void {
    this.key = key;
    this.v = VOICES[key];
    this.gShaftTap.gain.setValueAtTime(1 / this.v.teeth, t);
  }

  /* -------------------------------------------------------------- *
   *  Per frame
   * -------------------------------------------------------------- */

  sync(f: CityAudioFrame, dt: number): void {
    const ac = this.ac;
    if (!ac || this.st !== "live") return;
    const t = ac.currentTime;
    const step = cl(dt, 0, 0.1);

    // Ducking is rig-predicted rather than measured. An AnalyserNode would
    // cost a 2048-float main-thread copy per frame to derive a loudness the
    // frame already gives us for free and one frame earlier. Fast attack,
    // slow release: a symmetric duck reads as a pumping compressor, an
    // asymmetric one reads as impact.
    this.duckLvl *= Math.exp(-step / 0.4);
    const duckTarget = 1 - cl(this.duckLvl, 0, 0.6);
    this.sDuck.set(duckTarget, duckTarget < this.duckPrev ? 0.025 : 0.12, t);
    this.duckPrev = duckTarget;

    if (!f.driven || f.kind === "bot") {
      this.silence(t);
      return;
    }

    // Machine change. K_MESH moves by up to 60% between machines, so a
    // smoothed transition would glide the pitch down over a second and a
    // half and sound like a broken tape. Fade out, jump, fade back in: what
    // you hear is a re-spool, which is what getting into a different vehicle
    // should sound like.
    if (f.machineId !== this.machineId && this.swapTo !== f.machineId) {
      if (this.machineId === "") {
        this.machineId = f.machineId;
        this.applyVoice(f.specKey, t);
        this.resetEdges(f);
      } else {
        this.swapTo = f.machineId;
        this.swapPhase = 1;
        this.swapT = 0;
      }
    }
    if (this.swapPhase === 1) {
      this.sPtGate.set(0, 0.02, t);
      this.swapT += step;
      if (this.swapT >= 0.06) {
        this.machineId = this.swapTo;
        this.applyVoice(f.specKey, t);
        this.resetEdges(f);
        this.sRev.jump(0, t);
        this.swapPhase = 2;
        this.swapT = 0;
      }
    } else if (this.swapPhase === 2) {
      this.swapT += step;
      if (this.swapT >= 0.09) {
        this.swapPhase = 0;
        this.swapTo = "";
      }
    }

    const boat = f.kind === "boat";
    const vfa = Math.abs(f.vf);
    const n = cl(f.speed / FLEET_VMAX, 0, 1);

    this.motionBed(f, n, t, boat);
    if (boat) this.bargeVoice(f, n, t);
    else {
      this.powertrain(f, vfa, t);
      this.tyres(f, t);
      this.boost(f, t);
      this.deckJoints(f, n, step, t);
    }
    this.events(f, t);
  }

  /** Everything off, but the graph stays up and the world keeps its level.
   *  Used for the humanoid, for free look and between machines. */
  private silence(t: number): void {
    this.sRollGain.set(0, 0.08, t);
    this.sWindGain.set(0, 0.1, t);
    this.sSqGain.set(0, 0.1, t);
    this.sPtGate.set(0, 0.08, t);
    this.sHullG.set(0, 0.1, t);
    this.machineId = "";
    this.jointAcc = 0;
    this.sqCur = 0;
  }

  private resetEdges(f: CityAudioFrame): void {
    // The takeover seeding and the autopilot branch both write rig.gear
    // directly, so a naive edge detector fires a spurious clunk on every
    // takeover and every autopilot engage unless it is re-based here.
    this.prevGear = f.gear;
    this.prevAuto = f.autoActive;
    this.prevBoostActive = f.boostActive;
    this.prevBoostCool = f.boostCool;
    this.prevBoostArmed = f.boost >= BOOST_ARM;
    this.lashPrev = 0;
    this.jointAcc = 0;
    this.sqCur = 0;
  }

  /* ---- item 1 ---- */

  private motionBed(f: CityAudioFrame, n: number, t: number, boat: boolean): void {
    // The 0.6 exponent is deliberate. Linear gain leaves the bed inaudible
    // at parking speed, and parking speed is the first thing anyone
    // experiences after clicking a truck. At a 1 u/s creep this is quiet but
    // present, which is the same reasoning the chassis uses for its
    // kinematic blend threshold.
    const air = f.airborne;
    const roll = boat ? 0.42 * Math.sqrt(n) : 0.5 * Math.pow(n, 0.6);
    const rollTarget = f.speed < 0.15 ? 0 : air ? 0 : roll;
    // Off the flyover the road noise has to vanish completely, and fast:
    // that silence is the moment the viaduct stops being scenery.
    this.sRollGain.set(rollTarget, air ? 0.04 : 0.05, t);
    // If only one mapping could ship it would be this one, not the gain.
    // Brightness is how ears read speed; level is how they read proximity, so
    // a bed that only gets louder reads as the camera moving closer.
    this.sRollLP.set(boat ? 220 + 700 * n : 400 + 2600 * n, 0.06, t);
    // Playback rate is the tread-passing frequency in disguise: shifting the
    // whole buffer gets that character for no extra nodes. Water has no
    // tread, so a barge holds rate 1.
    this.sRollRate.set(boat ? 1 : 0.9 + 0.45 * n, 0.15, t);

    const surf = f.surface;
    this.sSurfF.set(surf === 2 ? 340 : surf === 1 ? 1500 : 900, 0.08, t);
    this.sSurfG.set(surf === 2 ? 4 : surf === 1 ? 6 : 2, 0.08, t);

    // Wind is the weakest layer here and it is the first thing to pull if
    // the mix ever feels hissy, never the tyres: top speed is 74 km/h and
    // real wind noise at that speed is modest, while this occupies the same
    // broadband high band the tyre bed is using to do the real work. It
    // stays live while airborne, because you are still moving through air
    // and it is what keeps a jump from being total silence.
    //
    // 0.10, down from 0.35, because the comment above was aspirational and
    // the numbers said the opposite. A sedan at VMAX ran this at 0.224 on
    // white noise for an RMS near 0.12, against about 0.065 for the pink,
    // band-limited roll bed underneath: wind was 5.5 dB hotter in raw RMS and
    // sat two decades higher in frequency, so top speed read as hiss over a
    // muffled rumble instead of as tyres and motor. That is precisely
    // backwards for a layer whose job is perceived speed.
    this.sWindGain.set(0.1 * n * n, 0.12, t);
    this.sWindHP.set(700 + 1800 * n, 0.1, t);
  }

  /* ---- item 2 ---- */

  private powertrain(f: CityAudioFrame, vfa: number, t: number): void {
    const v = this.v;
    const rev = f.gear === "R";
    const air = f.airborne;

    // vf, never speed. speed is hypot(vf, vl), so in a slide it rises with
    // lateral velocity and the engine would pitch UP while the wheels are
    // being dragged sideways, which is the wrong direction.
    //
    // The slipDrive term is a 5.5% lift when drive is clipping the traction
    // cap, which is the flare you hear as a car breaks traction. Airborne
    // gets a 6% lift and its load cut to 15%, because traction control
    // pulls torque the instant the wheels unload and free-spinning wheels
    // overspeed slightly. Boost needs no special case at all: vf is clamped
    // against VMAX * boostV, so pitch climbs a genuine 25% for free.
    const fMesh = v.kMesh * Math.max(vfa, 0.35) * (1 + 0.055 * f.slipDrive) * (air ? 1.06 : 1);
    if (this.swapPhase !== 1) this.sRev.set(fMesh, 0.02, t);

    const load = f.load * (air ? 0.15 : 1);
    // Regeneration is braking effort as a fraction of what this machine can
    // put down, and it is mutually exclusive with drive by construction.
    const regenCap = Math.max(f.ACCEL * 0.35, 0.5);
    const regen = cl(f.aBrake / regenCap, 0, 1) * (1 - load);
    const spd = cl((vfa - 0.25) / 1.4, 0, 1);
    // Ear sensitivity peaks near 3 to 4 kHz and a constant-gain engine is
    // genuinely painful up there on headphones. About 3 dB off above 2.2 kHz
    // is the difference between "fast" and "make it stop".
    const loud = 1 - 0.3 * cl((fMesh - 2200) / 1400, 0, 1);
    // The 0.34 floor is deliberate: an electric machine coasting at speed is
    // clearly audible, and gating the whine to zero on lift is the second
    // most common way a synthesised engine dies.
    const mixLvl = (0.34 + 0.66 * load) * loud;
    const base = 0.16 * spd * mixLvl;

    // Equal power, so the crossfade does not dip through the middle.
    this.sCoast.set(base * Math.sqrt(Math.max(0, 1 - load - regen)), 0.045, t);
    this.sDrive.set(base * Math.sqrt(load) * (rev ? 1.3 : 1), 0.045, t);
    this.sRegen.set(base * Math.sqrt(regen), 0.045, t);
    this.sTwin.set(v.twin ? base * Math.sqrt(load) * 0.55 : 0, 0.045, t);
    this.sHalf.set(rev ? 0.22 * load * base * 4 : 0, 0.05, t);

    // This pair is the whole anti-theremin argument. Coasting the cutoff
    // sits at 1.6 times mesh with a low Q: fundamental plus a whisper of the
    // second, thin and glassy. At full load it is six times mesh with the
    // corner lifted: six harmonics and more bite, rich and straining. Timbre
    // moves independently of pitch, which is what a pitch-only synth can
    // never do.
    //
    // Q is capped at about 1.6 and NOT used as the source of that bite. A
    // lowpass biquad's response at its own cutoff is exactly Q, so the 4.1
    // this used to reach was a +12 dB resonant peak, and sLpF parks that peak
    // at six times mesh. A sedan at a wholly ordinary 30 km/h puts it at 4.5
    // kHz, so every throttle application dragged an ice pick across the
    // 2.5 to 9 kHz band the ear is most sensitive in. The `loud` trim above
    // was written to protect that band but only engages above 2200 Hz of
    // MESH, which across this fleet only the monopod on boost ever reaches,
    // so it was inert for five machines out of six. Bite now comes from
    // sPeakG and the noise bed, which are level controls and cannot ring.
    this.sLpF.set(cl(fMesh * (1.6 + 4.4 * load), 400, 8000), 0.035, t);
    this.sLpQ.set(0.9 + 0.7 * load, 0.06, t);
    this.sPeakF.set(cl(fMesh * 2.6, 120, 14000), 0.05, t);
    this.sPeakG.set(11 * regen, 0.05, t);

    this.sBedF.set(cl(fMesh * 0.55, 120, 3200), 0.05, t);
    this.sBedG.set(0.11 * v.bed * (0.25 + 0.75 * spd) * (0.55 + 0.45 * load), 0.05, t);

    // 0.12 is standby current. The regen term is why lift-off still sizzles,
    // and that one detail is what makes regeneration sound electric.
    this.sInvF.set(6200 + 900 * load, 0.06, t);
    this.sInvG.set(0.055 * v.inv * (0.12 + 0.88 * Math.max(load, regen * 0.8)), 0.03, t);

    this.sShaftDepth.set(0.06 * (0.4 + 0.6 * load) * spd, 0.06, t);

    // The reverse wave swap happens inside the machine-change fade window
    // only; mid-note setPeriodicWave is a discontinuity, so between gears it
    // is handled by holding a wave per direction and crossfading the drive
    // gain, which the 1.3 multiplier above already does.
    if (rev !== this.revWaveOn) {
      this.revWaveOn = rev;
      this.oscDrive.setPeriodicWave(rev ? this.wReverse : this.wDrive);
    }

    this.sLimDepth.set(f.limiter ? 2 : 0, f.limiter ? 0.12 : 0.25, t);
    if (this.swapPhase === 0) this.sPtGate.set(1, 0.09, t);
  }

  private revWaveOn = false;

  /* ---- item 4 ---- */

  private tyres(f: CityAudioFrame, t: number): void {
    // No squeal at a crawl: a stationary car scrubbing its tyres is a bug.
    const sg = cl((f.speed - 1.2) / 3, 0, 1);
    // Onset at 0.55 is a hair under the cockpit's own LOOSE threshold of
    // 0.6, on purpose: the sound should LEAD the label, so you hear it going
    // before you read that it went. If audio and the HUD disagree about
    // whether the car is sliding, the game is lying to the player.
    const sl = ss(f.gripLoss, 0.55, 0.95);
    const scr = cl(f.scrub / 3, 0, 1);

    let f1: number;
    let q: number;
    let lvl: number;
    if (scr > 0.15) {
      // Scrape wins over squeal. They share one voice, so power-oversteering
      // into a tower plays the wall, which is the more urgent information.
      f1 = 380;
      q = 2.5;
      lvl = 0.44 * scr;
    } else if (f.hb) {
      // A locked tyre slides instead of stick-slipping, so the formant
      // collapses: Q from about 9 down to 1.2 and the centre from 1500 to
      // 620 turns a pitched squeal into a broadband skid. Zero new nodes for
      // a completely different sound, off a boolean the chassis already
      // publishes with three real physical consequences behind it.
      f1 = 620;
      q = 1.2;
      lvl = 0.5 * sg;
    } else {
      f1 = 1050 + 900 * cl(Math.abs(f.beta) / 0.45, 0, 1) + 220 * cl(f.r / 2, -1, 1);
      // driftHeat is eased at about 2.2 rad/s by the chassis, so a brief
      // scrub stays broad and gritty while a held drift narrows onto a tone.
      // That is what steady-state stick-slip does, and it means a flick of
      // oversteer and a committed slide sound different, which is
      // information the player can act on.
      q = 6 + 6 * f.driftHeat;
      lvl = 0.32 * sl * sg;
    }

    // Asymmetric, and required: setTargetAtTime alone is symmetric, and a
    // squeal that fades in as slowly as it fades out is mush.
    const tau = lvl > this.sqCur ? 0.02 : 0.14;
    this.sqCur += (lvl - this.sqCur) * 0.35;
    this.sSqF1.set(f1, 0.05, t);
    this.sSqF2.set(f1 * 1.48, 0.05, t);
    this.sSqQ1.set(q, 0.08, t);
    this.sSqQ2.set(q * 0.78, 0.08, t);
    this.sSqGain.set(lvl, tau, t);
  }

  /* ---- item 5 and item 8 ---- */

  private boost(f: CityAudioFrame, t: number): void {
    const v = this.v;
    const vfa = Math.abs(f.vf);
    const spd = cl((vfa - 0.25) / 1.4, 0, 1);
    // boostK is already eased at 8 rad/s by the physics, specifically so it
    // never steps, so it is used directly as the envelope rather than
    // smoothed again.
    const bK = cl((f.boostK - 1) / 0.8, 0, 1);
    // The 1.6 must match gBoostTap: this is the peaking filter tracking the
    // oscillator's own fundamental, so a mismatch parks the boost on a
    // harmonic instead. The ceiling is 5 kHz rather than the old 16, which
    // only ever mattered because the tap itself was three times too high.
    this.sBoostF.set(cl(v.kMesh * Math.max(vfa, 0.35) * 1.6, 200, 5000), 0.03, t);
    // 0.03, down from 0.075. A sawtooth's fundamental is 2/pi of its peak and
    // boostPeak adds another 8 dB on top of exactly that partial, so the old
    // figure produced a near pure tone hotter than the engine underneath it.
    this.sBoostG.set(0.03 * bK * spd, 0.025, t);
    this.sRailF.set(92 * (0.9 + 0.1 * f.boost), 0.1, t);
    this.sRailG.set(0.05 * bK, 0.03, t);

    // Pedestrian alert. Fades in from a standstill and hands over to the
    // mesh whine between 4.2 and 5.6 u/s, which is roughly the 30 km/h
    // regulatory cutover in this world's scale.
    const fade = ss(vfa, 0.15, 0.6) * (1 - ss(vfa, 4.2, 5.6));
    const rev = f.gear === "R";
    const fA = v.avas * (1 + 0.5 * cl(vfa / 5.05, 0, 1));
    this.sAvasA.set(fA, 0.05, t);
    this.sAvasB.set(fA * 1.5, 0.05, t);
    this.sAvasGain.set(0.09 * v.avasLvl * fade * (rev ? 1.35 : 1), 0.05, t);
    this.sAvasLfoF.set(rev ? 1.9 : 4.5, 0.08, t);
    const depth = rev ? 0.45 : 0.05;
    this.sAvasTrem.set(1 - depth, 0.08, t);
    this.sAvasDepth.set(depth, 0.08, t);
  }

  /* ---- item 6 ---- */

  private deckJoints(f: CityAudioFrame, n: number, step: number, t: number): void {
    // Spatial, not temporal. Expansion joints are two units apart, so the
    // thumps correctly speed up with the car, slow as it slows, and stop
    // when it stops. A sine tremolo LFO would be wrong here: joints are
    // impulsive, and a 5 Hz wobble on a bus reads as a broken gain stage.
    if (f.surface !== 1 || f.airborne) {
      this.jointAcc = 0;
      return;
    }
    this.jointAcc += Math.abs(f.vf) * step;
    let guard = 0;
    while (this.jointAcc > 2 && guard++ < 8) {
      this.jointAcc -= 2;
      this.fireJoint(n, t);
    }
  }

  /* ---- item 10 ---- */

  private bargeVoice(f: CityAudioFrame, n: number, t: number): void {
    // The boat branch returns early from the chassis before load, gripLoss,
    // the gearbox and the booster are ever written, so every powertrain,
    // squeal, boost and alert layer above is structurally dead on a barge.
    // Giving it a gearbox whine would be inventing data. It gets water and a
    // hull thrum instead, and the squeal voice is re-pointed at bow wash off
    // the helm.
    this.sPtGate.set(0, 0.12, t);
    const wash = cl(Math.abs(f.r) / 0.6, 0, 1) * cl(n * 2, 0, 1);
    this.sSqF1.set(300, 0.12, t);
    this.sSqF2.set(444, 0.12, t);
    this.sSqQ1.set(1.5, 0.12, t);
    this.sSqQ2.set(1.2, 0.12, t);
    this.sSqGain.set(0.26 * wash, wash > this.sqCur ? 0.08 : 0.25, t);
    this.sqCur = wash;
    this.sHullG.set(0.1 * (0.3 + 0.7 * n), 0.12, t);
  }

  /* ---- item 3 and item 7: edges and one-shots ---- */

  private events(f: CityAudioFrame, t: number): void {
    // 0.35 u/s closing is a genuine nudge; below it nothing fires. The 60 ms
    // gate is what stops a machine-gun: resolveContacts runs up to twelve
    // times a frame and a car RESTING against a bollard is in contact on
    // every one of them.
    if (f.impact > 0.35 && t - this.lastHitT > 0.06) {
      this.lastHitT = t;
      this.fireImpact(f.impact, f.halfWB, t);
    }
    if (f.landing > 0.8) this.fireLanding(f.landing, f.halfWB, t);

    if (f.gear !== this.prevGear) {
      this.prevGear = f.gear;
      this.fireGear(t);
    }
    if (f.autoActive !== this.prevAuto) {
      this.prevAuto = f.autoActive;
      this.fireGlide(f.autoActive ? 440 : 660, f.autoActive ? 660 : 415, f.autoActive ? 0.14 : 0.18, 0.11, t);
    }
    // The chassis keeps the BUTTON and the EFFECT distinct, so a press that
    // did nothing correctly makes no sound here.
    if (f.boostActive && !this.prevBoostActive) this.fireGlide(400, 1400, 0.22, 0.16, t);
    this.prevBoostActive = f.boostActive;
    if (f.boostCool > 0 && this.prevBoostCool <= 0) this.fireGlide(700, 430, 0.14, 0.1, t);
    this.prevBoostCool = f.boostCool;
    const armed = f.boost >= BOOST_ARM;
    if (armed && !this.prevBoostArmed) this.fireBlip(880, 0.06, 0.07, t);
    this.prevBoostArmed = armed;

    // Lash take-up: the clunk you feel through the seat when you lift in a
    // real electric car, and the most convincing 45 ms in the design. The
    // edge is derived here from levels the engine reads itself, which is why
    // nothing in this module depends on a channel the chassis clears.
    const regenCap = Math.max(f.ACCEL * 0.35, 0.5);
    const lash = f.load - cl(f.aBrake / regenCap, 0, 1);
    if (Math.abs(lash - this.lashPrev) > 0.22 && t - this.lashT > 0.12 && Math.abs(f.vf) > 0.3) {
      this.lashT = t;
      this.fireLash(Math.abs(lash - this.lashPrev), t);
    }
    this.lashPrev = lash;
  }

  ui(kind: UiSound): void {
    const ac = this.ac;
    if (!ac || this.st !== "live") return;
    const t = ac.currentTime;
    if (t - this.lastUiT < 0.045) return;
    this.lastUiT = t;
    if (kind === "exit") this.fireGlide(760, 380, 0.16, 0.12, t);
    else this.fireClick(t);
    this.duckLvl = Math.max(this.duckLvl, 0.2);
  }

  /* -------------------------------------------------------------- *
   *  Transient voices
   *
   *  These are the only nodes created after graph-build time, and the
   *  exception is forced rather than chosen: a started AudioBufferSourceNode
   *  cannot be restarted. Events are rare, the nodes self-collect on ended,
   *  and a hard cap plus a rate limit keeps a player mashing a pedal from
   *  leaking voices.
   * -------------------------------------------------------------- */

  private canFire(): boolean {
    return this.transient < 6;
  }

  private noiseBurst(t: number, dur: number, offsetSpread: number): AudioBufferSourceNode | null {
    const ac = this.ac;
    if (!ac) return null;
    const buf = noiseBuffers(ac).white;
    const s = ac.createBufferSource();
    s.buffer = buf;
    s.loop = false;
    const off = Math.random() * Math.max(0.01, buf.duration - offsetSpread);
    this.transient++;
    s.start(t, off, dur);
    s.onended = () => {
      this.transient--;
      s.disconnect();
    };
    return s;
  }

  /**
   * Release a one-shot's whole chain, not just its source.
   *
   * Disconnecting the AudioBufferSourceNode alone leaves its filters and
   * gains still connected to their bus, where they stay reachable from
   * destination and are therefore retained AND pulled on every render
   * quantum for the rest of the page load. Deck joints fire about five times
   * a second on the flyover, so three minutes of viaduct driving used to
   * strand roughly nine hundred nodes on busHit, with impacts, landings,
   * lash clunks and cockpit clicks adding to the pile. The transient cap
   * bounds concurrent SOURCES, which is a different thing entirely.
   *
   * Replaces the handler noiseBurst installed, so the count is decremented
   * exactly once either way.
   */
  private trail(s: AudioBufferSourceNode, tail: AudioNode[]): void {
    s.onended = () => {
      this.transient--;
      s.disconnect();
      for (let i = 0; i < tail.length; i++) tail[i].disconnect();
    };
  }

  private fireImpact(imp: number, halfWB: number, t: number): void {
    const ac = this.ac;
    if (!ac || !this.canFire()) return;
    // sev matches the chassis's own severity reference of 2 u/s, which it
    // already uses to scale tangential scrub and yaw damping. Audio agreeing
    // means a hit that FEELS full severity also SOUNDS it.
    const sev = cl(imp / 2, 0, 1);
    const loud = cl(imp / 4, 0, 1);
    const T = 0.1 + 0.35 * sev;
    const src = this.noiseBurst(t, T + 0.12, 0.5);
    if (!src) return;

    // Crack. Brightness is a stronger "how hard" cue than loudness.
    const bpC = ac.createBiquadFilter();
    bpC.type = "bandpass";
    bpC.frequency.value = 900 + 2200 * sev;
    bpC.Q.value = 1;
    const gC = ac.createGain();
    gC.gain.setValueAtTime(0.0001, t);
    gC.gain.exponentialRampToValueAtTime(0.18 + 0.55 * loud, t + 0.003);
    gC.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);

    // Body. An impulse into a narrow bandpass IS a damped sinusoid, which is
    // exactly what a panel mode is, and it is what gives a hit mass. The
    // centre comes from the half wheelbase, so the fleet differentiates
    // itself: a monopod tings at the clamp, a semi thuds at 65 Hz.
    //
    // Q and gain here are joined at the hip, and getting that wrong is what
    // made the body inaudible for a long time. A Web Audio bandpass is unity
    // at centre, so noise through it comes out scaled by sqrt(ENBW / Nyquist):
    // at Q 12 and 162 Hz that passed about 21 Hz of bandwidth for an output
    // RMS near 0.017, against 0.21 for the Q 1 crack. Same nominal gain, 20 dB
    // apart in reality, before the ear's low-frequency insensitivity is even
    // counted, so every collision landed as a bright tick with no mass and the
    // per-machine differentiation below was inaudible. Q 5 widens the band by
    // 2.4x and the 4x envelope covers the rest.
    const bpB = ac.createBiquadFilter();
    bpB.type = "bandpass";
    bpB.frequency.value = cl((130 * 0.9) / Math.max(halfWB, 0.2), 60, 240);
    bpB.Q.value = 5;
    const gB = ac.createGain();
    gB.gain.setValueAtTime(0.0001, t);
    gB.gain.exponentialRampToValueAtTime(0.9 + 2.4 * loud, t + 0.008);
    gB.gain.exponentialRampToValueAtTime(0.0001, t + T);

    src.connect(bpC).connect(gC).connect(this.busHit);
    src.connect(bpB).connect(gB).connect(this.busHit);
    this.trail(src, [bpC, gC, bpB, gB]);
    this.duckLvl = Math.max(this.duckLvl, 0.35 * sev);
  }

  private fireLanding(land: number, halfWB: number, t: number): void {
    const ac = this.ac;
    if (!ac || !this.canFire()) return;
    const sev = cl(land / 10, 0, 1);
    const src = this.noiseBurst(t, 0.3, 0.4);
    if (!src) return;
    // Suspension bottoming is duller than a panel strike, so this sits 60 Hz
    // below the collision body and carries more weight in the low end.
    const bpB = ac.createBiquadFilter();
    bpB.type = "bandpass";
    bpB.frequency.value = cl((130 * 0.9) / Math.max(halfWB, 0.2) - 60, 45, 200);
    bpB.Q.value = 9;
    const gB = ac.createGain();
    gB.gain.setValueAtTime(0.0001, t);
    gB.gain.exponentialRampToValueAtTime(0.3 + 0.55 * sev, t + 0.01);
    gB.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    // Tyres slapping down on contact.
    const bpS = ac.createBiquadFilter();
    bpS.type = "bandpass";
    bpS.frequency.value = 1200;
    bpS.Q.value = 1.4;
    const gS = ac.createGain();
    gS.gain.setValueAtTime(0.0001, t);
    gS.gain.exponentialRampToValueAtTime(0.1 + 0.2 * sev, t + 0.006);
    gS.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    src.connect(bpB).connect(gB).connect(this.busHit);
    src.connect(bpS).connect(gS).connect(this.busHit);
    this.trail(src, [bpB, gB, bpS, gS]);
    this.duckLvl = Math.max(this.duckLvl, 0.4 * sev);
  }

  private fireJoint(n: number, t: number): void {
    const ac = this.ac;
    if (!ac || !this.canFire()) return;
    const src = this.noiseBurst(t, 0.06, 0.2);
    if (!src) return;
    const lp = ac.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 260;
    lp.Q.value = 0.9;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.1 + 0.16 * n, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
    src.connect(lp).connect(g).connect(this.busHit);
    this.trail(src, [lp, g]);
  }

  private fireLash(mag: number, t: number): void {
    const ac = this.ac;
    if (!ac || !this.canFire()) return;
    const peak = 0.28 * cl(mag, 0, 1);
    const o = ac.createOscillator();
    o.type = "sine";
    o.frequency.value = 165;
    const g = ac.createGain();
    g.gain.setValueAtTime(peak, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
    o.connect(g).connect(this.busHit);
    this.transient++;
    o.start(t);
    o.stop(t + 0.05);
    o.onended = () => {
      this.transient--;
      o.disconnect();
      g.disconnect();
    };
    const src = this.noiseBurst(t, 0.02, 0.1);
    if (!src) return;
    const bp = ac.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 900;
    bp.Q.value = 1.2;
    const gn = ac.createGain();
    gn.gain.setValueAtTime(peak * 0.6, t);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.012);
    src.connect(bp).connect(gn).connect(this.busHit);
    this.trail(src, [bp, gn]);
  }

  private fireGear(t: number): void {
    const ac = this.ac;
    if (!ac || !this.canFire()) return;
    const o = ac.createOscillator();
    o.type = "sine";
    o.frequency.value = 90;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    o.connect(g).connect(this.busUi);
    this.transient++;
    o.start(t);
    o.stop(t + 0.08);
    o.onended = () => {
      this.transient--;
      o.disconnect();
      g.disconnect();
    };
    const src = this.noiseBurst(t, 0.035, 0.1);
    if (!src) return;
    const lp = ac.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 400;
    const gn = ac.createGain();
    gn.gain.setValueAtTime(0.35, t);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
    src.connect(lp).connect(gn).connect(this.busUi);
    this.trail(src, [lp, gn]);
  }

  private fireClick(t: number): void {
    const ac = this.ac;
    if (!ac || !this.canFire()) return;
    const src = this.noiseBurst(t, 0.02, 0.1);
    if (src) {
      const hp = ac.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 3000;
      const g = ac.createGain();
      g.gain.setValueAtTime(0.6, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.008);
      src.connect(hp).connect(g).connect(this.busUi);
      this.trail(src, [hp, g]);
    }
    const o = ac.createOscillator();
    o.type = "triangle";
    o.frequency.value = 1750;
    const g2 = ac.createGain();
    g2.gain.setValueAtTime(0.28, t);
    g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.018);
    o.connect(g2).connect(this.busUi);
    this.transient++;
    o.start(t);
    o.stop(t + 0.02);
    o.onended = () => {
      this.transient--;
      o.disconnect();
      g2.disconnect();
    };
  }

  private fireBlip(hz: number, dur: number, peak: number, t: number): void {
    const ac = this.ac;
    if (!ac || !this.canFire()) return;
    const o = ac.createOscillator();
    o.type = "sine";
    o.frequency.value = hz;
    const g = ac.createGain();
    g.gain.setValueAtTime(peak, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.busUi);
    this.transient++;
    o.start(t);
    o.stop(t + dur + 0.01);
    o.onended = () => {
      this.transient--;
      o.disconnect();
      g.disconnect();
    };
  }

  /** A swept tone. Used for boost engage, the refusal blip and the autopilot
   *  handoff, all of which are direction-carrying cues rather than alerts. */
  private fireGlide(from: number, to: number, dur: number, peak: number, t: number): void {
    const ac = this.ac;
    if (!ac || !this.canFire()) return;
    const o = ac.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(from, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + dur);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.busUi);
    this.transient++;
    o.start(t);
    o.stop(t + dur + 0.02);
    o.onended = () => {
      this.transient--;
      o.disconnect();
      g.disconnect();
    };
  }
}

/* ---------------------------------------------------------------- *
 *  Module singleton and frame factory
 * ---------------------------------------------------------------- */

let _singleton: CityAudio | null = null;

/**
 * The engine for this page load, in the shape of the scene's existing lazy
 * singletons. Constructs NOTHING until enable() is called from a gesture, so
 * calling this during render is free.
 */
export function getCityAudio(): CityAudioHandle {
  if (!_singleton) _singleton = new CityAudio();
  return _singleton;
}

/** One frame object, allocated by the caller and mutated in place forever. */
export function createAudioFrame(): CityAudioFrame {
  return {
    driven: false,
    kind: "car",
    machineId: "",
    specKey: "sedan",
    halfWB: 0.72,
    VMAX: 10,
    ACCEL: 12.5,
    vf: 0,
    speed: 0,
    beta: 0,
    r: 0,
    load: 0,
    slipDrive: 0,
    aBrake: 0,
    gripLoss: 0,
    driftHeat: 0,
    hb: 0,
    gear: "N",
    boost: 1,
    boostK: 1,
    boostActive: false,
    boostCool: 0,
    autoActive: false,
    airborne: false,
    surface: 0,
    impact: 0,
    landing: 0,
    scrub: 0,
    limiter: false,
  };
}
