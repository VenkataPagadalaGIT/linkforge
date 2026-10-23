"use client";

import * as React from "react";

export type ThemeChoice = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
  /** What the user picked: "light", "dark", or "system". Persisted in localStorage. */
  theme: ThemeChoice;
  /** What's actually applied to <html>. "system" resolves to the OS preference. */
  resolvedTheme: ResolvedTheme;
  setTheme: (t: ThemeChoice) => void;
  /** Cycles light → dark → system → light. Used by the toggle button. */
  cycleTheme: () => void;
}

const STORAGE_KEY = "vp-theme";
const DEFAULT_THEME: ThemeChoice = "system";

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

const getOSPreference = (): ResolvedTheme => {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const readStoredTheme = (): ThemeChoice => {
  if (typeof window === "undefined") return DEFAULT_THEME;
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === "light" || v === "dark" || v === "system" ? v : DEFAULT_THEME;
};

const applyThemeClass = (resolved: ResolvedTheme) => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (resolved === "dark") {
    root.classList.add("dark");
    root.style.colorScheme = "dark";
  } else {
    root.classList.remove("dark");
    root.style.colorScheme = "light";
  }
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // SSR-safe initial value — no DOM access. Real value loaded after mount.
  const [theme, setThemeState] = React.useState<ThemeChoice>(DEFAULT_THEME);
  const [resolvedTheme, setResolvedTheme] = React.useState<ResolvedTheme>("dark");

  // Load stored choice on mount and apply.
  React.useEffect(() => {
    const stored = readStoredTheme();
    const resolved = stored === "system" ? getOSPreference() : stored;
    setThemeState(stored);
    setResolvedTheme(resolved);
    applyThemeClass(resolved);
  }, []);

  // Watch OS preference changes — only matters when theme === "system".
  React.useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      const next: ResolvedTheme = e.matches ? "dark" : "light";
      setResolvedTheme(next);
      applyThemeClass(next);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  // Sync across tabs.
  React.useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      const next = e.newValue as ThemeChoice;
      if (next !== "light" && next !== "dark" && next !== "system") return;
      const resolved = next === "system" ? getOSPreference() : next;
      setThemeState(next);
      setResolvedTheme(resolved);
      applyThemeClass(resolved);
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const setTheme = React.useCallback((t: ThemeChoice) => {
    const resolved = t === "system" ? getOSPreference() : t;
    setThemeState(t);
    setResolvedTheme(resolved);
    applyThemeClass(resolved);
    try {
      window.localStorage.setItem(STORAGE_KEY, t);
    } catch {
      /* localStorage unavailable (private browsing, etc.) — non-fatal */
    }
  }, []);

  const cycleTheme = React.useCallback(() => {
    const order: ThemeChoice[] = ["light", "dark", "system"];
    setTheme(order[(order.indexOf(theme) + 1) % order.length]);
  }, [theme, setTheme]);

  const value = React.useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, setTheme, cycleTheme }),
    [theme, resolvedTheme, setTheme, cycleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) {
    // Safe fallback so unwrapped components don't crash during SSR / Storybook.
    return {
      theme: "dark",
      resolvedTheme: "dark",
      setTheme: () => {},
      cycleTheme: () => {},
    };
  }
  return ctx;
};
