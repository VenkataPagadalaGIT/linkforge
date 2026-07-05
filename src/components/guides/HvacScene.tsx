/**
 * HvacScene — schematic 3D model of a residential split HVAC system.
 *
 * Deliberately schematic (primitive geometry, not a photoreal GLTF): every
 * part is its own clickable group whose id matches COMPONENTS in data/hvac.ts,
 * so the diagnose panel can light up suspects and the explore panel can
 * inspect whatever is clicked. Loaded lazily — three.js never touches the
 * main bundle.
 */
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { ContactShadows, Environment, Grid, Html, Lightformer, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type React from "react";
import {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { PATHS, componentById } from "@/data/hvac";

export interface HvacSceneState {
  selectedId: string | null;
  highlightIds: string[];
  running: boolean;
  exploded: boolean;
  /** Always-on name chips on every part. */
  labels: boolean;
  /** Water droplets at the condensate drain's outdoor outlet. */
  drip: boolean;
  /** Emergency-pan water level 0..1 (scenario-driven). */
  panWater: number;
  /** Float switch lifted — renders red and risen. */
  floatTripped: boolean;
  onSelect: (id: string | null) => void;
}

interface Ctx extends HvacSceneState {
  highlight: Set<string>;
}
// Nullable: during Vite HMR a remounting tree can briefly read a stale
// context module. Every consumer guards for null instead of crashing.
const SceneCtx = createContext<Ctx | null>(null);

/* ---------------------------------------------------------------- *
 *  Part wrapper: explode lerp, hover/select/suspect glow, label
 * ---------------------------------------------------------------- */

const HOVER = new THREE.Color("#e5e5e5");
const SUSPECT = new THREE.Color("#f59e0b");
const SELECTED = new THREE.Color("#7dd3fc");

function Part({
  id,
  base,
  explode = [0, 0, 0],
  labelY = 0.6,
  labelAt,
  children,
}: {
  id: string;
  base: [number, number, number];
  explode?: [number, number, number];
  labelY?: number;
  /** Explicit label position (group-local) for parts whose geometry spans the scene. */
  labelAt?: [number, number, number];
  children: ReactNode;
}) {
  const ctx = useContext(SceneCtx);
  const group = useRef<THREE.Group>(null);
  const hovered = useRef(false);
  const glow = useRef(0);
  // Passive labels only render when the camera is close — otherwise 39 chips
  // wall off the model. Hysteresis avoids flicker at the threshold.
  const [near, setNear] = useState(false);
  const nearRef = useRef(false);
  const frame = useRef(0);

  const isSelected = ctx?.selectedId === id;
  const isSuspect = ctx?.highlight.has(id) ?? false;

  useFrame((state, delta) => {
    const g = group.current;
    if (!g || !ctx) return;
    frame.current++;
    if (frame.current % 12 === 0) {
      const d = state.camera.position.distanceTo(g.position);
      const shouldShow = nearRef.current ? d < 6.2 : d < 5.4;
      if (shouldShow !== nearRef.current) {
        nearRef.current = shouldShow;
        setNear(shouldShow);
      }
    }
    const k = 1 - Math.pow(0.001, delta); // frame-rate independent lerp
    g.position.x += ((ctx.exploded ? base[0] + explode[0] : base[0]) - g.position.x) * k;
    g.position.y += ((ctx.exploded ? base[1] + explode[1] : base[1]) - g.position.y) * k;
    g.position.z += ((ctx.exploded ? base[2] + explode[2] : base[2]) - g.position.z) * k;

    let target = 0;
    if (isSelected) target = 0.9;
    else if (isSuspect) target = 0.45 + 0.4 * (0.5 + 0.5 * Math.sin(state.clock.elapsedTime * 4));
    else if (hovered.current) target = 0.5;
    glow.current += (target - glow.current) * Math.min(1, 10 * delta);

    const color = isSelected ? SELECTED : isSuspect ? SUSPECT : HOVER;
    g.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.userData?.keepEmissive) return; // self-lit meshes (heat strips)
      const mat = mesh.material as THREE.MeshStandardMaterial | undefined;
      if (mat && mat.isMeshStandardMaterial) {
        mat.emissive.copy(color);
        mat.emissiveIntensity = glow.current;
      }
    });
  });

  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    hovered.current = true;
    document.body.style.cursor = "pointer";
  };
  const out = () => {
    hovered.current = false;
    document.body.style.cursor = "auto";
  };
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    ctx?.onSelect(isSelected ? null : id);
  };

  if (!ctx) return null;

  const comp = componentById(id);
  const name = comp?.name ?? id;
  const pathColor = comp ? PATHS[comp.path].color : "#787c84";
  const active = isSelected || isSuspect;
  const showLabel = active || (ctx.labels && near);
  const accent = isSelected ? "#7dd3fc" : "#f59e0b";

  // Passive labels sit BESIDE the part with a leader line, not on top of it:
  // parts left of the scene push labels left, right pushes right, center goes up.
  const side: "left" | "right" | "top" = base[0] < -0.9 ? "left" : base[0] > 1.6 ? "right" : "top";

  const chipStyle: React.CSSProperties = {
    fontFamily: "ui-monospace, monospace",
    fontSize: "9px",
    letterSpacing: "0.04em",
    whiteSpace: "nowrap",
    padding: "1px 5px",
    border: `1px solid ${pathColor}66`,
    color: "rgba(206,210,218,0.85)",
    background: "rgba(10,10,10,0.72)",
    borderLeft: `3px solid ${pathColor}`,
    pointerEvents: "none",
  };
  const leader: React.CSSProperties = { background: `${pathColor}88`, pointerEvents: "none", flexShrink: 0 };

  return (
    <group ref={group} position={base} onPointerOver={over} onPointerOut={out} onClick={click}>
      {children}
      {showLabel && active && (
        <Html position={labelAt ?? [0, labelY, 0]} center distanceFactor={9} zIndexRange={[20, 0]}>
          <div
            style={{
              fontFamily: "ui-monospace, monospace",
              fontSize: "11px",
              letterSpacing: "0.05em",
              whiteSpace: "nowrap",
              padding: "3px 8px",
              border: `1px solid ${accent}`,
              color: accent,
              background: "rgba(10,10,10,0.85)",
              pointerEvents: "none",
            }}
          >
            {name}
          </div>
        </Html>
      )}
      {showLabel && !active && (
        <Html position={labelAt ?? [0, labelY, 0]} distanceFactor={9} zIndexRange={[15, 0]}>
          {side === "top" ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", transform: "translate(-50%, -100%)", pointerEvents: "none" }}>
              <div style={chipStyle}>{name}</div>
              <div style={{ ...leader, width: "1px", height: "16px" }} />
            </div>
          ) : side === "left" ? (
            <div style={{ display: "flex", alignItems: "center", transform: "translate(-100%, -50%)", pointerEvents: "none" }}>
              <div style={chipStyle}>{name}</div>
              <div style={{ ...leader, width: "22px", height: "1px" }} />
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", transform: "translateY(-50%)", pointerEvents: "none" }}>
              <div style={{ ...leader, width: "22px", height: "1px" }} />
              <div style={chipStyle}>{name}</div>
            </div>
          )}
        </Html>
      )}
    </group>
  );
}

/* ---------------------------------------------------------------- *
 *  Materials (plain colors; emissive driven by Part)
 * ---------------------------------------------------------------- */

// With the baked Environment map in the scene, real metalness finally pays:
// these values are tuned for IBL reflections (expert-panel rebalance).
const M = {
  cabinet: { color: "#b9bdc7", metalness: 0.65, roughness: 0.4 },
  shell: { color: "#c8ccd4", metalness: 0.65, roughness: 0.38 },
  fins: { color: "#aeb4bd", metalness: 0.8, roughness: 0.4 },
  copper: { color: "#e08a2e", metalness: 0.9, roughness: 0.28 },
  insulation: { color: "#6b7280", metalness: 0.05, roughness: 0.9 },
  dark: { color: "#585d66", metalness: 0.5, roughness: 0.5 },
  device: { color: "#eceef1", metalness: 0.4, roughness: 0.4 },
  brass: { color: "#d4a017", metalness: 0.88, roughness: 0.32 },
  duct: { color: "#a8a29e", metalness: 0.6, roughness: 0.45 },
  filter: { color: "#38bdf8", metalness: 0.05, roughness: 0.7 },
} as const;

/* ---------------------------------------------------------------- *
 *  Animated bits
 * ---------------------------------------------------------------- */

function FanBlades({ radius, blades = 5, speed }: { radius: number; blades?: number; speed: number }) {
  const ctx = useContext(SceneCtx);
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current && ctx?.running) ref.current.rotation.y += speed * delta;
  });
  const bladeLen = radius * 0.72;
  return (
    <group ref={ref}>
      {/* motor hub */}
      <mesh>
        <cylinderGeometry args={[0.1, 0.12, 0.14, 16]} />
        <meshStandardMaterial color="#3f434b" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.08, 0]}>
        <sphereGeometry args={[0.06, 12, 8]} />
        <meshStandardMaterial color="#3f434b" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* pitched blades, root at the hub, tip inside the shroud */}
      {Array.from({ length: blades }, (_, i) => (
        <group key={i} rotation={[0, (i * Math.PI * 2) / blades, 0]}>
          <mesh position={[0.1 + bladeLen / 2, 0, 0]} rotation={[0.6, 0, 0]}>
            <boxGeometry args={[bladeLen, 0.012, 0.2]} />
            <meshStandardMaterial color="#c8ccd4" metalness={0.35} roughness={0.45} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Concentric-ring + spoke safety grille over the condenser fan. */
function FanGrille({ radius }: { radius: number }) {
  return (
    <group>
      {[0.35, 0.65, 0.95].map((f) => (
        <mesh key={f} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[radius * f, 0.008, 6, 40]} />
          <meshStandardMaterial color="#565b64" metalness={0.5} roughness={0.4} />
        </mesh>
      ))}
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} rotation={[0, (i * Math.PI) / 8, 0]}>
          <boxGeometry args={[radius * 2, 0.008, 0.014]} />
          <meshStandardMaterial color="#565b64" metalness={0.5} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function BlowerWheel() {
  const ctx = useContext(SceneCtx);
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current && ctx?.running) ref.current.rotation.z += 6 * delta;
  });
  return (
    <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.3, 0.3, 0.55, 12, 1, true]} />
      <meshStandardMaterial {...M.device} wireframe side={THREE.DoubleSide} />
    </mesh>
  );
}

/** Dots flowing along a curve — refrigerant. */
function FlowDots({
  curve,
  count,
  color,
  speed,
  size = 0.045,
}: {
  curve: THREE.CatmullRomCurve3;
  count: number;
  color: string;
  speed: number;
  size?: number;
}) {
  const ctx = useContext(SceneCtx);
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const t = useRef(0);
  useFrame((_, delta) => {
    if (!ctx) return;
    if (ctx.running) t.current = (t.current + speed * delta) % 1;
    refs.current.forEach((m, i) => {
      if (!m) return;
      const p = curve.getPointAt((t.current + i / count) % 1);
      m.position.copy(p);
      m.visible = ctx.running;
    });
  });
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <mesh key={i} ref={(el) => (refs.current[i] = el)}>
          <sphereGeometry args={[size, 8, 8]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.6} />
        </mesh>
      ))}
    </>
  );
}

/** Water droplets falling from the condensate drain's outdoor outlet. */
function DripDots() {
  const ctx = useContext(SceneCtx);
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const t = useRef(0);
  const TOP = 0.72;
  const COUNT = 4;
  useFrame((_, delta) => {
    if (!ctx) return;
    if (ctx.drip) t.current = (t.current + 0.55 * delta) % 1;
    refs.current.forEach((m, i) => {
      if (!m) return;
      const p = (t.current + i / COUNT) % 1;
      m.position.set(-2.85, TOP - p * p * TOP, 1.98); // p² ≈ gravity
      m.visible = !!ctx.drip;
      const s = 0.6 + 0.4 * (1 - p);
      m.scale.setScalar(s);
    });
  });
  return (
    <>
      {Array.from({ length: COUNT }, (_, i) => (
        <mesh key={i} ref={(el) => (refs.current[i] = el)}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshStandardMaterial color="#7dd3fc" emissive="#38bdf8" emissiveIntensity={1.4} transparent opacity={0.9} />
        </mesh>
      ))}
      {/* small puddle that appears while dripping */}
      <PuddleDisc />
    </>
  );
}

function PuddleDisc() {
  const ctx = useContext(SceneCtx);
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (ref.current) ref.current.visible = !!ctx?.drip;
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[-2.85, 0.012, 2.0]}>
      <circleGeometry args={[0.22, 20]} />
      <meshStandardMaterial color="#164e63" emissive="#0e7490" emissiveIntensity={0.5} transparent opacity={0.75} />
    </mesh>
  );
}

/** Cool air sinking from ceiling registers into the rooms while running. */
function AirPuffs() {
  const ctx = useContext(SceneCtx);
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const t = useRef(0);
  const XS = [-0.4, 1.0];
  const PER = 3;
  useFrame((_, delta) => {
    if (!ctx) return;
    if (ctx.running) t.current = (t.current + 0.35 * delta) % 1;
    refs.current.forEach((m, i) => {
      if (!m) return;
      const reg = XS[Math.floor(i / PER)];
      const p = (t.current + (i % PER) / PER) % 1;
      m.position.set(reg, 3.02 - p * 0.85, 0.15);
      m.visible = !!ctx.running;
      const mat = m.material as THREE.MeshStandardMaterial;
      mat.opacity = 0.45 * (1 - p);
    });
  });
  return (
    <>
      {Array.from({ length: XS.length * PER }, (_, i) => (
        <mesh key={i} ref={(el) => (refs.current[i] = el)} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.09, 0.16, 8]} />
          <meshStandardMaterial color="#7dd3fc" emissive="#38bdf8" emissiveIntensity={0.6} transparent opacity={0.4} depthWrite={false} />
        </mesh>
      ))}
    </>
  );
}

/** Rising water in the emergency pan, driven by scenario steps. */
function PanWater() {
  const ctx = useContext(SceneCtx);
  const ref = useRef<THREE.Mesh>(null);
  const level = useRef(0);
  useFrame((_, delta) => {
    if (!ref.current || !ctx) return;
    const k = 1 - Math.pow(0.02, delta);
    level.current += ((ctx.panWater ?? 0) - level.current) * k;
    const h = Math.max(0.001, level.current * 0.11);
    ref.current.visible = level.current > 0.02;
    ref.current.scale.y = h / 0.1;
    ref.current.position.y = 0.065 + h / 2;
  });
  return (
    <mesh ref={ref} position={[-3.4, 0.07, 0]} visible={false}>
      <boxGeometry args={[2.0, 0.1, 1.7]} />
      <meshStandardMaterial color="#22d3ee" emissive="#0e7490" emissiveIntensity={0.5} transparent opacity={0.5} userData={{ keepEmissive: true }} />
    </mesh>
  );
}

/** Float cap that rides the pan water and turns red when tripped. */
function FloatCap() {
  const ctx = useContext(SceneCtx);
  const ref = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  useFrame((state, delta) => {
    if (!ref.current || !mat.current || !ctx) return;
    const k = 1 - Math.pow(0.02, delta);
    const targetY = 0.13 + (ctx.panWater ?? 0) * 0.09;
    ref.current.position.y += (targetY - ref.current.position.y) * k;
    if (ctx.floatTripped) {
      mat.current.color.set("#ef4444");
      mat.current.emissive.set("#ef4444");
      mat.current.emissiveIntensity = 0.9 + 0.5 * Math.sin(state.clock.elapsedTime * 5);
    } else {
      mat.current.color.set("#38bdf8");
      mat.current.emissive.set("#0e7490");
      mat.current.emissiveIntensity = 0.25;
    }
  });
  return (
    <mesh ref={ref} position={[0, 0.13, 0]} userData={{ keepEmissive: true }}>
      <cylinderGeometry args={[0.075, 0.075, 0.06, 10]} />
      <meshStandardMaterial ref={mat} color="#38bdf8" metalness={0.2} roughness={0.5} userData={{ keepEmissive: true }} />
    </mesh>
  );
}

/** Translucent partial-home shell: walls, ceiling/attic, room labels. */
function HouseShell() {
  const ctx = useContext(SceneCtx);
  const wall = { color: "#9aa0ab", metalness: 0.05, roughness: 0.9, transparent: true, opacity: 0.09, depthWrite: false } as const;
  const noRay = () => null as unknown as void;
  const rooms: { label: string; pos: [number, number, number] }[] = [
    { label: "GARAGE", pos: [-3.9, 2.85, 0.9] },
    { label: "HALLWAY", pos: [-1.6, 2.7, 0.6] },
    { label: "LIVING ROOM", pos: [0.5, 2.7, 0.6] },
    { label: "ATTIC", pos: [-0.6, 3.6, 1.1] },
    { label: "OUTSIDE", pos: [3.6, 2.7, 1.3] },
  ];
  return (
    <group>
      {/* exterior wall between house and outdoor unit */}
      <mesh position={[1.8, 2.2, 0]} raycast={noRay}>
        <boxGeometry args={[0.08, 4.4, 4.2]} />
        <meshStandardMaterial {...wall} />
      </mesh>
      {/* back wall */}
      <mesh position={[-1.9, 2.2, -1.62]} raycast={noRay}>
        <boxGeometry args={[7.5, 4.4, 0.08]} />
        <meshStandardMaterial {...wall} />
      </mesh>
      {/* ceiling / attic floor */}
      <mesh position={[-1.9, 3.15, 0.15]} raycast={noRay}>
        <boxGeometry args={[7.5, 0.06, 3.7]} />
        <meshStandardMaterial {...wall} opacity={0.12} />
      </mesh>
      {/* garage wall + room divider */}
      <mesh position={[-2.45, 1.57, -0.65]} raycast={noRay}>
        <boxGeometry args={[0.06, 3.16, 1.9]} />
        <meshStandardMaterial {...wall} />
      </mesh>
      <mesh position={[-0.8, 1.57, -0.65]} raycast={noRay}>
        <boxGeometry args={[0.06, 3.16, 1.9]} />
        <meshStandardMaterial {...wall} />
      </mesh>
      {/* ceiling supply grilles under the register boots */}
      {[-0.4, 1.0].map((x) => (
        <mesh key={x} position={[x, 3.11, 0.15]} raycast={noRay}>
          <boxGeometry args={[0.48, 0.04, 0.48]} />
          <meshStandardMaterial color="#c8ccd4" metalness={0.3} roughness={0.5} />
        </mesh>
      ))}
      {/* room labels (follow the Labels toggle) */}
      {ctx?.labels &&
        rooms.map((r) => (
          <Html key={r.label} position={r.pos} center distanceFactor={11} zIndexRange={[10, 0]}>
            <div
              style={{
                fontFamily: "ui-monospace, monospace",
                fontSize: "10px",
                letterSpacing: "0.35em",
                color: "rgba(160,166,178,0.5)",
                whiteSpace: "nowrap",
                pointerEvents: "none",
              }}
            >
              {r.label}
            </div>
          </Html>
        ))}
    </group>
  );
}

function Tube({
  curve,
  radius,
  mat,
}: {
  curve: THREE.CatmullRomCurve3;
  radius: number;
  mat: { color: string; metalness: number; roughness: number };
}) {
  const geo = useMemo(() => new THREE.TubeGeometry(curve, 64, radius, 10, false), [curve, radius]);
  return (
    <mesh geometry={geo}>
      <meshStandardMaterial {...mat} />
    </mesh>
  );
}

/* ---------------------------------------------------------------- *
 *  The system model
 * ---------------------------------------------------------------- */

/** Contact shadows that re-bake when the exploded layout changes. */
function ContactShadowsRig() {
  const ctx = useContext(SceneCtx);
  return (
    <ContactShadows
      key={String(ctx?.exploded)}
      position={[0, 0.001, 0]}
      scale={15}
      far={4}
      blur={2.4}
      opacity={0.5}
      resolution={512}
      frames={60}
    />
  );
}

function SystemModel() {
  // Refrigerant loop curves (world coordinates; lines part sits at origin)
  const suction = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-2.85, 2.5, 0.35),
        new THREE.Vector3(-1.7, 1.7, 1.0),
        new THREE.Vector3(0.6, 0.7, 1.05),
        new THREE.Vector3(2.3, 0.75, 0.7),
      ]),
    []
  );
  const liquid = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(2.45, 0.5, 0.95),
        new THREE.Vector3(0.6, 0.45, 1.25),
        new THREE.Vector3(-1.8, 1.35, 1.2),
        new THREE.Vector3(-2.95, 2.3, 0.5),
      ]),
    []
  );

  // Outdoor service wiring: 240V whip + low-voltage thermostat runs
  const whip = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(4.35, 0.85, -0.6),
        new THREE.Vector3(4.25, 0.45, -0.55),
        new THREE.Vector3(3.85, 0.4, -0.45),
        new THREE.Vector3(3.6, 0.55, -0.35),
      ]),
    []
  );
  const statWireIndoor = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-1.32, 1.75, -1.28),
        new THREE.Vector3(-1.7, 1.0, -1.15),
        new THREE.Vector3(-2.6, 0.7, -0.95),
        new THREE.Vector3(-3.2, 0.85, -0.72),
      ]),
    []
  );
  const statWireOutdoor = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-3.2, 0.7, -0.6),
        new THREE.Vector3(-1.0, 0.12, -0.95),
        new THREE.Vector3(1.6, 0.12, -0.95),
        new THREE.Vector3(3.3, 0.5, -0.7),
      ]),
    []
  );
  // Flex duct: trunk → attic register, with a natural sag
  const flexCurve = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(1.2, 3.95, 0),
        new THREE.Vector3(1.9, 3.55, -0.6),
        new THREE.Vector3(2.35, 3.65, -1.05),
        new THREE.Vector3(2.75, 3.45, -1.35),
      ]),
    []
  );

  return (
    <>
      {/* ground: shader grid with radial fade — dissolves into the page */}
      <fog attach="fog" args={["#0a0a0a", 14, 28]} />
      <Grid
        position={[0, 0.002, 0]}
        cellSize={0.5}
        cellThickness={0.6}
        cellColor="#26282d"
        sectionSize={2}
        sectionThickness={1.1}
        sectionColor="#3a3d44"
        fadeDistance={18}
        fadeStrength={1.5}
        infiniteGrid
      />

      {/* ================= INDOOR (left) ================= */}

      {/* furnace cabinet — backdrop, not interactive */}
      <mesh position={[-3.4, 1.1, 0]}>
        <boxGeometry args={[1.5, 2.2, 1.3]} />
        <meshStandardMaterial color="#9aa0ab" metalness={0.2} roughness={0.6} transparent opacity={0.3} depthWrite={false} />
      </mesh>
      {/* plenum above cabinet */}
      <mesh position={[-3.4, 2.65, 0]}>
        <boxGeometry args={[1.3, 0.95, 1.15]} />
        <meshStandardMaterial color="#9aa0ab" metalness={0.2} roughness={0.6} transparent opacity={0.24} depthWrite={false} />
      </mesh>

      <Part id="air-filter" base={[-4.32, 0.75, 0]} explode={[-0.9, 0, 0]} labelY={0.75}>
        <mesh rotation={[0, 0, 0.12]}>
          <boxGeometry args={[0.09, 1.05, 1.0]} />
          <meshStandardMaterial {...M.filter} />
        </mesh>
      </Part>

      <Part id="blower" base={[-3.4, 0.55, 0]} explode={[0, 0, 1.4]} labelY={0.55}>
        <BlowerWheel />
        <mesh position={[0, 0, 0.35]}>
          <cylinderGeometry args={[0.12, 0.12, 0.18, 12]} />
          <meshStandardMaterial {...M.dark} />
        </mesh>
      </Part>

      <Part id="heat-exchanger" base={[-3.4, 1.55, 0]} explode={[0, 0, 1.6]} labelY={0.5}>
        {/* serpentine exchanger tubes, one per burner */}
        {[-0.32, 0, 0.32].map((z) => (
          <group key={z} position={[0, 0, z]}>
            <mesh rotation={[0, 0, 0.18]}>
              <capsuleGeometry args={[0.06, 0.44, 4, 10]} />
              <meshStandardMaterial {...M.shell} />
            </mesh>
            {/* burner mouth at the bottom */}
            <mesh position={[0.09, -0.3, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.05, 0.05, 0.14, 10]} />
              <meshStandardMaterial color="#3b4048" metalness={0.4} roughness={0.5} />
            </mesh>
          </group>
        ))}
      </Part>

      <Part id="igniter" base={[-2.95, 1.35, 0.45]} explode={[0.5, 0, 1.0]} labelY={0.3}>
        <mesh>
          <boxGeometry args={[0.16, 0.22, 0.1]} />
          <meshStandardMaterial {...M.device} />
        </mesh>
        <mesh position={[0, -0.16, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.14, 6]} />
          <meshStandardMaterial {...M.brass} />
        </mesh>
      </Part>

      <Part id="control-board" base={[-3.78, 1.75, 0.7]} explode={[-0.6, 0.3, 1.1]} labelY={0.32}>
        <mesh>
          <boxGeometry args={[0.3, 0.38, 0.04]} />
          <meshStandardMaterial color="#166534" metalness={0.2} roughness={0.6} />
        </mesh>
        {[[-0.07, 0.1], [0.06, 0.02], [-0.04, -0.08]].map(([x, y], i) => (
          <mesh key={i} position={[x, y, 0.03]}>
            <boxGeometry args={[0.07, 0.05, 0.02]} />
            <meshStandardMaterial color="#0a0a0a" metalness={0.3} roughness={0.5} />
          </mesh>
        ))}
      </Part>

      <Part id="aux-heat-strips" base={[-3.4, 1.95, 0]} explode={[0, 0.35, 1.8]} labelY={0.3}>
        {[-0.14, 0, 0.14].map((y) => (
          <mesh key={y} position={[0, y, 0]} rotation={[0, 0, Math.PI / 2]} userData={{ keepEmissive: true }}>
            <cylinderGeometry args={[0.022, 0.022, 1.15, 8]} />
            <meshStandardMaterial color="#7f1d1d" emissive="#ef4444" emissiveIntensity={1.1} />
          </mesh>
        ))}
        <mesh position={[0.62, 0, 0]}>
          <boxGeometry args={[0.06, 0.5, 0.5]} />
          <meshStandardMaterial {...M.dark} />
        </mesh>
      </Part>

      <Part id="emergency-pan" base={[-3.4, 0.035, 0]} explode={[0, -0.5, 1.6]} labelY={0.22}>
        <mesh>
          <boxGeometry args={[2.1, 0.05, 1.8]} />
          <meshStandardMaterial color="#8f949d" metalness={0.35} roughness={0.5} />
        </mesh>
        {/* raised lip */}
        {([[0, 0.87], [0, -0.87]] as const).map(([x, z], i) => (
          <mesh key={`z${i}`} position={[x, 0.05, z]}>
            <boxGeometry args={[2.1, 0.08, 0.06]} />
            <meshStandardMaterial color="#8f949d" metalness={0.35} roughness={0.5} />
          </mesh>
        ))}
        {([[1.02, 0], [-1.02, 0]] as const).map(([x, z], i) => (
          <mesh key={`x${i}`} position={[x, 0.05, z]}>
            <boxGeometry args={[0.06, 0.08, 1.8]} />
            <meshStandardMaterial color="#8f949d" metalness={0.35} roughness={0.5} />
          </mesh>
        ))}
      </Part>

      <Part id="float-switch" base={[-2.45, 0.18, 0.75]} explode={[0.7, 0.25, 1.4]} labelY={0.28}>
        <mesh>
          <cylinderGeometry args={[0.055, 0.055, 0.2, 10]} />
          <meshStandardMaterial {...M.device} />
        </mesh>
        <FloatCap />
      </Part>

      <Part id="inducer-fan" base={[-2.82, 1.9, -0.4]} explode={[0.6, 0.3, -1.1]} labelY={0.3}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.16, 0.16, 0.14, 14]} />
          <meshStandardMaterial {...M.dark} />
        </mesh>
        {/* exhaust stub upward */}
        <mesh position={[0, 0.2, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.28, 10]} />
          <meshStandardMaterial color="#e7e5e4" metalness={0.1} roughness={0.7} />
        </mesh>
      </Part>

      <Part id="gas-valve" base={[-2.72, 1.15, 0.5]} explode={[0.9, -0.1, 1.1]} labelY={0.28}>
        <mesh>
          <boxGeometry args={[0.22, 0.16, 0.16]} />
          <meshStandardMaterial {...M.dark} />
        </mesh>
        <mesh position={[0, 0.1, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.05, 10]} />
          <meshStandardMaterial color="#dc2626" metalness={0.3} roughness={0.5} />
        </mesh>
        {/* gas pipe stub */}
        <mesh position={[0.22, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.035, 0.035, 0.25, 8]} />
          <meshStandardMaterial {...M.brass} />
        </mesh>
      </Part>

      <Part id="condensate-drain" base={[-3.4, 2.2, 0]} explode={[0, 0, 1.3]} labelY={0.35}>
        <mesh>
          <boxGeometry args={[1.25, 0.07, 1.1]} />
          <meshStandardMaterial {...M.dark} />
        </mesh>
        {/* drain line down the front */}
        <mesh position={[0.55, -0.75, 0.62]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.045, 0.045, 1.45, 8]} />
          <meshStandardMaterial color="#e7e5e4" metalness={0.1} roughness={0.7} />
        </mesh>
        {/* run the termination well clear of the unit so the healthy
            drip reads as "outside", not as a leak beside the furnace */}
        <mesh position={[0.55, -1.48, 1.27]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.045, 0.045, 1.35, 8]} />
          <meshStandardMaterial color="#e7e5e4" metalness={0.1} roughness={0.7} />
        </mesh>
      </Part>

      <Part id="evaporator-coil" base={[-3.4, 2.62, 0]} explode={[0, 0.9, 0.9]} labelY={0.55}>
        <mesh position={[-0.26, 0, 0]} rotation={[0, 0, 0.5]}>
          <boxGeometry args={[0.12, 0.85, 1.0]} />
          <meshStandardMaterial {...M.fins} />
        </mesh>
        <mesh position={[0.26, 0, 0]} rotation={[0, 0, -0.5]}>
          <boxGeometry args={[0.12, 0.85, 1.0]} />
          <meshStandardMaterial {...M.fins} />
        </mesh>
      </Part>

      <Part id="txv" base={[-2.95, 2.32, 0.5]} explode={[0.7, 0.5, 0.7]} labelY={0.28}>
        <mesh>
          <boxGeometry args={[0.16, 0.2, 0.14]} />
          <meshStandardMaterial {...M.brass} />
        </mesh>
      </Part>

      <Part id="ductwork" base={[0, 0, 0]} explode={[0, 1.1, -0.8]} labelY={4.6}>
        {/* supply trunk from plenum, across the "ceiling" */}
        <mesh position={[-3.4, 3.45, 0]}>
          <boxGeometry args={[1.05, 0.65, 0.95]} />
          <meshStandardMaterial {...M.duct} />
        </mesh>
        <mesh position={[-1.15, 3.95, 0]}>
          <boxGeometry args={[4.9, 0.55, 0.85]} />
          <meshStandardMaterial {...M.duct} />
        </mesh>
        {/* register drops */}
        {[-0.4, 1.0].map((x) => (
          <mesh key={x} position={[x, 3.55, 0]}>
            <boxGeometry args={[0.45, 0.35, 0.45]} />
            <meshStandardMaterial {...M.duct} />
          </mesh>
        ))}
        {/* return trunk into the filter */}
        <mesh position={[-5.05, 0.75, 0]}>
          <boxGeometry args={[1.25, 0.95, 1.0]} />
          <meshStandardMaterial {...M.duct} />
        </mesh>
      </Part>

      <Part id="furnace-switch" base={[-4.85, 1.55, -0.7]} explode={[-1.0, 0.4, -0.8]} labelY={0.35}>
        {/* wall stub */}
        <mesh position={[0, 0, -0.04]}>
          <boxGeometry args={[0.5, 0.8, 0.04]} />
          <meshStandardMaterial color="#4b4f57" roughness={0.9} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.2, 0.32, 0.07]} />
          <meshStandardMaterial {...M.device} />
        </mesh>
        {/* red toggle */}
        <mesh position={[0, 0.03, 0.055]} rotation={[0.35, 0, 0]}>
          <boxGeometry args={[0.05, 0.12, 0.05]} />
          <meshStandardMaterial color="#dc2626" metalness={0.2} roughness={0.5} />
        </mesh>
      </Part>

      <Part id="limit-switch" base={[-3.15, 1.82, 0.68]} explode={[0.3, 0.6, 1.3]} labelY={0.26}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.05, 12]} />
          <meshStandardMaterial {...M.device} />
        </mesh>
        {[-0.03, 0.03].map((x) => (
          <mesh key={x} position={[x, 0.06, 0.02]}>
            <boxGeometry args={[0.02, 0.05, 0.02]} />
            <meshStandardMaterial {...M.brass} />
          </mesh>
        ))}
      </Part>

      <Part id="condensate-pump" base={[-2.35, 0.16, 0.62]} explode={[1.1, 0, 1.3]} labelY={0.3}>
        <mesh>
          <boxGeometry args={[0.32, 0.24, 0.24]} />
          <meshStandardMaterial color="#1f2937" metalness={0.2} roughness={0.6} />
        </mesh>
        {/* discharge tube up */}
        <mesh position={[0.1, 0.35, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.5, 8]} />
          <meshStandardMaterial color="#e7e5e4" metalness={0.1} roughness={0.7} />
        </mesh>
      </Part>

      <Part id="blower-door-switch" base={[-3.95, 0.9, 0.68]} explode={[-0.5, -0.3, 1.2]} labelY={0.24}>
        <mesh>
          <boxGeometry args={[0.1, 0.14, 0.07]} />
          <meshStandardMaterial {...M.dark} />
        </mesh>
        <mesh position={[0, 0, 0.05]}>
          <cylinderGeometry args={[0.02, 0.02, 0.05, 8]} />
          <meshStandardMaterial color="#dc2626" metalness={0.2} roughness={0.5} />
        </mesh>
      </Part>

      <Part id="blower-run-capacitor" base={[-2.95, 0.72, 0.5]} explode={[1.0, 0.2, 1.1]} labelY={0.26}>
        <mesh>
          <cylinderGeometry args={[0.07, 0.07, 0.22, 12]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.25} />
        </mesh>
      </Part>

      <Part id="gas-supply-shutoff" base={[-2.5, 0.6, 0.52]} explode={[1.2, -0.2, 1.2]} labelY={0.75}>
        <mesh>
          <cylinderGeometry args={[0.035, 0.035, 1.1, 8]} />
          <meshStandardMaterial color="#1c1917" metalness={0.4} roughness={0.6} />
        </mesh>
        {/* quarter-turn handle */}
        <mesh position={[0, 0.35, 0.06]} rotation={[Math.PI / 2, 0, 0]}>
          <boxGeometry args={[0.16, 0.03, 0.04]} />
          <meshStandardMaterial color="#facc15" metalness={0.3} roughness={0.5} />
        </mesh>
        {/* drip leg */}
        <mesh position={[0, -0.62, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.14, 8]} />
          <meshStandardMaterial color="#1c1917" metalness={0.4} roughness={0.6} />
        </mesh>
        {/* stub to the gas valve */}
        <mesh position={[-0.11, 0.55, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.03, 0.03, 0.22, 8]} />
          <meshStandardMaterial color="#1c1917" metalness={0.4} roughness={0.6} />
        </mesh>
      </Part>

      <Part id="furnace-condensate-trap" base={[-3.75, 0.42, 0.68]} explode={[-0.6, -0.2, 1.3]} labelY={0.26}>
        <mesh>
          <boxGeometry args={[0.16, 0.18, 0.1]} />
          <meshStandardMaterial color="#e7e5e4" metalness={0.05} roughness={0.7} />
        </mesh>
        {[-0.05, 0.05].map((x) => (
          <mesh key={x} position={[x, 0.14, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.14, 8]} />
            <meshStandardMaterial color="#d6d3d1" metalness={0.05} roughness={0.7} />
          </mesh>
        ))}
      </Part>

      <Part id="drain-cleanout-tee" base={[-2.85, 1.45, 0.64]} explode={[0.8, 0.4, 1.1]} labelY={0.24}>
        <mesh>
          <cylinderGeometry args={[0.055, 0.055, 0.16, 8]} />
          <meshStandardMaterial color="#f5f5f4" metalness={0.05} roughness={0.65} />
        </mesh>
        {/* cap */}
        <mesh position={[0, 0.1, 0]}>
          <cylinderGeometry args={[0.065, 0.065, 0.04, 8]} />
          <meshStandardMaterial color="#a8a29e" metalness={0.1} roughness={0.6} />
        </mesh>
      </Part>

      <Part id="flue-vent-pipe" base={[-2.82, 3.35, -0.4]} explode={[0, 1.2, -0.7]} labelY={1.15}>
        <mesh>
          <cylinderGeometry args={[0.07, 0.07, 2.0, 10]} />
          <meshStandardMaterial color="#f5f5f4" metalness={0.1} roughness={0.6} />
        </mesh>
        {/* rain cap */}
        <mesh position={[0, 1.06, 0]}>
          <cylinderGeometry args={[0.11, 0.13, 0.06, 10]} />
          <meshStandardMaterial color="#d6d3d1" metalness={0.2} roughness={0.5} />
        </mesh>
      </Part>

      <Part id="transformer" base={[-3.1, 0.3, 0.5]} explode={[0.9, -0.15, 1.2]} labelY={0.25}>
        <mesh>
          <boxGeometry args={[0.22, 0.18, 0.16]} />
          <meshStandardMaterial {...M.dark} />
        </mesh>
        {[-0.05, 0.05].map((x) => (
          <mesh key={x} position={[x, 0, 0.09]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.06, 10]} />
            <meshStandardMaterial {...M.copper} />
          </mesh>
        ))}
      </Part>

      <Part id="flex-duct" base={[0, 0, 0]} explode={[0.4, 0.9, -0.9]} labelAt={[2.1, 4.0, -0.85]}>
        <Tube curve={flexCurve} radius={0.15} mat={{ color: "#d7d9de", metalness: 0.75, roughness: 0.3 }} />
        {/* helix ribs suggest the corrugation */}
        {[0.15, 0.38, 0.62, 0.85].map((t) => {
          const p = flexCurve.getPointAt(t);
          return (
            <mesh key={t} position={[p.x, p.y, p.z]}>
              <sphereGeometry args={[0.165, 10, 10]} />
              <meshStandardMaterial color="#c3c6cd" metalness={0.7} roughness={0.35} />
            </mesh>
          );
        })}
        {/* ceiling register boot at the end */}
        <mesh position={[2.85, 3.38, -1.42]}>
          <boxGeometry args={[0.4, 0.28, 0.4]} />
          <meshStandardMaterial {...M.duct} />
        </mesh>
      </Part>

      <Part id="service-wiring" base={[0, 0, 0]} explode={[0, 0.35, -1.0]} labelAt={[3.95, 1.15, -0.55]}>
        <Tube curve={whip} radius={0.045} mat={{ color: "#8a8d94", metalness: 0.5, roughness: 0.5 }} />
        <Tube curve={statWireIndoor} radius={0.018} mat={M.copper} />
        <Tube curve={statWireOutdoor} radius={0.018} mat={M.brass} />
      </Part>

      <Part id="thermostat" base={[-1.3, 2.0, -1.35]} explode={[0.4, 0.6, -0.9]} labelY={0.45}>
        {/* wall stub */}
        <mesh position={[0, 0, -0.05]}>
          <boxGeometry args={[0.75, 1.0, 0.05]} />
          <meshStandardMaterial color="#4b4f57" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0, 0.03]}>
          <boxGeometry args={[0.3, 0.42, 0.07]} />
          <meshStandardMaterial {...M.device} />
        </mesh>
        <mesh position={[0, 0.05, 0.075]}>
          <boxGeometry args={[0.2, 0.14, 0.01]} />
          <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={0.6} />
        </mesh>
      </Part>

      {/* ================= OUTDOOR (right) ================= */}

      {/* condenser housing — backdrop */}
      <mesh position={[3.0, 0.8, 0]}>
        <boxGeometry args={[1.9, 1.6, 1.9]} />
        <meshStandardMaterial color="#9aa0ab" metalness={0.2} roughness={0.6} transparent opacity={0.28} depthWrite={false} />
      </mesh>

      <Part id="condenser-coil" base={[3.0, 0.78, 0]} explode={[1.1, 0, 0]} labelY={0.85}>
        <mesh>
          <cylinderGeometry args={[0.78, 0.78, 1.25, 20, 3, true]} />
          <meshStandardMaterial {...M.fins} wireframe side={THREE.DoubleSide} />
        </mesh>
      </Part>

      <Part id="compressor" base={[3.0, 0.42, 0.25]} explode={[0.9, 0, 1.2]} labelY={0.5}>
        <mesh>
          <cylinderGeometry args={[0.27, 0.27, 0.6, 16]} />
          <meshStandardMaterial {...M.dark} />
        </mesh>
        <mesh position={[0, 0.33, 0]}>
          <sphereGeometry args={[0.27, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial {...M.dark} />
        </mesh>
      </Part>

      <Part id="defrost-sensor" base={[3.62, 1.22, 0.28]} explode={[1.2, 0.2, 0.8]} labelY={0.22}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.03, 0.08, 4, 8]} />
          <meshStandardMaterial color="#1f2937" metalness={0.3} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.045, 0]}>
          <boxGeometry args={[0.06, 0.02, 0.05]} />
          <meshStandardMaterial {...M.device} />
        </mesh>
      </Part>

      <Part id="outdoor-air-sensor" base={[3.78, 1.5, -0.5]} explode={[1.3, 0.5, -0.7]} labelY={0.22}>
        <mesh>
          <capsuleGeometry args={[0.028, 0.07, 4, 8]} />
          <meshStandardMaterial {...M.device} />
        </mesh>
      </Part>

      <Part id="refrigerant-pressure-switches" base={[2.6, 0.72, 0.5]} explode={[-0.7, 0.15, 1.4]} labelY={0.26}>
        {[-0.05, 0.05].map((x) => (
          <mesh key={x} position={[x, 0, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.12, 8]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.7} roughness={0.3} />
          </mesh>
        ))}
        <mesh position={[0, -0.09, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.02, 0.02, 0.16, 6]} />
          <meshStandardMaterial {...M.copper} />
        </mesh>
      </Part>

      <Part id="service-valves" base={[2.38, 0.6, 0.82]} explode={[-0.8, -0.1, 1.5]} labelY={0.3}>
        {[[0, 0.13], [0.12, -0.06]].map(([x, y], i) => (
          <group key={i} position={[x, y, 0]}>
            <mesh>
              <boxGeometry args={[0.11, 0.09, 0.09]} />
              <meshStandardMaterial {...M.brass} />
            </mesh>
            <mesh position={[0, 0.07, 0]}>
              <cylinderGeometry args={[0.025, 0.025, 0.05, 8]} />
              <meshStandardMaterial color="#1f2937" metalness={0.3} roughness={0.5} />
            </mesh>
          </group>
        ))}
      </Part>

      <Part id="reversing-valve" base={[3.0, 1.1, 0.42]} explode={[1.3, 0.5, 1.0]} labelY={0.28}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.055, 0.055, 0.34, 10]} />
          <meshStandardMaterial {...M.brass} />
        </mesh>
        {[-0.09, 0, 0.09].map((x) => (
          <mesh key={x} position={[x, -0.08, 0]}>
            <cylinderGeometry args={[0.022, 0.022, 0.12, 8]} />
            <meshStandardMaterial {...M.copper} />
          </mesh>
        ))}
        {/* solenoid */}
        <mesh position={[0.16, 0.07, 0]}>
          <boxGeometry args={[0.08, 0.08, 0.08]} />
          <meshStandardMaterial {...M.dark} />
        </mesh>
      </Part>

      <Part id="condenser-fan" base={[3.0, 1.62, 0]} explode={[0, 1.1, 0]} labelY={0.45}>
        {/* venturi shroud ring */}
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.68, 0.72, 0.2, 28, 1, true]} />
          <meshStandardMaterial {...M.shell} side={THREE.DoubleSide} />
        </mesh>
        <FanBlades radius={0.62} speed={9} />
        <group position={[0, 0.13, 0]}>
          <FanGrille radius={0.66} />
        </group>
      </Part>

      <Part id="capacitor" base={[2.02, 0.95, 0.72]} explode={[-0.9, 0.3, 0.7]} labelY={0.3}>
        <mesh>
          <cylinderGeometry args={[0.1, 0.1, 0.32, 12]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.25} />
        </mesh>
      </Part>

      <Part id="contactor" base={[2.02, 0.5, 0.72]} explode={[-0.9, -0.2, 0.7]} labelY={0.28}>
        <mesh>
          <boxGeometry args={[0.2, 0.26, 0.14]} />
          <meshStandardMaterial {...M.dark} />
        </mesh>
      </Part>

      <Part id="breaker-disconnect" base={[4.35, 1.25, -0.6]} explode={[1.0, 0.4, -0.5]} labelY={0.45}>
        <mesh position={[0, 0, -0.05]}>
          <boxGeometry args={[0.6, 1.1, 0.05]} />
          <meshStandardMaterial color="#4b4f57" roughness={0.9} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.32, 0.44, 0.14]} />
          <meshStandardMaterial {...M.shell} />
        </mesh>
      </Part>

      {/* ================= REFRIGERANT LOOP ================= */}

      <Part id="refrigerant-lines" base={[0, 0, 0]} explode={[0, 0, 1.2]} labelY={1.9}>
        <Tube curve={suction} radius={0.075} mat={M.insulation} />
        <Tube curve={liquid} radius={0.035} mat={M.copper} />
      </Part>
      {/* flow dots live outside the Part so emissive isn't overridden */}
      <FlowDots curve={suction} count={7} color="#38bdf8" speed={0.12} />
      <FlowDots curve={liquid} count={7} color="#fb923c" speed={0.12} size={0.035} />
      <DripDots />
      <AirPuffs />
      <PanWater />
      <HouseShell />

      {/* lights */}
      <ambientLight intensity={0.45} />
      <hemisphereLight args={["#ffffff", "#3a3a40", 0.5]} />
      <directionalLight position={[5, 9, 5]} intensity={1.3} />
      <directionalLight position={[-6, 4, -4]} intensity={0.55} />
      <directionalLight position={[0, 3, 9]} intensity={0.35} />
      {/* procedural studio environment — gives every metal real reflections
          without fetching a single asset (CSP-safe, offline-safe) */}
      <Environment resolution={64} frames={1}>
        <Lightformer intensity={2.2} position={[0, 6, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[12, 12, 1]} color="#cdd3dd" />
        <Lightformer intensity={1.1} position={[-8, 3, 2]} rotation={[0, Math.PI / 2, 0]} scale={[8, 3, 1]} color="#9fb4d0" />
        <Lightformer intensity={0.9} position={[8, 2.5, -1]} rotation={[0, -Math.PI / 2, 0]} scale={[7, 3, 1]} color="#d9c9a8" />
        <Lightformer intensity={0.5} position={[0, 2, -9]} scale={[10, 2, 1]} color="#7d8aa0" />
      </Environment>
      {/* soft grounding shadows under both units */}
      <ContactShadowsRig />
    </>
  );
}

/* ---------------------------------------------------------------- *
 *  Canvas wrapper (default export, lazy-loaded)
 * ---------------------------------------------------------------- */

export default function HvacScene(props: HvacSceneState) {
  const ctx: Ctx = { ...props, highlight: new Set(props.highlightIds) };
  // Attract mode: slow orbit until the user interacts (or something is
  // selected/highlighted) — a still frame doesn't pull people in.
  const [interacted, setInteracted] = useState(false);
  const attract = !interacted && !props.selectedId && props.highlightIds.length === 0;
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [2.2, 4.2, 12.6], fov: 42 }}
      gl={{ antialias: true, alpha: false }}
      onCreated={({ gl }) => gl.setClearColor("#0a0a0a")}
      onPointerMissed={() => props.onSelect(null)}
      onPointerDown={() => setInteracted(true)}
      style={{ touchAction: "none" }}
    >
      <SceneCtx.Provider value={ctx}>
        <SystemModel />
      </SceneCtx.Provider>
      {/* minDistance 1.2 + pan: users can zoom INSIDE the house and walk the rooms */}
      <OrbitControls
        target={[-0.5, 1.9, 0]}
        enablePan
        enableDamping
        autoRotate={attract}
        autoRotateSpeed={0.55}
        onStart={() => setInteracted(true)}
        minDistance={1.2}
        maxDistance={20}
        maxPolarAngle={1.5}
      />
    </Canvas>
  );
}
