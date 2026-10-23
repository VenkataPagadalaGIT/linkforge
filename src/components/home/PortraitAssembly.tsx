"use client";
/**
 * PortraitAssembly: the owner's photo built from sixteen thousand pieces.
 *
 * Every particle carries one pixel of the portrait. They swarm in from a
 * scattered shell and lock into place bottom-up, like a wall being laid, and
 * the finished portrait never quite freezes: it breathes, the cursor pushes
 * particles aside like dust, and they heal back into the image. Clicking
 * scatters the whole face and rebuilds it.
 *
 * One draw call: THREE.Points with a custom shader. The image is sampled
 * once into per-particle attributes (target position, colour, delay), so no
 * texture is read at render time and the effect costs almost nothing.
 *
 * The twin (2026-10-23, Higgsfield clips made from the owner's own photo,
 * approved by him): the face is split by the banner's seam (TwinSeam).
 * Left of it he is himself, a living video (breathing, a blink, a warm
 * smile); right of it he is his AI twin, the same frames re-rendered as an
 * android replica. Both halves live in ONE packed video, so they can never
 * drift apart. The seam arrives in clip space every frame; the crisp layer,
 * the dust and the neural net all split on it, and the dust burns cyan where
 * it passes. A click still shatters the face, and now hands the whole
 * banner to the twin and back. Reduced motion and Save-Data get the two
 * stills, never the video, and the video loads only after the face assembles.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { HERO_PORTRAIT } from "@/data/heroPortrait";
import { createTwin, type Twin } from "./twin";

const PHOTO = "/venkata-pagadala.jpeg";
/** Particles per side of the sampling grid. */
const N = 256;
/** Seconds for a full assembly. */
const BUILD_S = 2.8;
/** The fired chain glows radium, on either theme. */
const RADIUM = "#36ffb0";
/** The twin's colour: its neural net, and the seam's burn in the dust. */
const TWIN_CYAN = "#22d3ee";

interface Sampled {
  targets: Float32Array;
  starts: Float32Array;
  colors: Float32Array;
  /** The same grid sampled from the AI twin's still: the dust's colour right of the seam. */
  colors2: Float32Array;
  delays: Float32Array;
  alphas: Float32Array;
  /** Pseudo-depth per tile from luminance: the lit face sits proud of the
   *  dark room, so tilting the portrait parallaxes like a 3D render. */
  depths: Float32Array;
  count: number;
  /** Neuron positions at the face's feature-dense points. */
  neurons: Float32Array;
  neuronCount: number;
  /** Edge segment endpoints (pairs) and a shared phase per vertex. */
  edges: Float32Array;
  edgePhases: Float32Array;
  edgeVertexCount: number;
}

/** One image onto the N x N grid, as RGBA bytes. */
function gridPixels(img: HTMLImageElement): Uint8ClampedArray {
  const c = document.createElement("canvas");
  c.width = N;
  c.height = N;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  const s = Math.min(img.width, img.height);
  ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, N, N);
  return ctx.getImageData(0, 0, N, N).data;
}

function sampleImage(img: HTMLImageElement, imgTwin?: HTMLImageElement | null): Sampled {
  const c = document.createElement("canvas");
  c.width = N;
  c.height = N;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  const s = Math.min(img.width, img.height);
  ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, N, N);
  const data = ctx.getImageData(0, 0, N, N).data;

  const count = N * N;
  const targets = new Float32Array(count * 3);
  const starts = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  // without the twin's still the dust keeps his colours on both sides of the seam
  const data2 = imgTwin ? gridPixels(imgTwin) : data;
  const colors2 = new Float32Array(count * 3);
  const delays = new Float32Array(count);
  const alphas = new Float32Array(count);

  const depths = new Float32Array(count);
  let i = 0;
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const px = (y * N + x) * 4;
      const nx = x / (N - 1) - 0.5; // -0.5..0.5
      const ny = 0.5 - y / (N - 1);
      depths[i] = ((0.299 * data[px] + 0.587 * data[px + 1] + 0.114 * data[px + 2]) / 255) * 0.055;
      targets[i * 3] = nx;
      targets[i * 3 + 1] = ny;
      targets[i * 3 + 2] = 0;
      // scattered shell: outside the frame, biased toward the camera
      const a = Math.random() * Math.PI * 2;
      const r = 0.75 + Math.random() * 0.6;
      starts[i * 3] = Math.cos(a) * r;
      starts[i * 3 + 1] = Math.sin(a) * r * 0.8 - 0.15;
      starts[i * 3 + 2] = 0.25 + Math.random() * 0.55;
      colors[i * 3] = data[px] / 255;
      colors[i * 3 + 1] = data[px + 1] / 255;
      colors[i * 3 + 2] = data[px + 2] / 255;
      colors2[i * 3] = data2[px] / 255;
      colors2[i * 3 + 1] = data2[px + 1] / 255;
      colors2[i * 3 + 2] = data2[px + 2] / 255;
      // laid bottom-up, with grain so rows shimmer instead of snapping
      delays[i] = (1 - (ny + 0.5)) * 0.55 + Math.random() * 0.22;
      // No rectangle anywhere: density falls off radially, so the portrait
      // condenses out of the page instead of sitting on it as a card. The
      // centre sits at the face, not the geometric middle.
      const radial = Math.hypot(nx * 2, (ny - 0.08) * 1.85);
      alphas[i] = THREE.MathUtils.smoothstep(1.0 - radial, 0.0, 0.5);
      i++;
    }
  }

  // The neural layer: neurons sit where the face has the most detail. One
  // candidate per super-cell, kept only where local contrast is real, so the
  // net hugs eyes, beard and lapels instead of the flat wall behind.
  const lum = (x: number, y: number) => {
    const px = (y * N + x) * 4;
    return 0.299 * data[px] + 0.587 * data[px + 1] + 0.114 * data[px + 2];
  };
  const cells = 12;
  const step = Math.floor(N / cells);
  const picked: [number, number][] = [];
  for (let cy = 0; cy < cells; cy++) {
    for (let cx = 0; cx < cells; cx++) {
      let best = -1, bx = 0, by = 0;
      for (let y = cy * step + 1; y < (cy + 1) * step - 1; y += 2) {
        for (let x = cx * step + 1; x < (cx + 1) * step - 1; x += 2) {
          const g = Math.abs(lum(x + 1, y) - lum(x - 1, y)) + Math.abs(lum(x, y + 1) - lum(x, y - 1));
          if (g > best) { best = g; bx = x; by = y; }
        }
      }
      if (best > 26) picked.push([bx, by]);
    }
  }
  const neurons = new Float32Array(picked.length * 3);
  picked.forEach(([x, y], j) => {
    neurons[j * 3] = x / (N - 1) - 0.5;
    neurons[j * 3 + 1] = 0.5 - y / (N - 1);
    neurons[j * 3 + 2] = 0.012;
  });

  // Each neuron reaches for its two nearest peers; duplicate pairs collapse.
  const pairKey = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`);
  const seen = new Set<string>();
  const segs: number[] = [];
  const phases: number[] = [];
  for (let a = 0; a < picked.length; a++) {
    const dists = picked
      .map((_, b) => ({ b, d: b === a ? Infinity : (neurons[a * 3] - neurons[b * 3]) ** 2 + (neurons[a * 3 + 1] - neurons[b * 3 + 1]) ** 2 }))
      .sort((u, v) => u.d - v.d)
      .slice(0, 2);
    for (const { b, d } of dists) {
      if (d > 0.045 || seen.has(pairKey(a, b))) continue;
      seen.add(pairKey(a, b));
      const ph = Math.random();
      segs.push(
        neurons[a * 3], neurons[a * 3 + 1], neurons[a * 3 + 2],
        neurons[b * 3], neurons[b * 3 + 1], neurons[b * 3 + 2],
      );
      phases.push(ph, ph);
    }
  }

  return {
    targets, starts, colors, colors2, delays, alphas, depths, count,
    neurons, neuronCount: picked.length,
    edges: new Float32Array(segs),
    edgePhases: new Float32Array(phases),
    edgeVertexCount: phases.length,
  };
}

const VERT = /* glsl */ `
attribute vec3 aTarget;
attribute vec3 aStart;
attribute vec3 aColor;
attribute vec3 aColor2;
attribute float aDelay;
attribute float aAlpha;
attribute float aDepth;
uniform float uSeam; // the seam's x in clip space: right of it the dust takes the twin's colours
uniform float uT;
uniform float uTime;
uniform vec3 uMouse;
uniform float uPixel;
uniform vec3 uFire; // x, y: origin; z: time the chain was fired
varying vec3 vColor;
varying float vAlpha;
varying float vWave;

void main() {
  float p = clamp((uT - aDelay) / 0.42, 0.0, 1.0);
  p = 1.0 - pow(1.0 - p, 3.0);
  vec3 pos = mix(aStart, aTarget, p);
  // luminance depth: the lit face rides proud of the room, so any tilt
  // parallaxes the portrait like a true 3D render
  pos.z += aDepth * p;
  // alive: a faint breath across the assembled face
  pos.z += sin(uTime * 1.3 + aTarget.x * 18.0 + aTarget.y * 14.0) * 0.006 * p;
  // edge dust: the sparse rim drifts loose, a citizen of the background
  float loose = 1.0 - aAlpha;
  pos.xy += (aStart.xy - aTarget.xy) * loose * 0.1;
  pos.x += sin(uTime * 0.5 + aTarget.y * 30.0) * loose * 0.02;
  pos.y += cos(uTime * 0.4 + aTarget.x * 30.0) * loose * 0.02;
  // the cursor breaks pieces loose where it touches; they heal behind it
  vec2 dm = pos.xy - uMouse.xy;
  float distM = length(dm);
  float push = smoothstep(0.1, 0.0, distM) * p;
  pos.xy += normalize(dm + 1e-4) * push * 0.05;
  pos.z += push * 0.045;
  // a click shatters the WHOLE image: pieces fly outward on their own
  // scatter directions and the envelope carries every one of them home
  float eAge = uTime - uFire.z;
  if (uFire.z > 0.0 && eAge > 0.0 && eAge < 1.4) {
    float env = sin(3.14159 * eAge / 1.4);
    vec3 dir = normalize(aStart - aTarget + vec3(0.0, 0.0, 0.15));
    pos += dir * env * 0.26 * p;
  }

  // a fired chain ripples outward from the click as a travelling ring
  float age = uTime - uFire.z;
  float wave = 0.0;
  if (uFire.z > 0.0 && age < 2.5) {
    float ring = length(aTarget.xy - uFire.xy) - age * 0.5;
    wave = exp(-ring * ring * 180.0) * (1.0 - age / 2.5) * p;
  }
  pos.z += wave * 0.03;
  vWave = wave;

  // the twin: measured where the piece lands on screen, so the split follows
  // the page's seam exactly through any tilt; the seam burns cyan in the dust
  // and lifts the pieces it crosses
  vec4 cp = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  float sx = cp.x / cp.w;
  float twin = smoothstep(uSeam - 0.012, uSeam + 0.012, sx);
  float onLine = exp(-pow((sx - uSeam) / 0.022, 2.0));
  pos.z += onLine * 0.012 * p;

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uPixel / -mv.z;
  vColor = mix(aColor, aColor2, twin) + vec3(0.13, 0.83, 0.93) * onLine * 0.7;
  vAlpha = aAlpha * (0.25 + 0.75 * p);
}
`;

const FRAG = /* glsl */ `
uniform vec3 uFireColor;
varying vec3 vColor;
varying float vAlpha;
varying float vWave;
void main() {
  // solid tiles with a hair of antialiasing at the rim: they must seal the
  // surface, or the page colour bleeds through every seam on light theme
  vec2 q = abs(gl_PointCoord - 0.5);
  float m = smoothstep(0.5, 0.475, max(q.x, q.y));
  if (m < 0.01) discard;
  // the travelling ring burns radium, not white
  vec3 col = mix(vColor, uFireColor, clamp(vWave * 1.3, 0.0, 0.85));
  col += vWave * 0.2;
  gl_FragColor = vec4(col, m * vAlpha);
}
`;

const FIRE_WAVE = /* glsl */ `
uniform vec3 uFire;
float fireWave(vec2 at, float time) {
  float age = time - uFire.z;
  if (uFire.z <= 0.0 || age >= 2.5) return 0.0;
  float ring = length(at - uFire.xy) - age * 0.5;
  return exp(-ring * ring * 140.0) * (1.0 - age / 2.5);
}
`;

const NET_VERT = /* glsl */ `
attribute float aPhase;
uniform float uTime;
uniform float uSeam;
${FIRE_WAVE}
varying float vPhase;
varying float vWave;
varying float vTwin;
void main() {
  vPhase = aPhase;
  vWave = fireWave(position.xy, uTime);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  vTwin = smoothstep(uSeam - 0.012, uSeam + 0.012, gl_Position.x / gl_Position.w);
}
`;

const NET_FRAG = /* glsl */ `
uniform float uTime;
uniform float uT;
uniform vec3 uColor;
uniform vec3 uTwinColor;
uniform vec3 uFireColor;
uniform float uOpacity;
varying float vPhase;
varying float vWave;
varying float vTwin;
void main() {
  // signals idle across the net; a click fires the chains in radium
  float on = smoothstep(0.78, 1.0, uT);
  float pulse = 0.3 + 0.7 * pow(0.5 + 0.5 * sin(uTime * 1.7 + vPhase * 6.2832), 2.0);
  float a = (uOpacity + vTwin * 0.12) * pulse + vWave * 1.1;
  vec3 col = mix(mix(uColor, uTwinColor, vTwin), uFireColor, clamp(vWave * 1.6, 0.0, 1.0));
  gl_FragColor = vec4(col, a * on);
}
`;

const NODE_VERT = /* glsl */ `
uniform float uPixel;
uniform float uTime;
uniform float uSeam;
${FIRE_WAVE}
varying float vSeed;
varying float vWave;
varying float vTwin;
void main() {
  vWave = fireWave(position.xy, uTime);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = (uPixel * (1.0 + vWave * 1.4)) / -mv.z;
  vSeed = position.x * 37.0 + position.y * 91.0;
  vTwin = smoothstep(uSeam - 0.012, uSeam + 0.012, gl_Position.x / gl_Position.w);
}
`;

const NODE_FRAG = /* glsl */ `
uniform float uTime;
uniform float uT;
uniform vec3 uColor;
uniform vec3 uTwinColor;
uniform vec3 uFireColor;
uniform float uOpacity;
varying float vSeed;
varying float vWave;
varying float vTwin;
void main() {
  float on = smoothstep(0.78, 1.0, uT);
  float d = length(gl_PointCoord - 0.5);
  float m = smoothstep(0.5, 0.12, d);
  float pulse = 0.5 + 0.5 * sin(uTime * 2.1 + vSeed);
  float a = uOpacity * (0.4 + 0.6 * pulse) + vWave * 1.2;
  vec3 col = mix(mix(uColor, uTwinColor, vTwin), uFireColor, clamp(vWave * 1.6, 0.0, 1.0));
  gl_FragColor = vec4(col, m * a * on);
}
`;

interface FireReq {
  x: number;
  y: number;
  pending: boolean;
  /** ONE Vector3 shared by every material's uFire uniform, so a single
   *  writer updates the tiles, edges and neurons in the same frame. */
  vec: THREE.Vector3;
  /** While the pointer is over the portrait, the crisp photo dissolves. */
  hover: boolean;
}

const CRISP_FRAG = /* glsl */ `
uniform sampler2D uHuman;  // his photo
uniform sampler2D uTwin;   // the twin's still
uniform sampler2D uPacked; // the living video: him on the left half, the twin on the right
uniform float uVideo;      // 0 the stills, 1 the video, crossfaded when it starts
uniform float uSeam;       // the seam's x in clip space
uniform vec2 uRes;         // the drawing buffer, to place this fragment in clip space
uniform float uOpacity;
varying vec2 vUv;
void main() {
  // crisp only where the face lives; the perimeter belongs to the dust, so
  // no rectangle ever appears on the page
  vec2 d = (vUv - vec2(0.5, 0.58)) * vec2(2.0, 1.85);
  float a = smoothstep(0.92, 0.5, length(d)) * uOpacity;
  float sx = gl_FragCoord.x / uRes.x * 2.0 - 1.0;
  float twin = smoothstep(uSeam - 0.004, uSeam + 0.004, sx);
  // each half of the packed frame, kept a texel clear of the middle so the
  // two never bleed into each other
  float u = clamp(vUv.x, 0.002, 0.998) * 0.5;
  vec3 human = mix(texture2D(uHuman, vUv).rgb, texture2D(uPacked, vec2(u, vUv.y)).rgb, uVideo);
  vec3 ai = mix(texture2D(uTwin, vUv).rgb, texture2D(uPacked, vec2(0.5 + u, vUv.y)).rgb, uVideo);
  vec3 col = mix(human, ai, twin);
  // light spill from the seam onto the skin either side of it
  col += vec3(0.13, 0.83, 0.93) * exp(-pow((sx - uSeam) / 0.03, 2.0)) * 0.22;
  gl_FragColor = vec4(col, a);
}
`;

/**
 * The crisp photograph itself, crossfaded in whenever the portrait is at
 * rest. A mosaic can never out-resolve its source, so at rest the reader
 * sees the real pixels; firing it hands the surface back to the particles.
 * Same vignette as the tiles, so the swap is seamless. Split by the seam:
 * him on the left, the twin on the right, from stills until the packed
 * video plays, then from the video.
 */
function CrispPhoto({
  clockRef,
  fireRef,
  twin,
}: {
  clockRef: React.MutableRefObject<{ t: number }>;
  fireRef: React.MutableRefObject<FireReq>;
  twin: Twin;
}) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const load = (src: string) => {
    const t = new THREE.TextureLoader().load(src);
    // Raw sRGB, not SRGBColorSpace: this shader writes what it samples, with no
    // output conversion, so a hardware-decoded (linear) photo came out about
    // 40% too dark beside the video frames and the dust, which are both raw.
    t.colorSpace = THREE.NoColorSpace;
    t.anisotropy = 8;
    return t;
  };
  const photoTex = useMemo(() => load(PHOTO), []);
  const twinTex = useMemo(() => load(HERO_PORTRAIT.aiStill.src), []);
  // The packed video. Created only once the dust has settled, so it never
  // competes with the page's first paint; never created for reduced motion or
  // Save-Data, where the two stills carry the split.
  const media = useRef<{ started: boolean; el?: HTMLVideoElement; tex?: THREE.VideoTexture; ready: boolean }>({
    started: false,
    ready: false,
  });
  const allowVideo = useMemo(() => {
    if (typeof window === "undefined") return false;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const saveData = (navigator as unknown as { connection?: { saveData?: boolean } }).connection?.saveData;
    return !reduce && !saveData;
  }, []);
  const { gl } = useThree();
  const onscreen = useRef(true);
  const startMedia = () => {
    const md = media.current;
    if (md.started || !allowVideo) return;
    md.started = true;
    const vp9 = document.createElement("video").canPlayType('video/webm; codecs="vp9"') !== "";
    const el = document.createElement("video");
    el.muted = true;
    el.defaultMuted = true;
    el.setAttribute("muted", "");
    el.playsInline = true;
    el.setAttribute("playsinline", "");
    el.loop = true;
    el.preload = "auto";
    el.src = vp9 ? HERO_PORTRAIT.twin.webm : HERO_PORTRAIT.twin.mp4;
    const tex = new THREE.VideoTexture(el);
    tex.colorSpace = THREE.NoColorSpace; // raw, like the stills and the dust
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    md.el = el;
    md.tex = tex;
    el.addEventListener("playing", () => (md.ready = true), { once: true });
    // autoplay can be refused (iOS low-power mode): then the stills stay, and nothing breaks
    if (onscreen.current && !document.hidden) el.play().catch(() => {});
  };
  // the video plays only while the face is on screen and the tab is visible;
  // everything is freed on unmount
  useEffect(() => {
    const sync = () => {
      const el = media.current.el;
      if (!el) return;
      if (onscreen.current && !document.hidden) el.play().catch(() => {});
      else el.pause();
    };
    const io = new IntersectionObserver(([e]) => {
      onscreen.current = e.isIntersecting;
      sync();
    });
    io.observe(gl.domElement);
    document.addEventListener("visibilitychange", sync);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      const md = media.current;
      if (md.el) {
        md.el.pause();
        md.el.removeAttribute("src");
        md.el.load();
      }
      md.tex?.dispose();
      photoTex.dispose();
      twinTex.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const uniforms = useMemo(
    () => ({
      uHuman: { value: photoTex as THREE.Texture },
      uTwin: { value: twinTex as THREE.Texture },
      // a placeholder until the video exists; weighted to zero by uVideo
      uPacked: { value: photoTex as THREE.Texture },
      uVideo: { value: 0 },
      uSeam: { value: 2 },
      uRes: { value: new THREE.Vector2(1, 1) },
      uOpacity: { value: 0 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  useFrame((state, delta) => {
    const m = mat.current;
    if (!m) return;
    const md = media.current;
    if (clockRef.current.t >= 1.28) startMedia();
    // The face stays crisp at all times: it steps aside only for the click
    // shatter, when the pieces ARE the picture.
    const fireAge = state.clock.elapsedTime - fireRef.current.vec.z;
    const fireActive = fireRef.current.vec.z > 0 && fireAge < 2.0;
    if (md.ready && md.tex) {
      m.uniforms.uPacked.value = md.tex;
      m.uniforms.uVideo.value = Math.min(1, (m.uniforms.uVideo.value as number) + delta / 0.4);
    }
    m.uniforms.uSeam.value = twin.seamNdc;
    (m.uniforms.uRes.value as THREE.Vector2).set(state.size.width * state.viewport.dpr, state.size.height * state.viewport.dpr);
    const want = clockRef.current.t >= 1.28 && !fireActive ? 1 : 0;
    const cur = m.uniforms.uOpacity.value as number;
    m.uniforms.uOpacity.value = cur + (want - cur) * Math.min(1, delta * (want ? 2.2 : 8));
    // measurement hook for the QA harness
    (window as unknown as { __portraitTwin?: unknown }).__portraitTwin = {
      seam: +twin.seamNdc.toFixed(3),
      video: allowVideo,
      showing: (m.uniforms.uVideo.value as number) > 0.5 ? "video" : "stills",
      videoT: md.el ? +md.el.currentTime.toFixed(2) : null,
      opacity: +(m.uniforms.uOpacity.value as number).toFixed(2),
    };
  });
  return (
    <mesh position={[0, 0, 0.006]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={mat}
        transparent
        depthWrite={false}
        uniforms={uniforms}
        vertexShader={`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`}
        fragmentShader={CRISP_FRAG}
      />
    </mesh>
  );
}

function Cloud({
  sampled,
  clockRef,
  fireRef,
  twin,
}: {
  sampled: Sampled;
  clockRef: React.MutableRefObject<{ t: number }>;
  fireRef: React.MutableRefObject<FireReq>;
  twin: Twin;
}) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const { viewport } = useThree();

  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    // position is required by three even though the shader ignores it
    g.setAttribute("position", new THREE.BufferAttribute(sampled.targets, 3));
    g.setAttribute("aTarget", new THREE.BufferAttribute(sampled.targets, 3));
    g.setAttribute("aStart", new THREE.BufferAttribute(sampled.starts, 3));
    g.setAttribute("aColor", new THREE.BufferAttribute(sampled.colors, 3));
    g.setAttribute("aColor2", new THREE.BufferAttribute(sampled.colors2, 3));
    g.setAttribute("aDelay", new THREE.BufferAttribute(sampled.delays, 1));
    g.setAttribute("aAlpha", new THREE.BufferAttribute(sampled.alphas, 1));
    g.setAttribute("aDepth", new THREE.BufferAttribute(sampled.depths, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 2);
    return g;
  }, [sampled]);
  useEffect(() => () => geom.dispose(), [geom]);

  const uniforms = useMemo(
    () => ({
      uT: { value: 0 },
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector3(99, 99, 0) },
      uPixel: { value: 4.0 },
      uFire: { value: fireRef.current.vec },
      uFireColor: { value: new THREE.Color(RADIUM) },
      uSeam: { value: 2 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useFrame((state, delta) => {
    const m = mat.current;
    if (!m) return;
    clockRef.current.t = Math.min(1.3, clockRef.current.t + delta / BUILD_S);
    // the banner's opening sweep waits for this: it needs a face to cross
    twin.assembly = clockRef.current.t;
    m.uniforms.uT.value = clockRef.current.t;
    m.uniforms.uTime.value = state.clock.elapsedTime;
    m.uniforms.uSeam.value = twin.seamNdc;
    m.uniforms.uMouse.value.set(
      (state.pointer.x * viewport.width) / 2,
      (state.pointer.y * viewport.height) / 2,
      0,
    );
    if (fireRef.current.pending) {
      fireRef.current.pending = false;
      // writes the SHARED vector: tiles, edges and neurons all fire together
      fireRef.current.vec.set(
        (fireRef.current.x * viewport.width) / 2,
        (fireRef.current.y * viewport.height) / 2,
        state.clock.elapsedTime,
      );
    }
    // Tile size from the actual projection: world cell size 1/N, projected
    // through the camera at the tile plane, in device pixels, with overlap.
    // Sizing tiles from CSS cell counts left one-pixel seams that read as a
    // white mesh over the whole face on the light theme.
    const cam = state.camera as THREE.PerspectiveCamera;
    const projected =
      ((1 / N) * state.size.height * state.viewport.dpr) /
      (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)));
    m.uniforms.uPixel.value = projected * 1.18;
    // measurement hook: lets a test read the real tile-vs-cell arithmetic
    (window as any).__portrait = {
      uPixel: m.uniforms.uPixel.value,
      camZ: cam.position.z,
      bufferH: state.size.height * state.viewport.dpr,
    };
  });

  return (
    <points geometry={geom}>
      <shaderMaterial
        ref={mat}
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </points>
  );
}

/** The neural layer: pulsing edges and neurons over the assembled face. */
function Net({
  sampled,
  clockRef,
  fireRef,
  isDark,
  twin,
}: {
  sampled: Sampled;
  clockRef: React.MutableRefObject<{ t: number }>;
  fireRef: React.MutableRefObject<FireReq>;
  isDark: boolean;
  twin: Twin;
}) {
  const lineMat = useRef<THREE.ShaderMaterial>(null);
  const nodeMat = useRef<THREE.ShaderMaterial>(null);

  const lineGeom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(sampled.edges, 3));
    g.setAttribute("aPhase", new THREE.BufferAttribute(sampled.edgePhases, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 2);
    return g;
  }, [sampled]);
  const nodeGeom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(sampled.neurons, 3));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 2);
    return g;
  }, [sampled]);
  useEffect(
    () => () => {
      lineGeom.dispose();
      nodeGeom.dispose();
    },
    [lineGeom, nodeGeom],
  );

  const lineUniforms = useMemo(
    () => ({ uTime: { value: 0 }, uT: { value: 0 }, uColor: { value: new THREE.Color("#ffffff") }, uTwinColor: { value: new THREE.Color(TWIN_CYAN) }, uFireColor: { value: new THREE.Color(RADIUM) }, uOpacity: { value: 0.13 }, uFire: { value: fireRef.current.vec }, uSeam: { value: 2 } }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const nodeUniforms = useMemo(
    () => ({ uTime: { value: 0 }, uT: { value: 0 }, uColor: { value: new THREE.Color("#ffffff") }, uTwinColor: { value: new THREE.Color(TWIN_CYAN) }, uFireColor: { value: new THREE.Color(RADIUM) }, uOpacity: { value: 0.55 }, uPixel: { value: 6 }, uFire: { value: fireRef.current.vec }, uSeam: { value: 2 } }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useFrame((state) => {
    const t = clockRef.current.t;
    const time = state.clock.elapsedTime;
    // theme-aware accent: glow on dark, ink on light; the twin's half runs cyan
    const color = isDark ? "#ffffff" : "#241c10";
    const twinColor = isDark ? TWIN_CYAN : "#0e7490";
    if (lineMat.current) {
      lineMat.current.uniforms.uTime.value = time;
      lineMat.current.uniforms.uT.value = t;
      lineMat.current.uniforms.uSeam.value = twin.seamNdc;
      (lineMat.current.uniforms.uColor.value as THREE.Color).set(color);
      (lineMat.current.uniforms.uTwinColor.value as THREE.Color).set(twinColor);
      lineMat.current.uniforms.uOpacity.value = isDark ? 0.13 : 0.15;
    }
    if (nodeMat.current) {
      nodeMat.current.uniforms.uTime.value = time;
      nodeMat.current.uniforms.uT.value = t;
      nodeMat.current.uniforms.uSeam.value = twin.seamNdc;
      (nodeMat.current.uniforms.uColor.value as THREE.Color).set(color);
      (nodeMat.current.uniforms.uTwinColor.value as THREE.Color).set(twinColor);
      nodeMat.current.uniforms.uOpacity.value = isDark ? 0.55 : 0.5;
      nodeMat.current.uniforms.uPixel.value = 5.5 * state.viewport.dpr;
    }
  });

  return (
    <>
      <lineSegments geometry={lineGeom}>
        <shaderMaterial ref={lineMat} vertexShader={NET_VERT} fragmentShader={NET_FRAG} uniforms={lineUniforms} transparent depthWrite={false} />
      </lineSegments>
      <points geometry={nodeGeom}>
        <shaderMaterial ref={nodeMat} vertexShader={NODE_VERT} fragmentShader={NODE_FRAG} uniforms={nodeUniforms} transparent depthWrite={false} />
      </points>
    </>
  );
}

/** The whole portrait tilts with the pointer, wherever it is on the page,
 *  the same way the blueprint background does. Layered depths (tiles, photo
 *  card, neurons, per-tile luminance depth) turn the tilt into parallax. */
function TiltGroup({
  pointerRef,
  children,
}: {
  pointerRef: React.MutableRefObject<{ x: number; y: number }>;
  children: React.ReactNode;
}) {
  const g = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    const gp = g.current;
    if (!gp) return;
    const k = Math.min(1, delta * 3.5);
    gp.rotation.y += (pointerRef.current.x * 0.14 - gp.rotation.y) * k;
    gp.rotation.x += (-pointerRef.current.y * 0.09 - gp.rotation.x) * k;
  });
  return <group ref={g}>{children}</group>;
}

const PortraitAssembly = ({
  glPower = "high-performance",
  twin: twinProp,
}: {
  glPower?: "high-performance" | "default";
  /** The banner's seam; without one the face is all him. */
  twin?: Twin;
}) => {
  const [sampled, setSampled] = useState<Sampled | null>(null);
  const clockRef = useRef({ t: 0 });
  const fireRef = useRef<FireReq>({ x: 0, y: 0, pending: false, vec: new THREE.Vector3(0, 0, -1), hover: false });
  const pointerRef = useRef({ x: 0, y: 0 });
  const [ownTwin] = useState(createTwin);
  const twin = twinProp ?? ownTwin;

  // page-level pointer, like the background: the portrait reacts wherever
  // the cursor moves, not only when it is over the frame
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointerRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointerRef.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  // The accent layer follows the site theme live: `dark` class on <html>.
  const [isDark, setIsDark] = useState(true);
  useEffect(() => {
    const root = document.documentElement;
    const read = () => setIsDark(root.classList.contains("dark"));
    read();
    const mo = new MutationObserver(read);
    mo.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, []);

  useEffect(() => {
    // his photo and the twin's still, sampled together so the dust knows both
    // halves; if the still is slow or missing, his colours stand in
    const loadImg = (src: string) =>
      new Promise<HTMLImageElement | null>((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
      });
    let alive = true;
    const twinStill = Promise.race([
      loadImg(HERO_PORTRAIT.aiStill.src),
      new Promise<null>((r) => window.setTimeout(() => r(null), 1500)),
    ]);
    Promise.all([loadImg(PHOTO), twinStill]).then(([img, imgTwin]) => {
      if (alive && img) setSampled(sampleImage(img, imgTwin));
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!sampled) return <div className="w-full h-full" aria-busy="true" />;

  return (
    <div
      className="w-full h-full cursor-pointer outline-none"
      role="button"
      tabIndex={0}
      aria-label="Portrait of Venkata Pagadala, half him and half his AI twin. Activate to turn the whole banner into the twin, and again to bring him back."
      title="Click: the human and the AI twin"
      onClick={(e) => {
        // fire the chains from exactly where the click landed
        const rect = e.currentTarget.getBoundingClientRect();
        fireRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        fireRef.current.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
        fireRef.current.pending = true;
        twin.toggle();
      }}
      onKeyDown={(e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        fireRef.current.x = 0;
        fireRef.current.y = 0.1;
        fireRef.current.pending = true;
        twin.toggle();
      }}
      onPointerEnter={() => {
        fireRef.current.hover = true;
      }}
      onPointerLeave={() => {
        fireRef.current.hover = false;
      }}
    >
      <Canvas
        dpr={[1, 2]}
        // z = 0.5 / tan(fov/2): the 1x1 portrait fits the square exactly,
        // nothing cropped. Closer distances cut the head off.
        camera={{ position: [0, 0, 0.5 / Math.tan((20 * Math.PI) / 180)], fov: 40, near: 0.01, far: 10 }}
        gl={{ antialias: false, alpha: true, powerPreference: glPower }}
      >
        <TiltGroup pointerRef={pointerRef}>
          <Cloud sampled={sampled} clockRef={clockRef} fireRef={fireRef} twin={twin} />
          <CrispPhoto clockRef={clockRef} fireRef={fireRef} twin={twin} />
          <Net sampled={sampled} clockRef={clockRef} fireRef={fireRef} isDark={isDark} twin={twin} />
        </TiltGroup>
      </Canvas>
    </div>
  );
};

export default PortraitAssembly;
