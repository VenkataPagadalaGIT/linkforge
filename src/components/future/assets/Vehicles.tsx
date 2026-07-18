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

const STEEL = { color: "#a8a8ae", metalness: 0.9, roughness: 0.35, clearcoat: 0.4, clearcoatRoughness: 0.3 } as const;
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
      <mesh position={[0, 0.49, 1.5]}>
        <boxGeometry args={[1.18, 0.045, 0.03]} />
        <meshBasicMaterial color={ICE_BRIGHT} transparent opacity={0.95 * d} />
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
          position={[side * 0.675, 1.46, -1.1]}
          rotation={[0, side * (Math.PI / 2), 0]}
          fontSize={0.34}
          letterSpacing={0.14}
          color="#3f424a"
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
