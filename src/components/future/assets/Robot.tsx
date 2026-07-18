"use client";
/**
 * Robot: a brand-free Optimus-class humanoid built to read as real at the
 * mid distances the city scene uses. Two-tone body language does the work:
 * satin ivory outer panels (chest, cowls, arms, legs) over a matte black
 * undersuit (waist, pelvis, collar), near-black joint spheres at shoulder,
 * elbow, hip and knee, black hands and feet, and one fully glossy black
 * head. A faint ice-blue visor strip and a tiny amber sternum LED are the
 * only lights it carries.
 *
 * Everything is generated geometry: rounded boxes, capsules, spheres, and a
 * four-sided tapered cylinder for each chamfered foot. 34 meshes total.
 * Materials live at module scope so every instance shares the same handful
 * of shader programs; only the two emissive materials are per-instance
 * because they scale with the scene dim factor.
 *
 * Animation is deterministic: time plus the phase prop drives every channel,
 * so instanced robots never sync up and a frozen render composes the same
 * pose on every machine. `frozen` holds one composed frame for
 * prefers-reduced-motion.
 */
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { useRef, type MutableRefObject } from "react";

const ICE = "#9fb4d0";
const AMBER = "#d9a860";

/* Shared, static materials: one program each across all robot instances.
   The Optimus read comes from the split, not the parts: satin ivory outer
   panels over a matte black undersuit, near-black joints at every
   articulation, and one fully glossy black head. Panels run a wider
   specular lobe so they catch rim light and stay visible against the dark
   scene. */
const SHELL = new THREE.MeshStandardMaterial({ color: "#d8d8d2", metalness: 0.25, roughness: 0.42 });
const GRAPHITE = new THREE.MeshStandardMaterial({ color: "#1a1b1e", metalness: 0.45, roughness: 0.6 });
const SILVER = new THREE.MeshStandardMaterial({ color: "#d8d8d2", metalness: 0.25, roughness: 0.42 });
const SILVER_FACET = new THREE.MeshStandardMaterial({
  color: "#1c1d20",
  metalness: 0.5,
  roughness: 0.55,
  // the feet are the one faceted design element; flat shading keeps their
  // chamfers crisp instead of ballooning across the four-sided taper
  flatShading: true,
});
const GUNMETAL = new THREE.MeshStandardMaterial({ color: "#1f2024", metalness: 0.75, roughness: 0.4 });
const SOLE = new THREE.MeshStandardMaterial({ color: "#101013", metalness: 0.3, roughness: 0.75 });
const VISOR = new THREE.MeshPhysicalMaterial({
  color: "#060608",
  metalness: 0.4,
  roughness: 0.35,
  clearcoat: 1,
  clearcoatRoughness: 0.1,
});

/** Head group height above the torso pivot; the skull rides here. */
const HEAD_Y = 0.54;

const smoothstep = THREE.MathUtils.smoothstep;

export interface RobotProps {
  pose: "walk" | "assemble" | "idle";
  /** Per-instance time offset so multiple robots never move in lockstep. */
  phase: number;
  scale?: number;
  /** Emissive multiplier; pass the scene dim factor so lights match. */
  dim?: number;
  /** prefers-reduced-motion: hold one cleanly composed frame. */
  frozen?: boolean;
}

type GroupRef = MutableRefObject<THREE.Group | null>;

export default function Robot({ pose, phase, scale = 1, dim = 1, frozen = false }: RobotProps) {
  const root = useRef<THREE.Group | null>(null);
  const pelvis = useRef<THREE.Group | null>(null);
  const torso = useRef<THREE.Group | null>(null);
  const head = useRef<THREE.Group | null>(null);
  const shL = useRef<THREE.Group | null>(null);
  const shR = useRef<THREE.Group | null>(null);
  const elL = useRef<THREE.Group | null>(null);
  const elR = useRef<THREE.Group | null>(null);
  const hipL = useRef<THREE.Group | null>(null);
  const hipR = useRef<THREE.Group | null>(null);
  const kneeL = useRef<THREE.Group | null>(null);
  const kneeR = useRef<THREE.Group | null>(null);
  const footL = useRef<THREE.Group | null>(null);
  const footR = useRef<THREE.Group | null>(null);
  const ledMat = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }) => {
    const r = root.current;
    const pv = pelvis.current;
    const to = torso.current;
    const hd = head.current;
    if (
      !r || !pv || !to || !hd ||
      !shL.current || !shR.current || !elL.current || !elR.current ||
      !hipL.current || !hipR.current || !kneeL.current || !kneeR.current ||
      !footL.current || !footR.current
    )
      return;

    // Frozen holds t at zero; phase still differentiates each instance, so a
    // reduced-motion page shows varied static poses, not clones.
    const t = frozen ? 0 : clock.elapsedTime;

    if (pose === "walk") {
      const a = t * 3.4 + phase;
      const s = Math.sin(a);
      const cSwingL = Math.max(0, Math.cos(a)); // left mid-swing window
      const cSwingR = Math.max(0, Math.cos(a + Math.PI));
      const bob = 0.03 * Math.sin(2 * a + 1.1);

      r.position.y = bob;
      pv.rotation.z = 0.062 * s; // ~3.5 degree hip sway
      to.rotation.x = 0.085; // slight forward lean into the stride
      to.rotation.y = -0.05 * s; // shoulders counter-rotate the hips
      // stabilized head: cancels most of the sway and half the pelvis bob
      hd.position.y = HEAD_Y - bob * 0.6;
      hd.rotation.set(0.02, 0, -0.05 * s);

      hipL.current.rotation.x = -0.52 * s;
      hipR.current.rotation.x = 0.52 * s;
      // knee flexion only on the swing leg, peaking mid-swing
      kneeL.current.rotation.x = 0.95 * cSwingL * cSwingL;
      kneeR.current.rotation.x = 0.95 * cSwingR * cSwingR;
      // heel lift at push-off, a touch of toe-up before heel strike
      const liftL = Math.max(0, -s);
      const liftR = Math.max(0, s);
      footL.current.rotation.x = 0.5 * liftL * liftL * liftL - 0.18 * liftR * liftR;
      footR.current.rotation.x = 0.5 * liftR * liftR * liftR - 0.18 * liftL * liftL;

      // arms counter-phase to their own leg, elbow flexing on the fore-swing
      shL.current.rotation.x = 0.42 * s;
      shR.current.rotation.x = -0.42 * s;
      elL.current.rotation.x = -0.28 + 0.25 * Math.min(0, s);
      elR.current.rotation.x = -0.28 - 0.25 * Math.max(0, s);
    } else if (pose === "assemble") {
      // kneel-and-reach loop: right knee down, left foot planted forward in a
      // lunge, right arm reaches to a low point, pauses, retracts
      const cyc = ((t * 0.32 + phase * 0.17) % 1 + 1) % 1;
      const reach =
        smoothstep(cyc, 0.06, 0.42) * (1 - smoothstep(cyc, 0.6, 0.94));

      r.position.y = -0.42 + 0.006 * Math.sin(t * 1.6 + phase);
      pv.rotation.z = 0.02;
      to.rotation.x = 0.16 + 0.14 * reach; // torso leans into the reach
      to.rotation.y = -0.3 * reach; // and twists toward the working arm
      hd.position.y = HEAD_Y;
      hd.rotation.set(0.24 + 0.12 * reach, -0.18 * reach, 0);

      hipL.current.rotation.x = -1.35; // planted lunge leg
      kneeL.current.rotation.x = 0.52;
      footL.current.rotation.x = 0.83; // sole flat on the ground
      hipR.current.rotation.x = 0.35; // kneeling leg, shin folded back
      kneeR.current.rotation.x = 1.6;
      footR.current.rotation.x = 0.6;

      shR.current.rotation.x = -0.55 - 0.78 * reach; // working arm
      elR.current.rotation.x = -0.95 + 0.8 * reach; // extends as it reaches
      shL.current.rotation.x = -0.85; // off arm braced on the knee
      elL.current.rotation.x = -0.55;
    } else {
      // idle: micro weight shift plus a slow head sweep
      const s1 = Math.sin(t * 0.55 + phase);
      r.position.y = 0.006 * Math.sin(t * 1.1 + phase);
      pv.rotation.z = 0.028 * s1;
      to.rotation.x = 0.03;
      to.rotation.y = 0.04 * Math.sin(t * 0.31 + phase);
      hd.position.y = HEAD_Y;
      hd.rotation.set(0.03, 0.42 * Math.sin(t * 0.19 + phase * 1.7), -0.02 * s1);

      hipL.current.rotation.x = 0.02 * s1;
      hipR.current.rotation.x = -0.02 * s1;
      kneeL.current.rotation.x = 0.05;
      kneeR.current.rotation.x = 0.05;
      footL.current.rotation.x = 0;
      footR.current.rotation.x = 0;
      shL.current.rotation.x = 0.05 * Math.sin(t * 0.5 + phase + 1.2);
      shR.current.rotation.x = 0.05 * Math.sin(t * 0.5 + phase + 2.6);
      elL.current.rotation.x = -0.18;
      elR.current.rotation.x = -0.18;
    }

    if (ledMat.current)
      ledMat.current.emissiveIntensity =
        (0.75 + 0.35 * Math.sin(t * 2.3 + phase * 3)) * dim;
  });

  /* Two-segment arm: gunmetal shoulder sphere, graphite upper arm, silver
     forearm, mitt hand (palm plus thumb) that reads as five fingers at any
     distance the scene actually shows. Static wrapper carries the resting
     outward splay so useFrame only ever touches rotation.x. */
  const arm = (side: 1 | -1, sh: GroupRef, el: GroupRef) => (
    <group position={[side * 0.245, 0.335, 0]} rotation={[0, 0, side * 0.07]}>
      <group ref={sh}>
        <mesh material={GUNMETAL}>
          <sphereGeometry args={[0.056, 12, 10]} />
        </mesh>
        <mesh material={SILVER} position={[0, -0.145, 0]}>
          <capsuleGeometry args={[0.046, 0.2, 4, 10]} />
        </mesh>
        <group ref={el} position={[0, -0.29, 0]}>
          <mesh material={GUNMETAL}>
            <sphereGeometry args={[0.05, 12, 10]} />
          </mesh>
          <mesh material={SILVER} position={[0, -0.135, 0]}>
            <capsuleGeometry args={[0.04, 0.18, 4, 10]} />
          </mesh>
          <RoundedBox
            args={[0.065, 0.1, 0.042]}
            radius={0.014}
            smoothness={2}
            material={GUNMETAL}
            position={[0, -0.305, 0]}
          />
          <RoundedBox
            args={[0.024, 0.055, 0.03]}
            radius={0.008}
            smoothness={2}
            material={GUNMETAL}
            position={[side * -0.045, -0.275, 0.012]}
            rotation={[0.25, 0, side * -0.35]}
          />
        </group>
      </group>
    </group>
  );

  /* Leg: gunmetal hip sphere, graphite thigh, knee sphere, silver shin, and
     a chamfered wedge foot (four-sided tapered cylinder, flat shaded) over a
     thin dark sole. */
  const leg = (side: 1 | -1, hip: GroupRef, knee: GroupRef, foot: GroupRef) => (
    <group position={[side * 0.095, -0.07, 0]}>
      <group ref={hip}>
        <mesh material={GUNMETAL}>
          <sphereGeometry args={[0.062, 12, 10]} />
        </mesh>
        <mesh material={SILVER} position={[0, -0.175, 0]}>
          <capsuleGeometry args={[0.06, 0.23, 4, 10]} />
        </mesh>
        <group ref={knee} position={[0, -0.36, 0]}>
          <mesh material={GUNMETAL}>
            <sphereGeometry args={[0.055, 12, 10]} />
          </mesh>
          <mesh material={SILVER} position={[0, -0.19, 0]}>
            <capsuleGeometry args={[0.048, 0.25, 4, 10]} />
          </mesh>
          <group ref={foot} position={[0, -0.415, 0]}>
            <mesh material={SILVER_FACET} position={[0, -0.024, 0.035]} scale={[1, 1, 2]}>
              {/* thetaStart PI/4 turns the square cross-section so its flats
                  face forward; the taper is the chamfer */}
              <cylinderGeometry args={[0.05, 0.076, 0.06, 4, 1, false, Math.PI / 4]} />
            </mesh>
            <mesh material={SOLE} position={[0, -0.06, 0.035]}>
              <boxGeometry args={[0.115, 0.016, 0.235]} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );

  return (
    <group scale={scale}>
      <group ref={root}>
        <group ref={pelvis} position={[0, 0.92, 0]}>
          {/* pelvis: black undersuit block; legs hang from it */}
          <RoundedBox
            args={[0.27, 0.15, 0.175]}
            radius={0.04}
            smoothness={2}
            material={GRAPHITE}
            position={[0, -0.02, 0]}
          />
          {leg(-1, hipL, kneeL, footL)}
          {leg(1, hipR, kneeR, footR)}

          <group ref={torso} position={[0, 0.16, 0]}>
            {/* graphite core, deliberately narrower than the chest shell so
                the waist seam shows the inner layer */}
            <mesh material={GRAPHITE} position={[0, -0.01, 0]}>
              <boxGeometry args={[0.22, 0.24, 0.15]} />
            </mesh>
            <RoundedBox
              args={[0.36, 0.33, 0.215]}
              radius={0.05}
              smoothness={3}
              material={SHELL}
              position={[0, 0.225, 0]}
            />
            {/* collar */}
            <mesh material={GRAPHITE} position={[0, 0.415, 0]}>
              <cylinderGeometry args={[0.062, 0.075, 0.055, 12]} />
            </mesh>
            {/* shoulder cowls sloping off the chest line */}
            <RoundedBox
              args={[0.115, 0.085, 0.15]}
              radius={0.028}
              smoothness={2}
              material={SHELL}
              position={[-0.205, 0.36, 0]}
              rotation={[0, 0, 0.32]}
            />
            <RoundedBox
              args={[0.115, 0.085, 0.15]}
              radius={0.028}
              smoothness={2}
              material={SHELL}
              position={[0.205, 0.36, 0]}
              rotation={[0, 0, -0.32]}
            />
            {/* recessed amber status LED on the sternum */}
            <mesh position={[0, 0.29, 0.109]}>
              <boxGeometry args={[0.02, 0.02, 0.01]} />
              <meshStandardMaterial
                ref={ledMat}
                color="#1a1206"
                emissive={AMBER}
                emissiveIntensity={0.9 * dim}
                metalness={0.2}
                roughness={0.5}
              />
            </mesh>

            {arm(-1, shL, elL)}
            {arm(1, shR, elR)}

            <group ref={head} position={[0, HEAD_Y, 0]}>
              {/* the whole head is one glossy black dome, per the reference */}
              <RoundedBox
                args={[0.175, 0.21, 0.195]}
                radius={0.06}
                smoothness={3}
                material={VISOR}
                position={[0, 0.02, 0]}
              />
              {/* full-width glossy visor band, slightly proud of the skull */}
              <RoundedBox
                args={[0.185, 0.078, 0.205]}
                radius={0.035}
                smoothness={3}
                material={VISOR}
                position={[0, 0.045, 0.004]}
              />
              {/* faint ice strip riding the visor face */}
              <mesh position={[0, 0.045, 0.108]}>
                <boxGeometry args={[0.125, 0.016, 0.006]} />
                <meshStandardMaterial
                  color="#0b0e12"
                  emissive={ICE}
                  emissiveIntensity={0.7 * dim}
                  metalness={0.1}
                  roughness={0.4}
                />
              </mesh>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}
