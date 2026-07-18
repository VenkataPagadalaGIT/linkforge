"use client";
/**
 * Vehicles: three hero assets for the future-city scene, all generated
 * geometry, zero external files.
 *
 *  - CyberTruck: one extruded side-profile polygon, flat shaded, the angular
 *    design language is the whole point. Brushed steel physical material,
 *    full-width light bars, trapezoid fender flares, turbine wheels.
 *  - CyberSemi: massive angular cab (center driving glass), arch-cut side
 *    skirts, roof fairing sweeping into a long seamed trailer, five axles,
 *    ten instanced turbine wheels, amber running dots.
 *  - Sedan: the smooth counterpoint. Scaled sphere sections, satin black
 *    clearcoat paint, curved light arcs, covered aero wheels.
 *
 * Every component: ({ dim, speed }) => group centered at origin, +Z forward,
 * wheels resting on y = 0. All emissive strips multiply their opacity by
 * dim ?? 1. Pass speed (world units per second) and the wheels roll.
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
const GLASS = { color: "#0d1016", metalness: 0.9, roughness: 0.15, clearcoat: 0.6, clearcoatRoughness: 0.1 } as const;

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

/** Cylinder tire with the axle axis baked onto X. */
function tireGeo(r: number, w: number, segs = 20): THREE.CylinderGeometry {
  const geo = new THREE.CylinderGeometry(r, r, w, segs);
  geo.rotateZ(Math.PI / 2);
  return geo;
}

/* ---------------------------------------------------------------- *
 *  CyberTruck
 * ---------------------------------------------------------------- */

interface TruckGeos {
  body: THREE.BufferGeometry;
  glass: THREE.BufferGeometry;
  fender: THREE.BufferGeometry;
  tire: THREE.BufferGeometry;
  hub: THREE.BufferGeometry;
}
let _truck: TruckGeos | null = null;
function truckGeos(): TruckGeos {
  if (_truck) return _truck;
  // Side profile: sharp nose, one continuous rise to the single roof ridge
  // peak, then one clean taper down the bed to a high tailgate.
  const body = sideExtrude(
    [
      [1.4, 0.3],
      [1.48, 0.5],
      [0.62, 0.8],
      [0.1, 1.0],
      [-1.42, 0.62],
      [-1.46, 0.34],
      [-1.4, 0.3],
    ],
    1.14,
    0.02
  );
  // Tinted canopy: a thin skin that follows the cowl-peak-tail ridge line,
  // slightly proud of the steel, narrower so the roof rails read.
  const glass = sideExtrude(
    [
      [-0.57, 0.802],
      [0.1, 0.962],
      [0.62, 0.76],
      [0.66, 0.802],
      [0.105, 1.012],
      [-0.57, 0.846],
    ],
    1.0
  );
  // Trapezoid fender flare, one per wheel, overlapping the body side.
  const fender = sideExtrude(
    [
      [-0.42, 0.18],
      [0.42, 0.18],
      [0.26, 0.62],
      [-0.26, 0.62],
    ],
    0.16
  );
  _truck = {
    body,
    glass,
    fender,
    tire: tireGeo(0.26, 0.16),
    hub: turbineGeo(0.2, 0.05),
  };
  return _truck;
}

const TRUCK_WHEELS = [
  { x: -0.52, z: 0.95 },
  { x: 0.52, z: 0.95 },
  { x: -0.52, z: -0.98 },
  { x: 0.52, z: -0.98 },
];
const TRUCK_WHEEL_R = 0.26;

export function CyberTruck({ dim, speed }: VehicleProps) {
  const d = dim ?? 1;
  const g = useMemo(truckGeos, []);
  const spins = useRef<(THREE.Group | null)[]>([]);
  const roll = useRef(0);

  useFrame((_, delta) => {
    roll.current += ((speed ?? 0) / TRUCK_WHEEL_R) * delta;
    for (const s of spins.current) if (s) s.rotation.x = roll.current;
  });

  return (
    <group>
      <mesh geometry={g.body}>
        <meshPhysicalMaterial {...STEEL} flatShading />
      </mesh>
      <mesh geometry={g.glass}>
        <meshPhysicalMaterial {...GLASS} flatShading side={THREE.DoubleSide} />
      </mesh>
      {/* full-width light bars: cool white nose, amber-red tail */}
      <mesh position={[0, 0.5, 1.51]}>
        <boxGeometry args={[1.22, 0.06, 0.035]} />
        <meshBasicMaterial color={ICE_BRIGHT} transparent opacity={d} />
      </mesh>
      {/* solar laminate: hood panel and bed tonneau, tilted to the facets */}
      <mesh position={[0, 0.675, 1.03]} rotation={[0.335, 0, 0]}>
        <boxGeometry args={[0.9, 0.012, 0.68]} />
        <meshPhysicalMaterial {...SOLAR} />
      </mesh>
      <mesh position={[0, 0.84, -0.68]} rotation={[-0.245, 0, 0]}>
        <boxGeometry args={[0.98, 0.012, 1.32]} />
        <meshPhysicalMaterial {...SOLAR} />
      </mesh>
      <mesh position={[0, 0.52, -1.49]}>
        <boxGeometry args={[1.18, 0.04, 0.03]} />
        <meshBasicMaterial color={TAIL} transparent opacity={0.9 * d} />
      </mesh>
      {/* mirror-replacement camera pods at the A-pillar */}
      {([-1, 1] as const).map((side) => (
        <mesh key={`pod-${side}`} position={[side * 0.6, 0.72, 0.56]} rotation={[0, 0, side * -0.3]}>
          <capsuleGeometry args={[0.018, 0.06, 3, 8]} />
          <meshStandardMaterial {...DARK_TRIM} />
        </mesh>
      ))}
      {/* fender flares cut the arches over each wheel */}
      {TRUCK_WHEELS.map((w, i) => (
        <mesh key={i} geometry={g.fender} position={[Math.sign(w.x) * 0.55, 0, w.z]}>
          <meshStandardMaterial {...DARK_TRIM} flatShading />
        </mesh>
      ))}
      {/* wheels: dark tire, turbine hub, slight negative camber */}
      {TRUCK_WHEELS.map((w, i) => (
        <group
          key={i}
          position={[w.x, TRUCK_WHEEL_R, w.z]}
          rotation={[0, 0, w.x > 0 ? 0.05 : -0.05]}
        >
          <group
            ref={(el) => {
              spins.current[i] = el;
            }}
          >
            <mesh geometry={g.tire}>
              <meshStandardMaterial {...TIRE} />
            </mesh>
            <mesh geometry={g.hub} position={[Math.sign(w.x) * 0.06, 0, 0]}>
              <meshStandardMaterial {...HUB} flatShading />
            </mesh>
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

export function CyberSemi({ dim, speed }: VehicleProps) {
  const d = dim ?? 1;
  const g = useMemo(semiGeos, []);
  const tires = useRef<THREE.InstancedMesh>(null);
  const hubs = useRef<THREE.InstancedMesh>(null);
  const seams = useRef<THREE.InstancedMesh>(null);
  const dots = useRef<THREE.InstancedMesh>(null);
  const roll = useRef(0);
  const tmp = useMemo(() => new THREE.Object3D(), []);

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
    const tm = tires.current;
    const hm = hubs.current;
    if (!tm || !hm) return;
    let i = 0;
    for (const z of SEMI_AXLES) {
      const track = z > 0 ? 0.52 : 0.55; // front wheels tuck inside the skirts
      for (const sx of [-1, 1]) {
        tmp.position.set(sx * track, SEMI_WHEEL_R, z);
        tmp.rotation.set(roll.current, 0, 0);
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
        <meshBasicMaterial color={TAIL} transparent opacity={0.9 * d} />
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

interface SedanGeos {
  frontArc: THREE.BufferGeometry;
  rearArc: THREE.BufferGeometry;
  tire: THREE.BufferGeometry;
  hub: THREE.BufferGeometry;
}
let _sedan: SedanGeos | null = null;
function sedanGeos(): SedanGeos {
  if (_sedan) return _sedan;
  // Light strip: a torus arc scaled onto the body's horizontal cross-section
  // ellipse at strip height, so it hugs the paint with no straight edges.
  const arc = (rear: boolean) => {
    const geo = new THREE.TorusGeometry(1, 0.013, 6, 40, 0.8);
    geo.rotateZ(-0.4); // center the arc on +X
    geo.rotateX(-Math.PI / 2); // lay it into the ground plane
    geo.rotateY(rear ? Math.PI / 2 : -Math.PI / 2); // face +Z (nose) or -Z (tail)
    geo.scale(0.468, 1, 1.132); // body ellipse at y = 0.42, nudged proud
    geo.translate(0, 0.42, 0);
    return geo;
  };
  _sedan = {
    frontArc: arc(false),
    rearArc: arc(true),
    tire: tireGeo(0.19, 0.12, 24),
    hub: tireGeo(0.135, 0.125, 24), // smooth covered aero disc
  };
  return _sedan;
}

const SEDAN_WHEELS = [
  { x: -0.36, z: 0.72 },
  { x: 0.36, z: 0.72 },
  { x: -0.36, z: -0.72 },
  { x: 0.36, z: -0.72 },
];
const SEDAN_WHEEL_R = 0.19;

export function Sedan({ dim, speed }: VehicleProps) {
  const d = dim ?? 1;
  const g = useMemo(sedanGeos, []);
  const spins = useRef<(THREE.Group | null)[]>([]);
  const roll = useRef(0);

  useFrame((_, delta) => {
    roll.current += ((speed ?? 0) / SEDAN_WHEEL_R) * delta;
    for (const s of spins.current) if (s) s.rotation.x = roll.current;
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
      {/* thin curved light strips, front and rear */}
      <mesh geometry={g.frontArc}>
        <meshBasicMaterial color={ICE_BRIGHT} transparent opacity={0.95 * d} />
      </mesh>
      <mesh geometry={g.rearArc}>
        <meshBasicMaterial color={TAIL} transparent opacity={0.9 * d} />
      </mesh>
      {/* solar hood laminate riding the front body curve */}
      <mesh position={[0, 0.598, 0.58]} rotation={[0.13, 0, 0]}>
        <boxGeometry args={[0.44, 0.01, 0.36]} />
        <meshPhysicalMaterial {...SOLAR} />
      </mesh>
      {/* dark arch trims ground each wheel into the body instead of leaving
          it floating beside the ellipsoid: the single biggest "real car" cue */}
      {SEDAN_WHEELS.map((w, i) => (
        <mesh
          key={`arch-${i}`}
          position={[w.x + Math.sign(w.x) * 0.075, SEDAN_WHEEL_R, w.z]}
          rotation={[0, Math.PI / 2, 0]}
        >
          <torusGeometry args={[0.225, 0.022, 8, 22, Math.PI]} />
          <meshStandardMaterial {...DARK_TRIM} />
        </mesh>
      ))}
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
            ref={(el) => {
              spins.current[i] = el;
            }}
          >
            <mesh geometry={g.tire}>
              <meshStandardMaterial {...TIRE} />
            </mesh>
            <mesh geometry={g.hub} position={[Math.sign(w.x) * 0.01, 0, 0]}>
              <meshStandardMaterial {...HUB} />
            </mesh>
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

let _podBody: THREE.CapsuleGeometry | null = null;
function podBody(): THREE.CapsuleGeometry {
  if (_podBody) return _podBody;
  const geo = new THREE.CapsuleGeometry(0.17, 0.62, 4, 12);
  geo.rotateX(Math.PI / 2); // long axis onto Z
  _podBody = geo;
  return geo;
}

export function MonoPod({ dim, speed }: VehicleProps) {
  const d = dim ?? 1;
  const wheels = useRef<(THREE.Group | null)[]>([]);
  const roll = useRef(0);
  const R = 0.2;
  useFrame((_, delta) => {
    roll.current += ((speed ?? 0) / R) * delta;
    for (const w of wheels.current) if (w) w.rotation.x = roll.current;
  });
  return (
    <group>
      <mesh geometry={podBody()} position={[0, 0.46, 0]}>
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
      {/* inline wheels, half swallowed by the body */}
      {[0.42, -0.42].map((z, i) => (
        <group
          key={z}
          position={[0, R, z]}
          ref={(el) => {
            wheels.current[i] = el;
          }}
        >
          <mesh geometry={tireGeo(R, 0.09, 18)}>
            <meshStandardMaterial {...TIRE} />
          </mesh>
        </group>
      ))}
      {/* light dots */}
      <mesh position={[0, 0.5, 0.52]}>
        <sphereGeometry args={[0.022, 8, 6]} />
        <meshBasicMaterial color={ICE_BRIGHT} transparent opacity={0.95 * d} />
      </mesh>
      <mesh position={[0, 0.5, -0.52]}>
        <sphereGeometry args={[0.02, 8, 6]} />
        <meshBasicMaterial color={TAIL} transparent opacity={0.9 * d} />
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
