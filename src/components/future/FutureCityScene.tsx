"use client";
/**
 * FutureCityScene, hero-banner pass: a year-2040 establishing shot rebuilt
 * around the detailed humanoid and vehicle assets in ./assets. A levitating
 * cloud brain over a central plaza, articulated humanoids walking the loop
 * (one pauses to watch the landing pad), a kneeling pair assembling a frame
 * in sync with the beam cycle, one idle unit posed three-quarter to the
 * camera in the near field, angular pickups and a smooth sedan gliding the
 * ring road, and a slow semi on an outer bypass that makes the towers read
 * tall.
 *
 * Cinematography: cool moonlight key from camera-left, a low warm amber rim
 * spot raking from behind the plaza so silhouettes get an edge, dim fill, a
 * barely-reflective ground (drei MeshReflectorMaterial, hero mode only),
 * selective Bloom on the emissives (hero mode only), sparse dust motes in
 * the rim light, and a low 3/4 dolly start so the machines dominate frame.
 *
 * Background mode stays cheap by design: plain ground, no postprocessing,
 * capped dpr, dimmed emissives, pointer events off, slow fixed orbit.
 * No shadow maps anywhere; contact shadows are soft dark discs fed by a
 * tiny in-code radial gradient texture. No external assets of any kind.
 */
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Environment,
  Html,
  Lightformer,
  MeshReflectorMaterial,
  OrbitControls,
  Trail,
} from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import * as THREE from "three";
import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Robot from "./assets/Robot";
import { AirCar, CargoBoat, CyberSemi, CyberTruck, GranTourer, MonoPod, PodBus, Sedan } from "./assets/Vehicles";
import F1Wheel, { type F1WheelFrame, type F1WheelHandle, type WheelDir } from "@/components/future/F1Wheel";
import {
  createAudioFrame,
  getCityAudio,
  type CityAudioFrame,
  type CityAudioHandle,
  type SpecKey,
} from "@/components/future/cityAudio";

export interface FutureCitySceneProps {
  /** Background mode: pointer-events off, slow fixed orbit, dimmer, capped dpr. */
  background?: boolean;
  /** WebGL powerPreference proven usable by the lazy wrapper's probe. */
  glPower?: "high-performance" | "default";
  /** Game mode: the hero humanoid is playable from the first frame, arrows
   *  and WASD walk, shift runs, E greets a nearby unit. */
  game?: boolean;
  /** Opt-in procedural audio, and deliberately opt-in rather than inferred
   *  from !background. The component library mounts this scene with NO props
   *  as a 420px demo tile, so it is in hero mode with clickable machines and
   *  a live cockpit: gating on !background would put engine noise in a
   *  component catalog. Only the playable page passes this. */
  audio?: boolean;
}

interface Ctx {
  background: boolean;
  game: boolean;
  /** prefers-reduced-motion: freeze every loop, hold one composed frame. */
  still: boolean;
  /** Emissive multiplier; background mode runs everything dimmer. */
  dim: number;
}
// A real default rather than null. The previous version defaulted to null and
// papered over it with a non-null assertion, which is a compile-time fiction:
// at runtime all thirty consumers dereferenced it directly, so any read from
// outside the provider took the whole render tree down with "Cannot read
// properties of null". That happens for real during HMR, when a remounting
// tree briefly resolves a stale copy of this module and the provider it reads
// is not the provider that was written to. Defaulting to hero mode means such
// a read renders a correct frame instead of crashing the page.
const HERO_CTX: Ctx = { background: false, game: false, still: false, dim: 1 };
const SceneCtx = createContext<Ctx>(HERO_CTX);
const useScene = () => useContext(SceneCtx);

/* ---------------------------------------------------------------- *
 *  Drive mode: click a machine, take its controls
 * ---------------------------------------------------------------- */

interface DriveSel {
  id: string;
  label: string;
  kind: "car" | "boat" | "bot";
  /** Chase distance. A semi is ~10 units long, so the car default parks the
   *  camera inside its own trailer; every rider passes its own. */
  chase?: number;
}
interface DriveApi {
  sel: DriveSel | null;
  set: (d: DriveSel | null) => void;
  /** Game mode only: true when the player has stepped out of the humanoid,
   *  handing the camera back to free orbit. */
  freeCam: boolean;
  setFreeCam: (v: boolean) => void;
  /** True while the selected machine drives its own lane again with the
   *  player still aboard and the chase camera still following. This is the
   *  REQUEST; rig.autoActive is what actually went live, and the gap between
   *  them is the handoff blend the cockpit telltale shows. */
  auto: boolean;
  setAuto: (v: boolean) => void;
  /** Signed throttle, steer, brake, handbrake, booster and autopilot. */
  input: { current: DriveInput };
  /** The object the chase camera follows while driving. */
  target: { current: THREE.Object3D | null };
  /** Live chassis state of whatever is being driven, mutated in place. The
   *  chase camera and the cockpit read it every frame without a render. */
  rig: { current: Rig };
  /** The procedural audio engine, or null when audio is not on offer for
   *  this mount. Null is the normal case: only the playable page opts in. */
  audio: CityAudioHandle | null;
}
const DriveCtx = createContext<DriveApi | null>(null);
const useDrive = () => useContext(DriveCtx);

/* ---------------------------------------------------------------- *
 *  Palette: monochrome structures, one ice accent family, sparse amber
 * ---------------------------------------------------------------- */

const ICE = "#9fb4d0";
const ICE_BRIGHT = "#cfe4ff";
const AMBER = "#d9a860";

const M = {
  hull: { color: "#9aa0ab", metalness: 0.7, roughness: 0.35 },
  graphite: { color: "#3a3d44", metalness: 0.55, roughness: 0.5 },
  slab: { color: "#26282d", metalness: 0.4, roughness: 0.65 },
  joint: { color: "#4a4e56", metalness: 0.55, roughness: 0.5 },
} as const;

/** Humanoid scale: the old capsule figures stood ~1.25 units; the detailed
 *  asset is 1.75 at scale 1, so 0.82 lands ~1.44, the requested ~15% bump. */
const ROBOT_SCALE = 0.82;

/* ---------------------------------------------------------------- *
 *  Paths: everything that moves rides an arc-length-sampled curve
 * ---------------------------------------------------------------- */

const v3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Ring road around the block, slightly irregular so it reads designed, not generated. */
const ROAD = new THREE.CatmullRomCurve3(
  [
    v3(15, 0, 1), v3(12.5, 0, 8.5), v3(3.5, 0, 12.5), v3(-7, 0, 11.5), v3(-13.5, 0, 5),
    v3(-14.5, 0, -3.5), v3(-9.5, 0, -10.5), v3(0.5, 0, -13), v3(10, 0, -10.5), v3(14.5, 0, -5.5),
  ],
  true,
  "catmullrom",
  0.5
);
/** Ring-road surface height: ribbon sits at 0.01 with half-height 0.077. */
const ROAD_Y = 0.09;

/** Outer bypass: one slow lane for the semi, wide enough to skirt everything. */
const BYPASS = new THREE.CatmullRomCurve3(
  [
    v3(22, 0, 4), v3(15, 0, 15), v3(2, 0, 20), v3(-12, 0, 17.5), v3(-20.5, 0, 8),
    v3(-22, 0, -6), v3(-13.5, 0, -17), v3(2, 0, -21), v3(15, 0, -16.5), v3(21.5, 0, -7),
  ],
  true,
  "catmullrom",
  0.5
);
const BYPASS_Y = 0.082;

/** Elevated flyover: an OPEN viaduct arc that sweeps across the BACK of the
 *  scene, both ends RAMPING DOWN TO GRADE in the fog (a floating deck end reads broken; a ramp reads like an interchange), crossing over the ring road
 *  behind the plaza and over the bypass on the west. It deliberately never
 *  encloses the plaza: the camera's foreground stays clear and no pylon can
 *  land in the pedestrian field. The curve carries real y: deck height IS
 *  the path (higher over the west bypass crossing for semi clearance). */
const FLYOVER = new THREE.CatmullRomCurve3(
  [
    v3(30.5, 0.1, 8.6), v3(26.5, 1.5, 6.6), v3(19, 2.7, -1), v3(11, 3.1, -7.5),
    v3(2, 3.2, -11.5), v3(-7, 3.05, -11.8), v3(-15, 2.85, -8.5), v3(-22, 2.6, -2.5),
    v3(-27.5, 1.4, 3.4), v3(-31, 0.1, 5.2),
  ],
  false,
  "catmullrom",
  0.5
);
/** Wheels-on-deck offset: half the flattened ribbon above the curve line. */
const FLYOVER_Y = 0.075;

/** Cargo canal along the north edge, outside the bypass: two barge lanes. */
const CANAL = new THREE.CatmullRomCurve3(
  [
    v3(25, 0, 25.6), v3(10, 0, 25.1), v3(-12, 0, 25.5), v3(-25, 0, 26.3),
    v3(-25.5, 0, 28.4), v3(-10, 0, 28.9), v3(12, 0, 28.6), v3(25.5, 0, 28.1),
  ],
  true,
  "catmullrom",
  0.5
);
/** Water clamp box for player-driven barges. */
const CANAL_BOUNDS = { zMin: 24.4, zMax: 29.7, xMax: 29 } as const;

/** Pedestrian loop around the plaza under the brain. */
const WALKWAY = new THREE.CatmullRomCurve3(
  Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2;
    const r = 4.3 + ((i * 29) % 5) * 0.06;
    return v3(Math.cos(a) * r, 0, Math.sin(a) * r);
  }),
  true
);

/** Landing pad centre; the pausing walker turns to face it. */
const PAD_POS = v3(8.2, 0, -5.4);

const DRONE_PATHS = [
  // wide patrol that sinks toward the landing pad on each lap
  new THREE.CatmullRomCurve3(
    [
      v3(12, 5, 2), v3(8.4, 2.4, -5.2), v3(2, 4.4, -9.5), v3(-6, 5.6, -8.5),
      v3(-11.5, 4.4, -1), v3(-7.5, 3.6, 7), v3(2, 5, 9.5), v3(9, 4.6, 6.5),
    ],
    true
  ),
  // tight tilted orbit around the cloud brain
  new THREE.CatmullRomCurve3(
    [
      v3(5.4, 4.2, 0), v3(3.8, 5.3, 3.8), v3(0, 5.9, 5.4), v3(-3.8, 5.2, 3.8),
      v3(-5.4, 4.5, 0), v3(-3.8, 3.9, -3.8), v3(0, 3.5, -5.4), v3(3.8, 3.9, -3.8),
    ],
    true
  ),
  // long high sweep across the whole block
  new THREE.CatmullRomCurve3(
    [
      v3(16, 7.2, -6), v3(4, 6.4, -11.5), v3(-8, 7.6, -9.5), v3(-15.5, 6.6, 0),
      v3(-8, 5.8, 8.5), v3(4, 7, 10.5), v3(13.5, 6.2, 5),
    ],
    true
  ),
];

const DRONES = [
  { path: 0, offset: 0, speed: 0.02 },
  { path: 0, offset: 0.5, speed: 0.02 },
  { path: 1, offset: 0.2, speed: 0.034 },
  { path: 2, offset: 0.45, speed: 0.016 },
  { path: 2, offset: 0.85, speed: 0.016 },
];

/**
 * Capsule colliders every driven machine resolves against. Vehicles register
 * themselves on mount; statics are listed once.
 *
 * These used to be single circles, and a circle is a bad stand-in for a car:
 * one radius has to be either long enough to cover the nose (and then it is
 * two car widths wide, so you get shoved sideways across a visible gap) or
 * narrow enough to match the body (and then your bumper disappears into the
 * other machine before anything fires). A semi is the worst case at 4.79 long
 * and 1.05 wide. So each body is a spine of half extent `hl` along its own
 * local +Z, swept by radius `r`: exact in both axes, and it turns with the
 * body, which a circle never did.
 */
interface Collider {
  o: THREE.Object3D;
  /** Capsule radius, which is the body's half WIDTH, already scaled. */
  r: number;
  /** Spine half extent along local +Z, already scaled. Zero makes the capsule
   *  a plain circle, which is what every non-vehicle collider registers. */
  hl: number;
  /** Live "this body is on the elevated deck" flag, shared by reference with
   *  the owner so the surface tests below are an O(1) read. */
  deck: { current: boolean };
}
const COLLIDERS = new Set<Collider>();

/** Everything that is not a viaduct rider shares one immutable ground flag,
 *  so registering a plain collider costs no extra allocation. */
const AT_GRADE = { current: false };

/** Vertical separation above which two bodies count as being on different
 *  decks and therefore cannot touch. The flyover curve peaks at y = 3.2 and
 *  everything at grade sits near 0.09, so anything past 1.5 is unambiguously
 *  upstairs. Without this a truck on the viaduct shoves a car standing on the
 *  road eleven units below it. */
const DECK_GAP = 1.5;

/** Greetable units: the player finds the nearest and waves; it waves back.
 *  Registered by every autonomous humanoid, cleared on unmount. */
const NPCS = new Set<{ o: THREE.Object3D; greet: () => void }>();

/** Register a world-space group as a collision circle for its lifetime.
 *  Anything a driven machine must not pass through has to call this: the
 *  resolver only sees registered entries, so a body that merely resolves
 *  against others (and never registers) gets driven straight through. */
function useCollider(ref: React.MutableRefObject<THREE.Group | null>, r: number) {
  useEffect(() => {
    const o = ref.current;
    if (!o) return;
    const entry: Collider = { o: o as THREE.Object3D, r, hl: 0, deck: AT_GRADE };
    COLLIDERS.add(entry);
    return () => {
      COLLIDERS.delete(entry);
    };
  }, [ref, r]);
}

/** Skyline. The third tower used to stand at (9.6, -8.4), which is 0.061
 *  units from the FLYOVER centreline: its 0.65 half-width and the deck's 0.62
 *  half-width overlap almost completely, so an eleven-unit monolith passed
 *  straight through the middle of the viaduct. That was a geometry clash and
 *  not only a collision one, so skipping static colliders on the deck fixes
 *  the blocked drive but not the picture. Moved outward to 17.3 units from
 *  centre, which keeps it a background silhouette and leaves 4.7 from the
 *  deck, 2.6 from the ring road and 5.1 from the bypass. */
const TOWERS = [
  { x: -8.5, z: -7.5, w: 1.15, h: 9.5 },
  { x: -10.6, z: -4.2, w: 0.85, h: 6.2 },
  { x: 12.1, z: -12.3, w: 1.3, h: 11 },
  { x: 11.6, z: -5, w: 0.7, h: 5 },
];

/** How long a machine holds its stop after the way is clear, in seconds.
 *  Long enough to read as "it saw me and waited", short enough not to jam. */
const STOP_DWELL = 1.15;

/** Smoothstep for walk and approach easing. */
const smooth = (k: number) => k * k * (3 - 2 * k);

const STATIC_COLS: { x: number; z: number; r: number }[] = [
  ...TOWERS.map((t) => ({ x: t.x, z: t.z, r: t.w * 0.75 + 0.45 })),
  { x: 6.2, z: 5.8, r: 2.7 }, // the construction site
];

/* ---------------------------------------------------------------- *
 *  Lane traffic: every path follower publishes where it is on its curve
 * ---------------------------------------------------------------- */

/**
 * Path followers used to advance blind: each one hard-set its position from
 * its own curve every frame and never looked at anybody else, so the only
 * thing keeping two of them apart was the gap between their authored start
 * offsets. Any perturbation (a rider stopping to let the player past while
 * the one behind kept full lap speed) closed that gap permanently and the
 * two bodies ended up nose-inside-body. This registry is what lets a rider
 * see the machine in front of it.
 *
 * A positional push cannot fix that, because the curve write at the end of
 * every frame would erase it. Riders separate by modulating their SPEED
 * instead, which is also what real traffic does.
 */
interface TrafficEntry {
  curve: THREE.CatmullRomCurve3;
  /** Arc length of the curve, so a param delta converts to world units. */
  len: number;
  /** Live curve param, shared with the rider's own useFrame. */
  u: { current: number };
  /** Half the body length in world units, already scaled. */
  half: number;
  /** Collision circle radius, already scaled. */
  r: number;
  o: THREE.Object3D;
  /** True while the player has this one: it has left the lane, so nobody
   *  should queue behind its stale curve param. Open curves (the flyover)
   *  have no wrap, so "ahead" is read off curve.closed at the call site. */
  driven: { current: boolean };
}
const TRAFFIC = new Set<TrafficEntry>();
/** Object3D -> lane entry, so the cross-curve pass can tell which colliders
 *  the same-curve pass already owns and skip them. */
const TRAFFIC_BY_OBJ = new Map<THREE.Object3D, TrafficEntry>();

/** Bumper clearance at which a follower is fully stopped, and the gap at
 *  which it runs free. Everything between is a smooth speed taper, which is
 *  stable in a way a hard stop test is not: no rider ever waits on a rider
 *  that is waiting on it, because the taper never reaches zero until the
 *  gap is genuinely gone. */
const GAP_STOP = 0.4;
const GAP_FREE = 4.2;
/** How far ahead the cross-curve cone looks, before the speed term. */
const CONE_BASE = 1.6;

/** Longest a rider will hold for the player before it creeps again. The old
 *  hold was re-armed every frame the player stayed close, so a parked player
 *  pinned a rider forever and everything behind piled into it. */
const STOP_DWELL_MAX = 3;
/** Seconds spent easing a released machine back into its lane. The old code
 *  teleported it onto the curve, and at ten units a second that snap was the
 *  most visible artifact of letting a vehicle go. */
const REJOIN_BLEND = 0.35;
/** How much the rejoin scan prefers a param that points the way the car is
 *  already pointing, so a car released backwards does not flip 180 degrees. */
const REJOIN_HEADING = 3;
/** Cross-curve cones can in principle stare each other down. Nothing in the
 *  authored layout does, but a lane that has been stopped this long starts
 *  creeping rather than waiting forever. The timer is only cleared by a real
 *  recovery of clearance, never by the creep it triggers: an earlier version
 *  cleared it the moment the creep raised the speed factor past the trigger
 *  threshold, so the escape cancelled itself after about a tenth of a second
 *  and a blocked rider covered 0.4 units in two minutes. */
const JAM_MAX = 5;

/** Half body lengths before scale, keyed the same way the drive tuning is.
 *  Collision circles are a poor stand-in here: a semi's 3.4 circle misses
 *  1.4 of its own nose, and following distance has to know the real body. */
const BODY_HALF = {
  truck: 1.71,
  sedan: 1.15,
  tourer: 1.5,
  podbus: 1.06,
  pod: 0.54,
  semi: 4.79,
  boat: 2.2,
} as const;

/** Half body WIDTHS before scale, which are the capsule radii. Measured off
 *  the vehicle assets rather than guessed from the track width, because the
 *  flares and the barge hull both sit well outside the wheels. */
const BODY_HW = {
  truck: 0.75,
  sedan: 0.6,
  tourer: 0.62,
  podbus: 0.62,
  pod: 0.34,
  semi: 1.05,
  boat: 0.58,
} as const;

/* ---------------------------------------------------------------- *
 *  Drive model: a bicycle chassis with slip, weight transfer and an
 *  arcade stability assist
 * ---------------------------------------------------------------- */

/**
 * Body frame: +f is forward, +q is the driver's right. A positive yaw rate r
 * swings the nose right, which DECREASES rotation.y, because the scene
 * integrates position as (sin psi, cos psi). Positive steer is a right turn,
 * and positive lateral velocity is the car sliding to the driver's right.
 *
 * Every sign below is stated with its check. One inverted term here makes
 * the car amplify its own oversteer, which reads as "the physics is broken"
 * rather than "one line is negated", so the checks are worth the words.
 */
interface DriveInput {
  /** -1..1. Negative is brake in D and drive in R; stepDrive owns which. */
  th: number;
  /** -1..1 steer request, before rate limiting and the speed-faded lock. */
  st: number;
  /** 0/1 held foot brake. */
  bk: number;
  /** 0/1 held handbrake: kills rear grip and switches the assist off. */
  hb: number;
  /** 0/1 held booster request. Only the REQUEST: the rig owns the charge,
   *  the cooldown and the ramp, so releasing the machine clears all of it. */
  boost: 0 | 1;
  /** 0/1 autopilot request. Only the REQUEST: PathRider owns engagement and
   *  the rejoin blend, and rig.autoActive is what actually went live. */
  auto: 0 | 1;
}

const cl = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
/** Smoothstep between two thresholds, clamped. */
const ss = (x: number, a: number, b: number) => smooth(cl((x - a) / (b - a), 0, 1));
/** Framerate-independent exponential ease: the fraction to move this step. */
const ease = (k: number, dt: number) => 1 - Math.exp(-k * dt);

/** Fixed inner step. Variable delta feeding a saturating tyre curve is the
 *  single likeliest way this ships broken, so the physics never sees the
 *  frame delta directly. 1/120 leaves ~6x margin on the stability bound and
 *  moves at most 0.083 units per step, well inside any collision circle. */
const H_FIXED = 1 / 120;
/** Sized so the loop can actually consume DT_CAP: 12 * (1/120) is exactly
 *  0.1 s. At the old 8 the loop topped out at 66.7 ms and silently threw the
 *  rest away, so below 15 fps the chassis ran in slow motion while the
 *  airborne term (which uses the frame delta) kept full speed, and a car
 *  launched off the flyover fell further per unit of travel than it does at
 *  60 fps. Both axes now advance by the same amount. */
const MAX_SUBSTEPS = 12;
/** A 300 ms stall advances the world 100 ms. Dilating time on a hitch beats
 *  teleporting a 10 u/s car through a tower whose circle is 1.4 wide. */
const DT_CAP = 0.1;
const PRES_DT_CAP = 1 / 30;
/** Grip and load normalizer: real gravity at this scene's 1.65 m per unit. */
const G_REF = 6;
/** Air time only, and deliberately NOT the same number: real-scale gravity
 *  in a 52-unit world leaves a car hanging for an absurd length of time. */
const GRAV_AIR = 20;
/** Metres per world unit, for the speedometer. */
const UNIT_M = 1.65;
/** Tyre curve shape. Peak slip angle lands at 1.855 / B. */
const TYRE_C = 1.45;
/** Below this speed the chassis blends to a pure Ackermann trolley. Without
 *  it the car shimmies at parking speed, and parking speed is the first
 *  thing anyone experiences after clicking a truck. */
const UKIN = 1.7;
/** Rear combined-slip coupling: how much drive and brake eat cornering grip.
 *  This is what earns power oversteer. Set to 0 if it ever rings. */
const ELLIPSE = 0.7;
const HB_GRIP = 0.3;
const ASSIST_MAX = 1.8;
const ASSIST_FADE = 0.75;
const CS_ASSIST = 0.55;
/** 0.31 s to full lock, 0.19 s back to centre. The old keyboard wrote a hard
 *  plus or minus one straight into a yaw write, and that step function was
 *  most of the toy feel. The ramp lives in physics so the keyboard, the HUD
 *  wheel drag and anything added later all share one smoothing path. */
const STEER_IN = 3.2;
const STEER_OUT = 5.2;
const SPEED_FADE = 7;
const REST = 0.22;
/** Tangential velocity kept in a scrape. High, because a wall should feel
 *  like something you slide along, not a speed penalty for grazing a post. */
const TANG_KEEP = 0.88;
const CONTACT_MAX_PUSH = 0.4;
/** Soft reflecting boundary, inside the 27-unit walker bowl and far inside
 *  the fog far plane, so nothing pops as the car turns away. Machines on the
 *  viaduct are exempt: the flyover ramps reach radius 31.7, so the bowl cut
 *  across the deck in mid-air and bounced a truck off nothing. */
/** Water surface height. ABOVE the ground disc, not below it: 3 cm of
 *  displacement is imperceptible at the chase camera's shallow view angle,
 *  and putting it under an opaque disc is what hid the canal entirely. */
const WATER_Y = 0.03;
/** Ground disc radius. Must fully contain the water plane, whose far corner
 *  sits at (28, 31.35) and so needs 42; 44 clears it with margin. */
const GROUND_R = 44;

const BOWL_R = 26;
/** The bowl's positional correction is deliberately far smaller than a
 *  contact's. A car that lands off the end of a flyover ramp is five units
 *  outside the bowl, and resolving that overshoot at the contact rate would
 *  drag it home at nearly twenty times driving speed. The velocity impulse is
 *  what actually stops you leaving; the push only has to nudge. */
const BOWL_PUSH_MAX = 0.05;
/** Visible front-wheel angle cap, sized to the truck's front arch: at 0.50
 *  the steered tread sweeps 0.35 longitudinally against a 0.46 half-opening
 *  and 0.83 laterally against a flare edge at 0.73, so it clears. The full
 *  0.58 lock would push tread about 0.11 past the flare. */
const STEER_VIS_CLAMP = 0.5;
/** Steer is delivered to the vehicle meshes through a React re-render, so it
 *  is quantized: a steady corner settles on one bucket and stops rendering. */
const STEER_VIS_STEP = 0.03;

/** Booster. A multiplier on ACCEL alone is INVISIBLE, and that is arithmetic
 *  rather than opinion: the sedan's traction cap is MU * TRAC * nR * G_REF =
 *  1.12 * 1.15 * 0.5 * 6 = 3.86 u/s2 against an authored ACCEL of 12.5, so
 *  the car is already clipped at launch and a bigger ACCEL is discarded by
 *  the clamp on the very next line. Three ceilings have to move together:
 *  the drive force, the traction cap it is clamped against, and the hard
 *  velocity clamp at the end of the integrator. */
const BOOST_DUR = 3.2;
const BOOST_REGEN = 7;
const BOOST_COOL = 1.2;
const BOOST_ARM = 0.15;
const BOOST_K = 1.8;
const BOOST_T = 1.6;
const BOOST_V = 1.25;
/** Ramp rate in and out. The multipliers are eased rather than stepped
 *  because a step on a saturating tyre curve is a discontinuity in aDrive,
 *  which feeds the combined-slip term, which feeds gripLoss, which the HUD
 *  prints: a stepped booster flashes SLIP for one frame on every press. */
const BOOST_RAMP = 8;

/** Fastest machine in the fleet, used to reference the camera's speed cues.
 *  rig.norm is speed over the machine's OWN VMAX, so a semi flat out and a
 *  monopod flat out both reach 1 and got an identical fov sweep, pullback
 *  and yaw response despite a 67% real speed difference. The HUD keeps
 *  rig.norm (a driver wants percentage of their own limit); the camera wants
 *  absolute speed, or nothing in the scene ever feels quick. */
const FLEET_VMAX = 12.5;

/** Cockpit rim sweep, in degrees per full steering lock. Deliberately the
 *  same 120 the old toy wheel used: it is under one turn, which is what a
 *  real single-seater rim does, so the geometry changed and the feel did not. */
const SWEEP_DEG = 120;
/** How long the rim holds its OVERRIDE telltale after a manual input has
 *  taken the car back off the autopilot. Long enough to read, short enough
 *  that it is gone before the next corner. */
const OVERRIDE_HOLD = 0.6;

/** Chassis springs. Underdamped on purpose: the overshoot is the thing that
 *  reads as mass, and critically damped looks dead. */
const W0 = 13;
const ZETA = 0.5;
/** Pitch and roll gains are lower than a real chassis would want because the
 *  wheels rotate with the body here (the vehicle assets have no separate
 *  body group), so the lift term below has to keep them out of the tarmac. */
const PITCH_K = 0.0038;
const ROLL_K = 0.0045;
const A_CLAMP = 22;
const LAND_KICK = 0.9;

/** Chase camera. The azimuth lag IS the corner swing: in a right turn the
 *  camera sits off the outside rear and catches up on the exit. */
const CAM_YAW_BASE = 2.8;
const CAM_YAW_SPD = 3;
const CAM_SLIP = 0.5;
const CAM_SWING = 0.2;
const CAM_OFFSET_MAX = 0.55;
const CAM_POS_BASE = 4.5;
const CAM_POS_SPD = 3;
/** Beyond this the camera snaps rather than sweeping the whole map, which is
 *  what a release-and-rejoin or a machine swap would otherwise look like. */
const CAM_SNAP = 14;
const BACK_SPD = 0.28;
const UP_DROP = 0.15;
const LOOK_UP = 1.1;
const LOOK_AHEAD = 4;
const LOOK_VEL = 0.12;
const LOOK_RESP = 6;
const CAM_ROLL_K = 0.006;
const CAM_ROLL_MAX = 0.07;
const SHAKE_K = 0.06;
const SHAKE_MAX = 0.3;
const SHAKE_DECAY = 6;
const FOV0 = 40;
const FOV_SPD = 10;
const FOV_TH = 3;
const FOV_DRIFT = 3;
const FOV_RESP = 3.5;

interface VehicleSpec {
  /** Wheelbase, and the CG split fore and aft of it. */
  L: number;
  a: number;
  b: number;
  aFrac: number;
  bFrac: number;
  track: number;
  hCg: number;
  /** Yaw inertia over mass, as a multiple of a*b. */
  K2: number;
  MU: number;
  /** Longitudinal traction factor, applied ONLY to the drive clamp. Without
   *  it the clamp is a flat MU * load ceiling that every machine hits at
   *  launch, so the whole fleet left the line at 3.7 to 4.4 u/s2 no matter
   *  what its ACCEL said and a shuttle pod actually beat a truck. Cornering
   *  grip is untouched, so the corner-speed budget in the comment above still
   *  holds exactly. */
  TRAC: number;
  BF: number;
  BR: number;
  SIG_HI: number;
  SIG_LO: number;
  VMAX: number;
  ACCEL: number;
  BRAKE: number;
  COAST: number;
  HB_DECEL: number;
  VREV: number;
  ACCEL_REV: number;
  ASSIST_YAW: number;
  R_MAX: number;
  wheelR: number;
  halfWB: number;
  halfTrack: number;
  boat: boolean;
  BTHRUST: number;
  BDRAG: number;
  BRUD: number;
  BYAWD: number;
  BLAT: number;
}

/** Per-machine tuning. Lengths take the rider's scale; speeds and
 *  accelerations deliberately do not, because a 0.85-scale pod must not be
 *  15% slower than the same pod at scale 1.
 *
 *  The MU numbers are what make the ring road a game rather than a rail:
 *  max lateral is MU * G_REF = 6.3 u/s2, so the fastest a car holds the
 *  ring's ~14-unit radius is sqrt(6.3 * 14) = 9.4 against a VMAX of 10.
 *  Every corner asks for a brush of brake. */
const DRIVE_TUNE = {
  truck: { L: 2.3, track: 1.1, aFrac: 0.52, hCg: 0.52, K2: 1.15, MU: 1.05, TRAC: 1, BF: 9, BR: 10.2, SIG_HI: 0.56, SIG_LO: 0.19, ACCEL: 11, BRAKE: 14, COAST: 2, HB_DECEL: 5, VREV: 3.4, ACCEL_REV: 6, ASSIST_YAW: 2.2, R_MAX: 2.6, wheelR: 0.3 },
  sedan: { L: 1.44, track: 0.72, aFrac: 0.5, hCg: 0.3, K2: 1.1, MU: 1.12, TRAC: 1.15, BF: 10, BR: 11, SIG_HI: 0.58, SIG_LO: 0.2, ACCEL: 12.5, BRAKE: 15, COAST: 1.9, HB_DECEL: 5, VREV: 3.4, ACCEL_REV: 6.5, ASSIST_YAW: 2, R_MAX: 2.9, wheelR: 0.19 },
  tourer: { L: 1.84, track: 0.84, aFrac: 0.51, hCg: 0.33, K2: 1.15, MU: 1.08, TRAC: 1.05, BF: 9.6, BR: 10.6, SIG_HI: 0.55, SIG_LO: 0.19, ACCEL: 11.8, BRAKE: 14.5, COAST: 1.9, HB_DECEL: 5, VREV: 3.4, ACCEL_REV: 6.2, ASSIST_YAW: 2.1, R_MAX: 2.7, wheelR: 0.22 },
  podbus: { L: 1.56, track: 0.92, aFrac: 0.48, hCg: 0.62, K2: 1.25, MU: 0.95, TRAC: 0.65, BF: 8.4, BR: 9.4, SIG_HI: 0.5, SIG_LO: 0.17, ACCEL: 7, BRAKE: 11, COAST: 2.4, HB_DECEL: 4, VREV: 2.8, ACCEL_REV: 4, ASSIST_YAW: 2.8, R_MAX: 2.2, wheelR: 0.24 },
  // Single-track: it leans instead of steering, and it gets no countersteer
  // help, because a leaning bike that catches its own slides feels wrong.
  pod: { L: 0.84, track: 0, aFrac: 0.5, hCg: 0.34, K2: 0.95, MU: 1, TRAC: 1.2, BF: 9, BR: 9, SIG_HI: 0.7, SIG_LO: 0.24, ACCEL: 13.5, BRAKE: 13, COAST: 2.2, HB_DECEL: 5.5, VREV: 4, ACCEL_REV: 7, ASSIST_YAW: 1.2, R_MAX: 3.2, wheelR: 0.2 },
  // L is a WHEELBASE, not an overall length. It was 7.3, which is the whole
  // tractor plus trailer, and the minimum turn radius that implies is
  // L / tan(lock) = 20.6 units at rest and 55.8 at cruise, against a bypass
  // whose own minimum radius is 10.99 and whose median is 21.97. The semi
  // literally could not follow the road it is mounted on: it understeered
  // off the first corner and into the bowl boundary. At 3.6 with SIG_LO
  // raised to 0.19 it turns in 10.2 units at rest and 18.7 at cruise, which
  // clears both. BODY_HALF.semi stays 4.79: that is the collision length and
  // it was always correct.
  semi: { L: 3.6, track: 0.54, aFrac: 0.62, hCg: 1.2, K2: 1.4, MU: 0.85, TRAC: 0.5, BF: 7.5, BR: 8.5, SIG_HI: 0.34, SIG_LO: 0.19, ACCEL: 4.2, BRAKE: 8, COAST: 2.6, HB_DECEL: 3, VREV: 2.2, ACCEL_REV: 2.4, ASSIST_YAW: 3.2, R_MAX: 1.1, wheelR: 0.3 },
} as const;

/** Which tuning block a rider id maps to. Checked longest-prefix first so
 *  "podbus" never falls through to "pod". */
const TUNE_KEYS = ["podbus", "truck", "sedan", "tourer", "semi", "pod"] as const;

/** Half body length for a rider id, before scale. */
function bodyHalf(id: string | undefined, kind: "car" | "boat"): number {
  if (kind === "boat") return BODY_HALF.boat;
  const key = id ? TUNE_KEYS.find((k) => id.startsWith(k)) : undefined;
  return key ? BODY_HALF[key] : 1.4;
}

/** Half body width for a rider id, before scale. The unknown case returns the
 *  same 1.4 the length lookup does, which collapses the capsule back to the
 *  circle the porter and the drone rider have always had. */
function bodyHW(id: string | undefined, kind: "car" | "boat"): number {
  if (kind === "boat") return BODY_HW.boat;
  const key = id ? TUNE_KEYS.find((k) => id.startsWith(k)) : undefined;
  return key ? BODY_HW[key] : 1.4;
}

function resolveSpec(id: string, kind: "car" | "boat" | "bot", driveMax: number, scale: number): VehicleSpec {
  // VMAX derives from the existing per-rider driveMax prop, so all nineteen
  // mount sites keep their authored relative pace with no edits.
  const VMAX = driveMax * 2.5;
  const key = TUNE_KEYS.find((k) => id.startsWith(k)) ?? "sedan";
  const t = DRIVE_TUNE[key];
  const L = t.L * scale;
  const a = L * t.aFrac;
  return {
    L,
    a,
    b: L - a,
    aFrac: t.aFrac,
    bFrac: 1 - t.aFrac,
    track: t.track * scale,
    hCg: t.hCg * scale,
    K2: t.K2 * a * (L - a),
    MU: t.MU,
    TRAC: t.TRAC,
    BF: t.BF,
    BR: t.BR,
    SIG_HI: t.SIG_HI,
    SIG_LO: t.SIG_LO,
    VMAX,
    ACCEL: t.ACCEL,
    BRAKE: t.BRAKE,
    COAST: t.COAST,
    HB_DECEL: t.HB_DECEL,
    VREV: t.VREV,
    ACCEL_REV: t.ACCEL_REV,
    ASSIST_YAW: t.ASSIST_YAW,
    R_MAX: t.R_MAX,
    wheelR: t.wheelR * scale,
    halfWB: L * 0.5,
    halfTrack: Math.max(0.2, t.track * scale * 0.5),
    boat: kind === "boat",
    // A barge takes two seconds to answer the helm and then keeps turning.
    // The lag is the point, so it gets a first-order yaw and no tyres.
    BTHRUST: 3.4,
    BDRAG: 0.095,
    BRUD: 0.9,
    BYAWD: 1.1,
    BLAT: 1.3,
  };
}

const DEFAULT_SPEC = resolveSpec("sedan", "car", 4, 1);

/** Which powertrain voice a rider id gets. Same longest-prefix rule and the
 *  same fallback the chassis tuning uses, so a machine can never be tuned as
 *  one thing and voiced as another. */
function audioSpecKey(id: string): SpecKey {
  return (TUNE_KEYS.find((k) => id.startsWith(k)) ?? "sedan") as SpecKey;
}

/** Deck centreline samples. Sample spacing is 0.59 units against a 0.62
 *  half-width test, so coverage along the ribbon is continuous. */
const FLYOVER_PTS = Array.from({ length: 129 }, (_, i) => FLYOVER.getPointAt(i / 128));
const DECK_HALF_W = 0.62;

/**
 * Wheels-on-deck height above (x, z), or null off the ribbon. The flyover is
 * the only elevated surface a machine can be on, so one linear scan for the
 * one driven vehicle is the whole ground query the scene needs. Without it
 * a player taking over a flyover rider drops through the deck immediately.
 */
function deckHeightAt(x: number, z: number): number | null {
  let best = -1;
  for (const q of FLYOVER_PTS) {
    const dx = q.x - x;
    const dz = q.z - z;
    if (dx * dx + dz * dz < DECK_HALF_W * DECK_HALF_W && q.y > best) best = q.y;
  }
  return best < 0 ? null : best + FLYOVER_Y;
}

/** Live chassis state. One stable ref, mutated in place: the camera, the HUD
 *  and the vehicle meshes all read it, so a car at full slip costs no
 *  React renders at all. */
interface Rig {
  vf: number;
  vl: number;
  r: number;
  vy: number;
  steer: number;
  steerN: number;
  ax: number;
  ay: number;
  airborne: boolean;
  speed: number;
  norm: number;
  beta: number;
  gear: "D" | "N" | "R";
  gripLoss: number;
  driftHeat: number;
  pitch: number;
  pitchV: number;
  roll: number;
  rollV: number;
  steerVis: number;
  brakeLamp: number;
  thSm: number;
  bkSm: number;
  hb: number;
  /** Event channels: physics raises them, presentation consumes and clears. */
  impact: number;
  landing: number;
  /** Decaying shake level the camera reads. It has to be a separate field
   *  because presentation runs before the camera does, so a channel that
   *  cleared itself would always be zero by the time the camera looked. */
  hit: number;
  driven: boolean;
  /** 0..1 remaining booster charge. */
  boost: number;
  /** Seconds of hard lockout left after a full drain; 0 when armed. */
  boostCool: number;
  /** True while force is ACTUALLY being applied, which is held AND charged
   *  AND out of lockout. Distinct from the button, so the HUD can show a
   *  press that did nothing rather than pretending it worked. */
  boostActive: boolean;
  /** Live drive and traction multiplier, 1 idle. Ramped, never stepped. */
  boostK: number;
  /** Live VMAX multiplier, 1 idle. Also divides VMAX for the rev strip, or
   *  the strip pins at full the instant the booster is pressed. */
  boostV: number;
  /** True only once the autopilot actually owns the lane, which is after the
   *  rejoin blend completes. The button being down is not this. */
  autoActive: boolean;
  spec: VehicleSpec;

  /* ---- Published for audio. Levels and latches, never channels that clear
   *      themselves, with the two explicit exceptions below. The chassis
   *      already writes twenty-odd fields per substep, so four more is
   *      unmeasurable, and it is the honest option: every one of these dies
   *      as a local inside stepDrive otherwise, and reconstructing them
   *      downstream conflates things the ear can tell apart. ---- */
  /** 0..1 drive torque against the rear traction cap. Correctly saturates
   *  off the line and correctly falls to zero at VMAX through the torque
   *  droop, which is what makes the engine thin out at top speed. rig.ax
   *  cannot stand in for it: ax conflates drive, brake and cornering. Nor
   *  can rig.thSm, which is the throttle REQUEST and freezes forever under
   *  autopilot because that branch never calls presentDrive. */
  load: number;
  /** How far past the traction cap the drive request reached before the
   *  clamp. There is no wheel-speed state in this chassis, so this is the
   *  only wheelspin proxy available, and it is used only as a small pitch
   *  flare rather than as a scream: the wheel meshes spin at road speed, so
   *  a wheelspin layer would be an audible lie the player can see through. */
  slipDrive: number;
  /** Brake deceleration after the traction clamp, u/s^2, magnitude. */
  aBrake: number;
  /** 0 at grade, 1 on the flyover deck, 2 on water. Free: the deck query
   *  already runs once a frame for the ride height. */
  surface: number;
  /** Tangential contact speed scaled by severity: a sustained scrape level
   *  rather than a one-shot, because grinding along a wall is a state. */
  scrub: number;
  /** Audio-owned event accumulators. presentDrive folds impact and landing
   *  into these by max and never clears them; the audio consumer clears them
   *  after it has read them. Max-accumulate is required rather than tidy:
   *  resolveContacts runs up to twelve times a frame, so a plain assignment
   *  would drop all but the last contact and a plain sum would inflate a
   *  graze into a crash. */
  aImpact: number;
  aLanding: number;
}

function createRig(): Rig {
  return {
    vf: 0, vl: 0, r: 0, vy: 0,
    steer: 0, steerN: 0, ax: 0, ay: 0, airborne: false,
    speed: 0, norm: 0, beta: 0, gear: "N",
    gripLoss: 0, driftHeat: 0,
    pitch: 0, pitchV: 0, roll: 0, rollV: 0,
    steerVis: 0, brakeLamp: 0,
    thSm: 0, bkSm: 0, hb: 0,
    impact: 0, landing: 0, hit: 0,
    driven: false,
    boost: 1, boostCool: 0, boostActive: false, boostK: 1, boostV: 1,
    autoActive: false,
    spec: DEFAULT_SPEC,
    load: 0, slipDrive: 0, aBrake: 0, surface: 0, scrub: 0,
    aImpact: 0, aLanding: 0,
  };
}

function resetRig(rig: Rig) {
  const spec = rig.spec;
  Object.assign(rig, createRig());
  rig.spec = spec;
}

/**
 * One fixed physics substep. Order matters: steering, gear, load transfer,
 * longitudinal, rear combined slip, tyres, yaw, then integrate.
 */
function stepDrive(rig: Rig, inp: DriveInput, g: THREE.Object3D, h: number) {
  const s = rig.spec;
  if (s.boat) {
    // No tyres, no load transfer, no handbrake. Drag is quadratic so the
    // barge coasts a long way, and the rudder needs way on to bite.
    rig.vf += (inp.th * s.BTHRUST - s.BDRAG * rig.vf * Math.abs(rig.vf)) * h;
    rig.r += (inp.st * s.BRUD * cl(Math.abs(rig.vf) / 2, 0.25, 1) * Math.sign(rig.vf || 1) - rig.r * s.BYAWD) * h;
    rig.vl += (-rig.vf * rig.r - s.BLAT * rig.vl) * h;
    rig.r = cl(rig.r, -0.85, 0.85);
    rig.ax = 0;
    rig.ay = -rig.vf * rig.r;
    rig.steer = inp.st * 0.3;
    // Zeroed before the early return, or a barge inherits the last car's
    // load and holds a fixed engine note forever: none of the tyre, gearbox
    // or booster blocks below ever run for a boat.
    rig.load = 0;
    rig.slipDrive = 0;
    rig.aBrake = 0;
    rig.surface = 2;
    g.rotation.y -= rig.r * h;
    const by = g.rotation.y;
    g.position.x += (Math.sin(by) * rig.vf - Math.cos(by) * rig.vl) * h;
    g.position.z += (Math.cos(by) * rig.vf + Math.sin(by) * rig.vl) * h;
    return;
  }

  // Booster charge. Every timer is decremented by h rather than the frame
  // delta, because this function runs up to MAX_SUBSTEPS times per frame and
  // a frame-delta timer would drain twelve times too fast on a slow machine.
  //
  // BOOST_ARM gates RE-engagement only, so the test is latched: once a boost
  // is running it continues until the charge is genuinely gone or the button
  // comes up. Applied as a plain threshold it chattered at 120 Hz the moment
  // the charge decayed to BOOST_ARM (drain below, regen back above, engage,
  // repeat), which pinned the charge at 0.15, never reached the drain-out
  // that arms the cooldown, and strobed both the telltale and the rev strip.
  const wantBoost =
    inp.boost === 1 &&
    rig.boostCool <= 0 &&
    // Nothing reads boostK in the reverse branch, so draining the charge while
    // backing up spent it for no thrust and armed the cooldown for nothing.
    rig.gear !== "R" &&
    inp.th > 0.05 &&
    (rig.boostActive ? rig.boost > 0 : rig.boost >= BOOST_ARM);
  rig.boostActive = wantBoost;
  if (wantBoost) {
    rig.boost = Math.max(0, rig.boost - h / BOOST_DUR);
    if (rig.boost <= 0) {
      rig.boostActive = false;
      rig.boostCool = BOOST_COOL;
    }
  } else if (rig.boostCool > 0) {
    rig.boostCool = Math.max(0, rig.boostCool - h);
  } else {
    rig.boost = Math.min(1, rig.boost + h / BOOST_REGEN);
  }
  rig.boostK += ((rig.boostActive ? BOOST_K : 1) - rig.boostK) * ease(BOOST_RAMP, h);
  rig.boostV += ((rig.boostActive ? BOOST_V : 1) - rig.boostV) * ease(BOOST_RAMP, h);

  // A. Steering. Return to centre is faster than turn-in, which is what a
  // real self-centring rack does and what stops the car darting on release.
  const rate = Math.abs(inp.st) > Math.abs(rig.steerN) ? STEER_IN : STEER_OUT;
  rig.steerN += cl(inp.st - rig.steerN, -rate * h, rate * h);
  const lock = s.SIG_HI - (s.SIG_HI - s.SIG_LO) * cl(Math.abs(rig.vf) / SPEED_FADE, 0, 1);
  let d = rig.steerN * lock;
  // Countersteer aid, and only while the player is NOT steering. beta > 0
  // means the car is travelling to the driver's right of where it points,
  // so the tail is out to the left and the correction is a LEFT (negative)
  // steer input: -CS_ASSIST * beta is negative. Inverting this sign makes
  // the car amplify its own slide.
  d += cl(-CS_ASSIST * rig.beta, -0.14, 0.14) * (1 - Math.abs(rig.steerN));
  rig.steer = cl(d, -s.SIG_HI, s.SIG_HI);

  // B. Gear, as real state rather than a HUD multiplier. In D a negative
  // throttle is the brake pedal, not reverse, which kills the old bug where
  // the S key drove you backwards with the readout still showing D.
  if (Math.abs(rig.vf) < 0.4 && inp.th < -0.05 && rig.gear !== "R") rig.gear = "R";
  // The vf > -0.2 term is load-bearing. Without it the box left R the instant
  // forward throttle appeared, which made the reverse-brake branch below
  // unreachable and applied FULL forward drive against the car's own backward
  // motion: the droop term 1 - cl(vf / VMAX, 0, 1) evaluates to 1 with vf
  // negative, so pressing forward while rolling back was maximum acceleration
  // rather than a brake. FRONT is a labelled button now, so every player will
  // press it while reversing on their first attempt.
  if (rig.gear === "R" && ((inp.th > 0.05 && rig.vf > -0.2) || rig.vf > 0.6)) rig.gear = "D";
  if (rig.gear === "N" && Math.abs(inp.th) > 0.05) rig.gear = inp.th > 0 ? "D" : "R";
  if (rig.gear === "D" && Math.abs(rig.vf) < 0.15 && Math.abs(inp.th) < 0.05) rig.gear = "N";

  // C. Load transfer. Braking gives ax < 0, so nF rises, the nose bites and
  // the rear goes light. This one line is where trail-braking rotation
  // comes from, and it is why the front axle needs no friction ellipse.
  const xfer = cl(rig.ax / G_REF, -0.7, 0.7) * (s.hCg / s.L);
  const nF = cl(s.bFrac - xfer, 0.15, 0.85);
  const nR = cl(s.aFrac + xfer, 0.15, 0.85);

  // D. Longitudinal. Torque droop rather than heavy drag, so top speed is
  // exact and coasting still feels weighty.
  let aDrive = 0;
  let aBrake = 0;
  if (rig.gear === "R") {
    if (inp.th < 0) aDrive = inp.th * s.ACCEL_REV * (1 - cl(-rig.vf / s.VREV, 0, 1));
    else if (inp.th > 0 && rig.vf < -0.2) aBrake = s.BRAKE * inp.th;
  } else {
    if (inp.th > 0) aDrive = inp.th * s.ACCEL * rig.boostK * (1 - cl(rig.vf / (s.VMAX * rig.boostV), 0, 1));
    else if (inp.th < 0) aBrake = s.BRAKE * -inp.th;
  }
  if (inp.bk) aBrake = Math.max(aBrake, s.BRAKE);
  if (rig.hb) aBrake = Math.max(aBrake, s.HB_DECEL);
  if (Math.abs(inp.th) < 0.05 && !inp.bk) aBrake = Math.max(aBrake, s.COAST);
  // Brakes are traction-limited the same way drive is. They were not, and the
  // Math.min below never bound (at vf 10 and h 1/120 it compares against
  // 1215), so the authored BRAKE column ran at about 2.2x the tyres' own
  // limit: a sedan stopped from VMAX in 3.3 units, which is 1.6 of its own
  // body lengths, and the 9.6-unit semi stopped in 0.37 of its length. A stop
  // that short cannot read as mass, and this was the single biggest reason
  // the whole fleet felt weightless. Measured after: sedan 3.6 body lengths,
  // truck 2.5, semi 0.58.
  aBrake = Math.min(aBrake, s.MU * G_REF);
  // Traction-limit the drive against the rear load BEFORE the ellipse, so
  // the ellipse is not a function of its own output. TRAC is what keeps this
  // ceiling from swallowing the whole authored ACCEL column at launch.
  const tCap = s.MU * s.TRAC * (rig.boostActive ? BOOST_T : 1) * nR * G_REF;
  // Published before and after the clamp. load is what the tyres are
  // actually delivering, which is the engine-load axis; slipDrive is what
  // the clamp threw away, which is the only trace of wheelspin this chassis
  // has. Both are cheap and neither changes the physics.
  const aReq = aDrive;
  aDrive = cl(aDrive, -tCap, tCap);
  rig.aBrake = aBrake;
  rig.load = cl(Math.abs(aDrive) / (tCap + 1e-4), 0, 1);
  rig.slipDrive = cl(Math.abs(aReq) / (tCap + 1e-4) - 1, 0, 1);
  // Capping at |vf|/h stops the brake reversing the car through zero inside
  // a single substep, which would read as a bounce off nothing.
  const aBrakeSigned = -Math.sign(rig.vf || 1) * Math.min(aBrake, Math.abs(rig.vf) / h + s.BRAKE);

  // E. Rear combined slip. Only the rear: the front is modulated by its load
  // alone, and an ellipse there is the term most likely to ring under trail
  // braking for no gain the load transfer has not already delivered.
  const useR = cl((Math.abs(aDrive) + 0.38 * aBrake) / (s.MU * nR * G_REF + 1e-4), 0, 1);
  let muR = s.MU * Math.sqrt(Math.max(0, 1 - ELLIPSE * useR * useR));
  if (rig.hb) muR *= HB_GRIP;
  const muF = s.MU;

  // F. Tyres: one saturating curve that peaks and then drops slightly. The
  // drop is what lets a slide break away and stay out instead of settling
  // on an asymptote, and it is what makes lifting off catch it.
  const uSafe = Math.max(Math.abs(rig.vf), 0.9);
  const aF = Math.atan2(rig.vl + s.a * rig.r, uSafe) - rig.steer;
  const aR = Math.atan2(rig.vl - s.b * rig.r, uSafe);
  const satF = Math.sin(TYRE_C * Math.atan(s.BF * aF));
  const satR = Math.sin(TYRE_C * Math.atan(s.BR * aR));
  // Sign check: straight ahead, steer right (steer > 0) gives aF < 0, so
  // satF < 0 and AyF > 0, a force to the driver's right. That both pushes
  // the car right and yaws the nose right. Correct.
  const AyF = -muF * nF * G_REF * satF;
  const AyR = -muR * nR * G_REF * satR;
  rig.gripLoss = cl(Math.abs(aR) / (1.855 / s.BR), 0, 1);

  // G. Yaw. The assist is a product setting, not physics: it pulls the car
  // toward the grip-capped kinematic reference so a first-time visitor does
  // not spin into a tower in three seconds, and it fades out once they have
  // committed to a slide. Handbrake switches it off entirely.
  const cd = Math.cos(rig.steer);
  const sd = Math.sin(rig.steer);
  const tauPhys = (s.a * AyF * cd - s.b * AyR) / s.K2;
  const rKin = (rig.vf * Math.tan(rig.steer)) / s.L;
  const rCap = (s.MU * G_REF) / Math.max(Math.abs(rig.vf), 1);
  const rRef = cl(rKin, -rCap, rCap);
  const fade = 1 - ASSIST_FADE * ss(Math.abs(rig.beta), 0.18, 0.55);
  const gAss = s.ASSIST_YAW * (1 - rig.hb) * fade;
  const rD = tauPhys + cl(gAss * (rRef - rig.r), -ASSIST_MAX, ASSIST_MAX);

  // H. Body accelerations, then integrate.
  const axD = aDrive + aBrakeSigned - AyF * sd + rig.vl * rig.r;
  const ayD = AyF * cd + AyR - rig.vf * rig.r;
  rig.vf += axD * h;
  const kb = cl(Math.abs(rig.vf) / UKIN, 0, 1);
  const rK = (rig.vf * Math.tan(rig.steer)) / s.L;
  rig.vl = kb * (rig.vl + ayD * h) + (1 - kb) * (rK * s.b);
  rig.r = kb * (rig.r + rD * h) + (1 - kb) * rK;
  if (rig.airborne) {
    // Nothing to push against: yaw and slide just decay.
    rig.r *= Math.exp(-0.6 * h);
    rig.vl *= Math.exp(-0.4 * h);
  }
  rig.r = cl(rig.r, -s.R_MAX, s.R_MAX);
  rig.vl = cl(rig.vl, -(0.85 * Math.abs(rig.vf) + 2.2), 0.85 * Math.abs(rig.vf) + 2.2);
  rig.vf = cl(rig.vf, -s.VREV * 1.05, s.VMAX * rig.boostV * 1.05);
  rig.ax = axD;
  rig.ay = ayD;

  // rotation.y stays the visual heading: slip lives in the velocity vector,
  // never in a mesh yaw the chase camera cannot see.
  g.rotation.y -= rig.r * h;
  const py = g.rotation.y;
  const sy = Math.sin(py);
  const cy = Math.cos(py);
  g.position.x += (sy * rig.vf - cy * rig.vl) * h;
  g.position.z += (cy * rig.vf + sy * rig.vl) * h;
}

/**
 * Contact response as an impulse rather than a speed tax. n points AWAY from
 * the other body. Tangential velocity is mostly kept, so a wall reads as
 * something you scrape along.
 *
 * Known limitation: this is still one-sided, because path followers write
 * their position from their curve every frame. T-boning a truck gives you a
 * proper impulse and a spin, and the truck drives on through. That is why
 * REST stays low: a hard bounce off an effectively immovable body looks
 * absurd. Closing it means the lane branch owning two-way resolution.
 *
 * `quiet` suppresses the audio channels only, and exists for exactly one
 * caller: the invisible world boundary. That reflection is a genuine
 * impulse, but crunching into a wall the player cannot see is worse than an
 * unexplained deceleration.
 */
function rigContact(rig: Rig, g: THREE.Object3D, nx: number, nz: number, push: number, quiet = false) {
  const p = Math.min(push, CONTACT_MAX_PUSH);
  g.position.x += nx * p;
  g.position.z += nz * p;
  const py = g.rotation.y;
  const sy = Math.sin(py);
  const cy = Math.cos(py);
  let wx = sy * rig.vf - cy * rig.vl;
  let wz = cy * rig.vf + sy * rig.vl;
  const vn = wx * nx + wz * nz;
  if (vn >= 0) return; // already moving out of the surface
  const j = -(1 + REST) * vn;
  wx += nx * j;
  wz += nz * j;
  // Scrub and yaw damping scale with how head-on the hit is. Applying them
  // flat compounds once per substep, and a car merely RESTING against a
  // bollard is in contact on every substep of every frame: at eight substeps
  // that is a 64% speed tax per frame, which reads as the car being glued to
  // whatever it last touched. A grazing contact should cost almost nothing.
  const sev = cl(-vn / 2, 0, 1);
  const tx = -nz;
  const tz = nx;
  const vt = wx * tx + wz * tz;
  wx -= tx * vt * (1 - TANG_KEEP) * sev;
  wz -= tz * vt * (1 - TANG_KEEP) * sev;
  rig.vf = sy * wx + cy * wz;
  rig.vl = -cy * wx + sy * wz;
  rig.r *= 1 - 0.18 * sev;
  if (!quiet) {
    rig.impact = Math.max(rig.impact, -vn);
    // Tangential speed times severity: the difference between a bump and a
    // grind. TANG_KEEP is high, so a scrape genuinely keeps its speed, and
    // this is the level that says so.
    rig.scrub = Math.max(rig.scrub, Math.abs(vt) * sev);
  }
}

/** Closest-point scratch for the spine solver. JS has no cheap multi-return
 *  and this runs a few hundred times a frame, so it is a module singleton. */
const _spine = { ax: 0, az: 0, bx: 0, bz: 0 };

/**
 * Closest points between two 2D capsule spines, written into _spine. Each
 * spine is a centre, a unit direction and a half extent; a half extent of
 * zero degenerates to a point, which is how static circles and un-oriented
 * colliders fall out of the same code path with no branch.
 *
 * This is the standard clamped-parameter segment solver: solve the
 * unconstrained least squares for one parameter, clamp it, solve the other
 * against that clamp, then re-clamp the first. Two passes is exact for
 * segments, unlike the naive "project each centre onto the other".
 */
function closestSpines(
  ax: number, az: number, adx: number, adz: number, ah: number,
  bx: number, bz: number, bdx: number, bdz: number, bh: number
) {
  const rx = ax - bx;
  const rz = az - bz;
  const f = adx * bdx + adz * bdz;
  const c = adx * rx + adz * rz;
  const e = bdx * rx + bdz * rz;
  const den = 1 - f * f;
  // Near-parallel spines (two semis nose to tail) make the least squares
  // singular, and any point along the overlap is equally close, so take the
  // projection of B's centre onto A and let the clamps do the rest.
  let s = den > 1e-6 ? cl((f * e - c) / den, -ah, ah) : cl(-c, -ah, ah);
  const t = cl(f * s + e, -bh, bh);
  s = cl(f * t - c, -ah, ah);
  _spine.ax = ax + adx * s;
  _spine.az = az + adz * s;
  _spine.bx = bx + bdx * t;
  _spine.bz = bz + bdz * t;
}

/**
 * Every collider the driven machine has to stay out of, plus the world bowl.
 * Runs per substep, which is a few hundred capsule tests a frame: free.
 *
 * `onDeck` is passed rather than derived, because the deck query is a linear
 * scan of the viaduct centreline and the caller already has the answer.
 */
function resolveContacts(
  rig: Rig,
  g: THREE.Object3D,
  selfR: number,
  selfHL: number,
  bowl: boolean,
  onDeck: boolean
) {
  const fx = Math.sin(g.rotation.y);
  const fz = Math.cos(g.rotation.y);
  const hit = (ox: number, oz: number, odx: number, odz: number, ohl: number, orr: number) => {
    closestSpines(g.position.x, g.position.z, fx, fz, selfHL, ox, oz, odx, odz, ohl);
    let dx = _spine.ax - _spine.bx;
    let dz = _spine.az - _spine.bz;
    const rs = selfR + orr;
    let d2 = dx * dx + dz * dz;
    if (d2 > rs * rs) return;
    if (d2 < 1e-6) {
      // The spines actually cross, so there is no direction between the
      // closest points. Push along the centre line, and if the centres
      // coincide too, along this body's own lateral axis: any consistent
      // direction beats a NaN normal reaching the chassis.
      dx = g.position.x - ox;
      dz = g.position.z - oz;
      d2 = dx * dx + dz * dz;
      if (d2 < 1e-6) {
        dx = -fz;
        dz = fx;
        d2 = 1;
      }
    }
    const d = Math.sqrt(d2);
    rigContact(rig, g, dx / d, dz / d, rs - d);
  };
  COLLIDERS.forEach((c) => {
    if (c.o === g) return;
    // The flyover passes OVER the ring road. Without this test a car three
    // units overhead shoves the player sideways through a solid deck.
    //
    // This is a real height difference rather than a comparison of the two
    // deck FLAGS, which is what it used to be, and the difference is not
    // cosmetic. deck is "y > DECK_GAP", so the cruising air car at y 5.8 to
    // 7.6 was flagged on-deck permanently; its path crosses the viaduct
    // centreline to within 0.014 units in XZ while sitting 3.4 units above
    // it, so a player driving the deck was hit by an invisible flying car.
    // The cross-curve cone below already used the height form, so the two
    // systems disagreed with each other. They now agree.
    if (Math.abs(c.o.position.y - g.position.y) > DECK_GAP) return;
    hit(c.o.position.x, c.o.position.z, Math.sin(c.o.rotation.y), Math.cos(c.o.rotation.y), c.hl, c.r);
  });
  // Towers and the build site are upright circles, so their spine is a point
  // and their direction is arbitrary. They are also GROUND structures, and
  // they carry no deck concept at all, so on the viaduct they used to act as
  // columns of infinite height: the tower behind the plaza sits a fraction of
  // a unit off the deck centreline, which made the viaduct impassable in both
  // directions for a player while ambient riders sailed through (path
  // followers never call this function).
  if (!onDeck) {
    for (const sc of STATIC_COLS) hit(sc.x, sc.z, 0, 1, 0, sc.r);
  }
  // Reflect off the world edge rather than clamping to it. At 10 u/s the
  // bowl is crossed in five seconds, so the player meets it constantly and
  // a hard clamp reads as sticking to an invisible wall. Barges are exempt:
  // the canal sits outside the bowl and has its own banks.
  if (!bowl) return;
  const rad = Math.hypot(g.position.x, g.position.z);
  if (rad > BOWL_R) {
    rigContact(rig, g, -g.position.x / rad, -g.position.z / rad, Math.min(rad - BOWL_R, BOWL_PUSH_MAX), true);
  }
}

/**
 * Presentation, once per frame. Two second-order springs for the chassis,
 * plus the smoothed channels the HUD and the lamps read.
 *
 * The vehicle assets have no separate body group, so pitching the rig
 * rotates its wheels with it. The lift term compensates: raise the body by
 * exactly the amount the outermost corner dropped, and the wheels sit on
 * the road while the chassis still visibly dives, squats and leans.
 */
function presentDrive(rig: Rig, inp: DriveInput, dtP: number) {
  const aL = cl(rig.ax, -A_CLAMP, A_CLAMP);
  const aY = cl(rig.ay, -A_CLAMP, A_CLAMP);
  // Both signs are negated against the raw acceleration, because of how the
  // Euler angles land in this frame. rotation.x > 0 drops the +Z nose, so
  // braking (aL < 0) has to produce a POSITIVE pitch to dive. rotation.z > 0
  // raises the +X side, which is the driver's left, so a right-hand corner
  // (aY > 0) needs a NEGATIVE roll to lean on its outside wheels. Getting
  // either backwards gives a car that squats when it should dive and leans
  // into corners like a motorcycle.
  const pitchT = -PITCH_K * aL;
  const rollT = -ROLL_K * aY;
  rig.pitchV += (W0 * W0 * (pitchT - rig.pitch) - 2 * ZETA * W0 * rig.pitchV) * dtP;
  rig.pitch += rig.pitchV * dtP;
  rig.rollV += (W0 * W0 * (rollT - rig.roll) - 2 * ZETA * W0 * rig.rollV) * dtP;
  rig.roll += rig.rollV * dtP;
  if (rig.landing > 0) rig.pitchV -= LAND_KICK * rig.landing;
  // Fold this frame's events into a decaying level, then clear them. The
  // camera reads the level, because it runs after this and would otherwise
  // only ever see zero.
  rig.hit = Math.max(rig.hit * Math.exp(-SHAKE_DECAY * dtP), rig.impact + rig.landing * 0.6);
  // The audio consumer gets its OWN accumulators rather than reading rig.hit,
  // and that is not duplication. hit decays over roughly 400 ms, so a second
  // smaller impact inside that window produces no rising edge and would be
  // silently dropped, and hit folds landings in at 0.6, so a viaduct
  // touchdown and a tower collision are indistinguishable in it. They must
  // not sound the same.
  rig.aImpact = Math.max(rig.aImpact, rig.impact);
  rig.aLanding = Math.max(rig.aLanding, rig.landing);
  rig.impact = 0;
  rig.landing = 0;
  // Decayed rather than cleared: rigContact re-raises it on every substep it
  // touches something, so a car still grinding a wall keeps its level while
  // one that has come free falls away over a few frames.
  rig.scrub *= 0.55;

  rig.speed = Math.hypot(rig.vf, rig.vl);
  rig.norm = cl(rig.speed / rig.spec.VMAX, 0, 1);
  rig.beta = Math.atan2(rig.vl, Math.max(Math.abs(rig.vf), 1));
  rig.steerVis = cl(rig.steer, -STEER_VIS_CLAMP, STEER_VIS_CLAMP);

  rig.thSm += (Math.max(0, inp.th) - rig.thSm) * ease(12, dtP);
  rig.bkSm += ((inp.bk || rig.hb ? 1 : 0) - rig.bkSm) * ease(16, dtP);
  // Lamps light on lift-off deceleration too, not only on the pedal, which
  // is the difference between a car and a prop.
  rig.brakeLamp = Math.max(rig.bkSm, cl(-rig.ax / 8, 0, 1));
  rig.driftHeat += ((Math.abs(rig.beta) > 0.2 ? 1 : 0) - rig.driftHeat) * ease(2.2, dtP);
}

/* ---------------------------------------------------------------- *
 *  Contact shadows: soft dark discs, no shadow maps anywhere
 * ---------------------------------------------------------------- */

/** In-code radial gradient (alphaMap reads green); Linear filtering so the
 *  64px falloff stays smooth at any disc size. */
let _shadowTex: THREE.DataTexture | null = null;
function shadowTex(): THREE.DataTexture {
  if (_shadowTex) return _shadowTex;
  const S = 64;
  const data = new Uint8Array(S * S * 4);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const dx = (x + 0.5) / S - 0.5;
      const dy = (y + 0.5) / S - 0.5;
      const r = Math.min(1, Math.sqrt(dx * dx + dy * dy) * 2);
      const a = 1 - r;
      const f = Math.round(a * a * (3 - 2 * a) * 255); // smoothstep falloff
      const i = (y * S + x) * 4;
      data[i] = f;
      data[i + 1] = f;
      data[i + 2] = f;
      data[i + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, S, S);
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  _shadowTex = tex;
  return tex;
}

/** Soft grounding disc; w and l are the footprint in local units. */
function ContactShadow({
  w,
  l,
  opacity = 0.42,
  y = 0.008,
}: {
  w: number;
  l: number;
  opacity?: number;
  y?: number;
}) {
  return (
    <mesh position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[w, l, 1]} renderOrder={1}>
      <circleGeometry args={[0.5, 24]} />
      <meshBasicMaterial
        color="#000000"
        transparent
        opacity={opacity}
        alphaMap={shadowTex()}
        depthWrite={false}
      />
    </mesh>
  );
}

/* ---------------------------------------------------------------- *
 *  Cloud brain: wireframe shell, pulsing core, slow particle rings
 * ---------------------------------------------------------------- */

function CloudBrain() {
  const ctx = useScene();
  const root = useRef<THREE.Group>(null);
  const shell = useRef<THREE.Mesh>(null);
  const core = useRef<THREE.Mesh>(null);
  const coreMat = useRef<THREE.MeshStandardMaterial>(null);
  const swarm = useRef<THREE.InstancedMesh>(null);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  const v = useMemo(() => new THREE.Vector3(), []);
  // Three tilted rings, each drifting at its own speed: an orbit, not a blender.
  const rings = useMemo(
    () => [
      { q: new THREE.Quaternion().setFromEuler(new THREE.Euler(0.45, 0, 0.2)), r: 1.95, speed: 0.16, n: 30 },
      { q: new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.5, 0, -0.35)), r: 2.35, speed: -0.11, n: 30 },
      { q: new THREE.Quaternion().setFromEuler(new THREE.Euler(1.15, 0, 0.5)), r: 2.7, speed: 0.07, n: 24 },
    ],
    []
  );
  const N = 84;

  useFrame(({ clock }) => {
    if (!root.current || !shell.current || !core.current || !coreMat.current || !swarm.current) return;
    const t = ctx.still ? 0 : clock.elapsedTime;
    root.current.position.y = 4.6 + Math.sin(t * 0.5) * 0.1;
    shell.current.rotation.y = t * 0.06;
    shell.current.rotation.x = 0.2 + Math.sin(t * 0.11) * 0.05;
    const pulse = ctx.still ? 0.5 : 0.5 + 0.5 * Math.sin(t * 0.9);
    core.current.scale.setScalar(1 + pulse * 0.07);
    coreMat.current.emissiveIntensity = (0.8 + 1.0 * pulse) * ctx.dim;
    let i = 0;
    for (const ring of rings) {
      for (let k = 0; k < ring.n; k++) {
        const a = (k / ring.n) * Math.PI * 2 + t * ring.speed;
        v.set(Math.cos(a) * ring.r, Math.sin(k * 2.7) * 0.12, Math.sin(a) * ring.r).applyQuaternion(ring.q);
        tmp.position.copy(v);
        tmp.scale.setScalar(0.028 + ((k * 13) % 7) / 900);
        tmp.updateMatrix();
        swarm.current.setMatrixAt(i++, tmp.matrix);
      }
    }
    swarm.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={root} position={[0, 4.6, 0]}>
      <mesh ref={core}>
        <sphereGeometry args={[0.6, 24, 18]} />
        <meshStandardMaterial
          ref={coreMat}
          color="#101722"
          emissive={ICE_BRIGHT}
          emissiveIntensity={1.2}
          metalness={0.1}
          roughness={0.3}
        />
      </mesh>
      {/* soft halo around the core: cheap glow that Bloom then picks up */}
      <mesh>
        <sphereGeometry args={[1.0, 20, 14]} />
        <meshBasicMaterial color={ICE} transparent opacity={0.07 * ctx.dim} depthWrite={false} />
      </mesh>
      <mesh ref={shell}>
        <icosahedronGeometry args={[1.5, 1]} />
        <meshBasicMaterial color={ICE} wireframe transparent opacity={0.28 * ctx.dim} />
      </mesh>
      <instancedMesh ref={swarm} args={[undefined, undefined, N]} frustumCulled={false}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshBasicMaterial color={ICE_BRIGHT} transparent opacity={0.75 * ctx.dim} depthWrite={false} />
      </instancedMesh>
      {/* the brain is the scene's practical light: nearby hulls pick up its color */}
      <pointLight color={ICE} intensity={6 * ctx.dim} distance={16} decay={2} />
    </group>
  );
}

/* ---------------------------------------------------------------- *
 *  Humanoids: detailed articulated asset, three duty loops
 * ---------------------------------------------------------------- */

interface WalkerSpec {
  offset: number;
  speed: number;
  phase: number;
  /** Curve parameter where this walker stops for a beat. */
  pauseAt?: number;
  /** Seconds spent idling at the pause point. */
  pauseFor?: number;
}

/** Phases are chosen for the frozen poster too: sin(1.2) puts the first
 *  walker mid-stride on the camera side of the loop under reduced motion. */
const WALKERS: WalkerSpec[] = [
  { offset: 0.13, speed: 0.03, phase: 1.2 },
  { offset: 0.44, speed: 0.027, phase: 3.35, pauseAt: 0.9, pauseFor: 4.2 },
  { offset: 0.72, speed: 0.033, phase: 5.05 },
];

function Walker({ offset, speed, phase, pauseAt, pauseFor = 4 }: WalkerSpec) {
  const ctx = useScene();
  const group = useRef<THREE.Group>(null);
  useCollider(group, 0.5);
  const [paused, setPaused] = useState(false);
  const [greeting, setGreeting] = useState(false);
  const greetUntil = useRef(0);
  useEffect(() => {
    const o = group.current;
    if (!o || !ctx.game) return;
    const entry = {
      o: o as THREE.Object3D,
      greet: () => {
        greetUntil.current = performance.now() + 2600;
        setGreeting(true);
      },
    };
    NPCS.add(entry);
    return () => {
      NPCS.delete(entry);
    };
  }, [ctx.game]);
  const u = useRef(offset);
  const pauseStart = useRef(0);
  const yaw = useRef<number | null>(null);
  const p = useMemo(() => new THREE.Vector3(), []);
  const tan = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }, delta) => {
    const g = group.current;
    if (!g) return;
    if (greeting && performance.now() > greetUntil.current) setGreeting(false);
    if (!ctx.still && !greeting) {
      if (paused) {
        if (clock.elapsedTime - pauseStart.current > pauseFor) setPaused(false);
      } else {
        const prev = u.current;
        let next = prev + speed * delta;
        // crossing test that survives the 1 -> 0 wrap
        if (pauseAt !== undefined && (prev < pauseAt ? next >= pauseAt : next >= pauseAt + 1)) {
          next = pauseAt;
          setPaused(true);
          pauseStart.current = clock.elapsedTime;
        }
        u.current = next % 1;
      }
    }
    WALKWAY.getPointAt(u.current, p);
    WALKWAY.getTangentAt(u.current, tan);
    g.position.set(p.x, 0.01, p.z);
    // while paused, turn to watch the landing pad; otherwise face the path
    const target = paused
      ? Math.atan2(PAD_POS.x - p.x, PAD_POS.z - p.z)
      : Math.atan2(tan.x, tan.z);
    if (yaw.current === null || ctx.still) {
      yaw.current = target;
    } else {
      let dh = target - yaw.current;
      if (dh > Math.PI) dh -= Math.PI * 2;
      if (dh < -Math.PI) dh += Math.PI * 2;
      yaw.current += dh * Math.min(1, 4 * delta);
    }
    g.rotation.y = yaw.current;
  });

  return (
    <group ref={group}>
      <Robot
        pose={greeting ? "wave" : paused ? "idle" : "walk"}
        phase={phase}
        scale={ROBOT_SCALE}
        dim={ctx.dim}
        frozen={ctx.still}
      />
      <ContactShadow w={0.85} l={1.05} opacity={0.4} />
    </group>
  );
}

/** Near-field unit in three-quarter view, close to the hero camera start so
 *  the visor band, joint spheres and two-tone shells actually read. */
function IdleRobot() {
  const ctx = useScene();
  const drive = useDrive();
  const group = useRef<THREE.Group>(null);
  useCollider(group, 0.5);
  const vel = useRef(0);
  const [moving, setMoving] = useState(false);
  const [running, setRunning] = useState(false);
  const [waving, setWaving] = useState(false);
  const waveUntil = useRef(0);
  const keys = useRef({ f: 0, b: 0, l: 0, r: 0, run: false });
  // In game mode the hero unit is the player from the first frame, unless the
  // player has stepped out to look around, or has taken a machine. Clicking a
  // vehicle only clears freeCam, not the game flag, so without the `!sel` term
  // the humanoid stayed live: both key handlers ate the same WASD, the robot
  // walked off-screen while you drove, and both wrote drive.target so the
  // camera owner came down to mount order.
  const inMachine = !!drive?.sel && drive.sel.id !== "hero-bot";
  const driven = (ctx.game && !drive?.freeCam && !inMachine) || drive?.sel?.id === "hero-bot";

  // Game controls: arrows and WASD walk, shift runs, E or G greets the
  // nearest unit and it waves back. Kept local so drive mode is untouched.
  useEffect(() => {
    if (!ctx.game || inMachine) return;
    const set = (k: string, v: number, downEvt: boolean) => {
      const kk = k.toLowerCase();
      if (["w", "arrowup"].includes(kk)) keys.current.f = v;
      if (["s", "arrowdown"].includes(kk)) keys.current.b = v;
      if (["a", "arrowleft"].includes(kk)) keys.current.l = v;
      if (["d", "arrowright"].includes(kk)) keys.current.r = v;
      if (kk === "shift") keys.current.run = downEvt;
    };
    const greet = () => {
      const g = group.current;
      if (!g) return;
      let best: { greet: () => void } | null = null;
      let bd = 3.2 * 3.2;
      NPCS.forEach((n) => {
        const dx = n.o.position.x - g.position.x;
        const dz = n.o.position.z - g.position.z;
        const d2 = dx * dx + dz * dz;
        if (d2 < bd) {
          bd = d2;
          best = n;
        }
      });
      waveUntil.current = performance.now() + 2600;
      setWaving(true);
      if (best) (best as { greet: () => void }).greet();
    };
    const down = (e: KeyboardEvent) => {
      if (["e", "g"].includes(e.key.toLowerCase())) greet();
      set(e.key, 1, true);
    };
    const up = (e: KeyboardEvent) => set(e.key, 0, false);
    // A key held when the window loses focus never delivers its keyup, so it
    // stays latched at 1 for as long as the player is away. Combined with the
    // frame delta on return that walked the unit straight through every
    // collider in its path, so both halves are fixed: this clears the latch,
    // and the frame loop caps its step.
    const clear = () => {
      keys.current.f = 0;
      keys.current.b = 0;
      keys.current.l = 0;
      keys.current.r = 0;
      keys.current.run = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    document.addEventListener("visibilitychange", clear);
    (window as unknown as { __vpGreet?: () => void }).__vpGreet = greet;
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
      document.removeEventListener("visibilitychange", clear);
      delete (window as unknown as { __vpGreet?: () => void }).__vpGreet;
    };
  }, [ctx.game, inMachine]);
  useFrame((_, rawDelta) => {
    const g = group.current;
    if (!g || !driven) return;
    // r3f hands over raw wall-clock time, and rAF is suspended while the tab
    // is hidden, so the first frame back can carry twenty seconds. Uncapped
    // that integrated to a thirty-unit step, which tunnels through every
    // half-unit collider on the way and lands on the fog edge.
    const delta = Math.min(rawDelta, PRES_DT_CAP);
    if (waving && performance.now() > waveUntil.current) setWaving(false);
    // game mode reads its own keys; drive mode reads the shared input
    const k = keys.current;
    const th = ctx.game ? k.f - k.b * 0.7 : drive?.input.current.th ?? 0;
    const st = ctx.game ? k.r - k.l : drive?.input.current.st ?? 0;
    const bk = ctx.game ? 0 : drive?.input.current.bk ?? 0;
    const wantRun = ctx.game && k.run && k.f > 0;
    if (wantRun !== running) setRunning(wantRun);
    const top = wantRun ? 4.1 : 1.7;
    const target = waving ? 0 : th * top;
    vel.current += (target - vel.current) * Math.min(1, delta * 3);
    if (Math.abs(th) < 0.05) vel.current *= 1 - Math.min(1, delta * 3);
    if (bk) vel.current *= 1 - Math.min(1, delta * 6);
    g.rotation.y -= st * 2.6 * delta;
    g.position.x += Math.sin(g.rotation.y) * vel.current * delta;
    g.position.z += Math.cos(g.rotation.y) * vel.current * delta;
    // stay inside the fog bowl
    const r = Math.hypot(g.position.x, g.position.z);
    if (r > 27) {
      g.position.x *= 27 / r;
      g.position.z *= 27 / r;
    }
    // The robot slides out of overlaps like everything else. It is a point
    // against the other body's capsule spine, which matters now that a semi
    // is a 3.7-unit spine rather than a 3.4-unit circle: a circle test would
    // let the walker stroll straight through the middle of the trailer.
    const resolve = (ox: number, oz: number, odx: number, odz: number, ohl: number, orr: number) => {
      closestSpines(g.position.x, g.position.z, 0, 1, 0, ox, oz, odx, odz, ohl);
      const dx = g.position.x - _spine.bx;
      const dz = g.position.z - _spine.bz;
      const rs = 0.45 + orr;
      const d2 = dx * dx + dz * dz;
      if (d2 > rs * rs || d2 < 1e-6) return;
      const d = Math.sqrt(d2);
      const push = rs - d;
      g.position.x += (dx / d) * push;
      g.position.z += (dz / d) * push;
      vel.current *= 0.5;
    };
    COLLIDERS.forEach((c) => {
      // Same deck test the chassis resolver and the traffic cone use. The
      // walker was the one contact loop the deck work never reached, and the
      // flyover passes within 0.011 units of the ring road in plan view: a
      // truck three units overhead was barging the humanoid off the road with
      // nothing visible beside it. That is exactly the bug DECK_GAP exists to
      // kill, and the capsule change had made the footprint doing it larger.
      if (c.o === g || Math.abs(c.o.position.y - g.position.y) > DECK_GAP) return;
      resolve(c.o.position.x, c.o.position.z, Math.sin(c.o.rotation.y), Math.cos(c.o.rotation.y), c.hl, c.r);
    });
    for (const sc of STATIC_COLS) resolve(sc.x, sc.z, 0, 1, 0, sc.r);
    const isMoving = Math.abs(vel.current) > 0.12;
    if (isMoving !== moving) setMoving(isMoving);
    if (drive) drive.target.current = g;
  });
  const clickable = !!drive && !ctx.background;
  return (
    <group
      ref={group}
      position={[4.7, 0.008, 9.2]}
      rotation={[0, 1.35, 0]}
      onClick={
        clickable
          ? (e) => {
              e.stopPropagation();
              drive!.set({ id: "hero-bot", label: "HUMANOID", kind: "bot" });
            }
          : undefined
      }
      onPointerOver={
        clickable
          ? (e) => {
              e.stopPropagation();
              document.body.style.cursor = "pointer";
            }
          : undefined
      }
      onPointerOut={clickable ? () => (document.body.style.cursor = "auto") : undefined}
    >
      <Robot
        pose={waving ? "wave" : driven && moving ? (running ? "run" : "walk") : "idle"}
        phase={0.7}
        scale={ROBOT_SCALE}
        dim={ctx.dim}
        frozen={ctx.still}
      />
      <ContactShadow w={0.85} l={1.05} opacity={0.42} />
    </group>
  );
}

/* ---------------------------------------------------------------- *
 *  Build site: a frame going up, a kneeling pair working the beam cycle
 * ---------------------------------------------------------------- */

/** Three full assemble cycles (the asset's loop runs 3.125 s) per beam
 *  placement, so the kneel-reach loop stays in step with the lift. */
const BEAM_PERIOD = 9.375;

/** Ground loop the panel carrier walks: past the stack, around the open
 *  front of the structure, back along the rear, never through the glass. */
const CARRY_PATH = new THREE.CatmullRomCurve3(
  [
    v3(-1.9, 0, -0.6), v3(-2.3, 0, 0.55), v3(-1.3, 0, 1.6), v3(0.4, 0, 1.85),
    v3(1.7, 0, 1.3), v3(2.2, 0, 0.2), v3(1.5, 0, -1.25), v3(-0.3, 0, -1.5),
  ],
  true,
  "catmullrom",
  0.5
);

/** Welder: a kneeling unit works the rear column joint inside the ground
 *  floor; a spark point flickers deterministically with a matching light. */
function Welder() {
  const ctx = useScene();
  const sparkMat = useRef<THREE.MeshBasicMaterial>(null);
  const sparkLight = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    const t = ctx.still ? 0 : clock.elapsedTime;
    // gated flicker: bursts while the internal reach cycle is "on the joint"
    const cyc = ((t * 0.32 + 0.8 * 0.17) % 1 + 1) % 1;
    const working = cyc > 0.2 && cyc < 0.75 ? 1 : 0;
    const flick = working * Math.max(0, Math.sin(t * 31) * Math.sin(t * 17.3) + 0.35);
    if (sparkMat.current) sparkMat.current.opacity = Math.min(1, flick) * ctx.dim;
    if (sparkLight.current) sparkLight.current.intensity = flick * 1.6 * ctx.dim;
  });
  return (
    <group>
      <group position={[0.85, 0, -0.2]} rotation={[0, Math.PI, 0]}>
        <Robot pose="assemble" phase={0.8} scale={ROBOT_SCALE} dim={ctx.dim} frozen={ctx.still} />
      </group>
      <mesh position={[0.85, 0.38, -0.72]}>
        <sphereGeometry args={[0.025, 6, 6]} />
        <meshBasicMaterial ref={sparkMat} color={ICE_BRIGHT} transparent depthWrite={false} />
      </mesh>
      <pointLight ref={sparkLight} position={[0.85, 0.45, -0.68]} color={ICE_BRIGHT} distance={2.6} decay={2} />
    </group>
  );
}

/** Panel airlift loop: rise off the stack, ferry across, seat on the slab. */
const LIFT_PERIOD = 14;

function BuildSite() {
  const ctx = useScene();
  const beam = useRef<THREE.Mesh>(null);
  const beamMat = useRef<THREE.MeshStandardMaterial>(null);
  const lift = useRef<THREE.Group>(null);
  const liftMat = useRef<THREE.MeshStandardMaterial>(null);
  /** 0..1 beam height each frame; the kneeling pair's guideRef, so their
   *  hands visibly ride the beam instead of pantomiming beside it. */
  const riseRef = useRef(0);
  // ghost outline of the floors that do not exist yet
  const holoGeo = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(1.9, 1.05, 1.9)), []);

  useFrame(({ clock }) => {
    const m = beam.current;
    const mat = beamMat.current;
    if (m && mat) {
      // one placement cycle: lift, seat, quiet dissolve, repeat
      const p = ctx.still ? 0.6 : (clock.elapsedTime % BEAM_PERIOD) / BEAM_PERIOD;
      const rise = THREE.MathUtils.smoothstep(Math.min(p / 0.55, 1), 0, 1);
      m.position.y = 0.3 + rise * 1.9;
      mat.opacity = p > 0.75 ? Math.max(0, 1 - (p - 0.75) / 0.15) : 1;
      m.visible = mat.opacity > 0.01;
      riseRef.current = rise * mat.opacity;
    }
    const lg = lift.current;
    const lm = liftMat.current;
    if (lg && lm) {
      // drone pair ferries a wall panel: stack, up, across, seat, dissolve
      const p = ctx.still ? 0.42 : (clock.elapsedTime % LIFT_PERIOD) / LIFT_PERIOD;
      const up = THREE.MathUtils.smoothstep(Math.min(p / 0.3, 1), 0, 1);
      const across = THREE.MathUtils.smoothstep(p, 0.32, 0.58);
      const seat = THREE.MathUtils.smoothstep(p, 0.6, 0.72);
      lg.position.set(
        -1.7 + across * 1.7,
        0.35 + up * 2.1 - seat * 0.85,
        -0.6 + across * 0.25
      );
      lm.opacity = p > 0.8 ? Math.max(0, 1 - (p - 0.8) / 0.12) : 1;
      lg.visible = lm.opacity > 0.01;
    }
  });
  return (
    <group position={[6.2, 0.004, 5.8]} rotation={[0, -0.5, 0]}>
      {/* full-height corner columns span both built levels */}
      {[[-0.85, -0.85], [0.85, -0.85], [-0.85, 0.85], [0.85, 0.85]].map(([x, z], i) => (
        <mesh key={i} position={[x, 1.1, z]}>
          <boxGeometry args={[0.09, 2.2, 0.09]} />
          <meshStandardMaterial {...M.joint} />
        </mesh>
      ))}
      {/* ground floor is DONE: slab on top, glass infill on the two back sides */}
      <mesh position={[0, 1.12, 0]}>
        <boxGeometry args={[2.05, 0.07, 2.05]} />
        <meshStandardMaterial {...M.hull} />
      </mesh>
      <mesh position={[0, 0.55, -0.85]}>
        <boxGeometry args={[1.66, 1.05, 0.035]} />
        <meshStandardMaterial color="#10131a" metalness={0.85} roughness={0.2} />
      </mesh>
      <mesh position={[-0.85, 0.55, 0]}>
        <boxGeometry args={[0.035, 1.05, 1.66]} />
        <meshStandardMaterial color="#10131a" metalness={0.85} roughness={0.2} />
      </mesh>
      {/* level two is bones: one top beam in, the rest arriving */}
      <mesh position={[0, 2.2, -0.85]}>
        <boxGeometry args={[1.8, 0.09, 0.09]} />
        <meshStandardMaterial {...M.joint} />
      </mesh>
      {/* the beam the ground pair is placing */}
      <mesh ref={beam} position={[0, 0.3, 0.85]}>
        <boxGeometry args={[1.8, 0.09, 0.09]} />
        <meshStandardMaterial
          ref={beamMat}
          {...M.hull}
          transparent
          emissive={ICE}
          emissiveIntensity={0.25 * ctx.dim}
        />
      </mesh>
      {/* holographic blueprint: the two floors that only exist as intent yet */}
      {[2.85, 3.95].map((y, i) => (
        <lineSegments key={i} geometry={holoGeo} position={[0, y, 0]}>
          <lineBasicMaterial color={ICE} transparent opacity={(0.2 - i * 0.07) * ctx.dim} />
        </lineSegments>
      ))}
      {/* panel stack waiting on the ground */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[-1.7, 0.08 + i * 0.055, -0.6]} rotation={[0, 0.12 * i, 0]}>
          <boxGeometry args={[0.72, 0.045, 0.5]} />
          <meshStandardMaterial {...M.hull} />
        </mesh>
      ))}
      {/* drone pair ferrying one panel up to the slab */}
      <group ref={lift}>
        <mesh>
          <boxGeometry args={[0.72, 0.045, 0.5]} />
          <meshStandardMaterial
            ref={liftMat}
            {...M.hull}
            transparent
            emissive={ICE}
            emissiveIntensity={0.2 * ctx.dim}
          />
        </mesh>
        {([-1, 1] as const).map((side) => (
          <group key={side} position={[side * 0.26, 0.34, 0]}>
            <mesh>
              <capsuleGeometry args={[0.035, 0.09, 3, 8]} />
              <meshStandardMaterial {...M.joint} />
            </mesh>
            {/* taut lift cables down to the panel corners */}
            <mesh position={[0, -0.17, 0]}>
              <boxGeometry args={[0.006, 0.3, 0.006]} />
              <meshStandardMaterial color="#3a3d44" metalness={0.6} roughness={0.5} />
            </mesh>
          </group>
        ))}
      </group>
      {/* the kneeling pair at the beam ends: guideRef couples their hands
          and gaze to the beam's actual height every frame */}
      <group position={[1.3, 0, 0.85]} rotation={[0, -Math.PI / 2, 0]}>
        <Robot pose="assemble" phase={0} guideRef={riseRef} scale={ROBOT_SCALE} dim={ctx.dim} frozen={ctx.still} />
        <ContactShadow w={1.0} l={1.3} opacity={0.42} />
      </group>
      <group position={[-1.3, 0, 0.85]} rotation={[0, Math.PI / 2, 0]}>
        <Robot pose="assemble" phase={2.94} guideRef={riseRef} scale={ROBOT_SCALE} dim={ctx.dim} frozen={ctx.still} />
        <ContactShadow w={1.0} l={1.3} opacity={0.42} />
      </group>
      {/* panel carrier: hauls a panel around the open front on a fixed loop */}
      <PathRider curve={CARRY_PATH} offset={0.2} lapSpeed={0.05} y={0} scale={ROBOT_SCALE}>
        {() => (
          <>
            <Robot pose="carry" phase={1.1} dim={ctx.dim} frozen={ctx.still} />
            <mesh position={[0, 0.82, 0.4]} rotation={[0.12, 0, 0]}>
              <boxGeometry args={[0.62, 0.05, 0.46]} />
              <meshStandardMaterial {...M.hull} />
            </mesh>
            <ContactShadow w={0.9} l={1.2} opacity={0.4} />
          </>
        )}
      </PathRider>
      {/* welder inside the ground floor, sparking the rear column joint */}
      <Welder />
      {/* site supervisor at a holo console, reading the build */}
      <group position={[2.05, 0, -0.35]} rotation={[0, -Math.PI / 2 - 0.25, 0]}>
        <Robot pose="operate" phase={2.2} scale={ROBOT_SCALE} dim={ctx.dim} frozen={ctx.still} />
        <ContactShadow w={0.8} l={0.9} opacity={0.38} />
        {/* the console it is reading: two legs, tilted holo pane */}
        <group position={[0, 0, 0.62]}>
          {([-1, 1] as const).map((side) => (
            <mesh key={side} position={[side * 0.22, 0.42, 0]}>
              <cylinderGeometry args={[0.018, 0.024, 0.84, 8]} />
              <meshStandardMaterial {...M.graphite} />
            </mesh>
          ))}
          <mesh position={[0, 0.88, 0]} rotation={[-0.42, 0, 0]}>
            <planeGeometry args={[0.6, 0.34]} />
            <meshBasicMaterial color={ICE} transparent opacity={0.1 * ctx.dim} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
          <mesh position={[0, 0.88, 0.002]} rotation={[-0.42, 0, 0]}>
            <planeGeometry args={[0.52, 0.05]} />
            <meshBasicMaterial color={ICE_BRIGHT} transparent opacity={0.2 * ctx.dim} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
        </group>
      </group>
      {/* the third builder works ON the finished slab, seating the airlifted
          panels at the level-two edge */}
      <group position={[0.28, 1.155, 0.02]} rotation={[0, -Math.PI / 2 + 0.3, 0]}>
        <Robot pose="assemble" phase={1.5} scale={ROBOT_SCALE} dim={ctx.dim} frozen={ctx.still} />
      </group>
    </group>
  );
}

/* ---------------------------------------------------------------- *
 *  Drones: propless lozenges banking through their patrol curves
 * ---------------------------------------------------------------- */

function Drone({ curve, offset, speed }: { curve: THREE.CatmullRomCurve3; offset: number; speed: number }) {
  const ctx = useScene();
  const group = useRef<THREE.Group>(null);
  const strobe = useRef<THREE.MeshBasicMaterial>(null);
  const t = useRef(offset);
  const heading = useRef<number | null>(null);
  const bank = useRef(0);
  const p = useMemo(() => new THREE.Vector3(), []);
  const tan = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }, delta) => {
    const g = group.current;
    if (!g) return;
    if (!ctx.still) t.current = (t.current + speed * delta) % 1;
    curve.getPointAt(t.current, p);
    curve.getTangentAt(t.current, tan);
    g.position.copy(p);
    const h = Math.atan2(tan.x, tan.z);
    // bank into turns from the frame-to-frame heading change, normalized
    // across the +-pi wrap so the roll never snaps
    let dh = heading.current === null ? 0 : h - heading.current;
    if (dh > Math.PI) dh -= Math.PI * 2;
    if (dh < -Math.PI) dh += Math.PI * 2;
    heading.current = h;
    const target = ctx.still ? 0 : THREE.MathUtils.clamp(-dh * 22, -0.45, 0.45);
    bank.current += (target - bank.current) * Math.min(1, 5 * delta);
    g.rotation.order = "YXZ"; // heading first, then pitch and roll
    g.rotation.set(-tan.y * 0.7, h, bank.current);
    if (strobe.current)
      strobe.current.opacity =
        (ctx.still ? 0.5 : Math.sin(clock.elapsedTime * 5 + offset * 40) > 0.65 ? 1 : 0.12) * ctx.dim;
  });

  return (
    <group ref={group}>
      {/* hull: a flattened lozenge, no rotors: 2040 does not spin props */}
      <mesh scale={[1, 0.32, 1.45]}>
        <sphereGeometry args={[0.17, 12, 8]} />
        <meshStandardMaterial {...M.hull} />
      </mesh>
      <mesh position={[0, -0.045, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.21, 0.013, 6, 24]} />
        <meshBasicMaterial color={ICE} transparent opacity={0.7 * ctx.dim} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.02, -0.26]}>
        <sphereGeometry args={[0.028, 6, 6]} />
        <meshBasicMaterial ref={strobe} color={AMBER} transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

/* ---------------------------------------------------------------- *
 *  Roadways and traffic
 * ---------------------------------------------------------------- */

function RoadStuds() {
  const ctx = useScene();
  const N = 56;
  const ref = useRef<THREE.InstancedMesh>(null);
  // Static: matrices are laid down once, before first paint.
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const tmp = new THREE.Object3D();
    const p = new THREE.Vector3();
    const tan = new THREE.Vector3();
    const side = new THREE.Vector3();
    for (let i = 0; i < N; i++) {
      const t = i / N;
      ROAD.getPointAt(t, p);
      ROAD.getTangentAt(t, tan);
      side.set(tan.z, 0, -tan.x).normalize(); // perpendicular in the ground plane
      const s = i % 2 === 0 ? 1 : -1;
      tmp.position.set(p.x + side.x * 0.68 * s, 0.055, p.z + side.z * 0.68 * s);
      tmp.rotation.set(0, Math.atan2(tan.x, tan.z), 0);
      tmp.updateMatrix();
      m.setMatrixAt(i, tmp.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, N]} frustumCulled={false}>
      <boxGeometry args={[0.05, 0.02, 0.18]} />
      <meshBasicMaterial color={ICE} transparent opacity={0.4 * ctx.dim} depthWrite={false} />
    </instancedMesh>
  );
}

function Roadway() {
  const ctx = useScene();
  // A tube flattened on y becomes the ribbon; the same curve at a hairline
  // radius becomes the center guide line.
  const ribbon = useMemo(() => new THREE.TubeGeometry(ROAD, 128, 0.55, 8, true), []);
  const guide = useMemo(() => new THREE.TubeGeometry(ROAD, 128, 0.02, 6, true), []);
  return (
    <group>
      <mesh geometry={ribbon} scale={[1, 0.14, 1]} position={[0, 0.01, 0]}>
        <meshStandardMaterial color="#141519" metalness={0.5} roughness={0.55} />
      </mesh>
      <mesh geometry={guide} position={[0, 0.085, 0]}>
        <meshBasicMaterial color={ICE} transparent opacity={0.18 * ctx.dim} depthWrite={false} />
      </mesh>
      <RoadStuds />
    </group>
  );
}

/** The bypass lane: wider, darker, fainter guide; the semi's territory. */
function BypassRoad() {
  const ctx = useScene();
  const ribbon = useMemo(() => new THREE.TubeGeometry(BYPASS, 160, 0.85, 8, true), []);
  const guide = useMemo(() => new THREE.TubeGeometry(BYPASS, 160, 0.02, 6, true), []);
  return (
    <group>
      <mesh geometry={ribbon} scale={[1, 0.08, 1]} position={[0, 0.012, 0]}>
        <meshStandardMaterial color="#121317" metalness={0.5} roughness={0.55} />
      </mesh>
      <mesh geometry={guide} position={[0, 0.08, 0]}>
        <meshBasicMaterial color={ICE} transparent opacity={0.12 * ctx.dim} depthWrite={false} />
      </mesh>
    </group>
  );
}


/** The flyover: flattened-tube deck riding the elevated curve, a faint
 *  guide line, instanced edge lights, and pylons that drop to grade only
 *  where they will not spear the ring road or the plaza. */
function FlyoverRoad() {
  const ctx = useScene();
  // TubeGeometry bakes world coordinates, so flattening the round tube into a
  // ribbon with a mesh-level scale on Y squashed the deck's ELEVATION, not
  // just its thickness: the slab ended up lying across the ring road at y 0.3
  // while its riders drove three units above it. Flatten every ring toward
  // its own centre point instead, which touches thickness only.
  const deck = useMemo(() => {
    const SEG = 160;
    const geo = new THREE.TubeGeometry(FLYOVER, SEG, 0.62, 8, false);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const perRing = pos.count / (SEG + 1);
    const c = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      FLYOVER.getPointAt(Math.min(1, Math.floor(i / perRing) / SEG), c);
      pos.setY(i, c.y + (pos.getY(i) - c.y) * 0.12);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  }, []);
  const guide = useMemo(() => new THREE.TubeGeometry(FLYOVER, 160, 0.02, 6, false), []);
  // Pylon placement: sample the deck, drop a pier unless it lands on the
  // ring road ribbon, inside the plaza, or on the bypass lane.
  const pylons = useMemo(() => {
    const roadPts = ROAD.getSpacedPoints(140);
    const bypassPts = BYPASS.getSpacedPoints(140);
    const out: { x: number; z: number; h: number }[] = [];
    const N = 26;
    for (let i = 0; i < N; i++) {
      const p = FLYOVER.getPointAt(i / N);
      const nearRoad = roadPts.some((q) => (q.x - p.x) ** 2 + (q.z - p.z) ** 2 < 1.35 ** 2);
      const nearBypass = bypassPts.some((q) => (q.x - p.x) ** 2 + (q.z - p.z) ** 2 < 1.1 ** 2);
      const inPlaza = p.x * p.x + p.z * p.z < 5.6 ** 2;
      const h = p.y - 0.12; // top ends clear of the deck underside
      if (h > 0.7 && !nearRoad && !nearBypass && !inPlaza) out.push({ x: p.x, z: p.z, h });
    }
    return out;
  }, []);
  const piers = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = piers.current;
    if (!m) return;
    const tmp = new THREE.Object3D();
    pylons.forEach((py, i) => {
      tmp.position.set(py.x, py.h / 2, py.z);
      tmp.scale.set(1, py.h, 1);
      tmp.updateMatrix();
      m.setMatrixAt(i, tmp.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  }, [pylons]);
  const lights = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = lights.current;
    if (!m) return;
    const tmp = new THREE.Object3D();
    const p = new THREE.Vector3();
    const tan = new THREE.Vector3();
    const side = new THREE.Vector3();
    const N = 64;
    for (let i = 0; i < N; i++) {
      FLYOVER.getPointAt(i / N, p);
      FLYOVER.getTangentAt(i / N, tan);
      side.set(tan.z, 0, -tan.x).normalize();
      const s = i % 2 === 0 ? 1 : -1;
      tmp.position.set(p.x + side.x * 0.55 * s, p.y + 0.085, p.z + side.z * 0.55 * s);
      tmp.rotation.set(0, Math.atan2(tan.x, tan.z), 0);
      tmp.updateMatrix();
      m.setMatrixAt(i, tmp.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <group>
      <mesh geometry={deck}>
        <meshStandardMaterial color="#16171c" metalness={0.55} roughness={0.5} />
      </mesh>
      <mesh geometry={guide} position={[0, 0.075, 0]}>
        <meshBasicMaterial color={ICE} transparent opacity={0.16 * ctx.dim} depthWrite={false} />
      </mesh>
      <instancedMesh ref={lights} args={[undefined, undefined, 64]} frustumCulled={false}>
        <boxGeometry args={[0.05, 0.02, 0.16]} />
        <meshBasicMaterial color={ICE} transparent opacity={0.35 * ctx.dim} depthWrite={false} />
      </instancedMesh>
      <instancedMesh ref={piers} args={[undefined, undefined, 26]} count={pylons.length} frustumCulled={false}>
        <cylinderGeometry args={[0.07, 0.14, 1, 8]} />
        <meshStandardMaterial color="#1d1f24" metalness={0.6} roughness={0.5} />
      </instancedMesh>
    </group>
  );
}

/**
 * Rides a closed curve at a constant lap speed, +Z aligned to the tangent.
 * Children receive the wheel-spin speed (world speed divided by the group
 * scale, so the asset's unscaled wheel radii roll at true ground speed).
 */
function PathRider({
  curve,
  offset,
  lapSpeed,
  y,
  scale = 1,
  driveId,
  driveLabel,
  driveMax = 4,
  driveKind = "car",
  hitR,
  driveChase,
  children,
}: {
  curve: THREE.CatmullRomCurve3;
  offset: number;
  lapSpeed: number;
  y: number;
  scale?: number;
  /** Present = this rider is clickable and player-drivable. */
  driveId?: string;
  driveLabel?: string;
  driveMax?: number;
  driveKind?: "car" | "boat";
  /** Optional override for the capsule RADIUS (half width) before scale.
   *  Nothing passes one now: BODY_HW carries a measured half width for every
   *  tuning key, including the semi and the barge that used to need one. */
  hitR?: number;
  /** Chase-camera distance for this machine; long ones need much more. */
  driveChase?: number;
  /** Second and third arguments are the live front-wheel angle (radians,
   *  positive turns left, matching the vehicle assets) and brake state of a
   *  player-driven machine. Ambient traffic passes undefined for both, which
   *  is what keeps its tail lamps on the old constant glow. */
  children: (wheelSpeed: number, steer?: number, brake?: boolean) => ReactNode;
}) {
  const ctx = useScene();
  const drive = useDrive();
  const group = useRef<THREE.Group>(null);
  const u = useRef(offset);
  const wasDriven = useRef(false);
  const p = useMemo(() => new THREE.Vector3(), []);
  const tan = useMemo(() => new THREE.Vector3(), []);
  const len = useMemo(() => curve.getLength(), [curve]);
  const selected = !!driveId && drive?.sel?.id === driveId;
  /** Autopilot: the machine drives its own lane again with the player still
   *  aboard and the chase camera still on it. `manual` is the flag the
   *  physics branch keys off, and splitting the two is what lets the release
   *  path below run its existing rejoin blend when AUTO engages. */
  const auto = selected && !!drive?.auto;
  const manual = selected && !auto;
  const driven = selected;
  // The capsule radius is the body's half WIDTH. It used to be the
  // pre-capsule circle constant, which left every body with a correct spine
  // length and a radius 1.9x to 3.2x too wide: a semi got 3.40 against a real
  // 1.05, giving a collision body 16.4 units long and 6.8 wide for a truck
  // that is about 10 units long. That is why a player stopped 2.5 units of
  // visible daylight short of a parked car and could not pass anything on a
  // lane roughly one car wide. bodyHW was written for exactly this and was
  // never wired in.
  const selfR = (hitR ?? bodyHW(driveId, driveKind)) * scale;
  const halfLen = bodyHalf(driveId, driveKind) * scale;
  // Which deck this body is on, shared by reference with its collider entry so
  // the resolver reads it in O(1). Flyover riders start elevated, and it is
  // refreshed from real height every frame because a driven machine can come
  // down a ramp and rejoin the traffic at grade mid-lap.
  const deckRef = useRef(curve === FLYOVER);
  const yieldF = useRef(1);
  const holdUntil = useRef(0);
  const holdSince = useRef(0);
  const jamSince = useRef(0);
  const drivenRef = useRef(false);
  // Rejoin blend state, captured at the moment the player lets go.
  const rejoin = useRef(0);
  const rejoinPos = useMemo(() => new THREE.Vector3(), []);
  const rejoinYaw = useRef(0);
  /** Last lane heading, so the autopilot can publish a real yaw rate. */
  const prevYaw = useRef(0);
  const lamps = useRef<THREE.Group>(null);
  const lampMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: "#ff3524", transparent: true, opacity: 0, toneMapped: false }),
    []
  );
  useEffect(() => () => lampMat.dispose(), [lampMat]);
  // Steer and brake reach the vehicle meshes as props, which costs a render,
  // so they are quantized: a steady corner settles on one bucket and stops
  // re-rendering, and ambient traffic never writes them at all.
  const [vis, setVis] = useState({ ws: 0, st: 0, bk: false });
  const visRef = useRef(vis);
  const pushVis = (ws: number, st: number, bk: boolean) => {
    const q = visRef.current;
    if (q.ws === ws && q.st === st && q.bk === bk) return;
    visRef.current = { ws, st, bk };
    setVis(visRef.current);
  };
  useEffect(() => {
    // MANUAL, not selected. Under autopilot this machine is back on its own
    // curve, so it has to stay visible to the same-curve following scan or
    // every rider behind it queues against nothing and drives through it.
    drivenRef.current = manual;
  }, [manual]);
  useEffect(() => {
    const g = group.current;
    // Only riders the player can actually take over register a collider.
    // The other two were both wrong in ways nothing else could see: the
    // build-site porter lives inside a group translated to (6.2, 5.8) and
    // rotated -0.5, and every resolver reads c.o.position directly as a world
    // value, so it registered a 2.3-unit invisible capsule orbiting the
    // middle of the plaza while the porter itself had no collider at all. The
    // cruising air car flies at y 5.8 to 7.6 and has nothing to collide with
    // by design. Neither has traffic to queue behind either, which is why the
    // lane registry below already skipped them.
    if (!g || !driveId) return;
    // Heading, pitch and roll all live on this one group (the vehicle assets
    // have no separate body node), so the Euler order has to apply yaw
    // first or a leaning car would also swing its nose.
    g.rotation.order = "YXZ";
    const entry: Collider = { o: g as THREE.Object3D, r: selfR, hl: halfLen, deck: deckRef };
    COLLIDERS.add(entry);
    return () => {
      COLLIDERS.delete(entry);
    };
  }, [selfR, halfLen, driveId]);
  // Only drivable riders join the lane registry: the airborne drone rider and
  // the build-site porter have no traffic to queue behind.
  useEffect(() => {
    const g = group.current;
    if (!g || !driveId) return;
    const entry: TrafficEntry = {
      curve,
      len,
      u,
      half: halfLen,
      r: selfR,
      o: g as THREE.Object3D,
      driven: drivenRef,
    };
    TRAFFIC.add(entry);
    TRAFFIC_BY_OBJ.set(g, entry);
    return () => {
      TRAFFIC.delete(entry);
      TRAFFIC_BY_OBJ.delete(g);
    };
  }, [curve, len, halfLen, selfR, driveId, u]);
  useFrame((st, delta) => {
    const g = group.current;
    if (!g) return;
    // Refreshed before any contact test runs, so a machine that has just
    // ramped down is treated as being at grade on the same frame.
    deckRef.current = g.position.y > DECK_GAP;
    if (manual && drive) {
      const rig = drive.rig.current;
      if (!wasDriven.current) {
        // Take control without a dead stop: seed the chassis with the speed
        // this machine was already carrying, and let its heading stand.
        wasDriven.current = true;
        resetRig(rig);
        rig.spec = resolveSpec(driveId!, driveKind, driveMax, scale);
        rig.driven = true;
        rig.vf = ctx.still ? 0 : len * lapSpeed;
        rig.gear = rig.vf > 0.25 ? "D" : "N";
      }
      const inp = drive.input.current;
      rig.hb = inp.hb;
      rig.autoActive = false;
      const dtPhys = Math.min(delta, DT_CAP);
      let rem = dtPhys;
      let guard = 0;
      while (rem > 1e-5 && guard++ < MAX_SUBSTEPS) {
        const h = Math.min(H_FIXED, rem);
        stepDrive(rig, inp, g, h);
        // The bowl is skipped while this machine is on the viaduct. The ramps
        // reach radius 31.7 against a 26-unit bowl, so the boundary cut clean
        // across a solid deck in mid-air and bounced the player off nothing
        // on both ramps, which are the only way down to grade.
        resolveContacts(rig, g, selfR, halfLen, driveKind !== "boat" && !deckRef.current, deckRef.current);
        rem -= h;
      }
      // Whatever the substep guard could not consume. The airborne term below
      // has to advance by the time the loop ACTUALLY covered, or vertical and
      // horizontal motion run on different clocks inside one frame and a jump
      // off the flyover falls further per unit of travel on a slow machine.
      const dtUsed = dtPhys - Math.max(0, rem);
      // A NaN anywhere in the chassis is unrecoverable and silently poisons
      // the camera too, so catch it here rather than debugging it later.
      //
      // rotation.y and position.y are in the test and in the recovery for a
      // reason: rotation.y is only ever written by a -= inside stepDrive and
      // position.y only by a += or a lerp, so neither has an absolute reset
      // anywhere else. A recovery that teleported the group but left the
      // heading poisoned put Math.sin(NaN) straight back into the position
      // integral on the very next frame, so the guard fired forever, the
      // machine was pinned at world origin, and because it is still published
      // as the camera target the whole canvas went black.
      if (
        !Number.isFinite(
          rig.vf + rig.vl + rig.r + rig.steer + g.position.x + g.position.y + g.position.z + g.rotation.y
        )
      ) {
        resetRig(rig);
        rig.driven = true;
        rig.vy = 0;
        g.rotation.set(0, 0, 0);
        g.position.set(0, ROAD_Y, 0);
      }
      if (driveKind === "boat") {
        // The banks bounce the barge instead of clamping it, so a hard turn
        // into the wall scrubs off speed rather than sticking.
        if (g.position.z < CANAL_BOUNDS.zMin) rigContact(rig, g, 0, 1, CANAL_BOUNDS.zMin - g.position.z);
        else if (g.position.z > CANAL_BOUNDS.zMax) rigContact(rig, g, 0, -1, g.position.z - CANAL_BOUNDS.zMax);
        if (g.position.x < -CANAL_BOUNDS.xMax) rigContact(rig, g, 1, 0, -CANAL_BOUNDS.xMax - g.position.x);
        else if (g.position.x > CANAL_BOUNDS.xMax) rigContact(rig, g, -1, 0, g.position.x - CANAL_BOUNDS.xMax);
      }
      const dtP = Math.min(delta, PRES_DT_CAP);
      presentDrive(rig, inp, dtP);
      g.rotation.x = rig.pitch;
      g.rotation.z = rig.roll;
      // Ride height: the body dives and leans about the group origin, which
      // would drive the loaded corner through the tarmac, so lift by exactly
      // what that corner dropped. The net read is suspension travel.
      const lift =
        Math.abs(Math.sin(rig.pitch)) * rig.spec.halfWB + Math.abs(Math.sin(rig.roll)) * rig.spec.halfTrack;
      // Stay on the viaduct while you are on it, and fall off the end. The
      // half-unit tolerance is what stops a car driving UNDER the flyover
      // from being snapped up onto it.
      let surface = ROAD_Y;
      if (driveKind === "boat") {
        surface = 0.02;
        rig.surface = 2;
      } else {
        const deck = deckHeightAt(g.position.x, g.position.z);
        const onDeck = deck !== null && g.position.y > deck - 0.5;
        if (onDeck) surface = deck as number;
        // The deck query already ran, so surface type costs nothing extra.
        // Ribbed viaduct concrete is harder and brighter than the road, and
        // the expansion joints are what make the flyover a place rather than
        // a ramp. There is deliberately no plaza case: the plaza is
        // physically identical to the ring road and looks like the same
        // polished floor, so a timbre change there would read as a bug.
        rig.surface = onDeck ? 1 : 0;
      }
      const rest = surface + lift;
      if (g.position.y > rest + 0.05) {
        // Driving off the flyover now actually falls, and lands.
        rig.airborne = true;
        rig.vy -= GRAV_AIR * dtUsed;
        g.position.y += rig.vy * dtUsed;
        if (g.position.y <= rest) {
          rig.landing = Math.max(rig.landing, -rig.vy);
          g.position.y = rest;
          rig.vy = 0;
          rig.airborne = false;
        }
      } else {
        g.position.y += (rest - g.position.y) * ease(8, dtUsed);
        rig.vy = 0;
        rig.airborne = false;
      }
      if (lamps.current) {
        lamps.current.visible = rig.brakeLamp > 0.05;
        lampMat.opacity = rig.brakeLamp;
      }
      drive.target.current = g;
      // Kept current while the player drives, so that if they hand over to
      // the autopilot the first published yaw rate is a real one rather than
      // a difference against a heading from whenever they took over.
      prevYaw.current = g.rotation.y;
      // The assets take a LEFT-positive steer angle; the chassis works in
      // right-positive, so this is the one place the sign flips.
      pushVis(
        Math.round((Math.abs(rig.vf) / scale) * 4) / 4,
        -Math.round(rig.steerVis / STEER_VIS_STEP) * STEER_VIS_STEP,
        rig.brakeLamp > 0.45
      );
      return;
    }
    // The lane branch integrates on a capped delta for the same reason every
    // other integration in this file does: r3f hands over raw wall-clock
    // time and rAF is suspended while the tab is hidden, so the first frame
    // back can carry twenty seconds. Uncapped, that advanced a ring rider
    // 0.54 of a lap in one frame, which is a 48-unit teleport straight
    // through the yield logic (speed-only, so it structurally cannot see a
    // positional jump) and through anything parked in the way.
    const dtLane = Math.min(delta, DT_CAP);
    const now = st.clock.elapsedTime;
    if (wasDriven.current) {
      // Released: pick a curve param that is near, points the way the car is
      // already pointing, and is not already occupied. The old scan took the
      // nearest param unconditionally, which could drop a car inside another
      // one and, since every ring rider shares a lap speed, leave it there.
      wasDriven.current = false;
      // Only clear the chassis if nothing else has claimed it. Swapping
      // straight from one machine to another runs the new rider's seeding
      // and this release in the same frame, in mount order, so an
      // unconditional reset here would wipe a rig that is already in use.
      //
      // Two extra cases beyond "nothing else claimed it". Under AUTO the
      // selection is still this machine, so the old test was false and the
      // chassis stayed frozen at its last driving velocity while the camera
      // kept computing lag and lead from it: the view sat at a fixed offset
      // while the car visibly drove away. And stepping back into the
      // humanoid is a selection like any other, so a vehicle-to-bot switch
      // also took the skip path and left the cockpit printing 48 KM/H in D
      // while the player stood on the pavement.
      const rig = drive?.rig.current;
      if (rig && !auto && (!drive?.sel || drive.sel.kind === "bot")) {
        resetRig(rig);
        rig.driven = false;
      }
      rejoinPos.copy(g.position);
      rejoinYaw.current = g.rotation.y;
      rejoin.current = REJOIN_BLEND;
      g.rotation.x = 0;
      g.rotation.z = 0;
      pushVis(0, 0, false);
      const fx = Math.sin(g.rotation.y);
      const fz = Math.cos(g.rotation.y);
      let best = 0;
      let bs = Infinity;
      for (let i = 0; i < 160; i++) {
        const uu = i / 160;
        curve.getPointAt(uu, p);
        curve.getTangentAt(uu, tan);
        const dx = p.x - g.position.x;
        const dz = p.z - g.position.z;
        let score = dx * dx + dz * dz - REJOIN_HEADING * Math.max(0, tan.x * fx + tan.z * fz);
        TRAFFIC.forEach((e) => {
          if (e.o === g || e.curve !== curve) return;
          let du = Math.abs(uu - e.u.current);
          if (curve.closed) du = Math.min(du, 1 - du);
          if (du * len < halfLen + e.half + 0.6) score += 1e4;
        });
        if (score < bs) {
          bs = score;
          best = uu;
        }
      }
      u.current = best;
    }
    // Yield to the player, whether they are driving or on foot. The hold is
    // now capped: it used to be re-armed on every frame the player stayed
    // inside the circle, so a parked player pinned this rider forever and
    // the machine behind drove straight into its back. That was the bug.
    let playerWant = 1;
    const pt = drive?.target.current ?? null;
    if (pt && pt !== g && Math.abs(pt.position.y - g.position.y) < DECK_GAP) {
      const dx = pt.position.x - g.position.x;
      const dz = pt.position.z - g.position.z;
      // A fast player needs to be seen sooner, or the yield reads as a jerk.
      const near = selfR + 2.8 + (drive?.rig.current.speed ?? 0) * 0.35;
      if (dx * dx + dz * dz < near * near) {
        if (holdSince.current === 0) holdSince.current = now;
        holdUntil.current = now + STOP_DWELL;
      } else if (now > holdUntil.current) {
        holdSince.current = 0;
      }
    } else if (now > holdUntil.current) {
      holdSince.current = 0;
    }
    if (now < holdUntil.current) {
      playerWant = holdSince.current > 0 && now - holdSince.current > STOP_DWELL_MAX ? 0.25 : 0;
    }
    // Same-curve following. Speed, never position: the curve write at the
    // bottom of this function is absolute, so a positional push would be
    // erased on the same frame it was applied.
    let laneGap = Infinity;
    let coneGap = Infinity;
    if (driveId) {
      TRAFFIC.forEach((e) => {
        if (e.o === g || e.curve !== curve || e.driven.current) return;
        let du = e.u.current - u.current;
        // On an open curve nobody behind you wraps around to be in front.
        if (du < 0) {
          if (!curve.closed) return;
          du += 1;
        }
        const gap = du * len - (halfLen + e.half);
        if (gap < laneGap) laneGap = gap;
      });
      // Everything else (the ride-hail taxi sharing the ring line, walkers,
      // the player, riders on a crossing curve) gets a forward cone. Slowing
      // beats pushing here: shoving a path follower off its own curve looks
      // far worse than a pause does.
      const fx = Math.sin(g.rotation.y);
      const fz = Math.cos(g.rotation.y);
      const reach = CONE_BASE + halfLen + len * lapSpeed * 0.8;
      COLLIDERS.forEach((c) => {
        if (c.o === g) return;
        const lane = TRAFFIC_BY_OBJ.get(c.o);
        if (lane && lane.curve === curve && !lane.driven.current) return; // the arc rule owns it
        if (Math.abs(c.o.position.y - g.position.y) > DECK_GAP) return; // different deck
        const dx = c.o.position.x - g.position.x;
        const dz = c.o.position.z - g.position.z;
        const ahead = dx * fx + dz * fz;
        // The obstacle's forward extent is its spine half length PLUS its
        // radius, not its radius alone. Measuring it with the radius made the
        // cone under-report every body whose spine is longer than it is wide,
        // which is all of them: a follower stopping GAP_STOP short of a semi
        // parked it 0.99 units inside the trailer, because the semi's real
        // half length is 4.79 against a radius of about 1. This cone is the
        // ONLY protection against a player-driven machine, since the arc rule
        // above deliberately skips anything the player is holding.
        const cExt = c.hl + c.r;
        if (ahead <= 0 || ahead > reach + cExt) return;
        if (Math.abs(-dx * fz + dz * fx) > selfR * 0.8 + c.r * 0.8) return;
        const gap = ahead - (halfLen + cExt);
        if (gap < coneGap) coneGap = gap;
      });
    }
    // Two cones can in principle stare each other down. Nothing in the
    // authored layout does, but a rider that has been cone-stopped this long
    // starts creeping rather than parking there for the session.
    //
    // The timer is cleared by a real recovery of CLEARANCE, never by the
    // creep it triggers. Clearing it from yieldF alone (which is what the
    // code did) made the escape cancel itself about a tenth of a second after
    // it fired, so instead of one clean creep the rider got a ratchet: a few
    // millimetres every five seconds, forever, with yieldF reading near zero
    // the whole time so it LOOKED stopped. Left running against a parked
    // obstacle that walked one body clean through another over about nine
    // minutes, and since path followers never resolve contacts there was no
    // second line of defence. This is the "one into the other" report.
    if (coneGap < GAP_STOP) {
      if (jamSince.current === 0) jamSince.current = now;
    } else {
      jamSince.current = 0;
    }
    const jammed = jamSince.current > 0 && now - jamSince.current > JAM_MAX;
    let coneWant = coneGap === Infinity ? 1 : ss(coneGap, GAP_STOP, GAP_FREE);
    // The escape is bounded by the clearance that actually remains, so it
    // dies as the gap closes and cannot fire at all once the bodies touch.
    if (jammed) coneWant = Math.max(coneWant, Math.min(0.3, ss(coneGap, -0.2, GAP_STOP)));
    const want = Math.min(playerWant, laneGap === Infinity ? 1 : ss(laneGap, GAP_STOP, GAP_FREE), coneWant);
    // Braking is prompt and releasing is gentle. That asymmetry is what keeps
    // a queue from oscillating into a stop-and-go wave.
    yieldF.current += (want - yieldF.current) * ease(want < yieldF.current ? 6 : 2, dtLane);
    // Brake lamps for every reason the machine slows, not just player yields:
    // a blink through the pause reads as a decision rather than a stall.
    if (lamps.current) {
      const stopped = 1 - yieldF.current;
      lamps.current.visible = stopped > 0.05;
      lampMat.opacity = stopped * (now % 0.86 < 0.52 ? 1 : 0.22);
    }
    if (!ctx.still) {
      const du = lapSpeed * dtLane * yieldF.current;
      if (curve.closed) {
        u.current = (u.current + du) % 1;
      } else {
        // The flyover is an OPEN viaduct, and a modulo wrap on it snapped a
        // rider 61.6 units from the west ramp end to the east one in a single
        // frame, three times a minute, collider and all. Both ramp ends sit at
        // grade, so a player parked at the east ramp got a truck materialised
        // on top of them with no cone warning on either side, because the body
        // never approached. It waits at the end until the far ramp is clear of
        // other traffic and of the player before it goes.
        //
        // The jump itself stays: the ramps are 31.5 units out against a fog
        // range of [18, 56], so a rider is already two thirds faded there, and
        // the alternative (blending 61.6 units of travel) would drag a truck
        // across the whole scene at twenty times road speed.
        const next = u.current + du;
        if (next < 1) {
          u.current = next;
        } else {
          curve.getPointAt(0, p);
          let clear = true;
          TRAFFIC.forEach((e) => {
            if (e.o === g) return;
            const ex = e.o.position.x - p.x;
            const ez = e.o.position.z - p.z;
            const room = halfLen + e.half + 2;
            if (ex * ex + ez * ez < room * room) clear = false;
          });
          const tgt = drive?.target.current ?? null;
          if (tgt && tgt !== g) {
            const tx2 = tgt.position.x - p.x;
            const tz2 = tgt.position.z - p.z;
            if (tx2 * tx2 + tz2 * tz2 < 36) clear = false;
          }
          u.current = clear ? next % 1 : 1 - 1e-4;
        }
      }
    }
    curve.getPointAt(u.current, p);
    curve.getTangentAt(u.current, tan);
    // y is additive so elevated curves (the flyover) carry their own height
    // while the flat ground loops keep behaving exactly as before
    const tx = p.x;
    const ty = p.y + y;
    const tz = p.z;
    const tyaw = Math.atan2(tan.x, tan.z);
    if (rejoin.current > 0) {
      rejoin.current = Math.max(0, rejoin.current - dtLane);
      const k = smooth(1 - rejoin.current / REJOIN_BLEND);
      let dh = tyaw - rejoinYaw.current;
      if (dh > Math.PI) dh -= Math.PI * 2;
      if (dh < -Math.PI) dh += Math.PI * 2;
      g.position.set(
        rejoinPos.x + (tx - rejoinPos.x) * k,
        rejoinPos.y + (ty - rejoinPos.y) * k,
        rejoinPos.z + (tz - rejoinPos.z) * k
      );
      g.rotation.y = rejoinYaw.current + dh * k;
    } else {
      g.position.set(tx, ty, tz);
      g.rotation.y = tyaw;
    }
    if (auto && drive) {
      // Autopilot with the player aboard. presentDrive never runs down here,
      // so every channel the cockpit and the camera read has to be published
      // from the lane instead. Freezing them was the one option worth ruling
      // out on its own: a live-looking speedometer showing a dead number is
      // confidently wrong, which is worse than a blank.
      const rig = drive.rig.current;
      rig.driven = true;
      // Only true once the rejoin blend has finished, which is what lets the
      // telltale show the handoff rather than claiming it landed instantly.
      rig.autoActive = rejoin.current <= 0;
      const lane = len * lapSpeed * yieldF.current;
      let dyaw = tyaw - prevYaw.current;
      if (dyaw > Math.PI) dyaw -= Math.PI * 2;
      if (dyaw < -Math.PI) dyaw += Math.PI * 2;
      prevYaw.current = tyaw;
      // rotation.y DECREASES as the nose swings right, so the yaw rate the
      // chassis works in is the negated derivative of the heading.
      rig.r = -dyaw / Math.max(dtLane, 1e-4);
      rig.vf = lane;
      rig.vl = 0;
      rig.vy = 0;
      rig.speed = lane;
      rig.norm = cl(lane / rig.spec.VMAX, 0, 1);
      rig.gear = lane > 0.25 ? "D" : "N";
      rig.beta = 0;
      rig.gripLoss = 0;
      rig.driftHeat *= Math.exp(-2 * dtLane);
      rig.ax = 0;
      rig.ay = -lane * rig.r;
      rig.hb = 0;
      rig.boostActive = false;
      rig.boostK = 1;
      rig.boostV = 1;
      // The audio channels are published from here for the same reason every
      // other channel is: presentDrive never runs on this path. 0.15 is not
      // a fudge, an autopilot holding a steady lane speed genuinely is at a
      // light constant load, and it is what stops the machine going silent
      // the moment it starts driving itself.
      rig.load = 0.15;
      rig.slipDrive = 0;
      rig.aBrake = 0;
      rig.scrub = 0;
      // Inverting the lane's own yaw rate through the bicycle relation is
      // what makes the cockpit rim visibly steer itself, which is the entire
      // point of an autopilot telltale.
      rig.steer = cl(
        Math.atan((rig.r * rig.spec.L) / Math.max(lane, 0.5)),
        -rig.spec.SIG_HI,
        rig.spec.SIG_HI
      );
      rig.steerVis = cl(rig.steer, -STEER_VIS_CLAMP, STEER_VIS_CLAMP);
      // Published unconditionally while this machine is the selection, not
      // only inside the manual branch, or the chase camera keeps following
      // whatever wrote the target last.
      drive.target.current = g;
      pushVis(
        Math.round((lane / scale) * 4) / 4,
        -Math.round(rig.steerVis / STEER_VIS_STEP) * STEER_VIS_STEP,
        yieldF.current < 0.85
      );
    } else {
      prevYaw.current = tyaw;
    }
  });
  // Ambient riders roll at their lap speed; a driven one rolls at whatever it
  // is actually doing, so the wheels no longer spin while it sits parked.
  const wheelSpeed = driven ? vis.ws : ctx.still ? 0 : (len * lapSpeed) / scale;
  const clickable = !!driveId && !!drive && !ctx.background;
  return (
    <group
      ref={group}
      scale={scale}
      onClick={
        clickable
          ? (e) => {
              e.stopPropagation();
              drive!.setFreeCam(false);
              drive!.set({
                id: driveId!,
                label: driveLabel ?? driveId!,
                kind: driveKind,
                chase: driveChase,
              });
            }
          : undefined
      }
      onPointerOver={
        clickable
          ? (e) => {
              e.stopPropagation();
              document.body.style.cursor = "pointer";
            }
          : undefined
      }
      onPointerOut={clickable ? () => (document.body.style.cursor = "auto") : undefined}
    >
      {children(wheelSpeed, driven ? vis.st : undefined, driven ? vis.bk : undefined)}
      {driveKind !== "boat" && (
        <group ref={lamps} visible={false}>
          <mesh position={[-0.36, 0.5, -(selfR / scale) * 0.82]} material={lampMat}>
            <boxGeometry args={[0.2, 0.07, 0.03]} />
          </mesh>
          <mesh position={[0.36, 0.5, -(selfR / scale) * 0.82]} material={lampMat}>
            <boxGeometry args={[0.2, 0.07, 0.03]} />
          </mesh>
        </group>
      )}
    </group>
  );
}

/** Rear-marker light trail, subtler than the old pass; frozen scenes keep the marker only. */
function TailTrail({ y, z }: { y: number; z: number }) {
  const ctx = useScene();
  const marker = (
    <mesh position={[0, y, z]}>
      <sphereGeometry args={[0.035, 6, 6]} />
      <meshBasicMaterial color={ICE_BRIGHT} transparent opacity={0.85 * ctx.dim} depthWrite={false} />
    </mesh>
  );
  if (ctx.still) return marker;
  return (
    <Trail width={0.22} length={3.2} decay={2.6} color={ICE} attenuation={(w) => w * w}>
      {marker}
    </Trail>
  );
}


/** Two machines keep the flyover alive without crowding it. */
function FlyoverTraffic() {
  const ctx = useScene();
  return (
    <>
      <PathRider curve={FLYOVER} offset={0.15} lapSpeed={0.02} y={FLYOVER_Y} scale={0.88} driveId="truck-3" driveLabel="CYBERTRUCK">
        {(s, steer, brake) => (
          <>
            <CyberTruck dim={ctx.dim} speed={s} steer={steer} brake={brake} />
            <ContactShadow w={1.4} l={3.0} opacity={0.4} y={0.012} />
            <TailTrail y={0.52} z={-1.52} />
          </>
        )}
      </PathRider>
      <PathRider curve={FLYOVER} offset={0.88} lapSpeed={0.02} y={FLYOVER_Y} scale={0.86} driveId="tourer-3" driveLabel="GRAN TOURER">
        {(s, steer, brake) => (
          <>
            <GranTourer dim={ctx.dim} speed={s} steer={steer} brake={brake} />
            <ContactShadow w={1.1} l={2.2} opacity={0.4} y={0.012} />
            <TailTrail y={0.44} z={-1.05} />
          </>
        )}
      </PathRider>
      <PathRider curve={FLYOVER} offset={0.62} lapSpeed={0.02} y={FLYOVER_Y} scale={0.92} driveId="sedan-3" driveLabel="ROBOTAXI">
        {(s, steer, brake) => (
          <>
            <Sedan dim={ctx.dim} speed={s} steer={steer} brake={brake} />
            <ContactShadow w={1.1} l={2.2} opacity={0.38} y={0.012} />
            <TailTrail y={0.44} z={-1.05} />
          </>
        )}
      </PathRider>
    </>
  );
}

/** The canal: still dark water, two shoreline guides, cargo barge lanes. */
function Canal() {
  const ctx = useScene();
  return (
    <group>
      <mesh position={[0, WATER_Y, 27.05]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[56, 8.6, 160, 24]} />
        <meshPhysicalMaterial color="#0a1420" metalness={0.85} roughness={0.22} clearcoat={0.6} clearcoatRoughness={0.3} />
      </mesh>
      {[23.6, 30.5].map((z) => (
        <mesh key={z} position={[0, WATER_Y + 0.008, z]}>
          <boxGeometry args={[64, 0.02, 0.06]} />
          <meshBasicMaterial color={ICE} transparent opacity={0.14 * ctx.dim} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

/** Two electric barges hauling the fleet's containers, clickable like cars. */
function BoatTraffic() {
  const ctx = useScene();
  const boat = (offset: number, id: string, ph: number) => (
    <PathRider curve={CANAL} offset={offset} lapSpeed={0.006} y={0} scale={1.35} driveId={id} driveLabel="CARGO BARGE" driveMax={2.4} driveKind="boat" driveChase={13}>
      {() => (
        <>
          <CargoBoat dim={ctx.dim} phase={ph} />
          {!ctx.still && !ctx.background && (
            <Trail width={0.55} length={5} decay={3} color="#dfe9f5" attenuation={(w) => w * w}>
              <mesh position={[0, 0.08, -2.15]}>
                <sphereGeometry args={[0.02, 4, 4]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
              </mesh>
            </Trail>
          )}
        </>
      )}
    </PathRider>
  );
  return (
    <>
      {boat(0.12, "boat-1", 0)}
      {boat(0.62, "boat-2", 2.4)}
    </>
  );
}

/** Holographic lane beacons on the ring road shoulder, cycling ice-amber. */
function TrafficBeacons() {
  const ctx = useScene();
  const spots = useMemo(() => {
    return [0.16, 0.5, 0.84].map((uu) => {
      const pt = ROAD.getPointAt(uu);
      const tn = ROAD.getTangentAt(uu);
      const side = new THREE.Vector3(tn.z, 0, -tn.x).normalize();
      return { x: pt.x + side.x * 1.2, z: pt.z + side.z * 1.2 };
    });
  }, []);
  const mats = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  useFrame(({ clock }) => {
    const t = ctx.still ? 0 : clock.elapsedTime;
    spots.forEach((_, i) => {
      const phase = (t * 0.35 + i * 0.33) % 1;
      for (let k = 0; k < 2; k++) {
        const m = mats.current[i * 2 + k];
        if (!m) continue;
        const on = phase < 0.5 ? k === 0 : k === 1;
        m.opacity = (on ? 0.85 : 0.12) * ctx.dim;
      }
    });
  });
  return (
    <>
      {spots.map((sp, i) => (
        <group key={i} position={[sp.x, 0, sp.z]}>
          <mesh position={[0, 0.7, 0]}>
            <cylinderGeometry args={[0.025, 0.035, 1.4, 8]} />
            <meshStandardMaterial color="#1d1f24" metalness={0.6} roughness={0.5} />
          </mesh>
          {[0, 1].map((k) => (
            <mesh key={k} position={[0, 1.5 - k * 0.18, 0]}>
              <sphereGeometry args={[0.05, 8, 8]} />
              <meshBasicMaterial
                ref={(el) => {
                  mats.current[i * 2 + k] = el;
                }}
                color={k === 0 ? ICE_BRIGHT : AMBER}
                transparent
                depthWrite={false}
              />
            </mesh>
          ))}
        </group>
      ))}
    </>
  );
}

/**
 * While driving, the camera falls in behind the controlled machine.
 *
 * The old pass was a rear offset in the target's yaw, one framerate-dependent
 * lerp, and a hard-snapped lookAt. That snap against a smoothed position is a
 * per-frame derivative discontinuity baked straight into the view matrix, and
 * it read as cheap no matter what the chassis underneath was doing. This one
 * lags the azimuth behind the car (which is what makes a corner swing), leads
 * the look target down the road, rolls slightly into the lateral load, kicks
 * on impact and widens the frustum with speed.
 *
 * Walking gets none of it. A humanoid keeps the original tuning exactly.
 */
function ChaseCam({ controls, game }: { controls: { current: { enabled: boolean } | null }; game?: boolean }) {
  const ctx = useScene();
  const drive = useDrive();
  const want = useMemo(() => new THREE.Vector3(), []);
  const lead = useMemo(() => new THREE.Vector3(), []);
  const lookWant = useMemo(() => new THREE.Vector3(), []);
  const lookAt = useMemo(() => new THREE.Vector3(), []);
  const camYaw = useRef<number | null>(null);
  const camRoll = useRef(0);
  useFrame((state, delta) => {
    // The default camera is the perspective one configured on <Canvas>; the
    // fov sweep below needs that concrete type.
    const camera = state.camera as THREE.PerspectiveCamera;
    const clock = state.clock;
    // game mode keeps the camera on the player unit; drive mode follows the
    // selected machine
    const following = drive?.sel || (game && !drive?.freeCam);
    const t = following ? drive?.target.current ?? null : null;
    const oc = controls.current;
    if (!t) {
      if (oc && !oc.enabled) oc.enabled = true;
      camYaw.current = null;
      return;
    }
    if (oc && oc.enabled) oc.enabled = false;
    // Orbit's target was pinned at world centre forever, so stepping out of a
    // machine parked at the fog line swung the camera all the way home.
    if (oc) (oc as unknown as { target?: THREE.Vector3 }).target?.copy(t.position);
    const dt = Math.min(delta, PRES_DT_CAP);
    const rig = drive?.rig.current;
    // A selection wins over the game flag: on /3d-game the walking camera
    // would otherwise stay selected while the player drove a truck.
    const bot = drive?.sel ? drive.sel.kind === "bot" : !!game;
    const psi = t.rotation.y;
    if (camYaw.current === null) {
      camYaw.current = psi;
      // Seed the look target too, or the first frame of a follow sweeps the
      // view all the way in from world origin.
      lookAt.set(t.position.x, t.position.y + LOOK_UP, t.position.z);
    }

    if (!rig || !rig.driven || bot) {
      // On foot: the original camera, untouched.
      const back = drive?.sel?.chase ?? (bot ? 4.2 : 7.8);
      const up = bot ? 2.2 : back * 0.42;
      camYaw.current = psi;
      want.set(-Math.sin(psi) * back, up, -Math.cos(psi) * back).add(t.position);
      camera.position.lerp(want, ease(2.4, dt));
      camera.lookAt(t.position.x, t.position.y + 1.1, t.position.z);
      lookAt.set(t.position.x, t.position.y + 1.1, t.position.z);
      if (camera.fov !== FOV0) {
        camera.fov = FOV0;
        camera.updateProjectionMatrix();
      }
      return;
    }

    // Reduced motion keeps the framing improvements and drops the effects
    // that actually move the viewer: roll, shake and the fov sweep together
    // are what make a chase camera nauseating.
    const cine = !ctx.still;
    // Referenced to the FLEET's top speed, not this machine's. rig.norm is
    // speed over its own VMAX, so a semi at 7.5 u/s and a monopod at 12.5
    // both reached 1 and received an identical fov, pullback, yaw response
    // and position lerp: the 67% real difference between the slowest and
    // fastest machine was cancelled out at exactly the point the player would
    // perceive it. The HUD keeps rig.norm, which is the right number for a
    // driver reading their own limit.
    const n = cl(rig.speed / FLEET_VMAX, 0, 1);

    // Azimuth lag. In a right-hand corner the camera sits off the outside
    // rear and catches up on the exit, and in a slide it swings around to
    // show the flank rather than staring at the boot lid.
    let off = -CAM_SLIP * rig.beta + CAM_SWING * rig.r;
    off = cl(off, -CAM_OFFSET_MAX, CAM_OFFSET_MAX);
    let dy = psi + off - camYaw.current;
    if (dy > Math.PI) dy -= Math.PI * 2;
    if (dy < -Math.PI) dy += Math.PI * 2;
    camYaw.current += dy * ease(CAM_YAW_BASE + CAM_YAW_SPD * n, dt);

    const back = (drive?.sel?.chase ?? 7.8) * (1 + BACK_SPD * n);
    const up = back * 0.42 * (1 - UP_DROP * n);
    want.set(-Math.sin(camYaw.current) * back, up, -Math.cos(camYaw.current) * back).add(t.position);
    if (want.distanceTo(camera.position) > CAM_SNAP) camera.position.copy(want);
    else camera.position.lerp(want, ease(CAM_POS_BASE + CAM_POS_SPD * n, dt));

    // Lead the look target down the road and smooth it, so the view matrix
    // stops carrying a discontinuity every frame.
    const wx = Math.sin(psi) * rig.vf - Math.cos(psi) * rig.vl;
    const wz = Math.cos(psi) * rig.vf + Math.sin(psi) * rig.vl;
    lead.set(Math.sin(psi) * LOOK_AHEAD * n + wx * LOOK_VEL, 0, Math.cos(psi) * LOOK_AHEAD * n + wz * LOOK_VEL);
    lookWant.set(t.position.x, t.position.y + LOOK_UP, t.position.z).add(lead);
    lookAt.lerp(lookWant, ease(LOOK_RESP, dt));
    camera.lookAt(lookAt);

    if (cine) {
      camRoll.current += (cl(-CAM_ROLL_K * rig.ay, -CAM_ROLL_MAX, CAM_ROLL_MAX) - camRoll.current) * ease(5, dt);
      camera.rotateZ(camRoll.current);
      // Two irrational frequencies so the shake never visibly repeats.
      const sh = Math.min(SHAKE_MAX, rig.hit * SHAKE_K);
      if (sh > 0.001) {
        const ts = clock.elapsedTime;
        camera.position.x += sh * Math.sin(ts * 47.3);
        camera.position.y += sh * Math.sin(ts * 61.7) * 0.6;
      }
      // Quadratic in speed so the sensation lands in the top quarter of the
      // range instead of creeping in from a standstill.
      const fovWant = FOV0 + FOV_SPD * n * n + FOV_TH * rig.thSm * n + FOV_DRIFT * rig.driftHeat;
      if (Math.abs(camera.fov - fovWant) > 0.01) {
        camera.fov += (fovWant - camera.fov) * ease(FOV_RESP, dt);
        camera.updateProjectionMatrix();
      }
    }
  });
  return null;
}

/** In-canvas layer keeps only the idle invitation; the active cockpit is a
 *  plain DOM sibling of the Canvas, docked inside the game frame. */
function CanvasHint() {
  const drive = useDrive();
  if (!drive || drive.sel) return null;
  return (
    <Html fullscreen zIndexRange={[40, 0]} style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 12, bottom: 12, fontFamily: "monospace", fontSize: 10, letterSpacing: "0.18em", color: "#6b6b74" }}>
        CLICK A VEHICLE, BARGE, OR THE NEAR HUMANOID TO DRIVE IT
      </div>
    </Html>
  );
}

/** AirCarDock rides inside the semi's PathRider, so its whole landing cycle
 *  happens in trailer-local space: approach, touch down on the solar roof,
 *  sit docked with rotors spun down, lift off, peel away. The landing zone
 *  is marked by four ice corner brackets on the trailer top. */
const DOCK_PERIOD = 34;

function AirCarDock() {
  const ctx = useScene();
  const car = useRef<THREE.Group>(null);
  const rotorRef = useRef(1);
  useFrame(({ clock }) => {
    const g = car.current;
    if (!g) return;
    const p = ctx.still ? 0.45 : (clock.elapsedTime % DOCK_PERIOD) / DOCK_PERIOD;
    const ss = THREE.MathUtils.smoothstep;
    const flyIn = ss(p, 0.02, 0.2);
    const down = ss(p, 0.24, 0.34);
    const up = ss(p, 0.62, 0.72);
    const away = ss(p, 0.74, 0.98);
    // behind-and-above approach, settle at the marked zone, mirror out
    g.position.set(
      0,
      4.4 - 2.2 * flyIn + (2.24 - (4.4 - 2.2)) * down + 1.9 * up + 0.4 * away,
      -6.5 + 4.5 * flyIn + 6.5 * away
    );
    g.rotation.z = 0.08 * Math.sin(clock.elapsedTime * 0.8) * (1 - down + up * 0.5);
    // rotors spin down while docked, back up before liftoff
    rotorRef.current = ctx.still ? 0.3 : Math.max(0.12, 1 - down + up);
  });
  return (
    <group>
      <group ref={car}>
        <AirCar dim={ctx.dim} rotorRef={rotorRef} />
      </group>
      {/* landing zone brackets on the trailer roof */}
      {([[-0.42, -2.42], [0.42, -2.42], [-0.42, -1.58], [0.42, -1.58]] as const).map(([x, z], i) => (
        <mesh key={i} position={[x, 2.11, z]}>
          <boxGeometry args={[0.16, 0.008, 0.16]} />
          <meshBasicMaterial color={ICE} transparent opacity={0.4 * ctx.dim} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Ring order is authored, not incidental: long bodies and short ones
 * alternate so no two Cybertrucks are ever neighbours, and every gap clears
 * the sum of the two half-lengths by at least four world units even before
 * the following logic in PathRider does anything. The old offsets clustered
 * three big vehicles inside a fifth of the loop, which meant a single yield
 * closed the gap and put one truck's nose inside another's body.
 *
 * Equal lap speeds still hold that spacing while nothing perturbs it; the
 * car-following taper is what holds it when something does.
 */
function RingTraffic() {
  const ctx = useScene();
  return (
    <>
      {/* hero pickup: frozen offset 0.13 parks it on the camera side */}
      <PathRider curve={ROAD} offset={0.13} lapSpeed={0.027} y={ROAD_Y} scale={0.92} driveId="truck-1" driveLabel="CYBERTRUCK">
        {(s, steer, brake) => (
          <>
            <CyberTruck dim={ctx.dim} speed={s} steer={steer} brake={brake} />
            <ContactShadow w={1.5} l={3.2} opacity={0.48} y={0.012} />
            <TailTrail y={0.52} z={-1.52} />
          </>
        )}
      </PathRider>
      <PathRider curve={ROAD} offset={0.92} lapSpeed={0.027} y={ROAD_Y} scale={0.88} driveId="truck-2" driveLabel="CYBERTRUCK">
        {(s, steer, brake) => (
          <>
            <CyberTruck dim={ctx.dim} speed={s} steer={steer} brake={brake} />
            <ContactShadow w={1.5} l={3.2} opacity={0.48} y={0.012} />
            <TailTrail y={0.52} z={-1.52} />
          </>
        )}
      </PathRider>
      {/* second sedan and a narrow single-track pod fill the ring out */}
      <PathRider curve={ROAD} offset={0.3} lapSpeed={0.027} y={ROAD_Y} scale={0.85} driveId="tourer-1" driveLabel="GRAN TOURER">
        {(s, steer, brake) => (
          <>
            <GranTourer dim={ctx.dim} speed={s} steer={steer} brake={brake} />
            <ContactShadow w={1.1} l={2.2} opacity={0.4} y={0.012} />
            <TailTrail y={0.44} z={-1.05} />
          </>
        )}
      </PathRider>
      <PathRider curve={ROAD} offset={0.39} lapSpeed={0.027} y={ROAD_Y} scale={0.85} driveId="podbus-1" driveLabel="SHUTTLE POD" driveMax={3.2} driveChase={9}>
        {(s, steer, brake) => (
          <>
            <PodBus dim={ctx.dim} speed={s} steer={steer} brake={brake} />
            <ContactShadow w={1.2} l={2.4} opacity={0.42} y={0.012} />
          </>
        )}
      </PathRider>
      <PathRider curve={ROAD} offset={0.22} lapSpeed={0.027} y={ROAD_Y} scale={0.85} driveId="pod-1" driveLabel="MONOPOD" driveMax={5} driveChase={3.4}>
        {(s, steer, brake) => (
          <>
            <MonoPod dim={ctx.dim} speed={s} steer={steer} brake={brake} />
            <ContactShadow w={0.55} l={1.4} opacity={0.38} y={0.012} />
          </>
        )}
      </PathRider>
      <PathRider curve={ROAD} offset={0.65} lapSpeed={0.027} y={ROAD_Y} scale={0.9} driveId="sedan-1" driveLabel="ROBOTAXI">
        {(s, steer, brake) => (
          <>
            <Sedan dim={ctx.dim} speed={s} steer={steer} brake={brake} />
            <ContactShadow w={1.1} l={2.5} opacity={0.45} y={0.012} />
            <TailTrail y={0.42} z={-1.16} />
          </>
        )}
      </PathRider>
      {/* the ring fills out: a second tourer, two more taxis, a second pod
          and a second shuttle, so the loop reads as traffic not a parade */}
      <PathRider curve={ROAD} offset={0.04} lapSpeed={0.027} y={ROAD_Y} scale={0.88} driveId="sedan-2" driveLabel="ROBOTAXI">
        {(s, steer, brake) => (
          <>
            <Sedan dim={ctx.dim} speed={s} steer={steer} brake={brake} />
            <ContactShadow w={1.1} l={2.5} opacity={0.45} y={0.012} />
            <TailTrail y={0.42} z={-1.16} />
          </>
        )}
      </PathRider>
      <PathRider curve={ROAD} offset={0.48} lapSpeed={0.027} y={ROAD_Y} scale={0.9} driveId="truck-4" driveLabel="CYBERTRUCK">
        {(s, steer, brake) => (
          <>
            <CyberTruck dim={ctx.dim} speed={s} steer={steer} brake={brake} />
            <ContactShadow w={1.5} l={3.2} opacity={0.48} y={0.012} />
            <TailTrail y={0.52} z={-1.52} />
          </>
        )}
      </PathRider>
      <PathRider curve={ROAD} offset={0.74} lapSpeed={0.027} y={ROAD_Y} scale={0.83} driveId="tourer-2" driveLabel="GRAN TOURER">
        {(s, steer, brake) => (
          <>
            <GranTourer dim={ctx.dim} speed={s} steer={steer} brake={brake} />
            <ContactShadow w={1.1} l={2.2} opacity={0.4} y={0.012} />
            <TailTrail y={0.44} z={-1.05} />
          </>
        )}
      </PathRider>
      <PathRider curve={ROAD} offset={0.83} lapSpeed={0.027} y={ROAD_Y} scale={0.84} driveId="podbus-2" driveLabel="SHUTTLE POD" driveMax={3.2} driveChase={9}>
        {(s, steer, brake) => (
          <>
            <PodBus dim={ctx.dim} speed={s} steer={steer} brake={brake} />
            <ContactShadow w={1.2} l={2.4} opacity={0.42} y={0.012} />
          </>
        )}
      </PathRider>
      <PathRider curve={ROAD} offset={0.57} lapSpeed={0.027} y={ROAD_Y} scale={0.85} driveId="pod-2" driveLabel="MONOPOD" driveMax={5} driveChase={3.4}>
        {(s, steer, brake) => (
          <>
            <MonoPod dim={ctx.dim} speed={s} steer={steer} brake={brake} />
            <ContactShadow w={0.55} l={1.4} opacity={0.38} y={0.012} />
          </>
        )}
      </PathRider>
      {/* the semi on the outer bypass: slow, huge, half in the fog; its
          frozen offset 0.6 parks it on the far arc for the reduced-motion
          poster, exactly where scale reads best against the towers */}
      <PathRider curve={BYPASS} offset={0.6} lapSpeed={0.009} y={BYPASS_Y} driveId="semi-1" driveLabel="VENKATAPAGADALA SEMI" driveMax={3} driveChase={19}>
        {(s) => (
          <>
            <CyberSemi dim={ctx.dim} speed={s} />
            <AirCarDock />
            <ContactShadow w={1.9} l={10} opacity={0.5} y={0.01} />
          </>
        )}
      </PathRider>
      {/* two more of the fleet, spaced a third of a lap apart */}
      <PathRider curve={BYPASS} offset={0.27} lapSpeed={0.009} y={BYPASS_Y} driveId="semi-2" driveLabel="VENKATAPAGADALA SEMI" driveMax={3} driveChase={19}>
        {(s) => (
          <>
            <CyberSemi dim={ctx.dim} speed={s} />
            <ContactShadow w={1.9} l={10} opacity={0.5} y={0.01} />
          </>
        )}
      </PathRider>
      <PathRider curve={BYPASS} offset={0.93} lapSpeed={0.009} y={BYPASS_Y} driveId="semi-3" driveLabel="VENKATAPAGADALA SEMI" driveMax={3} driveChase={19}>
        {(s) => (
          <>
            <CyberSemi dim={ctx.dim} speed={s} />
            <ContactShadow w={1.9} l={10} opacity={0.5} y={0.01} />
          </>
        )}
      </PathRider>
    </>
  );
}

/* ---------------------------------------------------------------- *
 *  Home base: monolith towers, landing pad, holographic rings
 * ---------------------------------------------------------------- */

function TowerLights() {
  const ctx = useScene();
  const ref = useRef<THREE.InstancedMesh>(null);
  const N = 72;
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const tmp = new THREE.Object3D();
    const ice = new THREE.Color(ICE);
    const amber = new THREE.Color(AMBER);
    let i = 0;
    TOWERS.forEach((t, ti) => {
      const rows = Math.floor(t.h / 0.9);
      for (let r = 0; r < rows && i < N; r++) {
        for (let c = 0; c < 3 && i < N; c++) {
          // deterministic sparse fill: most windows stay dark
          if ((r * 31 + c * 17 + ti * 7) % 4 !== 0) continue;
          tmp.position.set(t.x - t.w * 0.28 + c * t.w * 0.28, 0.9 + r * 0.9, t.z + t.w / 2 + 0.012);
          tmp.scale.setScalar(1);
          tmp.updateMatrix();
          m.setMatrixAt(i, tmp.matrix);
          m.setColorAt(i, (r * 13 + c + ti) % 7 === 0 ? amber : ice);
          i++;
        }
      }
    });
    // park unused instances at zero scale so they never draw
    for (; i < N; i++) {
      tmp.position.set(0, -10, 0);
      tmp.scale.setScalar(0);
      tmp.updateMatrix();
      m.setMatrixAt(i, tmp.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, []);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, N]} frustumCulled={false}>
      <boxGeometry args={[0.09, 0.035, 0.02]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.55 * ctx.dim} depthWrite={false} />
    </instancedMesh>
  );
}

function Towers() {
  const ctx = useScene();
  return (
    <group>
      {TOWERS.map((t, i) => (
        <group key={i} position={[t.x, 0, t.z]}>
          <mesh position={[0, t.h / 2, 0]}>
            <boxGeometry args={[t.w, t.h, t.w]} />
            <meshStandardMaterial {...(i % 2 === 0 ? M.graphite : M.slab)} />
          </mesh>
          {/* one lit edge per monolith: the only ornament they get */}
          <mesh position={[t.w / 2, t.h * 0.46, t.w / 2]}>
            <boxGeometry args={[0.025, t.h * 0.86, 0.025]} />
            <meshBasicMaterial color={ICE} transparent opacity={0.5 * ctx.dim} />
          </mesh>
        </group>
      ))}
      <TowerLights />
    </group>
  );
}

function HomeBase() {
  const ctx = useScene();
  const rings = useRef<(THREE.Mesh | null)[]>([]);
  const mats = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const RINGS = [
    { y: 1.4, r: 1.45 },
    { y: 2.3, r: 1.2 },
    { y: 3.2, r: 0.95 },
  ];
  useFrame(({ clock }) => {
    const t = ctx.still ? 0 : clock.elapsedTime;
    RINGS.forEach((ring, i) => {
      const mesh = rings.current[i];
      const mat = mats.current[i];
      if (!mesh || !mat) return;
      mesh.position.y = ring.y + Math.sin(t * 0.7 + i * 1.4) * 0.07;
      mat.opacity = (0.14 + 0.1 * (0.5 + 0.5 * Math.sin(t * 1.2 + i * 2.1))) * ctx.dim;
    });
  });
  return (
    <group position={[8.2, 0, -5.4]}>
      <mesh position={[0, 0.09, 0]}>
        <cylinderGeometry args={[1.9, 2.05, 0.18, 28]} />
        <meshStandardMaterial {...M.slab} />
      </mesh>
      <mesh position={[0, 0.185, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.45, 1.58, 40]} />
        <meshBasicMaterial color={ICE} transparent opacity={0.5 * ctx.dim} side={THREE.DoubleSide} />
      </mesh>
      {RINGS.map((ring, i) => (
        <mesh
          key={i}
          ref={(el) => {
            rings.current[i] = el;
          }}
          position={[0, ring.y, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <torusGeometry args={[ring.r, 0.018, 6, 48]} />
          <meshBasicMaterial
            ref={(el) => {
              mats.current[i] = el;
            }}
            color={ICE_BRIGHT}
            transparent
            opacity={0.18}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ---------------------------------------------------------------- *
 *  Ground: barely-reflective in hero mode, plain in background mode
 * ---------------------------------------------------------------- */

function GroundPlane() {
  const ctx = useScene();
  return (
    <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[GROUND_R, 96]} />
      {ctx.background ? (
        <meshStandardMaterial color="#0e0f12" metalness={0.35} roughness={0.75} />
      ) : (
        <MeshReflectorMaterial
          resolution={512}
          blur={[220, 80]}
          mixBlur={0.85}
          mixStrength={0.55}
          mirror={0.35}
          depthScale={0.6}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#0e0f12"
          metalness={0.5}
          roughness={0.8}
        />
      )}
    </mesh>
  );
}

/** The plaza is now just its lit boundary ring over the reflective floor. */
function PlazaRing() {
  const ctx = useScene();
  return (
    <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[4.95, 5.05, 48]} />
      <meshBasicMaterial
        color={ICE}
        transparent
        opacity={0.3 * ctx.dim}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

/* ---------------------------------------------------------------- *
 *  Atmosphere: sparse dust motes drifting through the rim light
 * ---------------------------------------------------------------- */

function DustMotes() {
  const ctx = useScene();
  const N = 60;
  const ref = useRef<THREE.InstancedMesh>(null);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  // deterministic scatter: hashed, no Math.random, same field every load
  const seeds = useMemo(
    () =>
      Array.from({ length: N }, (_, i) => {
        const h = (n: number) => {
          const s = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453;
          return s - Math.floor(s);
        };
        const a = h(1) * Math.PI * 2;
        const r = 2.5 + h(2) * 10.5;
        return {
          x: Math.cos(a) * r,
          z: Math.sin(a) * r,
          y: 0.4 + h(3) * 4.2,
          rise: 0.05 + h(4) * 0.08,
          sway: 0.3 + h(5) * 0.5,
          swaySpeed: 0.1 + h(6) * 0.25,
          phase: h(7) * Math.PI * 2,
          s: 0.014 + h(8) * 0.02,
        };
      }),
    []
  );
  useFrame(({ clock }) => {
    const m = ref.current;
    if (!m) return;
    const t = ctx.still ? 0 : clock.elapsedTime;
    for (let i = 0; i < N; i++) {
      const d = seeds[i];
      tmp.position.set(
        d.x + Math.sin(t * d.swaySpeed + d.phase) * d.sway,
        0.3 + ((d.y - 0.3 + t * d.rise) % 4.6),
        d.z + Math.cos(t * d.swaySpeed * 0.8 + d.phase) * d.sway
      );
      tmp.scale.setScalar(d.s);
      tmp.updateMatrix();
      m.setMatrixAt(i, tmp.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, N]} frustumCulled={false}>
      <sphereGeometry args={[1, 6, 5]} />
      {/* warm-tinted so the motes read as caught in the amber rim light */}
      <meshBasicMaterial color="#d9c8a8" transparent opacity={0.28 * ctx.dim} depthWrite={false} />
    </instancedMesh>
  );
}

/* ---------------------------------------------------------------- *
 *  Aircraft: distant, silent, crossing occasionally
 * ---------------------------------------------------------------- */

function Aircraft() {
  const ctx = useScene();
  const group = useRef<THREE.Group>(null);
  const strobe = useRef<THREE.MeshBasicMaterial>(null);
  const PERIOD = 46; // seconds between pass starts
  const PASS = 17; // seconds on screen; the rest of the period is empty sky
  useFrame(({ clock }) => {
    const g = group.current;
    if (!g) return;
    if (ctx.still) {
      g.visible = false;
      return;
    }
    const p = (clock.elapsedTime % PERIOD) / PASS;
    g.visible = p <= 1;
    if (!g.visible) return;
    g.position.set(-58 + 116 * p, 15.5, -26 - 5 * p);
    g.rotation.y = Math.atan2(116, -5);
    if (strobe.current)
      strobe.current.opacity = (Math.sin(clock.elapsedTime * 7) > 0.75 ? 1 : 0.1) * ctx.dim;
  });
  return (
    <group ref={group} visible={false}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.16, 2.4, 4, 8]} />
        <meshStandardMaterial {...M.hull} />
      </mesh>
      <mesh position={[0, 0, -0.3]}>
        <boxGeometry args={[3.6, 0.05, 0.9]} />
        <meshStandardMaterial {...M.graphite} />
      </mesh>
      <mesh position={[0, 0.05, -1.3]}>
        <sphereGeometry args={[0.06, 8, 6]} />
        <meshBasicMaterial ref={strobe} color={AMBER} transparent opacity={0} />
      </mesh>
    </group>
  );
}

/* ---------------------------------------------------------------- *
 *  Lighting: moonlight key, amber rim, dim fill
 * ---------------------------------------------------------------- */

/** Low warm spot raking from behind the plaza toward the camera side, so
 *  the humanoid silhouettes pick up an amber edge. No shadow casting. */
function RimLight() {
  const ctx = useScene();
  const spot = useRef<THREE.SpotLight>(null);
  useLayoutEffect(() => {
    const s = spot.current;
    if (!s) return;
    // static target: one manual matrix update stands in for scene insertion
    s.target.position.set(0.8, 0.9, 3.0);
    s.target.updateMatrixWorld();
  }, []);
  return (
    <spotLight
      ref={spot}
      position={[-5.5, 6.8, -12.5]}
      color="#e2a763"
      intensity={170 * (ctx.background ? 0.7 : 1)}
      distance={26}
      angle={0.3}
      penumbra={0.55}
      decay={2}
    />
  );
}

/* ---------------------------------------------------------------- *
 *  Composition + camera
 * ---------------------------------------------------------------- */

function World() {
  const ctx = useScene();
  return (
    <>
      <GroundPlane />
      <PlazaRing />
      <CloudBrain />
      <Roadway />
      <BypassRoad />
      <FlyoverRoad />
      <Canal />
      <BoatTraffic />
      <TrafficBeacons />
      <Towers />
      <HomeBase />
      <BuildSite />
      <RideHail />
      {WALKERS.map((w, i) => (
        <Walker key={i} {...w} />
      ))}
      {/* the near-field showcase unit is framed for the hero camera; the
          background orbit never reads it, so it stays hero-only */}
      {(!ctx.background || ctx.game) && <IdleRobot />}
      <RingTraffic />
      <FlyoverTraffic />
      {/* one air car cruising the high sweep, rotors always up */}
      <PathRider curve={DRONE_PATHS[2]} offset={0.3} lapSpeed={0.012} y={0} scale={1.1}>
        {() => <AirCar dim={ctx.dim} />}
      </PathRider>
      {DRONES.map((d, i) => (
        <Drone key={i} curve={DRONE_PATHS[d.path]} offset={d.offset} speed={d.speed} />
      ))}
      <Aircraft />
      <DustMotes />
      <RimLight />
    </>
  );
}

const BG_LOOK = new THREE.Vector3(0, 2.7, 0);

/* ---------------------------------------------------------------- *
 *  Ride hail: a robot walks to the call post, presses the button, a
 *  taxi pulls into the bay, and it rides away in the back seat
 * ---------------------------------------------------------------- */

/** One open curve carries both legs: the taxi arrives over the first half
 *  and leaves over the second, so the bay is simply the midpoint. */
const HAIL_PATH = new THREE.CatmullRomCurve3(
  [v3(6.5, 0, 12.4), v3(1, 0, 10.7), v3(-4.8, 0, 9), v3(-10, 0, 8.2), v3(-14, 0, 6.2)],
  false,
  "catmullrom",
  0.4
);
/** The post stands well back from the bay: close enough to read as its call
 *  point, far enough that the waiting robot is not inside the parked car. */
const HAIL_POST = { x: -2.9, z: 6.5 };
/** Where the robot stands to reach the button, then the curbside door, then
 *  the spot it waits on between runs. The door sits about 1.4 off the bay
 *  centre, which is just clear of the taxi's flank at this scale. */
const HAIL_STAND = { x: -3.1, z: 7.12 };
const HAIL_DOOR = { x: -4.5, z: 7.6 };
const HAIL_HOME = { x: -1.2, z: 5.5 };
/** Back seat in the taxi's own frame. Negative x is the curb side, the same
 *  side as HAIL_DOOR, so the robot sits down where it got in.
 *
 *  The y is deliberately below ground. A humanoid at this scale is about
 *  twice the height of this car, so seating it on top of the bodywork just
 *  perches it on the tail. Sinking it instead puts the hips and legs under
 *  the ground plane, which occludes them, and leaves the head and shoulders
 *  riding above the canopy exactly like a passenger in a low car. */
const SEAT = { x: -0.16, y: 0.18, z: -0.08 };
/** Seated scale. A standing humanoid is about twice this car's height, so a
 *  full-size figure either perches on the roof or pushes its limbs out
 *  through the bodywork. Shrinking it as it gets in is what makes it read as
 *  a passenger; the change happens during the board leg, while it is already
 *  half behind the door, so it is not something the eye catches. */
const SEAT_SCALE = 0.62;

type HailLeg = "toPost" | "press" | "hail" | "wait" | "toDoor" | "board" | "ride" | "reset";
/** The taxi is parked through wait, toDoor and board, so the pickup holds
 *  for about five seconds. Any less and it reads as a drive-by, not a stop. */
const HAIL_LEGS: { name: HailLeg; dur: number }[] = [
  { name: "toPost", dur: 2.6 },
  { name: "press", dur: 1.9 },
  { name: "hail", dur: 4.6 },
  { name: "wait", dur: 1.4 },
  { name: "toDoor", dur: 1.5 },
  { name: "board", dur: 2.0 },
  { name: "ride", dur: 5.6 },
  { name: "reset", dur: 2.4 },
];

function RideHail() {
  const ctx = useScene();
  const taxi = useRef<THREE.Group>(null);
  const bot = useRef<THREE.Group>(null);
  const button = useRef<THREE.MeshBasicMaterial>(null);
  const leg = useRef(0);
  const t = useRef(0);
  const [pose, setPose] = useState<"walk" | "idle" | "press" | "sit">("idle");
  const [rolling, setRolling] = useState(false);
  const poseRef = useRef(pose);
  const rollRef = useRef(false);
  useCollider(taxi, 1.3);
  const p = useMemo(() => new THREE.Vector3(), []);
  const tan = useMemo(() => new THREE.Vector3(), []);
  /** Lane courtesy, 0..1, multiplying this leg's own clock. */
  const pace = useRef(1);

  useFrame((_, delta) => {
    const car = taxi.current;
    const b = bot.current;
    if (!car || !b) return;

    const setPose_ = (v: typeof pose) => {
      if (poseRef.current === v) return;
      poseRef.current = v;
      setPose(v);
    };
    const setRoll = (v: boolean) => {
      if (rollRef.current === v) return;
      rollRef.current = v;
      setRolling(v);
    };
    /** Park the taxi at curve param u, facing along the path. */
    const place = (u: number) => {
      HAIL_PATH.getPointAt(u, p);
      HAIL_PATH.getTangentAt(u, tan);
      car.visible = true;
      car.position.set(p.x, 0.02, p.z);
      car.rotation.y = Math.atan2(tan.x, tan.z);
    };
    /** Hidden means out of the world, not just invisible, so the collision
     *  circle does not leave an invisible wall parked in the plaza. */
    const stow = () => {
      car.visible = false;
      car.position.set(90, -6, 90);
      setRoll(false);
    };
    const walkTo = (fx: number, fz: number, tx: number, tz: number, k: number) => {
      b.position.set(fx + (tx - fx) * k, 0.008, fz + (tz - fz) * k);
      b.rotation.y = Math.atan2(tx - fx, tz - fz);
    };
    /** Ease the robot from wherever it is into the back seat, in the taxi's
     *  rotated frame, and face it the way the taxi faces. */
    const seat = (k: number) => {
      const cy = Math.cos(car.rotation.y);
      const sy = Math.sin(car.rotation.y);
      const wx = car.position.x + SEAT.x * cy + SEAT.z * sy;
      const wz = car.position.z - SEAT.x * sy + SEAT.z * cy;
      b.position.x += (wx - b.position.x) * k;
      b.position.z += (wz - b.position.z) * k;
      b.position.y += (car.position.y + SEAT.y - b.position.y) * k;
      b.scale.setScalar(b.scale.x + (SEAT_SCALE - b.scale.x) * k);
      b.rotation.y = car.rotation.y;
    };
    /** Back to full height once it is out of the car. */
    const stand = (k: number) => b.scale.setScalar(b.scale.x + (1 - b.scale.x) * k);

    // Reduced motion gets the tableau instead of the loop: robot at the post
    // with a hand on the button, taxi already waiting in the bay.
    if (ctx.still) {
      place(0.5);
      b.position.set(HAIL_STAND.x, 0.008, HAIL_STAND.z);
      b.rotation.y = Math.atan2(HAIL_POST.x - HAIL_STAND.x, HAIL_POST.z - HAIL_STAND.z);
      setPose_("press");
      setRoll(false);
      return;
    }

    const cur = HAIL_LEGS[leg.current];
    // The taxi registers a collider but yields to nothing: it is driven by a
    // scripted leg timer, and HAIL_PATH runs down the ring road (the two
    // centrelines pass within 0.006 units at a 25 degree crossing angle). So
    // on its moving legs it used to run ALONG the live lane at 3 to 5.5 u/s
    // against traffic doing 2.4, and ring riders only look forward, which
    // left anything it came up behind defenceless. Measured over 400 s that
    // was seven interpenetration episodes, one every minute, and it was the
    // sole source: rider-against-rider clearance never dropped below 1.92.
    //
    // The fix is the same one every path follower already uses. Modulate the
    // leg's own clock from a forward cone rather than pushing anybody, and
    // hold the spawn until the lane it pops into is empty. `hail` also used
    // to teleport the car in from its stow at (90, -6, 90) to a point 0.589
    // units off the ring centreline and immediately accelerate.
    const moving = cur.name === "hail" || cur.name === "ride";
    let want = 1;
    if (moving) {
      const fx = Math.sin(car.rotation.y);
      const fz = Math.cos(car.rotation.y);
      COLLIDERS.forEach((c) => {
        if (c.o === car) return;
        if (Math.abs(c.o.position.y - car.position.y) > DECK_GAP) return;
        const dx = c.o.position.x - car.position.x;
        const dz = c.o.position.z - car.position.z;
        const ahead = dx * fx + dz * fz;
        const ext = c.hl + c.r;
        if (ahead <= 0 || ahead > CONE_BASE + 2.6 + ext) return;
        if (Math.abs(-dx * fz + dz * fx) > 1.3 * 0.8 + c.r * 0.8) return;
        want = Math.min(want, ss(ahead - (1.3 + ext), GAP_STOP, GAP_FREE));
      });
    }
    // Standing start: do not materialise a 1.3-radius body into the lane and
    // then accelerate out of it. The stow is held instead, which reads as the
    // taxi simply taking a moment longer to arrive.
    let spawnBlocked = false;
    if (cur.name === "hail" && t.current < 0.5) {
      HAIL_PATH.getPointAt(0, p);
      COLLIDERS.forEach((c) => {
        if (c.o === car) return;
        const dx = c.o.position.x - p.x;
        const dz = c.o.position.z - p.z;
        const room = 1.3 + c.hl + c.r + 1.6;
        if (dx * dx + dz * dz < room * room) spawnBlocked = true;
      });
    }
    if (spawnBlocked) {
      stow();
      stand(Math.min(1, delta * 8));
      setPose_("idle");
      pace.current = 0;
      return;
    }
    pace.current += (want - pace.current) * ease(want < pace.current ? 6 : 2, delta);
    t.current += delta * (moving ? pace.current : 1);
    const k = Math.min(1, t.current / cur.dur);

    switch (cur.name) {
      case "toPost":
        stow();
        stand(Math.min(1, delta * 8));
        walkTo(HAIL_HOME.x, HAIL_HOME.z, HAIL_STAND.x, HAIL_STAND.z, smooth(k));
        setPose_("walk");
        break;
      case "press":
        b.rotation.y = Math.atan2(HAIL_POST.x - b.position.x, HAIL_POST.z - b.position.z);
        setPose_("press");
        button.current?.color.set(k > 0.3 ? "#34d399" : "#ffb020");
        break;
      case "hail":
        // ease out of the arrival: quick off the road, gentle into the bay
        place((1 - Math.pow(1 - k, 2.4)) * 0.5);
        setRoll(k < 0.94);
        setPose_("idle");
        break;
      case "wait":
        // parked with the passenger still at the post: the beat that makes
        // the arrival read as a stop rather than a pass
        place(0.5);
        setRoll(false);
        setPose_("idle");
        break;
      case "toDoor":
        place(0.5);
        setRoll(false);
        walkTo(HAIL_STAND.x, HAIL_STAND.z, HAIL_DOOR.x, HAIL_DOOR.z, smooth(k));
        setPose_("walk");
        break;
      case "board":
        place(0.5);
        seat(Math.min(1, delta * 6));
        setPose_("sit");
        break;
      case "ride":
        place(0.5 + Math.pow(k, 1.8) * 0.5);
        seat(1);
        setRoll(true);
        setPose_("sit");
        break;
      default:
        stow();
        stand(1);
        b.position.set(HAIL_HOME.x, 0.008, HAIL_HOME.z);
        b.rotation.y = 0.6;
        setPose_("idle");
        button.current?.color.set("#ffb020");
    }

    if (k >= 1) {
      leg.current = (leg.current + 1) % HAIL_LEGS.length;
      t.current = 0;
    }
  });

  return (
    <>
      {/* the call post: slim pillar, lit button at hand height */}
      <group position={[HAIL_POST.x, 0, HAIL_POST.z]}>
        <mesh position={[0, 0.62, 0]}>
          <boxGeometry args={[0.13, 1.24, 0.13]} />
          <meshStandardMaterial color="#2a2c31" roughness={0.5} metalness={0.5} />
        </mesh>
        <mesh position={[0, 1.32, 0]}>
          <boxGeometry args={[0.4, 0.26, 0.06]} />
          <meshStandardMaterial color="#111216" roughness={0.75} metalness={0.2} />
        </mesh>
        <mesh position={[0, 1.0, 0.075]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.03, 16]} />
          <meshBasicMaterial ref={button} color="#ffb020" toneMapped={false} />
        </mesh>
        <ContactShadow w={0.4} l={0.4} opacity={0.32} />
      </group>
      {/* bay marking, so the stop reads as a designed pickup point */}
      <mesh position={[-4.8, 0.012, 9]} rotation={[-Math.PI / 2, 0, 0.24]}>
        <ringGeometry args={[1.5, 1.62, 30]} />
        <meshBasicMaterial color="#454951" transparent opacity={0.55} toneMapped={false} />
      </mesh>
      <group ref={taxi} scale={0.9} visible={false}>
        <Sedan dim={ctx.dim} speed={rolling ? 5.4 : 0} />
        <ContactShadow w={1.1} l={2.5} opacity={0.45} y={0.012} />
      </group>
      <group ref={bot} position={[HAIL_HOME.x, 0.008, HAIL_HOME.z]}>
        <Robot pose={pose} phase={2.1} scale={ROBOT_SCALE} dim={ctx.dim} frozen={ctx.still} />
        {pose !== "sit" && <ContactShadow w={0.85} l={1.05} opacity={0.4} />}
      </group>
    </>
  );
}

/** Background mode owns the camera: a slow fixed-radius orbit, no controls. */
function BackgroundRig() {
  const ctx = useScene();
  useFrame(({ camera, clock }) => {
    const th = 0.65 + (ctx.still ? 0 : clock.elapsedTime * 0.03);
    camera.position.set(Math.sin(th) * 21, 6.6, Math.cos(th) * 21);
    camera.lookAt(BG_LOOK);
  });
  return null;
}

function usePrefersReducedMotion() {
  const [still, setStill] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setStill(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return still;
}

/** The cockpit, docked inside the game frame: bottom-center controls plus a
 *  telemetry panel top-right. Both are absolutely positioned siblings of the
 *  Canvas inside the relative wrapper, so they travel with the frame.
 *
 *  Everything live is written imperatively from one rAF loop. The rim shows
 *  the chassis's ACTUAL road-wheel angle rather than echoing the key that was
 *  pressed, which means it displays the rate limit, the speed-faded lock and
 *  the countersteer assist for free. The old cosmetic road-feel sine is gone
 *  with it: there is real yaw data now, and fake vibration layered on top of
 *  real data looks like a bug.
 *
 *  The rim itself is F1Wheel, which is purely presentational: discrete state
 *  goes in as props, continuous chassis state goes in through one sync() call
 *  per frame, and actions come back as callbacks. A car at full slip costs
 *  zero React renders. The scratch frame below is allocated once and mutated
 *  in place, so the per-frame path allocates nothing either. */
function DriveOverlay({ api, sel }: { api: DriveApi; sel: DriveSel | null }) {
  // FRONT/BACK is a REQUEST that signs the accelerator. The gear the machine
  // is actually in comes from the chassis and is echoed on the rim's own
  // display, so the HUD can no longer read forward while the car reverses.
  const [dir, setDir] = useState<WheelDir>("FRONT");
  const [pedal, setPedal] = useState<0 | 1>(0);
  const [braking, setBraking] = useState(false);
  const [handbrake, setHandbrake] = useState(false);
  const [boostHeld, setBoostHeld] = useState(false);
  const [compact, setCompact] = useState(false);
  const still = usePrefersReducedMotion();
  // The api object is rebuilt whenever autopilot toggles, so it must never be
  // an effect dependency: reacting to its identity resets the cockpit on the
  // very commit that engages AUTO, and the autopilot can never come on. Read
  // it through a ref so the effects below fire on real state changes only.
  const apiRef = useRef(api);
  apiRef.current = api;
  const wheelApi = useRef<F1WheelHandle | null>(null);
  const speedRef = useRef<HTMLDivElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  const gearRef = useRef<HTMLSpanElement | null>(null);
  const stateRef = useRef<HTMLSpanElement | null>(null);
  const needle = useRef(0);
  /** Seconds left on the OVERRIDE telltale after a manual input dropped the
   *  autopilot, so the rim can say why it handed the car back. */
  const overrideT = useRef(0);
  const lastT = useRef(0);
  /** One frame object for the rim, mutated in place. */
  const frame = useRef<F1WheelFrame>({
    rimDeg: 0, reqDeg: 0, kmh: 0, gear: "N", rev: 0, limiter: false,
    gripLoss: 0, driftHeat: 0, boost: 1, boostCool: 0, boostActive: false,
    autoActive: false, hb: 0, t: 0,
  });

  // Phone and coarse-pointer reflow. One listener, changing on resize only:
  // thumb reach inverts on a phone, so the compact layout moves the four
  // function buttons to a full-width bar and EXIT out of both thumb arcs
  // rather than squashing the desktop row.
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(max-width: 640px), (pointer: coarse)");
    const apply = () => setCompact(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    setDir("FRONT");
    setPedal(0);
    setBraking(false);
    setHandbrake(false);
    setBoostHeld(false);
    overrideT.current = 0;
    const inp = apiRef.current.input.current;
    inp.th = 0;
    inp.st = 0;
    inp.bk = 0;
    inp.hb = 0;
    inp.boost = 0;
    inp.auto = 0;
  }, [sel?.id]);

  // The pedal is a signed throttle request; the chassis owns what that means.
  useEffect(() => {
    apiRef.current.input.current.th = pedal === 1 ? (dir === "BACK" ? -1 : 1) : 0;
  }, [dir, pedal]);
  useEffect(() => {
    apiRef.current.input.current.bk = braking ? 1 : 0;
  }, [braking]);
  useEffect(() => {
    apiRef.current.input.current.hb = handbrake ? 1 : 0;
  }, [handbrake]);
  useEffect(() => {
    apiRef.current.input.current.boost = boostHeld ? 1 : 0;
  }, [boostHeld]);
  useEffect(() => {
    api.input.current.auto = api.auto ? 1 : 0;
  }, [api]);

  /** Any manual input takes the car back. Called from the rim's own drag and
   *  from the keyboard, which stays mounted under autopilot and would
   *  otherwise keep writing into the shared input channel unnoticed. */
  const override = useMemo(
    () => () => {
      if (!api.auto) return;
      api.setAuto(false);
      overrideT.current = OVERRIDE_HOLD;
    },
    [api]
  );

  // One loop drives every live readout: rim angle, speed, slip, gear, the rev
  // strip, both dials and the two telltales.
  useEffect(() => {
    if (!sel) return;
    let raf = 0;
    const tick = (now: number) => {
      const rig = api.rig.current;
      const f = frame.current;
      const t = now / 1000;
      const dt = lastT.current ? Math.min(0.1, t - lastT.current) : 0;
      lastT.current = t;
      if (overrideT.current > 0) overrideT.current = Math.max(0, overrideT.current - dt);

      // Honest number, satisfying sweep: the dial tops out just above VMAX so
      // the digits stay real rather than being multiplied for drama.
      const kmh = Math.abs(rig.vf) * UNIT_M * 3.6;
      needle.current += (kmh - needle.current) * 0.14;

      f.rimDeg = (rig.steer / rig.spec.SIG_HI) * SWEEP_DEG;
      f.reqDeg = cl(api.input.current.st, -1, 1) * SWEEP_DEG;
      f.kmh = needle.current;
      f.gear = rig.gear;
      // Divided by the BOOSTED ceiling, never rig.norm: rig.norm clamps at 1,
      // so the strip would pin the instant the booster was pressed, which is
      // the one moment the player most wants to read it.
      f.rev = cl(rig.speed / (rig.spec.VMAX * rig.boostV), 0, 1);
      f.limiter = !rig.boostActive && rig.speed > rig.spec.VMAX * 0.995;
      f.gripLoss = rig.gripLoss;
      f.driftHeat = rig.driftHeat;
      f.boost = rig.boost;
      f.boostCool = rig.boostCool;
      f.boostActive = rig.boostActive;
      f.autoActive = rig.autoActive;
      f.hb = rig.hb ? 1 : 0;
      f.t = t;
      wheelApi.current?.sync(f);

      if (speedRef.current) speedRef.current.textContent = String(Math.round(needle.current));
      const bar = barRef.current;
      if (bar) {
        bar.style.width = `${Math.round(rig.driftHeat * 100)}%`;
        bar.style.background = rig.gripLoss > 0.85 ? "#e2573e" : rig.gripLoss > 0.6 ? "#d9a860" : "#9fb4d0";
      }
      if (gearRef.current) gearRef.current.textContent = rig.gear;
      const s = stateRef.current;
      if (s) {
        // The only readout that teaches where the limit is. AUTO and the
        // handoff sit above the grip ladder, because while the car is driving
        // itself the grip state is not the thing the player needs to know.
        if (rig.autoActive) {
          s.textContent = "AUTO";
          s.style.color = "#9fd0b4";
        } else if (api.auto) {
          s.textContent = "ENGAGING";
          s.style.color = "#d9a860";
        } else if (overrideT.current > 0) {
          s.textContent = "OVERRIDE";
          s.style.color = "#e2937e";
        } else if (rig.boostActive) {
          s.textContent = "BOOST";
          s.style.color = "#e2573e";
        } else {
          s.textContent = rig.hb ? "HANDBRAKE" : rig.gripLoss > 0.85 ? "SLIP" : rig.gripLoss > 0.6 ? "LOOSE" : "GRIP";
          s.style.color = rig.hb || rig.gripLoss > 0.85 ? "#e2573e" : rig.gripLoss > 0.6 ? "#d9a860" : "#9a9aa3";
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [sel, api]);

  // keyboard: signed throttle, steer, space brakes, shift handbrakes, Esc
  // exits, 1/2 pick the direction, B holds the booster, T toggles autopilot.
  useEffect(() => {
    if (!sel) return;
    const input = api.input;
    const clear = () => {
      input.current.th = 0;
      input.current.st = 0;
      input.current.bk = 0;
      input.current.hb = 0;
      input.current.boost = 0;
      setPedal(0);
      setBraking(false);
      setHandbrake(false);
      setBoostHeld(false);
    };
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      // A keyboard-only player never touches the canvas or a cockpit button,
      // so this is their re-resume path. isTrusted is load-bearing: the game
      // pad SYNTHESISES KeyboardEvents through dispatchEvent, and a
      // synthetic event does not satisfy the autoplay policy, so acting on
      // one would look like it worked and silently do nothing.
      if (e.isTrusted) api.audio?.resume();
      // Steer, throttle and brake all take the car back off the autopilot.
      if (["w", "s", "a", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) override();
      if (["w", "arrowup"].includes(k)) input.current.th = 1;
      // Signed, not a reverse shortcut: at speed this is the brake pedal and
      // only a held press from a near stop drops the box into R.
      if (["s", "arrowdown"].includes(k)) input.current.th = -1;
      if (["a", "arrowleft"].includes(k)) input.current.st = -1;
      if (["d", "arrowright"].includes(k)) input.current.st = 1;
      if (k === " ") input.current.bk = 1;
      if (k === "shift") input.current.hb = 1;
      if (k === "escape") {
        api.audio?.release();
        api.set(null);
      }
      // Repeats would re-fire a toggle thirty times a second.
      if (!e.repeat) {
        if (k === "1") {
          override();
          setDir("FRONT");
        }
        if (k === "2") {
          override();
          setDir("BACK");
        }
        if (k === "b" || k === "3") {
          override();
          setBoostHeld(true);
        }
        if (k === "t" || k === "4") {
          if (api.auto) override();
          else api.setAuto(true);
        }
      }
      // Space and the arrows scroll the page under the canvas otherwise. The
      // new keys are all plain characters, so none of them need this.
      if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) e.preventDefault();
    };
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (["w", "s", "arrowup", "arrowdown"].includes(k)) input.current.th = 0;
      if (["a", "d", "arrowleft", "arrowright"].includes(k)) input.current.st = 0;
      if (k === " ") input.current.bk = 0;
      if (k === "shift") input.current.hb = 0;
      if (k === "b" || k === "3") setBoostHeld(false);
    };
    // A key held when the window loses focus never delivers its keyup, so it
    // stayed latched in the shared input while the player was away AND after
    // they came back: Cmd+Tab away from a truck at full throttle and it was
    // still at full throttle on return, with no key down and no way to clear
    // it. The walking controller has fixed this since it shipped; the cockpit
    // never got the same treatment.
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    document.addEventListener("visibilitychange", clear);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
      document.removeEventListener("visibilitychange", clear);
      input.current.th = 0;
      input.current.st = 0;
      input.current.bk = 0;
      input.current.hb = 0;
      input.current.boost = 0;
      input.current.auto = 0;
    };
  }, [sel, api, override]);

  if (!sel) return null;

  const base: React.CSSProperties = {
    userSelect: "none",
    touchAction: "none",
    fontFamily: "monospace",
    color: "#cfe4ff",
  };
  const pedalStyle = (active: boolean): React.CSSProperties => ({
    ...base,
    fontSize: 11,
    letterSpacing: "0.12em",
    padding: "15px 17px",
    borderRadius: 8,
    cursor: "pointer",
    flexShrink: 0,
    border: `1px solid ${active ? "#9fb4d0" : "#2c2e35"}`,
    background: active ? "rgba(159,180,208,0.2)" : "rgba(16,17,20,0.92)",
  });
  // Under autopilot the pedals and the rim dim but stay hittable, because
  // touching one is what hands the car back. An inert-looking control that
  // still responds is confusing; a dimmed one that responds by giving you the
  // car is legible.
  const autoDim: React.CSSProperties = api.auto ? { opacity: 0.45 } : {};
  const exitBtn = (
    <div
      style={{ ...pedalStyle(false), color: "#e2937e", ...(compact ? { padding: "9px 11px" } : null) }}
      onPointerDown={() => {
        api.audio?.ui("exit");
        api.audio?.release();
        api.set(null);
      }}
    >
      ✕ EXIT
    </div>
  );

  return (
    <>
    {/* telemetry: the needle sweep is what reads as speed, so the dial tops
        out just above VMAX and the printed figure stays honest */}
    <div
      style={{
        ...base,
        position: "absolute",
        right: 16,
        top: 16,
        zIndex: 30,
        pointerEvents: "none",
        background: "rgba(16,17,20,0.92)",
        border: "1px solid #2c2e35",
        borderRadius: 8,
        padding: "9px 12px 8px",
        minWidth: 118,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "flex-end", gap: 6 }}>
        <div ref={speedRef} style={{ fontSize: 30, lineHeight: 1 }}>
          0
        </div>
        <div style={{ fontSize: 9, letterSpacing: "0.2em", color: "#9a9aa3" }}>KM/H</div>
      </div>
      <div style={{ marginTop: 9, height: 4, borderRadius: 2, background: "#23252b", overflow: "hidden" }}>
        <div ref={barRef} style={{ width: "0%", height: "100%", background: "#9fb4d0", borderRadius: 2 }} />
      </div>
      <div style={{ marginTop: 7, display: "flex", justifyContent: "space-between", fontSize: 9, letterSpacing: "0.18em", color: "#9a9aa3" }}>
        <span ref={gearRef}>N</span>
        <span ref={stateRef}>GRIP</span>
      </div>
    </div>
    {/* EXIT is the one destructive control in the cockpit, and on a phone it
        sat one button from the brake. On the compact layout it moves to the
        opposite corner, out of both thumb arcs. */}
    {compact && (
      <div style={{ position: "absolute", top: 12, left: 12, zIndex: 30, pointerEvents: "auto" }}>{exitBtn}</div>
    )}
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 16,
        zIndex: 30,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 9,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          ...base,
          fontSize: 10,
          letterSpacing: "0.2em",
          color: "#9a9aa3",
          background: "rgba(10,10,11,0.82)",
          padding: "5px 10px",
          borderRadius: 6,
          maxWidth: "calc(100% - 24px)",
        }}
      >
        DRIVING · {sel.label} · WASD STEER · SPACE BRAKE · SHIFT HANDBRAKE · ESC EXITS
      </div>
      {/* The ONLY interactive element in the cockpit. The strip above is
          pass-through, and nothing here may grow a hit-testable box outside
          its own layout rectangle, or it swallows the click-a-vehicle
          raycast that lives on the canvas behind it. */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          // Never wrap. Wrapping is what doubled the stack's height on a
          // phone and buried the road behind the controls.
          flexWrap: "nowrap",
          gap: compact ? 8 : 14,
          maxWidth: "min(98vw, 760px)",
          // Shrink the whole cluster on a phone rather than stacking it. The
          // road stays visible, and every control keeps its hit target because
          // the scale is modest.
          transform: compact ? "scale(0.82)" : undefined,
          transformOrigin: "bottom center",
          pointerEvents: "none",
        }}
      >
        {/* the handbrake is the only control that lets the rear go: it drops
            rear grip to a third and switches the stability assist off */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0, pointerEvents: "auto" }}>
          <div
            style={{ ...pedalStyle(handbrake), color: handbrake ? "#e2c07e" : "#cfe4ff" }}
            onPointerDown={() => {
              api.audio?.ui("click");
              override();
              setHandbrake(true);
            }}
            onPointerUp={() => setHandbrake(false)}
            onPointerLeave={() => setHandbrake(false)}
          >
            HAND
            <br />
            BRAKE
          </div>
          {!compact && exitBtn}
        </div>
        <F1Wheel
          ref={wheelApi}
          machineId={sel.id}
          dir={dir}
          onDir={(d) => {
            api.audio?.ui("click");
            override();
            setDir(d);
          }}
          boosting={boostHeld}
          onBoosting={(held) => {
            if (held) override();
            setBoostHeld(held);
          }}
          auto={api.auto}
          onAuto={(on) => {
            api.audio?.ui("click");
            if (on) api.setAuto(true);
            else override();
          }}
          onSteer={(st) => {
            api.input.current.st = st;
          }}
          onOverride={override}
          compact={compact}
          steerPx={compact ? 72 : 104}
          stillMotion={still}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0, pointerEvents: "auto", ...autoDim }}>
          <div
            style={pedalStyle(pedal === 1)}
            onPointerDown={() => {
              api.audio?.ui("click");
              override();
              setPedal(1);
            }}
            onPointerUp={() => setPedal(0)}
            onPointerLeave={() => setPedal(0)}
          >
            ACCEL
          </div>
          <div
            style={pedalStyle(braking)}
            onPointerDown={() => {
              api.audio?.ui("click");
              override();
              setBraking(true);
            }}
            onPointerUp={() => setBraking(false)}
            onPointerLeave={() => setBraking(false)}
          >
            BRAKE
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

/** Touch and mouse pad for the playable humanoid. It synthesises the same
 *  key events the controller already listens for, so keyboard and buttons
 *  share one input path and can never drift apart. */
function GamePad({ onFree }: { onFree: () => void }) {
  const send = (key: string, type: "keydown" | "keyup") =>
    window.dispatchEvent(new KeyboardEvent(type, { key, bubbles: true }));
  const hold = (key: string) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      send(key, "keydown");
    },
    onPointerUp: () => send(key, "keyup"),
    onPointerLeave: () => send(key, "keyup"),
  });
  const btn: React.CSSProperties = {
    userSelect: "none",
    touchAction: "none",
    fontFamily: "monospace",
    fontSize: 15,
    color: "#cfe4ff",
    background: "rgba(16,17,20,0.92)",
    border: "1px solid #2c2e35",
    borderRadius: 8,
    padding: "13px 16px",
    cursor: "pointer",
    textAlign: "center",
    minWidth: 46,
  };
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 16,
        zIndex: 30,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 9,
        pointerEvents: "none",
      }}
    >
      <div style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: "0.2em", color: "#9a9aa3", background: "rgba(10,10,11,0.82)", padding: "5px 10px", borderRadius: 6 }}>
        ARROWS OR WASD WALK · SHIFT RUNS · E GREETS · CLICK A VEHICLE TO DRIVE
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 10, pointerEvents: "auto" }}>
        <div
          style={{ ...btn, color: "#e2c07e", alignSelf: "center" }}
          onPointerDown={(e) => {
            e.preventDefault();
            onFree();
          }}
        >
          ⤢ FREE LOOK
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <div style={btn} {...hold("ArrowUp")}>▲</div>
          <div style={{ display: "flex", gap: 6 }}>
            <div style={btn} {...hold("ArrowLeft")}>◀</div>
            <div style={btn} {...hold("ArrowDown")}>▼</div>
            <div style={btn} {...hold("ArrowRight")}>▶</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={btn} {...hold("Shift")}>RUN</div>
          <div
            style={{ ...btn, color: "#9fd0b4" }}
            onPointerDown={(e) => {
              e.preventDefault();
              (window as unknown as { __vpGreet?: () => void }).__vpGreet?.();
            }}
          >
            GREET
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Copy the chassis into the audio engine's frame object. Mutates in place
 * and allocates nothing, exactly like the cockpit's F1WheelFrame path.
 *
 * The powertrain is gated on kind rather than on rig.driven, because the
 * humanoid is a drive selection like any other and it has no chassis at all:
 * anything keyed on rig alone would be reading a dead rig while the player
 * walks around on foot.
 */
function fillAudioFrame(f: CityAudioFrame, rig: Rig, sel: DriveSel | null) {
  f.driven = !!sel && sel.kind !== "bot" && rig.driven;
  f.kind = sel ? sel.kind : "bot";
  f.machineId = sel ? sel.id : "";
  f.specKey = sel ? audioSpecKey(sel.id) : "sedan";
  f.halfWB = rig.spec.halfWB;
  f.VMAX = rig.spec.VMAX;
  f.ACCEL = rig.spec.ACCEL;
  f.vf = rig.vf;
  f.speed = rig.speed;
  f.beta = rig.beta;
  f.r = rig.r;
  f.load = rig.load;
  f.slipDrive = rig.slipDrive;
  f.aBrake = rig.aBrake;
  f.gripLoss = rig.gripLoss;
  f.driftHeat = rig.driftHeat;
  f.hb = rig.hb;
  f.gear = rig.gear;
  f.boost = rig.boost;
  f.boostK = rig.boostK;
  f.boostActive = rig.boostActive;
  f.boostCool = rig.boostCool;
  f.autoActive = rig.autoActive;
  f.airborne = rig.airborne;
  f.surface = rig.surface === 2 ? 2 : rig.surface === 1 ? 1 : 0;
  f.impact = rig.aImpact;
  f.landing = rig.aLanding;
  f.scrub = rig.scrub;
  // Same expression the cockpit uses, and for the same reason: rig.norm
  // clamps at 1 and would claim the limiter the instant the booster fires.
  f.limiter = !rig.boostActive && rig.speed > rig.spec.VMAX * 0.995;
}

/**
 * The sound control. It is a sibling of the Canvas rather than part of the
 * cockpit, because the cockpit unmounts on every selection change, on free
 * look and on the humanoid, and a mute button that disappears when you get
 * out of a car is a page that makes noise with no obvious off switch.
 *
 * Its onClick is the ONE place an AudioContext is ever constructed. That is
 * what makes the autoplay policy a non-problem here rather than a race to be
 * won: the gesture is a press on a control whose entire purpose is sound.
 *
 * It has to be click rather than pointerdown, and that is a correctness
 * matter, not a preference. Under the HTML activation-triggering rules
 * pointerdown only grants user activation when pointerType is "mouse"; on
 * touch and pen the activation arrives with pointerup. A pointerdown handler
 * therefore constructs a context that the browser keeps suspended for every
 * tap on a phone, which is the one platform where the scene ships a touch
 * gamepad and a touch cockpit.
 */
function SoundToggle({ audio }: { audio: CityAudioHandle }) {
  const [on, setOn] = useState(false);
  const [vol, setVol] = useState(0.55);
  const [dead, setDead] = useState(false);

  // A stored preference sets the target VOLUME. It deliberately does NOT
  // authorise construction: the user still clicks once per page load, which
  // is both what the browser requires and what a visitor expects.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("vp.audio");
      if (raw) {
        const v = Number(JSON.parse(raw)?.vol);
        if (Number.isFinite(v)) setVol(cl(v, 0, 1));
      }
    } catch {
      // Private mode, a quota, or a corrupt value. The default stands.
    }
  }, []);

  const toggle = async () => {
    if (dead) return;
    if (!on) {
      audio.setVolume(vol);
      const ok = await audio.enable();
      if (!ok) {
        // Only a browser with no AudioContext at all reports "dead", and only
        // that disables the control. Every other failure (a blocked context,
        // or the losing half of a double press) leaves the button reading
        // SOUND OFF and fully retryable, because those are recoverable on the
        // next gesture and a control that permanently gives up on one unlucky
        // tap is worse than one that simply did nothing.
        setDead(audio.state === "dead");
        return;
      }
      setOn(true);
    } else {
      audio.setMuted(true);
      setOn(false);
    }
  };

  const panel: React.CSSProperties = {
    fontFamily: "monospace",
    fontSize: 11,
    letterSpacing: "0.16em",
    color: dead ? "#6b6b73" : "#cfe4ff",
    background: "rgba(16,17,20,0.92)",
    border: "1px solid #2c2e35",
    borderRadius: 8,
    padding: "11px 16px",
    userSelect: "none",
    cursor: dead ? "default" : "pointer",
    pointerEvents: "auto",
  };

  return (
    <div
      style={{
        position: "absolute",
        right: 16,
        bottom: 16,
        zIndex: 31,
        display: "flex",
        alignItems: "center",
        gap: 10,
        pointerEvents: "none",
      }}
    >
      {on && (
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(vol * 100)}
          aria-label="Volume"
          onChange={(e) => {
            const v = Number(e.target.value) / 100;
            setVol(v);
            audio.setVolume(v);
            try {
              window.localStorage.setItem("vp.audio", JSON.stringify({ vol: v }));
            } catch {
              // Persistence is a convenience; failing to store it changes nothing.
            }
          }}
          style={{ pointerEvents: "auto", width: 84, accentColor: "#9fb4d0", cursor: "pointer" }}
        />
      )}
      <div
        style={panel}
        role="button"
        aria-pressed={on}
        aria-disabled={dead}
        title={dead ? "Audio unavailable" : undefined}
        onClick={toggle}
      >
        {dead ? "SOUND N/A" : on ? "◉ SOUND ON" : "◎ SOUND OFF"}
      </div>
    </div>
  );
}

export default function FutureCityScene(props: FutureCitySceneProps) {
  const background = props.background ?? false;
  const still = usePrefersReducedMotion();
  const [interacted, setInteracted] = useState(false);
  const [driveSel, setDriveSel] = useState<DriveSel | null>(null);
  const driveInput = useRef<DriveInput>({ th: 0, st: 0, bk: 0, hb: 0, boost: 0, auto: 0 });
  const driveTarget = useRef<THREE.Object3D | null>(null);
  // One chassis, reused by whatever machine is currently under the player.
  // Stable across renders, so adding it to the memo below changes nothing.
  const driveRig = useRef<Rig>(createRig());
  const orbitRef = useRef<{ enabled: boolean } | null>(null);
  // Entering a machine always cancels free look: the two HUDs must never
  // render at once (they overlapped at the bottom of the frame).
  const [freeCam, setFreeCamState] = useState(false);
  const setFreeCam = (v: boolean) => {
    if (v) setDriveSel(null);
    setFreeCamState(v);
  };
  // Autopilot lives here rather than in the cockpit, because PathRider reads
  // it through the context to decide whether it owns the lane this frame.
  const [auto, setAutoState] = useState(false);
  const setAuto = (v: boolean) => {
    setAutoState(v);
    driveInput.current.auto = v ? 1 : 0;
  };
  // Leaving a machine always drops the autopilot with it, or the next one
  // taken over would start driving itself.
  useEffect(() => {
    setAutoState(false);
    driveInput.current.auto = 0;
  }, [driveSel?.id]);
  const game = props.game ?? false;
  // Three terms, belt and braces. props.audio is opt-in so a future
  // decorative mount cannot regress into making noise; !background so the
  // currently-unused background flag going live cannot either; !still
  // because a page that makes sound for someone who has explicitly asked
  // their OS for less stimulation is a liability. That last one is a product
  // call rather than a mechanical consequence and it is worth being honest
  // about: the drive branch has no still guard, so a reduced-motion visitor
  // genuinely can take a car and drive it, and under this gate they get a
  // moving vehicle in silence. Reduced motion is a vestibular preference,
  // not an auditory one, so the technically better answer is to keep the
  // motion bed and the powertrain and drop impacts and joints. It is written
  // down here so the decision gets re-opened deliberately rather than
  // rediscovered as a bug.
  const audioAllowed = (props.audio ?? false) && !background && !still;
  // getCityAudio constructs nothing, so calling it during render is free.
  const audio = useMemo(() => (audioAllowed ? getCityAudio() : null), [audioAllowed]);
  const audioFrame = useRef<CityAudioFrame>(createAudioFrame());
  const driveSelRef = useRef<DriveSel | null>(null);
  driveSelRef.current = driveSel;
  const driveApi = useMemo<DriveApi>(
    () => ({ sel: driveSel, set: setDriveSel, freeCam, setFreeCam, auto, setAuto, input: driveInput, target: driveTarget, rig: driveRig, audio }),
    [driveSel, freeCam, auto, audio]
  );
  const ctx: Ctx = { background, still, game, dim: background ? 0.55 : 1 };
  const lightDim = background ? 0.8 : 1;

  // Same mount nudge as HvacScene/LlmScene: some browsers (notably
  // Edge/Windows) miss r3f's first ResizeObserver measurement and the canvas
  // sticks at 300x150. A window "resize" forces a re-measure.
  useEffect(() => {
    const nudge = () => window.dispatchEvent(new Event("resize"));
    const raf = requestAnimationFrame(nudge);
    const timers = [60, 250, 800].map((ms) => window.setTimeout(nudge, ms));
    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
    };
  }, []);

  // The audio driver gets its OWN rAF rather than riding the cockpit's.
  // That loop early-returns without a selection and the cockpit is not
  // mounted at all for the humanoid in game mode or during free look, so an
  // audio layer living inside it would be killed mid-fade and leave a stuck
  // tone. One extra callback doing about a dozen AudioParam writes is worth
  // owning its own lifetime.
  //
  // The blur and visibilitychange pair is the audible twin of the bug the
  // cockpit's keyboard handler documents: rAF stops when a tab is hidden but
  // an AudioContext does not, so a truck left at full throttle would keep
  // roaring in a background tab with no loop running to update it.
  useEffect(() => {
    if (!audio) return;
    const f = audioFrame.current;
    const rig = driveRig.current;
    let raf = 0;
    let prev = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const t = now / 1000;
      const dt = prev ? Math.min(0.1, t - prev) : 0;
      prev = t;
      fillAudioFrame(f, rig, driveSelRef.current);
      audio.sync(f, dt);
      // The audio consumer owns the clear, which is what stops it hitting
      // the trap the camera already hit: a channel that cleared itself
      // inside presentDrive would read zero from out here, always.
      rig.aImpact = 0;
      rig.aLanding = 0;
    };
    raf = requestAnimationFrame(tick);
    // Wrapped rather than passed as method references: these are class
    // methods, so handing addEventListener a bare audio.resume would call it
    // with the wrong receiver and throw on the first tab switch.
    const onBlur = () => audio.suspend();
    const onFocus = () => audio.resume();
    const onVis = () => (document.hidden ? audio.suspend() : audio.resume());
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
      // A route change unmounts this tree, and a leaked AudioContext keeps
      // running and keeps a hardware audio unit open. Browsers also cap
      // concurrent contexts at around six, so bouncing between routes a few
      // times would exhaust them without this.
      audio.dispose();
    };
  }, [audio]);

  return (
    <div
      style={{ position: "relative", width: "100%", height: "100%" }}
      // Capture phase, because the cockpit pedals, the wheel, the game pad
      // and the free-look strip are all SIBLINGS of the Canvas and none of
      // their events bubble through its own handler. This only ever resumes;
      // it never constructs.
      onPointerDownCapture={audio ? () => audio.resume() : undefined}
    >
    <Canvas
      // Background mode caps dpr: it sits behind content, it does not get to
      // spend retina pixels.
      dpr={background ? [1, 1.5] : [1, 2]}
      // Hero start: a low 3/4 dolly angle so the humanoids and vehicles
      // dominate the frame instead of the skyline.
      camera={{ position: [9.5, 2.2, 15.5], fov: 40 }}
      // powerPreference nudges hybrid-GPU Windows laptops onto the discrete
      // GPU; leaving failIfMajorPerformanceCaveat false lets weak/software
      // GPUs still render instead of hard-failing on Edge.
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: props.glPower ?? "high-performance",
        failIfMajorPerformanceCaveat: false,
      }}
      onCreated={({ gl }) => {
        gl.setClearColor("#0a0a0b");
        // Some Windows/Edge GPUs drop the WebGL context under memory pressure
        // or a driver reset. preventDefault on "lost" lets the browser fire
        // "restored" so three.js rebuilds instead of freezing on a blank canvas.
        gl.domElement.addEventListener("webglcontextlost", (e) => e.preventDefault(), false);
      }}
      onPointerDown={
        background
          ? undefined
          : () => {
              setInteracted(true);
              audio?.resume();
            }
      }
      style={background ? { pointerEvents: "none", touchAction: "none" } : { touchAction: "none" }}
    >
      <fog attach="fog" args={["#0a0a0b", 18, 56]} />
      <SceneCtx.Provider value={ctx}>
        <DriveCtx.Provider value={background ? null : driveApi}>
          <World />
          {background && <BackgroundRig />}
          {!background && <ChaseCam controls={orbitRef} game={game} />}
          {!background && <CanvasHint />}
        </DriveCtx.Provider>
      </SceneCtx.Provider>


      {/* fill stays dim: the key and rim do the modelling */}
      <ambientLight intensity={0.18 * lightDim} />
      <hemisphereLight args={["#8fa3c0", "#26262c", 0.3 * lightDim]} />
      {/* cool moonlight key from camera-left of the hero start */}
      <directionalLight position={[-11, 11, 20]} color="#b9cfec" intensity={1.4 * lightDim} />
      {/* faint counter-fill so the dark sides never go to pure black */}
      <directionalLight position={[8, 5, -6]} intensity={0.22 * lightDim} />
      {/* procedural studio environment: real reflections on every hull
          without fetching a single asset (CSP-safe, offline-safe); side
          formers pushed up so the brushed metals keep a horizon to mirror */}
      <Environment resolution={64} frames={1}>
        <Lightformer intensity={1.6} position={[0, 6, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[12, 12, 1]} color="#cdd3dd" />
        <Lightformer intensity={1.6} position={[-8, 3, 2]} rotation={[0, Math.PI / 2, 0]} scale={[8, 3, 1]} color="#9fb4d0" />
        <Lightformer intensity={1.2} position={[8, 2.5, -1]} rotation={[0, -Math.PI / 2, 0]} scale={[7, 3, 1]} color="#d9c9a8" />
        <Lightformer intensity={0.6} position={[0, 2, -9]} scale={[10, 2, 1]} color="#7d8aa0" />
      </Environment>

      {/* selective glow, hero mode only: threshold high enough that only the
          emissives and light bars cross it, never the hulls */}
      {!background && (
        <EffectComposer multisampling={4}>
          <Bloom mipmapBlur intensity={0.5} luminanceThreshold={0.8} luminanceSmoothing={0.2} />
        </EffectComposer>
      )}

      {!background && (
        <OrbitControls
          ref={orbitRef as never}
          target={[0, 1.7, 0]}
          enablePan
          enableDamping
          autoRotate={!interacted && !still}
          autoRotateSpeed={0.35}
          onStart={() => setInteracted(true)}
          minDistance={5}
          maxDistance={36}
          maxPolarAngle={1.56}
        />
      )}
    </Canvas>
    {/* In game mode the humanoid reads its OWN keys (ctx.game short-circuits
        the shared input at the top of IdleRobot's frame loop), so selecting it
        used to swap the walking pad for a car cockpit whose wheel, pedals and
        gear buttons all wrote into a channel nothing was listening to: a touch
        player had zero working controls until they found EXIT. It keeps the
        pad. Outside game mode the humanoid genuinely is driven through the
        shared input, so the cockpit is still correct there. */}
    {!background && <DriveOverlay api={driveApi} sel={game && driveSel?.kind === "bot" ? null : driveSel} />}
    {audioAllowed && audio && <SoundToggle audio={audio} />}
    {game && freeCam && !driveSel && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 16,
            zIndex: 30,
            display: "flex",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              pointerEvents: "auto",
              cursor: "pointer",
              fontFamily: "monospace",
              fontSize: 11,
              letterSpacing: "0.16em",
              color: "#cfe4ff",
              background: "rgba(16,17,20,0.92)",
              border: "1px solid #2c2e35",
              borderRadius: 8,
              padding: "11px 16px",
            }}
            onPointerDown={() => setFreeCam(false)}
          >
            FREE LOOK · DRAG TO ORBIT · CLICK HERE TO TAKE THE HUMANOID BACK
          </div>
        </div>
      )}
    {game && !freeCam && (!driveSel || driveSel.kind === "bot") && <GamePad onFree={() => setFreeCam(true)} />}
    </div>
  );
}
