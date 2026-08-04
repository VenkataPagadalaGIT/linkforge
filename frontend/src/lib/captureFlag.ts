"use client";
/**
 * Poster-capture switch. With ?capture in the URL, WebGL canvases keep their
 * drawing buffer so canvas.toDataURL() returns the rendered frame instead of
 * black. Used only while photographing scenes for the static posters that
 * stand in for 3D on script-blocked networks; costs nothing otherwise.
 */
export const captureBuffer = (): boolean =>
  typeof window !== "undefined" && new URLSearchParams(window.location.search).has("capture");

// In capture mode the page may sit in a hidden window, where browsers stop
// delivering animation frames entirely. Swap rAF for a timer so the scene
// still renders (throttled is fine: a poster needs one settled frame, not
// sixty per second). Module-level on purpose: it must run before any Canvas
// mounts its render loop.
if (captureBuffer()) {
  window.requestAnimationFrame = ((cb: FrameRequestCallback) =>
    window.setTimeout(() => cb(performance.now()), 33)) as typeof window.requestAnimationFrame;
  window.cancelAnimationFrame = ((id: number) => window.clearTimeout(id)) as typeof window.cancelAnimationFrame;
}
