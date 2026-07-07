"use client";

import * as React from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme, type ThemeChoice } from "./ThemeProvider";

/**
 * Three-way theme toggle: Light ↔ Dark ↔ System.
 * Matches the editorial / dev-tool aesthetic of the rest of the site:
 * monospace, hairline border, no rounded corners.
 *
 * Click cycles through choices; long-press / right-click is unhandled
 * (cycle is fast enough). The icon visually represents the *current*
 * stored choice (not the resolved theme), so users always see what they
 * picked — important for the "System" state.
 */
const LABELS: Record<ThemeChoice, string> = {
  light: "Light",
  dark: "Dark",
  system: "Auto",
};

const ThemeToggle: React.FC<{ className?: string }> = ({ className = "" }) => {
  const { theme, cycleTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  // Avoid hydration mismatch — render a neutral placeholder until mounted.
  if (!mounted) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 px-2 py-1 border border-border ${className}`}
        aria-hidden="true"
      >
        <Monitor size={12} strokeWidth={1.75} />
      </span>
    );
  }

  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;
  const next: ThemeChoice =
    theme === "light" ? "dark" : theme === "dark" ? "system" : "light";

  return (
    <button
      type="button"
      onClick={cycleTheme}
      title={`Theme: ${LABELS[theme]} — click for ${LABELS[next]}`}
      aria-label={`Switch theme. Current: ${LABELS[theme]}. Next: ${LABELS[next]}.`}
      data-testid="theme-toggle"
      className={`inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground hover:border-foreground/40 px-2 py-1 border border-border bg-background/40 backdrop-blur-sm transition-colors ${className}`}
    >
      <Icon size={12} strokeWidth={1.75} aria-hidden="true" />
      <span className="hidden sm:inline">{LABELS[theme]}</span>
    </button>
  );
};

export default ThemeToggle;
