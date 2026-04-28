"use client";

import * as React from "react";
import { useTheme } from "@/components/theme/ThemeProvider";

/**
 * Brand color reference — single source of truth for every color token
 * used across the site. Live-updates with the active theme so you can
 * audit Light, Dark, and Auto in one place.
 *
 * Each swatch shows: visual sample · Tailwind class · resolved HSL · hex.
 */

type Swatch = {
  name: string;
  /** Tailwind class for the SAMPLE square */
  sample: string;
  /** Tailwind class for the TEXT example */
  text?: string;
  /** Inline label override */
  label?: string;
};

const SEMANTIC: Swatch[] = [
  { name: "background", sample: "bg-background border border-border" },
  { name: "foreground", sample: "bg-foreground", text: "text-foreground" },
  { name: "card", sample: "bg-card border border-border" },
  { name: "primary", sample: "bg-primary", text: "text-primary" },
  { name: "secondary", sample: "bg-secondary", text: "text-secondary-foreground" },
  { name: "muted", sample: "bg-muted", text: "text-muted-foreground" },
  { name: "accent", sample: "bg-accent", text: "text-accent-foreground" },
  { name: "border", sample: "border border-border bg-transparent" },
  { name: "destructive", sample: "bg-destructive", text: "text-destructive-foreground" },
];

const BRAND: Swatch[] = [
  { name: "emerald-300", sample: "bg-emerald-300", text: "text-emerald-300" },
  { name: "emerald-400", sample: "bg-emerald-400", text: "text-emerald-400" },
  { name: "emerald-400/40 bd", sample: "border border-emerald-400/40 bg-emerald-400/[0.06]", text: "text-emerald-300/90" },
  { name: "emerald-500/40", sample: "bg-emerald-500/40" },
  { name: "green-400", sample: "bg-green-400", text: "text-green-400" },
  { name: "teal-500/10", sample: "bg-teal-500/10 border border-teal-500/30" },
];

const TEXT_OPACITIES: Swatch[] = [
  { name: "foreground/100", sample: "bg-foreground", label: "Aa" },
  { name: "foreground/85", sample: "bg-foreground/85", label: "Aa" },
  { name: "foreground/70", sample: "bg-foreground/70", label: "Aa" },
  { name: "foreground/60", sample: "bg-foreground/60", label: "Aa" },
  { name: "muted-fg/100", sample: "bg-muted-foreground", label: "Aa" },
  { name: "muted-fg/70", sample: "bg-muted-foreground/70", label: "Aa" },
  { name: "muted-fg/50", sample: "bg-muted-foreground/50", label: "Aa" },
  { name: "muted-fg/40", sample: "bg-muted-foreground/40", label: "Aa" },
];

const Swatch: React.FC<{ swatch: Swatch }> = ({ swatch }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [resolved, setResolved] = React.useState<{ rgb: string; hex: string } | null>(null);

  React.useEffect(() => {
    if (!ref.current) return;
    const cs = getComputedStyle(ref.current);
    const bg = cs.backgroundColor;
    setResolved({ rgb: bg, hex: rgbToHex(bg) });
  }, [swatch]);

  return (
    <div className="border border-border bg-card p-4 flex flex-col gap-3">
      <div
        ref={ref}
        className={`h-16 w-full ${swatch.sample} flex items-center justify-center font-mono text-[10px]`}
      >
        {swatch.label && (
          <span className="mix-blend-difference text-white">{swatch.label}</span>
        )}
      </div>
      <div className="space-y-1">
        <div className="font-mono text-[11px] uppercase tracking-[0.15em] text-foreground">
          {swatch.name}
        </div>
        {swatch.text && (
          <div className={`font-mono text-[10px] ${swatch.text}`}>
            The quick brown fox
          </div>
        )}
        {resolved && (
          <div className="font-mono text-[9px] text-muted-foreground/80 leading-relaxed">
            <div>{resolved.rgb}</div>
            <div>{resolved.hex}</div>
          </div>
        )}
      </div>
    </div>
  );
};

function rgbToHex(rgb: string): string {
  // rgb(r,g,b) or rgba(r,g,b,a)
  const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!m) return rgb;
  const [, r, g, b, a] = m;
  const toHex = (n: string) => Number(n).toString(16).padStart(2, "0");
  const base = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  return a && Number(a) < 1
    ? `${base.toUpperCase()} · α ${Number(a).toFixed(2)}`
    : base.toUpperCase();
}

const Section: React.FC<{ title: string; children: React.ReactNode; description?: string }> = ({
  title,
  children,
  description,
}) => (
  <section className="mb-16">
    <h2 className="font-display text-2xl mb-2 text-foreground">{title}</h2>
    {description && (
      <p className="font-mono text-xs text-muted-foreground mb-6 max-w-2xl">
        {description}
      </p>
    )}
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {children}
    </div>
  </section>
);

export default function BrandPage() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <header className="mb-12 border-b border-border pb-8">
        <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-3">
          Internal · Design system
        </div>
        <h1 className="font-display text-4xl md:text-5xl mb-4 text-foreground">
          Brand &amp; Color Palette
        </h1>
        <p className="font-mono text-sm text-muted-foreground max-w-2xl leading-relaxed mb-6">
          Every color token used across <span className="text-foreground">venkatapagadala.com</span>.
          Resolved values update live with the active theme, so you can audit
          how each swatch behaves in Light, Dark, and Auto.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
            Active:
          </span>
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase border border-border px-2 py-1 text-foreground">
            choice = {theme}
          </span>
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase border border-border px-2 py-1 text-foreground">
            applied = {resolvedTheme}
          </span>
          <div className="flex gap-1 ml-2">
            {(["light", "dark", "system"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                data-testid={`brand-theme-${t}`}
                className={`font-mono text-[10px] uppercase tracking-[0.15em] px-3 py-1 border transition-colors ${
                  theme === t
                    ? "border-foreground text-foreground bg-foreground/[0.04]"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </header>

      <Section
        title="Semantic tokens"
        description="The core design system. Every component pulls from these CSS variables, so flipping themes swaps them all in one motion."
      >
        {SEMANTIC.map((s) => (
          <Swatch key={s.name} swatch={s} />
        ))}
      </Section>

      <Section
        title="Brand accent — emerald"
        description='The conference / notebook signal color. Used on "PUBLISHED", "FIELD NOTES", "LIVE NOTES" badges, the take-notes pill, and emphasized inline keywords. In light mode the original emerald-300 / 400 tints are auto-darkened to emerald-700 family for AAA contrast.'
      >
        {BRAND.map((s) => (
          <Swatch key={s.name} swatch={s} />
        ))}
      </Section>

      <Section
        title="Foreground opacity scale"
        description="Long-form notes use these descending opacity steps for hierarchy. Light mode auto-bumps the lower steps so they stay readable on white."
      >
        {TEXT_OPACITIES.map((s) => (
          <Swatch key={s.name} swatch={s} />
        ))}
      </Section>

      <Section
        title="UI component samples"
        description="Real components rendered in the active theme — quick visual sanity check."
      >
        <div className="border border-border bg-card p-4 flex flex-col gap-3 col-span-2">
          <div className="font-mono text-[11px] uppercase tracking-[0.15em] text-foreground mb-2">
            Badges
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="font-mono text-[9px] tracking-[0.2em] uppercase border border-emerald-400/45 text-emerald-300/95 bg-emerald-400/[0.04] px-2 py-1 inline-flex items-center gap-1.5">
              ● Published
            </span>
            <span className="font-mono text-[9px] tracking-[0.2em] uppercase border border-emerald-400/40 text-emerald-300/90 px-2 py-1 inline-flex items-center gap-1.5">
              ◇ Field Notes
            </span>
            <span className="font-mono text-[9px] tracking-[0.2em] uppercase border border-border text-foreground px-2 py-1 inline-flex items-center gap-1.5">
              Saved
            </span>
            <span className="font-mono text-[9px] tracking-[0.2em] uppercase border border-amber-400/40 text-amber-400 bg-amber-400/[0.04] px-2 py-1">
              Keynote
            </span>
          </div>
        </div>

        <div className="border border-border bg-card p-4 flex flex-col gap-3 col-span-2">
          <div className="font-mono text-[11px] uppercase tracking-[0.15em] text-foreground mb-2">
            Buttons
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="font-mono text-[10px] uppercase tracking-[0.15em] bg-foreground text-background px-4 py-2">
              Primary →
            </button>
            <button className="font-mono text-[10px] uppercase tracking-[0.15em] border border-border text-foreground hover:border-foreground/40 px-4 py-2">
              Secondary
            </button>
            <button className="font-mono text-[10px] uppercase tracking-[0.15em] border border-emerald-400/50 text-emerald-300/95 bg-emerald-400/[0.06] hover:bg-emerald-400/[0.12] px-4 py-2">
              Take notes
            </button>
          </div>
        </div>

        <div className="border border-border bg-card p-4 flex flex-col gap-2 col-span-2 lg:col-span-4">
          <div className="font-mono text-[11px] uppercase tracking-[0.15em] text-foreground mb-2">
            Long-form prose sample
          </div>
          <h3 className="font-display text-xl text-foreground">Key thesis</h3>
          <p className="text-foreground/85 leading-[1.85] text-sm">
            AI does not see your brand. It calculates it. Every paragraph you publish
            becomes a vector in embedding space; together they form clusters with a
            center point — the centroid — which is what the system actually treats as
            your brand.
          </p>
          <ul className="text-foreground/85 leading-[1.85] text-sm list-none space-y-1">
            <li>→ Bullet at full opacity for primary points</li>
            <li className="text-muted-foreground/70">— Sub-bullet at muted opacity</li>
          </ul>
        </div>
      </Section>

      <footer className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground/70 pt-8 border-t border-border">
        ⌁ Color tokens defined in app/globals.css · Toggle theme top-right or use buttons above
      </footer>
    </div>
  );
}
