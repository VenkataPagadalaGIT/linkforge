/**
 * Theme-aware canvas colors.
 *
 * `<canvas>` doesn't pick up Tailwind classes or CSS variables, so
 * components drawing to canvas need to manually probe the active theme
 * each frame. Instead of duplicating that logic, this hook returns a ref
 * whose `.current` always holds the right colors for the active theme.
 *
 * Usage:
 *   const themeRef = useCanvasThemeColors();
 *   // inside draw(): ctx.fillStyle = themeRef.current.fg;
 *
 * Subtle: we read from `<html class="dark">` rather than `prefers-color-
 * scheme` so that the user's explicit toggle wins.
 */
import { useEffect, useRef } from "react";

export type CanvasThemeColors = {
  /** Strong foreground — text on canvas, primary node fills */
  fg: string;
  /** Subtle foreground at 50% — connection lines, dim node fills */
  fgSubtle: string;
  /** Very subtle foreground — background grids, particles */
  fgFaint: string;
  /** Stroke for label outlines (inverse of fg, semi-opaque) */
  labelOutline: string;
  /** Whether the active theme is dark */
  isDark: boolean;
};

const DARK: CanvasThemeColors = {
  fg: "#ffffff",
  fgSubtle: "rgba(255,255,255,0.5)",
  fgFaint: "rgba(255,255,255,0.15)",
  labelOutline: "rgba(0,0,0,0.8)",
  isDark: true,
};

const LIGHT: CanvasThemeColors = {
  fg: "#0a0a0a",
  fgSubtle: "rgba(10,10,10,0.7)",
  fgFaint: "rgba(10,10,10,0.28)",
  labelOutline: "rgba(255,255,255,0.85)",
  isDark: false,
};

/**
 * Convert a "designed for dark mode" alpha into the equivalent perceived
 * weight in the active theme. Light backgrounds need ~1.7x more alpha to
 * feel as present as dark backgrounds because human visual perception of
 * dark-on-light vs light-on-dark isn't symmetric (Helmholtz–Kohlrausch
 * effect — dark text on white needs more density to read at the same
 * "weight" as light text on black at low opacities).
 *
 * Use this whenever you'd write `rgba(255,255,255,0.X)` literally.
 */
export const themeAlpha = (theme: CanvasThemeColors, a: number): number => {
  if (theme.isDark) return a;
  return Math.min(1, a * 1.7);
};

/**
 * Theme-aware foreground rgba string.
 * Replaces hardcoded `rgba(255,255,255,X)` calls — pass the original X and
 * the helper returns the right rgba for the active theme.
 */
export const themeFg = (theme: CanvasThemeColors, a: number): string => {
  const adj = themeAlpha(theme, a);
  if (theme.isDark) return `rgba(255,255,255,${adj})`;
  return `rgba(10,10,10,${adj})`;
};

/**
 * Theme-aware label-outline rgba string (inverse of fg).
 * Replaces hardcoded `rgba(0,0,0,X)` outlines.
 */
export const themeOutline = (theme: CanvasThemeColors, a: number): string => {
  const adj = themeAlpha(theme, a);
  if (theme.isDark) return `rgba(0,0,0,${adj})`;
  return `rgba(255,255,255,${adj})`;
};

export const useCanvasThemeColors = () => {
  const ref = useRef<CanvasThemeColors>(DARK);

  useEffect(() => {
    const update = () => {
      const isDark = document.documentElement.classList.contains("dark");
      ref.current = isDark ? DARK : LIGHT;
    };
    update();
    // Watch <html> class mutations — fires when ThemeProvider toggles.
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  return ref;
};
