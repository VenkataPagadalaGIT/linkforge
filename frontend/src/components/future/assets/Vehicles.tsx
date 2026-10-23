"use client";
/**
 * Vehicles: the hero assets for the future-city scene, all generated
 * geometry, zero external files.
 *
 *  - CyberTruck: an arched side-profile extrusion that is then shaped across
 *    its width, so the nose draws in and the roof pulls in for tumblehome.
 *    A separate greenhouse volume sits on the wedge with a real daylight
 *    opening, the arches are cut into the body and framed by proud fender
 *    bands, and the flank is broken by a rocker blade, a beltline crease and
 *    two shutlines.
 *  - CyberSemi: massive angular cab (center driving glass), arch-cut side
 *    skirts, roof fairing sweeping into a long seamed trailer, five axles,
 *    ten instanced turbine wheels, amber running dots.
 *  - Sedan and GranTourer: the smooth counterpoints. Scaled sphere sections
 *    with clearcoat paint, curved light arcs in dark housings, and trim
 *    blades shrink-wrapped onto the body ellipsoid so they read as pressed
 *    metal instead of floating boxes.
 *
 * Every component: ({ dim, speed, steer, brake }) => group centered at origin,
 * +Z forward, wheels resting on y = 0. All emissive strips multiply their
 * opacity by dim ?? 1. Pass speed (world units per second) and the wheels
 * roll; pass steer (radians, positive turns left) and the front wheels turn;
 * pass brake and the tail lamps come up to full. Every one of those is
 * optional, so ambient traffic that passes only { dim, speed } is unchanged.
 * Geometry is built once per module and shared across instances.
 */
import * as THREE from "three";
import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";

export interface VehicleProps {
  /** Emissive multiplier, background scenes run dimmer. */
  dim?: number;
  /** Ground speed in scene units per second, spins the wheels to match. */
  speed?: number;
  /** Front road-wheel angle in radians, positive turns left. Eased on arrival. */
  steer?: number;
  /** True while the driver is braking, lifts the tail lamps to full. */
  brake?: boolean;
}

/* ---------------------------------------------------------------- *
 *  Shared palette and helpers
 * ---------------------------------------------------------------- */

const ICE_BRIGHT = "#cfe4ff";
const AMBER = "#d9a860";
const TAIL = "#e2573e"; // amber-red rear strip family

const STEEL = { color: "#b6b6bc", metalness: 0.9, roughness: 0.32, clearcoat: 0.55, clearcoatRoughness: 0.25 } as const;
/** EV solar skin: deep blue-black glass laminate on hoods, roofs, trailers. */
const SOLAR = { color: "#0d1524", metalness: 0.85, roughness: 0.18, clearcoat: 0.8, clearcoatRoughness: 0.15 } as const;
const TRAILER_STEEL = { color: "#b4b4ba", metalness: 0.85, roughness: 0.3, clearcoat: 0.3, clearcoatRoughness: 0.3 } as const;
const DARK_TRIM = { color: "#26282d", metalness: 0.5, roughness: 0.6 } as const;
const TIRE = { color: "#1a1b1f", metalness: 0.2, roughness: 0.9 } as const;
const HUB = { color: "#7c7f86", metalness: 0.85, roughness: 0.35 } as const;
/** Vented disc behind the hub: the dark hole that tells you a wheel is a wheel. */
const DISC = { color: "#3c3f46", metalness: 0.8, roughness: 0.45 } as const;
const GLASS = { color: "#0d1016", metalness: 0.9, roughness: 0.15, clearcoat: 0.6, clearcoatRoughness: 0.1 } as const;

/** How fast a visual steering angle chases its target, and the tail lamps theirs. */
const STEER_EASE = 14;
const LAMP_EASE = 18;

function poly(points: [number, number][]): THREE.Shape {
  const s = new THREE.Shape();
  points.forEach(([x, y], i) => (i === 0 ? s.moveTo(x, y) : s.lineTo(x, y)));
  return s;
}

/**
 * Extrude a side profile (shape x = vehicle +Z forward, shape y = up) across
 * the vehicle width, centered on x = 0. The rotate is baked into the geometry
 * so meshes need no orientation of their own.
 */
function sideExtrude(points: [number, number][], width: number, bevel = 0): THREE.ExtrudeGeometry {
  const geo = new THREE.ExtrudeGeometry(
    poly(points),
    bevel > 0
      ? { depth: width, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 1 }
      : { depth: width, bevelEnabled: false }
  );
  geo.translate(0, 0, -width / 2);
  geo.rotateY(-Math.PI / 2);
  return geo;
}

/**
 * Scale every vertex's X by a function of where it sits, which is the whole
 * trick that turns a side extrusion from a prism into a body. sideExtrude
 * already bakes width onto world X and length onto world Z, so a nose taper
 * and tumblehome cost one pass over the position buffer and no new geometry.
 */
function shapeWidth(geo: THREE.BufferGeometry, fn: (z: number, y: number) => number): THREE.BufferGeometry {
  const p = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) p.setX(i, p.getX(i) * fn(p.getZ(i), p.getY(i)));
  p.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/**
 * Concatenate static geometry into one buffer. Every trim piece on a vehicle
 * shares the same dark material, so merging them costs one draw call instead
 * of a dozen: that is what lets the detail pass stay affordable in a scene
 * that already runs several hundred draws.
 */
function mergeParts(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const flat = parts.map((p) => (p.index ? p.toNonIndexed() : p));
  const out = new THREE.BufferGeometry();
  for (const key of ["position", "normal", "uv"] as const) {
    const size = key === "uv" ? 2 : 3;
    let n = 0;
    for (const p of flat) n += (p.attributes[key] as THREE.BufferAttribute).array.length;
    const arr = new Float32Array(n);
    let o = 0;
    for (const p of flat) {
      const a = (p.attributes[key] as THREE.BufferAttribute).array as Float32Array;
      arr.set(a, o);
      o += a.length;
    }
    out.setAttribute(key, new THREE.BufferAttribute(arr, size));
  }
  for (const p of parts) p.dispose();
  return out;
}

/** Cylinder tire with the axle axis baked onto X. */
function tireGeo(r: number, w: number, segs = 20): THREE.CylinderGeometry {
  const geo = new THREE.CylinderGeometry(r, r, w, segs);
  geo.rotateZ(Math.PI / 2);
  return geo;
}

/** Six swept blades extruded from a star polygon, axle axis baked onto X. */
function turbineGeo(rOut: number, thickness: number): THREE.ExtrudeGeometry {
  const pts: [number, number][] = [];
  const rIn = rOut * 0.24;
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2;
    pts.push([Math.cos(a) * rIn, Math.sin(a) * rIn]);
    pts.push([Math.cos(a + 0.55) * rOut, Math.sin(a + 0.55) * rOut]);
    pts.push([Math.cos(a + 0.85) * rOut, Math.sin(a + 0.85) * rOut]);
  }
  const geo = new THREE.ExtrudeGeometry(poly(pts), { depth: thickness, bevelEnabled: false });
  geo.translate(0, 0, -thickness / 2);
  geo.rotateY(Math.PI / 2);
  return geo;
}

/**
 * A fender arch band: the outer boundary traced forward, then the inner
 * boundary traced back, which closes into a C. Unlike the old trapezoid slab
 * this genuinely arches OVER the tire, so the tread stops poking through the
 * flank and the outer lip casts a shadow line onto the body.
 */
function archBand(halfLen: number, footY: number, crownY: number, lip: number, width: number): THREE.ExtrudeGeometry {
  const o = (t: number) => halfLen * t;
  const rise = crownY - footY;
  const outer: [number, number][] = [
    [-o(1), footY],
    [-o(0.92), footY + rise * 0.46],
    [-o(0.65), footY + rise * 0.84],
    [-o(0.23), crownY],
    [o(0.23), crownY],
    [o(0.65), footY + rise * 0.84],
    [o(0.92), footY + rise * 0.46],
    [o(1), footY],
  ];
  // The inner boundary never drops below the foot line, so the band's legs
  // taper to a point on the sill instead of hanging below it.
  const inner: [number, number][] = outer
    .map(([z, y]) => [z * 0.85, Math.max(footY, y - lip)] as [number, number])
    .reverse();
  return sideExtrude([...outer, ...inner], width);
}

/** Clone a shared piece into place so one profile can serve four corners. */
function at(geo: THREE.BufferGeometry, x: number, z: number): THREE.BufferGeometry {
  return geo.clone().translate(x, 0, z);
}

/**
 * Tail lamp brightness. Riders that never pass `brake` keep exactly the
 * ambient running level they have always had, so background traffic is
 * untouched by the drive model.
 */
function tailLevel(brake: boolean | undefined, d: number): number {
  return (brake === undefined ? 0.9 : brake ? 1 : 0.42) * d;
}

/* ---------------------------------------------------------------- *
 *  CyberTruck
 * ---------------------------------------------------------------- */

const TRUCK_WHEELS = [
  { x: -0.55, z: 1.16 },
  { x: 0.55, z: 1.16 },
  { x: -0.55, z: -1.14 },
  { x: 0.55, z: -1.14 },
];
const TRUCK_WHEEL_R = 0.32;

/**
 * Width shaping for the truck's lower body. The nose draws in hard, the tail
 * draws in gently, and everything above the shoulder line pulls in so the
 * roof is narrower than the sills. Without this the body is a prism whose
 * cross-section is identical at the bumper, the roof and the tailgate, which
 * is exactly what makes an extruded side profile read as a painted board.
 */
const truckTaper = (z: number, y: number) =>
  (z > 0.6 ? 1 - (z - 0.6) * 0.16 : z < -1.1 ? 1 - (-1.1 - z) * 0.13 : 1) * (y > 0.66 ? 1 - (y - 0.66) * 0.42 : 1);

/** Milder tumblehome for the greenhouse, which is already a narrow volume. */
const cabinTaper = (_z: number, y: number) => 1 - Math.max(0, y - 0.86) * 0.3;

interface TruckGeos {
  body: THREE.BufferGeometry;
  cabin: THREE.BufferGeometry;
  dlo: THREE.BufferGeometry;
  screen: THREE.BufferGeometry;
  trim: THREE.BufferGeometry;
  tire: THREE.BufferGeometry;
  hub: THREE.BufferGeometry;
  disc: THREE.BufferGeometry;
}
let _truck: TruckGeos | null = null;
function truckGeos(): TruckGeos {
  if (_truck) return _truck;
  // Side profile: a long low wedge, but now with real arches cut into the
  // bottom edge and a step between the cab shoulder and the bed rail. The
  // rocker sits at y 0.30 so there is daylight and suspension travel under
  // the sills instead of a slab resting on its own tires.
  const body = shapeWidth(
    sideExtrude(
      [
        [1.68, 0.3],
        [1.74, 0.52], // nose face, tall enough to carry a light bar
        [1.44, 0.62], // hood break
        [0.54, 0.86], // cowl, base of the windshield
        [-0.56, 0.94], // cab shoulder
        [-0.64, 0.84], // step down to the bed rail
        [-1.58, 0.8],
        [-1.66, 0.52], // tailgate
        [-1.62, 0.3],
        // rear arch, centered on the rear axle
        [-1.56, 0.3],
        [-1.52, 0.52],
        [-1.4, 0.68],
        [-1.24, 0.76],
        [-1.04, 0.76],
        [-0.88, 0.68],
        [-0.76, 0.52],
        [-0.72, 0.3],
        // front arch, centered on the front axle
        [0.7, 0.3],
        [0.78, 0.52],
        [0.9, 0.68],
        [1.06, 0.76],
        [1.26, 0.76],
        [1.42, 0.68],
        [1.54, 0.52],
        [1.62, 0.3],
      ],
      1.16,
      0.02
    ),
    truckTaper
  );
  // The greenhouse is its own volume sitting on the wedge, narrower than the
  // body so the shoulder steps in and the roof rails read from any angle.
  const cabin = shapeWidth(
    sideExtrude(
      [
        [0.56, 0.8],
        [-0.06, 1.2],
        [-0.5, 1.18],
        [-0.6, 0.86],
      ],
      0.96
    ),
    cabinTaper
  );
  // Daylight opening: the same shape inset all round and run slightly WIDER
  // than the shell, so the glass sits proud inside a steel frame with real
  // A and C pillars rather than being a paper chip laid on the roof.
  const dlo = shapeWidth(
    sideExtrude(
      [
        [0.44, 0.88],
        [-0.06, 1.14],
        [-0.46, 1.12],
        [-0.52, 0.92],
      ],
      1.0
    ),
    cabinTaper
  );
  const screen = new THREE.BoxGeometry(0.86, 0.014, 0.7);
  // Every dark detail on the truck is one mesh: four fender bands, the rocker
  // blade, a beltline crease, two door shutlines, the front splitter and the
  // recessed tail lamp housing.
  const band = archBand(0.52, 0.3, 0.86, 0.075, 0.28);
  const trim = mergeParts([
    ...TRUCK_WHEELS.map((w) => at(band, Math.sign(w.x) * 0.59, w.z)),
    // rocker blade, wider than the body so it catches its own highlight
    shapeWidth(
      sideExtrude(
        [
          [-0.7, 0.28],
          [0.68, 0.28],
          [0.68, 0.4],
          [-0.7, 0.38],
        ],
        1.26
      ),
      truckTaper
    ),
    // beltline crease running the length of the flank
    shapeWidth(
      sideExtrude(
        [
          [-0.7, 0.66],
          [0.68, 0.665],
          [0.68, 0.71],
          [-0.7, 0.705],
        ],
        1.28
      ),
      truckTaper
    ),
    // two door shutlines break the long quad into readable panels
    ...[0.3, -0.28].map((z) =>
      shapeWidth(
        sideExtrude(
          [
            [z - 0.008, 0.32],
            [z + 0.008, 0.32],
            [z + 0.008, 0.85],
            [z - 0.008, 0.85],
          ],
          1.28
        ),
        truckTaper
      )
    ),
    // front splitter, the lip that stops the nose floating
    sideExtrude(
      [
        [1.58, 0.2],
        [1.8, 0.24],
        [1.8, 0.32],
        [1.6, 0.34],
      ],
      1.06
    ),
    // tail lamp housing: a dark bezel the strip sits inside
    sideExtrude(
      [
        [-1.58, 0.54],
        [-1.7, 0.56],
        [-1.7, 0.72],
        [-1.58, 0.72],
      ],
      1.06
    ),
  ]);
  band.dispose();
  _truck = {
    body,
    cabin,
    dlo,
    screen,
    trim,
    tire: tireGeo(0.32, 0.19),
    hub: turbineGeo(0.24, 0.055),
    disc: tireGeo(0.225, 0.035, 20),
  };
  return _truck;
}

export function CyberTruck({ dim, speed, steer, brake }: VehicleProps) {
  const d = dim ?? 1;
  const g = useMemo(truckGeos, []);
  const spins = useRef<(THREE.Group | null)[]>([]);
  const knuckles = useRef<(THREE.Group | null)[]>([]);
  const lamp = useRef<THREE.MeshBasicMaterial>(null);
  const roll = useRef(0);
  const angle = useRef(0);

  useFrame((_, delta) => {
    roll.current += ((speed ?? 0) / TRUCK_WHEEL_R) * delta;
    for (const s of spins.current) if (s) s.rotation.x = roll.current;
    // A steering rack has mass. Easing the visual angle is what stops a
    // keyboard's instant full-lock input from snapping the wheels sideways.
    angle.current += ((steer ?? 0) - angle.current) * Math.min(1, delta * STEER_EASE);
    for (const k of knuckles.current) if (k) k.rotation.y = angle.current;
    const m = lamp.current;
    if (m) m.opacity += (tailLevel(brake, d) - m.opacity) * Math.min(1, delta * LAMP_EASE);
  });

  return (
    <group>
      <mesh geometry={g.body}>
        <meshPhysicalMaterial {...STEEL} flatShading />
      </mesh>
      <mesh geometry={g.cabin}>
        <meshPhysicalMaterial {...STEEL} flatShading />
      </mesh>
      <mesh geometry={g.dlo}>
        <meshPhysicalMaterial {...GLASS} flatShading />
      </mesh>
      {/* windshield laid on the cabin's front slope, proud of the steel */}
      <mesh geometry={g.screen} position={[0, 1.012, 0.256]} rotation={[0.573, 0, 0]}>
        <meshPhysicalMaterial {...GLASS} />
      </mesh>
      {/* every dark detail in one draw: arches, rocker, crease, shutlines,
          splitter and the tail lamp bezel */}
      <mesh geometry={g.trim}>
        <meshStandardMaterial {...DARK_TRIM} flatShading />
      </mesh>
      {/* full-width light bars: cool white nose, amber-red tail */}
      <mesh position={[0, 0.46, 1.75]}>
        <boxGeometry args={[0.9, 0.05, 0.03]} />
        <meshBasicMaterial color={ICE_BRIGHT} transparent opacity={d} />
      </mesh>
      <mesh position={[0, 0.635, -1.712]}>
        <boxGeometry args={[0.94, 0.07, 0.03]} />
        <meshBasicMaterial ref={lamp} color={TAIL} transparent opacity={tailLevel(brake, d)} />
      </mesh>
      {/* solar laminate: hood panel and bed tonneau, tilted to the facets */}
      <mesh position={[0, 0.748, 0.99]} rotation={[0.261, 0, 0]}>
        <boxGeometry args={[0.9, 0.012, 0.94]} />
        <meshPhysicalMaterial {...SOLAR} />
      </mesh>
      <mesh position={[0, 0.838, -1.11]} rotation={[-0.043, 0, 0]}>
        <boxGeometry args={[0.92, 0.012, 0.94]} />
        <meshPhysicalMaterial {...SOLAR} />
      </mesh>
      {/* mirror-replacement camera pods at the A-pillar */}
      {([-1, 1] as const).map((side) => (
        <mesh key={`pod-${side}`} position={[side * 0.52, 0.98, 0.46]} rotation={[0, 0, side * -0.3]}>
          <capsuleGeometry args={[0.018, 0.06, 3, 8]} />
          <meshStandardMaterial {...DARK_TRIM} />
        </mesh>
      ))}
      {/* wheels: outer group carries position and camber, the steer knuckle
          sits inside it on the front axle only, the spin group inside that */}
      {TRUCK_WHEELS.map((w, i) => (
        <group key={i} position={[w.x, TRUCK_WHEEL_R, w.z]} rotation={[0, 0, w.x > 0 ? 0.05 : -0.05]}>
          <group
            ref={
              w.z > 0
                ? (el) => {
                    knuckles.current[i] = el;
                  }
                : undefined
            }
          >
            <group
              ref={(el) => {
                spins.current[i] = el;
              }}
            >
              <mesh geometry={g.tire}>
                <meshStandardMaterial {...TIRE} />
              </mesh>
              <mesh geometry={g.disc} position={[Math.sign(w.x) * 0.01, 0, 0]}>
                <meshStandardMaterial {...DISC} />
              </mesh>
              <mesh geometry={g.hub} position={[Math.sign(w.x) * 0.07, 0, 0]}>
                <meshStandardMaterial {...HUB} flatShading />
              </mesh>
            </group>
          </group>
        </group>
      ))}
    </group>
  );
}

/* ---------------------------------------------------------------- *
 *  CyberSemi
 * ---------------------------------------------------------------- */

interface SemiGeos {
  cab: THREE.BufferGeometry;
  skirt: THREE.BufferGeometry;
  fairing: THREE.BufferGeometry;
  tire: THREE.BufferGeometry;
  hub: THREE.BufferGeometry;
}
let _semi: SemiGeos | null = null;
function semiGeos(): SemiGeos {
  if (_semi) return _semi;
  // Cab: vertical stance, one steep glass slope from bumper to roof. The
  // body stops above the wheels, the arch-cut skirts carry the lower line.
  const cab = sideExtrude(
    [
      [4.58, 0.5],
      [4.74, 0.66],
      [3.92, 1.88],
      [2.78, 1.94],
      [2.74, 0.5],
    ],
    1.26,
    0.02
  );
  // Full-height side skirt with two angular wheel arches cut out.
  const skirt = sideExtrude(
    [
      [2.76, 0.08],
      [2.84, 0.08],
      [2.98, 0.64],
      [3.42, 0.64],
      [3.56, 0.08],
      [3.64, 0.08],
      [3.78, 0.64],
      [4.22, 0.64],
      [4.36, 0.08],
      [4.6, 0.08],
      [4.66, 0.86],
      [2.76, 0.86],
    ],
    0.04
  );
  // Roof fairing sweeping from cab roof up into the trailer top line.
  const fairing = sideExtrude(
    [
      [2.8, 1.7],
      [3.35, 1.7],
      [3.35, 1.9],
      [2.8, 2.08],
    ],
    1.24
  );
  _semi = {
    cab,
    skirt,
    fairing,
    tire: tireGeo(0.3, 0.18),
    hub: turbineGeo(0.21, 0.055),
  };
  return _semi;
}

const SEMI_AXLES = [4.0, 3.2, -3.0, -3.7, -4.4]; // 2 front, 3 rear
const SEMI_WHEEL_R = 0.3;
const SEMI_SEAMS = [1.8, 0.8, -0.2, -1.2, -2.2, -3.2, -4.2];
const SEMI_DOTS = 18; // 9 amber running dots per trailer side

export function CyberSemi({ dim, speed, steer, brake }: VehicleProps) {
  const d = dim ?? 1;
  const g = useMemo(semiGeos, []);
  const tires = useRef<THREE.InstancedMesh>(null);
  const hubs = useRef<THREE.InstancedMesh>(null);
  const seams = useRef<THREE.InstancedMesh>(null);
  const dots = useRef<THREE.InstancedMesh>(null);
  const lamp = useRef<THREE.MeshBasicMaterial>(null);
  const roll = useRef(0);
  const angle = useRef(0);
  // YXZ order so a steered wheel yaws about its own vertical axis rather than
  // about an axis that the roll has already tipped over.
  const tmp = useMemo(() => {
    const o = new THREE.Object3D();
    o.rotation.order = "YXZ";
    return o;
  }, []);

  // Static instancing: trailer panel seams and running-light dots are laid
  // down once, before first paint.
  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    const s = seams.current;
    if (s) {
      SEMI_SEAMS.forEach((z, i) => {
        o.position.set(0, 1.35, z);
        o.rotation.set(0, 0, 0);
        o.updateMatrix();
        s.setMatrixAt(i, o.matrix);
      });
      s.instanceMatrix.needsUpdate = true;
    }
    const dm = dots.current;
    if (dm) {
      for (let i = 0; i < SEMI_DOTS; i++) {
        const side = i < SEMI_DOTS / 2 ? -1 : 1;
        const k = i % (SEMI_DOTS / 2);
        o.position.set(side * 0.66, 0.585, 2.3 - k * 0.85);
        o.updateMatrix();
        dm.setMatrixAt(i, o.matrix);
      }
      dm.instanceMatrix.needsUpdate = true;
    }
  }, []);

  // Ten wheels ride two instanced meshes; the spin recomposes their matrices.
  useFrame((_, delta) => {
    roll.current += ((speed ?? 0) / SEMI_WHEEL_R) * delta;
    // A tractor's lock is short: the visual angle is scaled down so a truck
    // never looks like it is steering as hard as a hatchback.
    angle.current += ((steer ?? 0) * 0.62 - angle.current) * Math.min(1, delta * STEER_EASE);
    const m = lamp.current;
    if (m) m.opacity += (tailLevel(brake, d) - m.opacity) * Math.min(1, delta * LAMP_EASE);
    const tm = tires.current;
    const hm = hubs.current;
    if (!tm || !hm) return;
    let i = 0;
    for (const z of SEMI_AXLES) {
      const track = z > 0 ? 0.52 : 0.55; // front wheels tuck inside the skirts
      for (const sx of [-1, 1]) {
        tmp.position.set(sx * track, SEMI_WHEEL_R, z);
        tmp.rotation.set(roll.current, z > 3.5 ? angle.current : 0, 0);
        tmp.updateMatrix();
        tm.setMatrixAt(i, tmp.matrix);
        tmp.position.x = sx * (track + 0.1); // hub face sits outboard
        tmp.updateMatrix();
        hm.setMatrixAt(i, tmp.matrix);
        i++;
      }
    }
    tm.instanceMatrix.needsUpdate = true;
    hm.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <mesh geometry={g.cab}>
        <meshPhysicalMaterial {...STEEL} flatShading />
      </mesh>
      {/* center driving position glass, one narrow panel on the slope */}
      <mesh position={[0, 1.26, 4.35]} rotation={[-0.578, 0, 0]}>
        <boxGeometry args={[0.5, 1.42, 0.05]} />
        <meshPhysicalMaterial {...GLASS} />
      </mesh>
      {/* front bumper mass grounds the nose under the raised cab floor */}
      <mesh position={[0, 0.34, 4.52]}>
        <boxGeometry args={[1.14, 0.32, 0.3]} />
        <meshStandardMaterial {...DARK_TRIM} flatShading />
      </mesh>
      {/* nose light bar */}
      <mesh position={[0, 0.47, 4.68]}>
        <boxGeometry args={[1.1, 0.05, 0.03]} />
        <meshBasicMaterial color={ICE_BRIGHT} transparent opacity={0.95 * d} />
      </mesh>
      {/* arch-cut full-height side skirts */}
      <mesh geometry={g.skirt} position={[-0.64, 0, 0]}>
        <meshStandardMaterial {...DARK_TRIM} flatShading />
      </mesh>
      <mesh geometry={g.skirt} position={[0.64, 0, 0]}>
        <meshStandardMaterial {...DARK_TRIM} flatShading />
      </mesh>
      <mesh geometry={g.fairing}>
        <meshPhysicalMaterial {...STEEL} flatShading />
      </mesh>
      {/* trailer: one clean volume, slightly lighter than the cab */}
      <mesh position={[0, 1.35, -1.1]}>
        <boxGeometry args={[1.3, 1.46, 7.4]} />
        <meshPhysicalMaterial {...TRAILER_STEEL} />
      </mesh>
      {/* trailer roof is one long solar array: the 2040 fleet economics */}
      <mesh position={[0, 2.095, -1.1]}>
        <boxGeometry args={[1.18, 0.016, 6.9]} />
        <meshPhysicalMaterial {...SOLAR} />
      </mesh>
      {/* subtle panel seams: thin darker inset boxes, not textures */}
      <instancedMesh ref={seams} args={[undefined, undefined, SEMI_SEAMS.length]} frustumCulled={false}>
        <boxGeometry args={[1.312, 1.38, 0.018]} />
        <meshStandardMaterial color="#85868c" metalness={0.6} roughness={0.5} />
      </instancedMesh>
      {/* concept livery: the owner's wordmark down both trailer sides, set
          like a real fleet brand: dark lettering on the light trailer skin */}
      {([-1, 1] as const).map((side) => (
        <Text
          key={side}
          position={[side * 0.675, 1.36, -1.1]}
          rotation={[0, side * (Math.PI / 2), 0]}
          fontSize={0.47}
          letterSpacing={0.09}
          color="#191b20"
          outlineWidth={0.012}
          outlineColor="#0d0e11"
          anchorX="center"
          anchorY="middle"
        >
          VENKATAPAGADALA
        </Text>
      ))}
      {/* amber running dots along the trailer bottom edge */}
      <instancedMesh ref={dots} args={[undefined, undefined, SEMI_DOTS]} frustumCulled={false}>
        <sphereGeometry args={[0.022, 6, 6]} />
        <meshBasicMaterial color={AMBER} transparent opacity={0.9 * d} depthWrite={false} />
      </instancedMesh>
      {/* trailer side skirts between the axle groups */}
      <mesh position={[-0.655, 0.42, 0.2]}>
        <boxGeometry args={[0.035, 0.5, 4.6]} />
        <meshStandardMaterial {...DARK_TRIM} />
      </mesh>
      <mesh position={[0.655, 0.42, 0.2]}>
        <boxGeometry args={[0.035, 0.5, 4.6]} />
        <meshStandardMaterial {...DARK_TRIM} />
      </mesh>
      {/* chassis spine ties cab to trailer and fills between the wheels */}
      <mesh position={[0, 0.485, -1.0]}>
        <boxGeometry args={[0.9, 0.27, 7.0]} />
        <meshStandardMaterial {...DARK_TRIM} />
      </mesh>
      {/* rear amber-red strip */}
      <mesh position={[0, 0.75, -4.82]}>
        <boxGeometry args={[1.2, 0.05, 0.03]} />
        <meshBasicMaterial ref={lamp} color={TAIL} transparent opacity={tailLevel(brake, d)} />
      </mesh>
      {/* ten turbine wheels on two instanced meshes */}
      <instancedMesh ref={tires} args={[undefined, undefined, SEMI_AXLES.length * 2]} geometry={g.tire} frustumCulled={false}>
        <meshStandardMaterial {...TIRE} />
      </instancedMesh>
      <instancedMesh ref={hubs} args={[undefined, undefined, SEMI_AXLES.length * 2]} geometry={g.hub} frustumCulled={false}>
        <meshStandardMaterial {...HUB} flatShading />
      </instancedMesh>
    </group>
  );
}

/* ---------------------------------------------------------------- *
 *  Sedan
 * ---------------------------------------------------------------- */

const SEDAN_WHEELS = [
  { x: -0.36, z: 0.72 },
  { x: 0.36, z: 0.72 },
  { x: -0.36, z: -0.72 },
  { x: 0.36, z: -0.72 },
];
const SEDAN_WHEEL_R = 0.19;

/**
 * Half-width of the sedan's body ellipsoid at a point, normalized to 1 at the
 * widest section. Trim blades are built straight and then shrink-wrapped
 * through this, which is the only way a flat extrusion can sit on a curved
 * body without either floating off the paint or sinking into it.
 */
const sedanHug = (z: number, y: number) =>
  Math.sqrt(Math.max(0.02, 1 - ((y - 0.36) / 0.26) ** 2 - (z / 1.15) ** 2));

interface SedanGeos {
  frontArc: THREE.BufferGeometry;
  rearArc: THREE.BufferGeometry;
  trim: THREE.BufferGeometry;
  tire: THREE.BufferGeometry;
  hub: THREE.BufferGeometry;
  disc: THREE.BufferGeometry;
}
let _sedan: SedanGeos | null = null;
function sedanGeos(): SedanGeos {
  if (_sedan) return _sedan;
  // Light strip: a torus arc scaled onto the body's horizontal cross-section
  // ellipse at strip height, so it hugs the paint with no straight edges.
  const arc = (rear: boolean, tube: number, sweep: number, k: number) => {
    const geo = new THREE.TorusGeometry(1, tube, 6, 40, sweep);
    geo.rotateZ(-sweep / 2); // center the arc on +X
    geo.rotateX(-Math.PI / 2); // lay it into the ground plane
    geo.rotateY(rear ? Math.PI / 2 : -Math.PI / 2); // face +Z (nose) or -Z (tail)
    geo.scale(0.468 * k, 1, 1.132 * k); // body ellipse at y = 0.42, nudged proud
    geo.translate(0, 0.42, 0);
    return geo;
  };
  const band = archBand(0.34, 0.19, 0.56, 0.06, 0.15);
  // One dark mesh: four arch bands, two hugged sills, a beltline crease and
  // the recessed housings the two light arcs sit inside.
  const trim = mergeParts([
    ...SEDAN_WHEELS.map((w) => at(band, Math.sign(w.x) * 0.435, w.z)),
    ...[
      // rocker sill blade
      shapeWidth(
        sideExtrude(
          [
            [-0.8, 0.16],
            [0.8, 0.16],
            [0.8, 0.235],
            [-0.8, 0.225],
          ],
          0.98
        ),
        (z, y) => sedanHug(z, y) * 1.05
      ),
      // beltline crease along the shoulder
      shapeWidth(
        sideExtrude(
          [
            [-0.95, 0.42],
            [0.95, 0.425],
            [0.95, 0.455],
            [-0.95, 0.45],
          ],
          0.98
        ),
        (z, y) => sedanHug(z, y) * 1.05
      ),
    ],
    // lamp housings: a thicker, wider arc set just inside the light ring, so
    // the strip reads as sitting in a bezel instead of floating on the paint
    arc(false, 0.028, 0.94, 0.978),
    arc(true, 0.028, 0.94, 0.978),
  ]);
  band.dispose();
  _sedan = {
    frontArc: arc(false, 0.013, 0.8, 1),
    rearArc: arc(true, 0.013, 0.8, 1),
    trim,
    tire: tireGeo(0.19, 0.12, 24),
    hub: tireGeo(0.135, 0.125, 24), // smooth covered aero disc
    disc: tireGeo(0.152, 0.03, 20),
  };
  return _sedan;
}

export function Sedan({ dim, speed, steer, brake }: VehicleProps) {
  const d = dim ?? 1;
  const g = useMemo(sedanGeos, []);
  const spins = useRef<(THREE.Group | null)[]>([]);
  const knuckles = useRef<(THREE.Group | null)[]>([]);
  const lamp = useRef<THREE.MeshBasicMaterial>(null);
  const roll = useRef(0);
  const angle = useRef(0);

  useFrame((_, delta) => {
    roll.current += ((speed ?? 0) / SEDAN_WHEEL_R) * delta;
    for (const s of spins.current) if (s) s.rotation.x = roll.current;
    angle.current += ((steer ?? 0) - angle.current) * Math.min(1, delta * STEER_EASE);
    for (const k of knuckles.current) if (k) k.rotation.y = angle.current;
    const m = lamp.current;
    if (m) m.opacity += (tailLevel(brake, d) - m.opacity) * Math.min(1, delta * LAMP_EASE);
  });

  return (
    <group>
      {/* body: one low smooth section, satin black under deep clearcoat */}
      <mesh position={[0, 0.36, 0]} scale={[0.475, 0.26, 1.15]}>
        <sphereGeometry args={[1, 28, 20]} />
        <meshPhysicalMaterial color="#0d0e11" metalness={0.7} roughness={0.32} clearcoat={1} clearcoatRoughness={0.12} />
      </mesh>
      {/* glass canopy emerging from the shoulder line */}
      <mesh position={[0, 0.48, -0.08]} scale={[0.4, 0.235, 0.68]}>
        <sphereGeometry args={[1, 24, 16]} />
        <meshPhysicalMaterial {...GLASS} />
      </mesh>
      {/* dark trim in one draw: arch bands, sills, beltline, lamp housings.
          Grounding each wheel into the body instead of leaving it floating
          beside the ellipsoid is still the single biggest "real car" cue */}
      <mesh geometry={g.trim}>
        <meshStandardMaterial {...DARK_TRIM} />
      </mesh>
      {/* thin curved light strips, front and rear, sitting in those housings */}
      <mesh geometry={g.frontArc}>
        <meshBasicMaterial color={ICE_BRIGHT} transparent opacity={0.95 * d} />
      </mesh>
      <mesh geometry={g.rearArc}>
        <meshBasicMaterial ref={lamp} color={TAIL} transparent opacity={tailLevel(brake, d)} />
      </mesh>
      {/* solar hood laminate riding the front body curve */}
      <mesh position={[0, 0.598, 0.58]} rotation={[0.13, 0, 0]}>
        <boxGeometry args={[0.44, 0.01, 0.36]} />
        <meshPhysicalMaterial {...SOLAR} />
      </mesh>
      {/* roof sensor puck: the robotaxi cue, with a faint ice ring */}
      <group position={[0, 0.705, -0.06]}>
        <mesh>
          <cylinderGeometry args={[0.085, 0.1, 0.04, 18]} />
          <meshStandardMaterial {...DARK_TRIM} />
        </mesh>
        <mesh position={[0, 0.032, 0]}>
          <cylinderGeometry args={[0.05, 0.06, 0.035, 14]} />
          <meshPhysicalMaterial {...GLASS} />
        </mesh>
        <mesh position={[0, 0.014, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.072, 0.006, 6, 24]} />
          <meshBasicMaterial color={ICE_BRIGHT} transparent opacity={0.55 * d} />
        </mesh>
      </group>
      {/* mirror-replacement camera pods at the A-pillar line */}
      {([-1, 1] as const).map((side) => (
        <mesh key={`pod-${side}`} position={[side * 0.48, 0.5, 0.4]} rotation={[0, 0, side * -0.35]}>
          <capsuleGeometry args={[0.016, 0.05, 3, 8]} />
          <meshStandardMaterial {...DARK_TRIM} />
        </mesh>
      ))}
      {SEDAN_WHEELS.map((w, i) => (
        <group key={i} position={[w.x, SEDAN_WHEEL_R, w.z]}>
          <group
            ref={
              w.z > 0
                ? (el) => {
                    knuckles.current[i] = el;
                  }
                : undefined
            }
          >
            <group
              ref={(el) => {
                spins.current[i] = el;
              }}
            >
              <mesh geometry={g.tire}>
                <meshStandardMaterial {...TIRE} />
              </mesh>
              <mesh geometry={g.disc} position={[Math.sign(w.x) * -0.01, 0, 0]}>
                <meshStandardMaterial {...DISC} />
              </mesh>
              <mesh geometry={g.hub} position={[Math.sign(w.x) * 0.01, 0, 0]}>
                <meshStandardMaterial {...HUB} />
              </mesh>
            </group>
          </group>
        </group>
      ))}
    </group>
  );
}

/* ---------------------------------------------------------------- *
 *  AirCar: a VTOL pod that can put down on a moving trailer roof
 * ---------------------------------------------------------------- */

export interface AirCarProps {
  dim?: number;
  /** 0..1 rotor speed, mutated per frame by the owner (0 while docked). */
  rotorRef?: { current: number };
}

export function AirCar({ dim, rotorRef }: AirCarProps) {
  const d = dim ?? 1;
  const rotors = useRef<(THREE.Mesh | null)[]>([]);
  const spin = useRef(0);
  useFrame((_, delta) => {
    spin.current += 22 * (rotorRef ? rotorRef.current : 1) * delta;
    for (const r of rotors.current) if (r) r.rotation.y = spin.current;
  });
  const arm = (sx: 1 | -1, sz: 1 | -1, i: number) => (
    <group key={i} position={[sx * 0.42, 0.1, sz * 0.44]}>
      <mesh position={[-sx * 0.14, 0, -sz * 0.12]} rotation={[0, Math.atan2(sx, sz), 0]}>
        <boxGeometry args={[0.05, 0.03, 0.32]} />
        <meshStandardMaterial {...DARK_TRIM} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.075, 0.09, 0.07, 10]} />
        <meshStandardMaterial {...DARK_TRIM} />
      </mesh>
      <mesh
        ref={(el) => {
          rotors.current[i] = el;
        }}
        position={[0, 0.055, 0]}
      >
        <cylinderGeometry args={[0.23, 0.23, 0.008, 16]} />
        <meshStandardMaterial color="#5a5d66" metalness={0.4} roughness={0.4} transparent opacity={0.5} />
      </mesh>
      <mesh position={[0, 0.06, 0]}>
        <sphereGeometry args={[0.02, 8, 6]} />
        <meshBasicMaterial color={AMBER} transparent opacity={0.85 * d} />
      </mesh>
    </group>
  );
  return (
    <group>
      {/* cabin: glossy black pod with a wrapped glass front */}
      <mesh position={[0, 0.16, 0]}>
        <capsuleGeometry args={[0.21, 0.5, 4, 12]} />
        <meshPhysicalMaterial color="#101114" metalness={0.7} roughness={0.3} clearcoat={1} clearcoatRoughness={0.12} />
      </mesh>
      <mesh position={[0, 0.24, 0.26]} rotation={[0.45, 0, 0]} scale={[1, 0.7, 1]}>
        <sphereGeometry args={[0.17, 14, 10]} />
        <meshPhysicalMaterial {...GLASS} />
      </mesh>
      {/* solar spine on the roof */}
      <mesh position={[0, 0.345, -0.05]}>
        <boxGeometry args={[0.26, 0.008, 0.42]} />
        <meshPhysicalMaterial {...SOLAR} />
      </mesh>
      {/* nose and tail strips */}
      <mesh position={[0, 0.15, 0.49]}>
        <boxGeometry args={[0.24, 0.03, 0.02]} />
        <meshBasicMaterial color={ICE_BRIGHT} transparent opacity={0.95 * d} />
      </mesh>
      <mesh position={[0, 0.16, -0.48]}>
        <boxGeometry args={[0.22, 0.025, 0.02]} />
        <meshBasicMaterial color={TAIL} transparent opacity={0.9 * d} />
      </mesh>
      {/* landing skids */}
      {([-1, 1] as const).map((sx) => (
        <mesh key={sx} position={[sx * 0.16, 0.015, 0]}>
          <boxGeometry args={[0.035, 0.03, 0.6]} />
          <meshStandardMaterial {...DARK_TRIM} />
        </mesh>
      ))}
      {arm(-1, -1, 0)}
      {arm(1, -1, 1)}
      {arm(-1, 1, 2)}
      {arm(1, 1, 3)}
    </group>
  );
}

/* ---------------------------------------------------------------- *
 *  MonoPod: the narrow single-track commuter, wheels inline
 * ---------------------------------------------------------------- */

const POD_WHEEL_R = 0.2;

interface PodGeos {
  body: THREE.CapsuleGeometry;
  tire: THREE.BufferGeometry;
}
let _pod: PodGeos | null = null;
function podGeos(): PodGeos {
  if (_pod) return _pod;
  const body = new THREE.CapsuleGeometry(0.17, 0.62, 4, 12);
  body.rotateX(Math.PI / 2); // long axis onto Z
  // Cached, because building this inside the render body allocated a fresh
  // cylinder on every re-render and never disposed the last one.
  _pod = { body, tire: tireGeo(POD_WHEEL_R, 0.09, 18) };
  return _pod;
}

export function MonoPod({ dim, speed, steer, brake }: VehicleProps) {
  const d = dim ?? 1;
  const g = useMemo(podGeos, []);
  const spins = useRef<(THREE.Group | null)[]>([]);
  const knuckle = useRef<THREE.Group>(null);
  const lamp = useRef<THREE.MeshBasicMaterial>(null);
  const roll = useRef(0);
  const angle = useRef(0);
  useFrame((_, delta) => {
    roll.current += ((speed ?? 0) / POD_WHEEL_R) * delta;
    for (const w of spins.current) if (w) w.rotation.x = roll.current;
    // A single-track machine leans as much as it steers, but the lean lives
    // in the drive model; here only the front wheel answers the bars.
    angle.current += ((steer ?? 0) - angle.current) * Math.min(1, delta * STEER_EASE);
    if (knuckle.current) knuckle.current.rotation.y = angle.current;
    const m = lamp.current;
    if (m) m.opacity += (tailLevel(brake, d) - m.opacity) * Math.min(1, delta * LAMP_EASE);
  });
  return (
    <group>
      <mesh geometry={g.body} position={[0, 0.46, 0]}>
        <meshPhysicalMaterial color="#15161a" metalness={0.7} roughness={0.28} clearcoat={1} clearcoatRoughness={0.12} />
      </mesh>
      {/* canopy bubble */}
      <mesh position={[0, 0.6, 0.1]} scale={[0.75, 0.65, 1]}>
        <sphereGeometry args={[0.16, 14, 10]} />
        <meshPhysicalMaterial {...GLASS} />
      </mesh>
      {/* solar strip down the spine */}
      <mesh position={[0, 0.635, -0.22]}>
        <boxGeometry args={[0.12, 0.008, 0.3]} />
        <meshPhysicalMaterial {...SOLAR} />
      </mesh>
      {/* inline wheels, half swallowed by the body. The front one gets its own
          steer group: the roll ref used to sit on the positioned group, where
          a yaw would have composed under the tipped-over roll axis. */}
      {[0.42, -0.42].map((z, i) => (
        <group key={z} position={[0, POD_WHEEL_R, z]}>
          <group ref={z > 0 ? knuckle : undefined}>
            <group
              ref={(el) => {
                spins.current[i] = el;
              }}
            >
              <mesh geometry={g.tire}>
                <meshStandardMaterial {...TIRE} />
              </mesh>
            </group>
          </group>
        </group>
      ))}
      {/* light dots */}
      <mesh position={[0, 0.5, 0.52]}>
        <sphereGeometry args={[0.022, 8, 6]} />
        <meshBasicMaterial color={ICE_BRIGHT} transparent opacity={0.95 * d} />
      </mesh>
      <mesh position={[0, 0.5, -0.52]}>
        <sphereGeometry args={[0.02, 8, 6]} />
        <meshBasicMaterial ref={lamp} color={TAIL} transparent opacity={tailLevel(brake, d)} />
      </mesh>
    </group>
  );
}

/* ---------------------------------------------------------------- *
 *  CargoBoat: electric canal barge, container stacks, silent wake
 * ---------------------------------------------------------------- */

interface BoatGeos {
  hull: THREE.BufferGeometry;
}
let _boat: BoatGeos | null = null;
function boatGeos(): BoatGeos {
  if (_boat) return _boat;
  // Low freeboard barge profile: raked bow, long flat deck, squared stern.
  const hull = sideExtrude(
    [
      [1.95, 0.05],
      [2.25, 0.34],
      [1.8, 0.52],
      [-1.95, 0.52],
      [-2.15, 0.3],
      [-2.05, 0.05],
    ],
    1.15,
    0.02
  );
  _boat = { hull };
  return _boat;
}

const CONTAINERS = [
  { x: -0.26, y: 0.7, z: 0.75, c: "#31527a" },
  { x: 0.26, y: 0.7, z: 0.75, c: "#6b4b2a" },
  { x: -0.26, y: 0.7, z: -0.15, c: "#4a4e56" },
  { x: 0.26, y: 0.7, z: -0.15, c: "#31527a" },
  { x: 0, y: 1.06, z: 0.3, c: "#5a5d66" },
];

export function CargoBoat({ dim, phase = 0 }: { dim?: number; phase?: number }) {
  const d = dim ?? 1;
  const g = useMemo(boatGeos, []);
  const root = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const r = root.current;
    if (!r) return;
    // gentle displacement bob and pitch; electric barges leave the water calm
    const t = clock.elapsedTime;
    r.position.y = 0.02 * Math.sin(t * 1.1 + phase);
    r.rotation.x = 0.008 * Math.sin(t * 0.9 + phase * 1.7);
    r.rotation.z = 0.01 * Math.sin(t * 0.7 + phase * 2.3);
  });
  return (
    <group ref={root}>
      <mesh geometry={g.hull}>
        <meshPhysicalMaterial color="#2a2d33" metalness={0.6} roughness={0.4} clearcoat={0.3} clearcoatRoughness={0.3} />
      </mesh>
      {/* solar deck between the container bays */}
      <mesh position={[0, 0.53, -1.35]}>
        <boxGeometry args={[0.95, 0.012, 0.9]} />
        <meshPhysicalMaterial {...SOLAR} />
      </mesh>
      {/* container stacks, fleet colors */}
      {CONTAINERS.map((c, i) => (
        <mesh key={i} position={[c.x, c.y, c.z]}>
          <boxGeometry args={[0.46, 0.34, 0.86]} />
          <meshStandardMaterial color={c.c} metalness={0.45} roughness={0.55} />
        </mesh>
      ))}
      {/* aft bridge: low block, wrapped glass, mast light */}
      <group position={[0, 0.72, -1.6]}>
        <mesh>
          <boxGeometry args={[0.7, 0.4, 0.5]} />
          <meshStandardMaterial {...DARK_TRIM} />
        </mesh>
        <mesh position={[0, 0.1, 0.26]}>
          <boxGeometry args={[0.6, 0.16, 0.02]} />
          <meshPhysicalMaterial {...GLASS} />
        </mesh>
        <mesh position={[0, 0.34, -0.1]}>
          <sphereGeometry args={[0.022, 8, 6]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.9 * d} />
        </mesh>
      </group>
      {/* nav lights: port red, starboard green, per maritime rule */}
      <mesh position={[-0.55, 0.5, 1.7]}>
        <sphereGeometry args={[0.02, 8, 6]} />
        <meshBasicMaterial color="#e2573e" transparent opacity={0.9 * d} />
      </mesh>
      <mesh position={[0.55, 0.5, 1.7]}>
        <sphereGeometry args={[0.02, 8, 6]} />
        <meshBasicMaterial color="#57e28a" transparent opacity={0.9 * d} />
      </mesh>
      {/* owner livery low on both hull sides */}
      {([-1, 1] as const).map((side) => (
        <Text
          key={side}
          position={[side * 0.585, 0.3, 0.2]}
          rotation={[0, side * (Math.PI / 2), 0]}
          fontSize={0.17}
          letterSpacing={0.12}
          color="#9fb4d0"
          fillOpacity={0.85}
          anchorX="center"
          anchorY="middle"
        >
          VENKATAPAGADALA
        </Text>
      ))}
    </group>
  );
}

/* ---------------------------------------------------------------- *
 *  GranTourer: the long low luxury EV, one unbroken curve
 * ---------------------------------------------------------------- */

const GT_WHEELS = [
  { x: -0.42, z: 0.92 },
  { x: 0.42, z: 0.92 },
  { x: -0.42, z: -0.92 },
  { x: 0.42, z: -0.92 },
];
const GT_WHEEL_R = 0.22;

/** Same shrink-wrap trick as the sedan, against the tourer's longer ellipsoid. */
const gtHug = (z: number, y: number) => Math.sqrt(Math.max(0.02, 1 - ((y - 0.4) / 0.27) ** 2 - (z / 1.5) ** 2));

interface GtGeos {
  trim: THREE.BufferGeometry;
  tire: THREE.BufferGeometry;
  rim: THREE.BufferGeometry;
  disc: THREE.BufferGeometry;
}
let _gt: GtGeos | null = null;
function gtGeos(): GtGeos {
  if (_gt) return _gt;
  const band = archBand(0.4, 0.22, 0.65, 0.07, 0.16);
  const trim = mergeParts([
    ...GT_WHEELS.map((w) => at(band, Math.sign(w.x) * 0.5, w.z)),
    // sill blade grounds the long body
    shapeWidth(
      sideExtrude(
        [
          [-0.95, 0.17],
          [0.95, 0.17],
          [0.95, 0.25],
          [-0.95, 0.24],
        ],
        1.02
      ),
      (z, y) => gtHug(z, y) * 1.05
    ),
    // beltline crease, the one line that stops the teardrop reading as a blob
    shapeWidth(
      sideExtrude(
        [
          [-1.25, 0.44],
          [1.25, 0.445],
          [1.25, 0.475],
          [-1.25, 0.47],
        ],
        1.02
      ),
      (z, y) => gtHug(z, y) * 1.05
    ),
  ]);
  band.dispose();
  _gt = {
    trim,
    tire: tireGeo(GT_WHEEL_R, 0.13, 24),
    rim: tireGeo(0.155, 0.135, 24),
    disc: tireGeo(0.175, 0.03, 20),
  };
  return _gt;
}

export function GranTourer({ dim, speed, steer, brake }: VehicleProps) {
  const d = dim ?? 1;
  const g = useMemo(gtGeos, []);
  const spins = useRef<(THREE.Group | null)[]>([]);
  const knuckles = useRef<(THREE.Group | null)[]>([]);
  const lamp = useRef<THREE.MeshBasicMaterial>(null);
  const roll = useRef(0);
  const angle = useRef(0);
  useFrame((_, delta) => {
    roll.current += ((speed ?? 0) / GT_WHEEL_R) * delta;
    for (const w of spins.current) if (w) w.rotation.x = roll.current;
    angle.current += ((steer ?? 0) - angle.current) * Math.min(1, delta * STEER_EASE);
    for (const k of knuckles.current) if (k) k.rotation.y = angle.current;
    const m = lamp.current;
    if (m) m.opacity += (tailLevel(brake, d) - m.opacity) * Math.min(1, delta * LAMP_EASE);
  });
  return (
    <group>
      {/* one long teardrop volume: the whole car is a single gesture */}
      <mesh position={[0, 0.4, 0]} scale={[0.52, 0.27, 1.5]}>
        <sphereGeometry args={[1, 30, 20]} />
        <meshPhysicalMaterial color="#171a20" metalness={0.75} roughness={0.24} clearcoat={1} clearcoatRoughness={0.08} />
      </mesh>
      {/* wraparound glasshouse riding the shoulder line */}
      <mesh position={[0, 0.55, -0.06]} scale={[0.44, 0.2, 0.86]}>
        <sphereGeometry args={[1, 26, 16]} />
        <meshPhysicalMaterial {...GLASS} />
      </mesh>
      {/* arch bands, sills and beltline in a single dark draw */}
      <mesh geometry={g.trim}>
        <meshStandardMaterial {...DARK_TRIM} />
      </mesh>
      {/* full-width light blades, front and rear */}
      <mesh position={[0, 0.42, 1.44]}>
        <boxGeometry args={[0.86, 0.028, 0.03]} />
        <meshBasicMaterial color={ICE_BRIGHT} transparent opacity={0.95 * d} />
      </mesh>
      <mesh position={[0, 0.44, -1.44]}>
        <boxGeometry args={[0.88, 0.038, 0.03]} />
        <meshBasicMaterial ref={lamp} color={TAIL} transparent opacity={tailLevel(brake, d)} />
      </mesh>
      {/* solar roof panel */}
      <mesh position={[0, 0.672, -0.06]}>
        <boxGeometry args={[0.4, 0.008, 0.78]} />
        <meshPhysicalMaterial {...SOLAR} />
      </mesh>
      {/* mirror-replacement camera pods on the shoulder */}
      {([-1, 1] as const).map((side) => (
        <mesh key={`pod-${side}`} position={[side * 0.47, 0.55, 0.62]} rotation={[0, 0, side * -0.35]}>
          <capsuleGeometry args={[0.016, 0.055, 3, 8]} />
          <meshStandardMaterial {...DARK_TRIM} />
        </mesh>
      ))}
      {GT_WHEELS.map((w, i) => (
        <group key={i} position={[w.x, GT_WHEEL_R, w.z]}>
          <group
            ref={
              w.z > 0
                ? (el) => {
                    knuckles.current[i] = el;
                  }
                : undefined
            }
          >
            <group
              ref={(el) => {
                spins.current[i] = el;
              }}
            >
              <mesh geometry={g.tire}>
                <meshStandardMaterial {...TIRE} />
              </mesh>
              <mesh geometry={g.disc} position={[Math.sign(w.x) * -0.01, 0, 0]}>
                <meshStandardMaterial {...DISC} />
              </mesh>
              <mesh geometry={g.rim} position={[Math.sign(w.x) * 0.008, 0, 0]}>
                <meshStandardMaterial color="#9aa0ab" metalness={0.9} roughness={0.25} />
              </mesh>
            </group>
          </group>
        </group>
      ))}
    </group>
  );
}

/* ---------------------------------------------------------------- *
 *  PodBus: the six-seat autonomous shuttle, glass box on soft corners
 * ---------------------------------------------------------------- */

const BUS_WHEELS = [
  { x: -0.46, z: 0.78 },
  { x: 0.46, z: 0.78 },
  { x: -0.46, z: -0.78 },
  { x: 0.46, z: -0.78 },
];
const BUS_WHEEL_R = 0.24;

interface BusGeos {
  trim: THREE.BufferGeometry;
  tire: THREE.BufferGeometry;
  rim: THREE.BufferGeometry;
}
let _bus: BusGeos | null = null;
function busGeos(): BusGeos {
  if (_bus) return _bus;
  // The box body had no arches at all, so the tires poked out of a flat side
  // with nothing to explain them. Bands plus a rocker fix that in one draw.
  const band = archBand(0.42, 0.24, 0.68, 0.07, 0.18);
  const trim = mergeParts([
    ...BUS_WHEELS.map((w) => at(band, Math.sign(w.x) * 0.53, w.z)),
    sideExtrude(
      [
        [-1.0, 0.23],
        [1.0, 0.23],
        [1.0, 0.32],
        [-1.0, 0.3],
      ],
      1.04
    ),
  ]);
  band.dispose();
  _bus = { trim, tire: tireGeo(BUS_WHEEL_R, 0.14, 20), rim: tireGeo(0.13, 0.145, 20) };
  return _bus;
}

export function PodBus({ dim, speed, steer, brake }: VehicleProps) {
  const d = dim ?? 1;
  const g = useMemo(busGeos, []);
  const spins = useRef<(THREE.Group | null)[]>([]);
  const knuckles = useRef<(THREE.Group | null)[]>([]);
  const lamp = useRef<THREE.MeshBasicMaterial>(null);
  const roll = useRef(0);
  const angle = useRef(0);
  useFrame((_, delta) => {
    roll.current += ((speed ?? 0) / BUS_WHEEL_R) * delta;
    for (const w of spins.current) if (w) w.rotation.x = roll.current;
    angle.current += ((steer ?? 0) - angle.current) * Math.min(1, delta * STEER_EASE);
    for (const k of knuckles.current) if (k) k.rotation.y = angle.current;
    const m = lamp.current;
    if (m) m.opacity += (tailLevel(brake, d) - m.opacity) * Math.min(1, delta * LAMP_EASE);
  });
  return (
    <group>
      {/* symmetrical body: no front or back, because it never needs to turn around */}
      <mesh position={[0, 0.66, 0]}>
        <boxGeometry args={[1.0, 0.86, 2.1]} />
        <meshPhysicalMaterial color="#2b2f36" metalness={0.6} roughness={0.35} clearcoat={0.5} clearcoatRoughness={0.25} />
      </mesh>
      {/* continuous glass band all the way round */}
      <mesh position={[0, 0.82, 0]}>
        <boxGeometry args={[1.02, 0.4, 2.13]} />
        <meshPhysicalMaterial {...GLASS} />
      </mesh>
      {/* arch bands and rocker, one dark draw */}
      <mesh geometry={g.trim}>
        <meshStandardMaterial {...DARK_TRIM} flatShading />
      </mesh>
      {/* solar roof */}
      <mesh position={[0, 1.096, 0]}>
        <boxGeometry args={[0.9, 0.014, 1.9]} />
        <meshPhysicalMaterial {...SOLAR} />
      </mesh>
      {/* identical light bands at both ends, only the rear answers the brake */}
      <mesh position={[0, 0.42, 1.055]}>
        <boxGeometry args={[0.84, 0.05, 0.02]} />
        <meshBasicMaterial color={ICE_BRIGHT} transparent opacity={0.9 * d} />
      </mesh>
      <mesh position={[0, 0.42, -1.055]}>
        <boxGeometry args={[0.84, 0.05, 0.02]} />
        <meshBasicMaterial ref={lamp} color={TAIL} transparent opacity={tailLevel(brake, d)} />
      </mesh>
      {/* roof sensor dome: it drives itself */}
      <mesh position={[0, 1.14, 0.3]}>
        <sphereGeometry args={[0.07, 12, 10]} />
        <meshPhysicalMaterial {...GLASS} />
      </mesh>
      {BUS_WHEELS.map((w, i) => (
        <group key={i} position={[w.x, BUS_WHEEL_R, w.z]}>
          <group
            ref={
              w.z > 0
                ? (el) => {
                    knuckles.current[i] = el;
                  }
                : undefined
            }
          >
            <group
              ref={(el) => {
                spins.current[i] = el;
              }}
            >
              <mesh geometry={g.tire}>
                <meshStandardMaterial {...TIRE} />
              </mesh>
              <mesh geometry={g.rim}>
                <meshStandardMaterial color="#6f737b" metalness={0.85} roughness={0.3} />
              </mesh>
            </group>
          </group>
        </group>
      ))}
    </group>
  );
}
