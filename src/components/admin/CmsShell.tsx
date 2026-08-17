"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/theme/ThemeToggle";

/**
 * CmsShell: the frame every Agentic CMS screen sits in.
 *
 * Accessibility is built into the shell so no screen has to remember it:
 *   - a skip link that is the first focusable element on the page
 *   - one <h1> per screen, passed in, so heading order is never guessed
 *   - <nav aria-label> and aria-current on the active item
 *   - a polite live region every screen uses to announce save results,
 *     because a toast that only appears visually is invisible to a
 *     screen reader
 *   - colours come only from theme tokens, so light and dark both work
 *     and the contrast floor in docs/BRAND_GUIDELINES.md holds
 *   - focus-visible rings on every interactive element, never removed
 */

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/cms/pages", label: "Pages" },
  { href: "/admin/cms/review", label: "Review queue" },
  { href: "/admin/cms/globals", label: "Global SEO" },
  { href: "/admin/cms/agents", label: "Agents" },
  { href: "/admin/cms/posts", label: "Legacy posts" },
];

export const focusRing =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function Field({
  label,
  hint,
  error,
  children,
  id,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  id: string;
}) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;
  return (
    <div className="mb-4">
      <label htmlFor={id} className="block font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1.5">
        {label}
      </label>
      {React.isValidElement(children)
        ? React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
            id,
            "aria-describedby": [hintId, errId].filter(Boolean).join(" ") || undefined,
            "aria-invalid": error ? true : undefined,
          })
        : children}
      {hint && (
        <p id={hintId} className="font-mono text-[10px] text-muted-foreground/70 mt-1">
          {hint}
        </p>
      )}
      {error && (
        <p id={errId} className="font-mono text-[10px] text-red-700 dark:text-red-300 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}

/** Field styling without a width, so callers set their own. */
export const inputBase =
  `bg-transparent border border-border px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground/70 ${focusRing}`;

/** The default: fills its column. Appending w-auto to this does nothing,
 *  because two width utilities of equal specificity resolve by stylesheet
 *  order, not by string order. Use inputBase when you want a narrow field. */
export const inputClass = `w-full ${inputBase}`;

export const btn =
  `font-mono text-[11px] uppercase tracking-wider px-4 py-2 border border-border text-muted-foreground hover:text-foreground transition-colors ${focusRing}`;

export const btnPrimary =
  `font-mono text-[11px] uppercase tracking-wider px-4 py-2 border border-foreground/60 text-foreground bg-foreground/10 hover:bg-foreground/20 transition-colors ${focusRing}`;

export default function CmsShell({
  title,
  intro,
  actions,
  status,
  children,
}: {
  title: string;
  intro?: string;
  actions?: React.ReactNode;
  /** Announced politely to assistive tech whenever it changes. */
  status?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#cms-main"
        className={`sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 bg-background border border-foreground px-4 py-2 font-mono text-xs ${focusRing}`}
      >
        Skip to content
      </a>

      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              Agentic CMS
            </span>
            <nav aria-label="CMS sections">
              <ul className="flex flex-wrap gap-1">
                {NAV.map((n) => {
                  // "/admin" is a prefix of every CMS route, so a plain
                  // startsWith would light up Dashboard on every screen and
                  // announce two current pages to a screen reader.
                  const active =
                    n.href === "/admin"
                      ? pathname === "/admin"
                      : pathname === n.href || pathname.startsWith(n.href + "/");
                  return (
                    <li key={n.href}>
                      <Link
                        href={n.href}
                        aria-current={active ? "page" : undefined}
                        className={`block px-3 py-1.5 font-mono text-[11px] border transition-colors ${focusRing} ${
                          active
                            ? "border-foreground/60 text-foreground bg-secondary/40"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {n.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main id="cms-main" className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground mb-1">{title}</h1>
            {intro && <p className="font-mono text-xs text-muted-foreground max-w-2xl leading-relaxed">{intro}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>

        {/* Save results and errors are announced, not just shown. */}
        <p role="status" aria-live="polite" className="font-mono text-[11px] text-emerald-700 dark:text-emerald-300 mb-4 min-h-[1rem]">
          {status}
        </p>

        {children}
      </main>
    </div>
  );
}
