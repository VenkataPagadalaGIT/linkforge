"use client";
/**
 * TwinSeam: the line that splits the home banner into the person and his AI
 * twin.
 *
 * Left of the seam is the page as people read it. Right of it is the twin:
 * the portrait as an android replica (PortraitAssembly's shaders read the
 * seam), the room tinted cyan, and the text column replaced by what machines
 * read about the same person (TwinReadout). The seam opens with one sweep
 * across the whole banner, then drifts across the face; hovering the face
 * steers it, the handle drags it anywhere, and a click on the face turns the
 * whole banner into the twin and back.
 *
 * One rAF loop writes one CSS variable, --seam (px from the banner's left
 * edge), that every layer reads, and the same position in the portrait's
 * clip space for the WebGL split, so the line, the page and the face move as
 * one. Wide screens split the whole banner; narrower ones split the face
 * alone, so the text stays readable. Reduced motion: no sweep and no drift,
 * the seam rests across the face and moves only when asked. Without scripts
 * --seam is unset and the banner is the human page, untouched.
 */
import { useEffect, useRef } from "react";
import type { Twin } from "./twin";

type Mode = "wait" | "sweep" | "hold" | "rest" | "follow" | "drag" | "parked" | "ai";
type Step = { to: () => number; dur: number } | { hold: number };

interface Geo {
  /** Wide layout: the seam splits the whole banner, not only the face. */
  wide: boolean;
  left: number;
  /** All AI at minX, all human at maxX; px from the banner's left edge. */
  minX: number;
  maxX: number;
  /** The face's centre line, and the portrait's edges. */
  faceX: number;
  pL: number;
  pR: number;
}

const easeInOut = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
/** Px kept clear at the top of the banner on wide screens: the fixed navbar sits there. */
const NAV_CLEAR = 72;

export default function TwinSeam({
  twin,
  rootRef,
  colRef,
  portraitRef,
}: {
  twin: Twin;
  rootRef: React.RefObject<HTMLDivElement>;
  colRef: React.RefObject<HTMLDivElement>;
  portraitRef: React.RefObject<HTMLDivElement>;
}) {
  const handleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const col = colRef.current;
    const pt = portraitRef.current;
    const handle = handleRef.current;
    if (!root || !col || !pt || !handle) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const wideMq = window.matchMedia("(min-width: 1024px)");
    const clock = () => performance.now() / 1000;

    let g: Geo = { wide: false, left: 0, minX: 0, maxX: 1, faceX: 0.5, pL: 0, pR: 1 };
    const measure = () => {
      const r = root.getBoundingClientRect();
      const c = col.getBoundingClientRect();
      const p = pt.getBoundingClientRect();
      const wide = wideMq.matches;
      const pL = p.left - r.left;
      const pR = p.right - r.left;
      const colL = c.left - r.left;
      const colR = c.right - r.left;
      g = {
        wide,
        left: r.left,
        minX: wide ? Math.min(colL, pL) - 40 : pL,
        maxX: wide ? Math.max(colR, pR) + 40 : pR,
        // the face sits a hair left of the photo's centre
        faceX: pL + 0.486 * (pR - pL),
        pL,
        pR,
      };
      const s = root.style;
      s.setProperty("--col-l", `${colL.toFixed(1)}px`);
      s.setProperty("--col-r", `${colR.toFixed(1)}px`);
      s.setProperty("--pt-l", `${pL.toFixed(1)}px`);
      // the line runs the full banner below the navbar on wide screens, the face alone on phones
      s.setProperty("--seam-top", `${wide ? NAV_CLEAR : (p.top - r.top).toFixed(1)}px`);
      s.setProperty("--seam-h", `${(wide ? r.height - NAV_CLEAR : p.height).toFixed(1)}px`);
      s.setProperty("--handle-y", `${(p.bottom - r.top - p.height * 0.07).toFixed(1)}px`);
    };
    measure();
    const clampX = (v: number) => Math.min(g.maxX, Math.max(g.minX, v));

    // All human until the face has assembled: the page as it renders without scripts.
    let x = reduce ? g.faceX : g.maxX;
    let mode: Mode = reduce ? "rest" : "wait";
    let t0 = clock();
    const born = t0;
    let from = x;
    let to = x;
    let dur = 0;
    let steps: Step[] = [];
    let after: Mode = "rest";
    let ai = false;
    let hoverX: number | null = null;
    let dragX = x;

    const enter = (m: Mode) => {
      mode = m;
      t0 = clock();
    };
    const nextStep = () => {
      const s = steps.shift();
      if (!s) return enter(after);
      t0 = clock();
      if ("hold" in s) {
        mode = "hold";
        dur = reduce ? 0 : s.hold;
      } else {
        mode = "sweep";
        from = x;
        to = s.to();
        dur = reduce ? 0 : s.dur;
      }
    };
    const run = (list: Step[], then: Mode) => {
      steps = list;
      after = then;
      nextStep();
    };
    // the line, the handle and the tint fade in as the seam starts to move,
    // so nothing waits idle beside the face while it assembles
    const show = () => {
      root.dataset.twin = "on";
    };

    // A click or Enter on the face: the whole banner becomes the twin, and back.
    twin.toggle = () => {
      show();
      ai = !ai;
      if (ai) run([{ to: () => g.minX, dur: 1.3 }], "ai");
      else run([{ to: () => g.faceX, dur: 1.1 }], "rest");
    };

    let lastX = Infinity;
    let lastPct = -1;
    const write = () => {
      if (Math.abs(x - lastX) >= 0.2) {
        root.style.setProperty("--seam", `${x.toFixed(1)}px`);
        lastX = x;
      }
      twin.seamNdc = ((x - g.pL) / Math.max(1, g.pR - g.pL)) * 2 - 1;
      // the slider's value is where the seam stands, left to right: 0 all twin, 100 all human
      const pct = Math.round((100 * (x - g.minX)) / Math.max(1, g.maxX - g.minX));
      if (pct !== lastPct) {
        lastPct = pct;
        handle.setAttribute("aria-valuenow", String(pct));
        handle.setAttribute("aria-valuetext", `${100 - pct}% AI twin`);
      }
      // measurement hook for the QA harness
      (window as unknown as { __twinSeam?: unknown }).__twinSeam = { mode, x: Math.round(x), pct, ndc: +twin.seamNdc.toFixed(3) };
    };

    let raf = 0;
    let last = clock();
    const frame = () => {
      const now = clock();
      const dt = Math.min(0.05, now - last);
      last = now;
      switch (mode) {
        case "wait":
          // the opening sweep waits for the face; without WebGL the photo is there at once
          if (twin.assembly >= 0.92 || (twin.assembly < 0 && now - born > 2.2)) {
            show();
            run([{ to: () => g.minX, dur: 1.5 }, { hold: 1.1 }, { to: () => g.faceX, dur: 1.2 }], "rest");
          }
          break;
        case "sweep": {
          const k = dur > 0 ? Math.min(1, (now - t0) / dur) : 1;
          x = from + (to - from) * easeInOut(k);
          if (k >= 1) nextStep();
          break;
        }
        case "hold":
          if (now - t0 >= dur) nextStep();
          break;
        case "rest": {
          // drifts across the face on two slow waves, starting from the centre line
          const tt = now - t0;
          const amp = reduce ? 0 : 0.15 * (g.pR - g.pL);
          const target = g.faceX + amp * (0.72 * Math.sin((tt * 2 * Math.PI) / 9.5) + 0.28 * Math.sin((tt * 2 * Math.PI) / 4.1));
          x += (target - x) * (1 - Math.exp(-dt * (reduce ? 60 : 4)));
          break;
        }
        case "follow":
          if (hoverX !== null) {
            const pad = 0.06 * (g.pR - g.pL);
            const target = Math.min(g.pR - pad, Math.max(g.pL + pad, hoverX));
            x += (target - x) * (1 - Math.exp(-dt * 12));
          }
          break;
        case "drag":
          x = clampX(dragX);
          break;
        case "ai":
          x = g.minX;
          break;
        case "parked":
          x = clampX(x);
          break;
      }
      write();
      raf = requestAnimationFrame(frame);
    };

    // Runs only while the banner is on screen and the tab is visible. A pause
    // shifts the timers, so a sweep resumes where it stopped instead of jumping.
    let onscreen = true;
    let pausedAt = 0;
    const kick = () => {
      const want = onscreen && !document.hidden;
      if (want && !raf) {
        const now = clock();
        if (pausedAt) t0 += now - pausedAt;
        pausedAt = 0;
        last = now;
        raf = requestAnimationFrame(frame);
      } else if (!want && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
        pausedAt = clock();
      }
    };
    const io = new IntersectionObserver(([e]) => {
      onscreen = e.isIntersecting;
      kick();
    });
    io.observe(root);
    document.addEventListener("visibilitychange", kick);

    const ro = new ResizeObserver(() => measure());
    ro.observe(root);
    ro.observe(col);
    ro.observe(pt);
    wideMq.addEventListener("change", measure);

    // Over the face the seam follows the pointer (a finger drags it on phones;
    // touch-action keeps vertical swipes scrolling the page).
    const rel = (e: PointerEvent) => e.clientX - root.getBoundingClientRect().left;
    const onFaceMove = (e: PointerEvent) => {
      hoverX = rel(e);
      if (mode === "rest" || mode === "parked") enter("follow");
    };
    const onFaceLeave = () => {
      hoverX = null;
      if (mode === "follow") enter("rest");
    };
    pt.addEventListener("pointermove", onFaceMove);
    pt.addEventListener("pointerleave", onFaceLeave);
    pt.addEventListener("pointercancel", onFaceLeave);

    // The handle drags the seam anywhere across the banner.
    const onDown = (e: PointerEvent) => {
      handle.setPointerCapture(e.pointerId);
      dragX = rel(e);
      enter("drag");
      e.preventDefault();
    };
    const onMove = (e: PointerEvent) => {
      if (mode === "drag") dragX = rel(e);
    };
    const onUp = () => {
      if (mode !== "drag") return;
      enter("parked");
      ai = x <= g.minX + 2;
    };
    const onKey = (e: KeyboardEvent) => {
      const step = (g.maxX - g.minX) * 0.05;
      let v = x;
      if (e.key === "ArrowLeft" || e.key === "ArrowDown") v -= step;
      else if (e.key === "ArrowRight" || e.key === "ArrowUp") v += step;
      else if (e.key === "Home") v = g.minX;
      else if (e.key === "End") v = g.maxX;
      else return;
      e.preventDefault();
      x = clampX(v);
      enter("parked");
      ai = x <= g.minX + 2;
    };
    handle.addEventListener("pointerdown", onDown);
    handle.addEventListener("pointermove", onMove);
    handle.addEventListener("pointerup", onUp);
    handle.addEventListener("pointercancel", onUp);
    handle.addEventListener("keydown", onKey);

    if (reduce) show();
    write();
    kick();
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", kick);
      wideMq.removeEventListener("change", measure);
      pt.removeEventListener("pointermove", onFaceMove);
      pt.removeEventListener("pointerleave", onFaceLeave);
      pt.removeEventListener("pointercancel", onFaceLeave);
      handle.removeEventListener("pointerdown", onDown);
      handle.removeEventListener("pointermove", onMove);
      handle.removeEventListener("pointerup", onUp);
      handle.removeEventListener("pointercancel", onUp);
      handle.removeEventListener("keydown", onKey);
      delete root.dataset.twin;
      twin.toggle = () => {};
    };
  }, [twin, rootRef, colRef, portraitRef]);

  return (
    <>
      {/* The twin's half of the room: scan lines, and the web strands turned cyan. */}
      <div aria-hidden="true" className="twin-backdrop pointer-events-none absolute inset-0 z-[5]" />
      <div aria-hidden="true" className="twin-line pointer-events-none absolute left-0 z-20" />
      <div
        ref={handleRef}
        role="slider"
        tabIndex={0}
        aria-label="Seam between Venkata and his AI twin"
        aria-orientation="horizontal"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={100}
        aria-valuetext="0% AI twin"
        className="twin-handle absolute left-0 z-30 flex select-none items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] backdrop-blur-sm outline-none"
      >
        <span className="text-foreground/80">Human</span>
        <span aria-hidden="true" className="twin-ink text-[9px] tracking-normal">
          ◀ ▶
        </span>
        <span className="twin-ink">AI twin</span>
      </div>
    </>
  );
}
