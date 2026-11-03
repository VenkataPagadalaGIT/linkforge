"use client";

/**
 * A hundred people, drawn.
 *
 * Every persona tool prints "42%" and stops. Nobody shows what plus or minus
 * 5.6 points looks like, so nobody believes it, so people act on a number that
 * is really a range. Here the hundred dots ARE the audience: solid dots are
 * the ones we can say use the platform, hollow dots the ones we can say do
 * not, and the ring between them is the margin of error, drawn to scale.
 *
 * When that ring is wide, the picture looks uncertain, because it is. That is
 * the whole point, and it is the reason no vendor selling confidence will
 * build this.
 *
 * Canvas rather than SVG: a hundred dots re-rendering on every hover is fine
 * in either, but the animation between states stays smooth here and the dots
 * can be drawn with sub-pixel positions.
 */

import { useEffect, useRef, useState } from "react";

const COLS = 10;
const ROWS = 10;

export interface CanvasState {
  /** Central estimate, 0-100. */
  value: number;
  /** Half-width of the 95% interval, in points. */
  moe: number;
  /** Colour for the solid dots. */
  color: string;
  /** measured cells are drawn crisply; estimated ones are drawn softer. */
  basis: "measured" | "estimated";
}

export default function AudienceCanvas({
  state,
  label,
  sublabel,
  size = 260,
}: {
  state: CanvasState;
  label: string;
  sublabel?: string;
  size?: number;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const shown = useRef({ value: state.value, moe: state.moe });
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Canvas has no notion of currentColor, so resolve the theme's text
    // colour once from the element itself. Passing the literal string paints
    // nothing and fails silently, which is how a blank patch ships.
    const muted = getComputedStyle(canvas).color || "#888";

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    let raf = 0;

    const draw = () => {
      const cur = shown.current;
      // Ease toward the target so a change in traits reads as movement
      // rather than a jump, which is what makes the band legible.
      const k = reduced ? 1 : 0.16;
      cur.value += (state.value - cur.value) * k;
      cur.moe += (state.moe - cur.moe) * k;

      const pad = 10;
      const cell = (size - pad * 2) / COLS;
      const r = Math.max(2.5, cell * 0.26);

      ctx.clearRect(0, 0, size, size);

      const lo = Math.max(0, cur.value - cur.moe);
      const hi = Math.min(100, cur.value + cur.moe);

      for (let i = 0; i < COLS * ROWS; i++) {
        // Fill column by column from the bottom left, so the block of
        // certainty reads as a rising level rather than a scatter.
        const col = i % COLS;
        const row = ROWS - 1 - Math.floor(i / COLS);
        const cx = pad + col * cell + cell / 2;
        const cy = pad + row * cell + cell / 2;
        const n = i + 1;

        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);

        if (n <= lo) {
          // Certain: inside the interval's floor.
          ctx.fillStyle = state.color;
          ctx.globalAlpha = state.basis === "measured" ? 0.95 : 0.7;
          ctx.fill();
        } else if (n <= hi) {
          // The margin of error, drawn. Might be a user, might not.
          ctx.globalAlpha = 1;
          ctx.strokeStyle = state.color;
          ctx.lineWidth = 1.2;
          ctx.setLineDash([1.6, 1.8]);
          ctx.stroke();
          ctx.setLineDash([]);
        } else {
          ctx.globalAlpha = 0.22;
          ctx.strokeStyle = muted;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;

      if (!reduced && (Math.abs(cur.value - state.value) > 0.15 || Math.abs(cur.moe - state.moe) > 0.15)) {
        raf = requestAnimationFrame(draw);
      }
    };

    draw();
    return () => cancelAnimationFrame(raf);
  }, [state, size, reduced]);

  const lo = Math.max(0, Math.round(state.value - state.moe));
  const hi = Math.min(100, Math.round(state.value + state.moe));

  return (
    <figure className="m-0">
      <canvas
        ref={ref}
        className="text-muted-foreground block"
        role="img"
        aria-label={`${label}: ${state.value}% of 100 people, with a range of ${lo} to ${hi} out of 100 once the margin of error is counted.`}
      />
      <figcaption className="mt-3">
        <p className="font-mono text-sm text-foreground leading-tight">
          <span className="text-2xl font-bold tabular-nums">{Math.round(state.value)}</span>
          <span className="text-muted-foreground"> of 100 · {label}</span>
        </p>
        {sublabel ? (
          <p className="font-mono text-[10px] text-muted-foreground leading-relaxed mt-1">{sublabel}</p>
        ) : null}
        <p className="font-mono text-[10px] text-muted-foreground/90 leading-relaxed mt-1.5">
          <span className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle" style={{ background: state.color, opacity: state.basis === "measured" ? 0.95 : 0.7 }} aria-hidden="true" />
          {lo} we can say do
          <span className="mx-1.5">·</span>
          <span className="inline-block w-2 h-2 rounded-full border border-current mr-1.5 align-middle" aria-hidden="true" />
          {hi - lo} could go either way
          <span className="mx-1.5">·</span>
          {100 - hi} we can say do not
        </p>
      </figcaption>
    </figure>
  );
}
