"use client";
/**
 * Navbar: two mega menus (Teardowns, Research), one direct link, About last,
 * and Contact as the CTA.
 *
 * This is a LABELS-AND-STRUCTURE change only. Every href below is an existing
 * URL, unchanged: the section a visitor reads as "Teardowns" is still served
 * from /guides/*, and "Research" is still /notebook/* and /ai-contributors.
 * Labels and slugs are independent, so the site reads differently without
 * moving a single page while the domain is rebuilding its index.
 *
 * The menus render real <a href> links at all times (no JS-gated hrefs), so
 * they double as crawlable internal links to the flagships from every page.
 * Desktop opens on hover with a short intent delay and on click/keyboard;
 * mobile turns each menu into an accordion inside the existing drawer.
 */
import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "@/lib/router-shim";
import { Menu, X, ChevronDown } from "lucide-react";
import ThemeToggle from "./theme/ThemeToggle";

interface MenuItem {
  label: string;
  /** Plain-English descriptor: the label is the door, this explains it. */
  note: string;
  to: string;
  /** Flags a new arrival in the menu. */
  badge?: string;
}
interface MegaMenu {
  id: string;
  label: string;
  /** Small-caps heading above the item grid. */
  heading: string;
  items: MenuItem[];
  /** Closing line: positioning for Teardowns, scope for Research. */
  footnote: string;
  /** Index link so hub pages never become orphans, and the menu can overflow. */
  seeAll: { label: string; to: string };
  /** Any path under these prefixes marks the parent as active. */
  active: string[];
}

const MEGA: MegaMenu[] = [
  {
    id: "teardowns",
    label: "Teardowns",
    heading: "How things actually work",
    items: [
      { label: "How LLMs Work", note: "21 stages, explorable in 3D", to: "/guides/how-llms-work" },
      { label: "Inside a Home HVAC System", note: "same method, physical hardware", to: "/guides/hvac-system-troubleshooting" },
      { label: "Graph Types for AI Agents", note: "one dataset, six structures", to: "/guides/graph-types-for-ai-agents" },
      { label: "Screaming Frog, Complete", note: "every screen, 76 screenshots", to: "/guides/screaming-frog" },
      { label: "3D Game", note: "walk and drive a 2040 city", to: "/3d-game", badge: "new" },
    ],
    footnote:
      "I take complex systems apart so you can see how they work. A language model, a crawler, the AI economy, even the furnace in your basement. Same method.",
    seeAll: { label: "See all teardowns", to: "/guides" },
    active: ["/guides", "/3d-game"],
  },
  {
    id: "research",
    label: "Research",
    heading: "The reference layer",
    items: [
      { label: "Map of the AI Economy", note: "471 players, who controls what", to: "/notebook/ai/map" },
      { label: "AI Encyclopedia", note: "110 concepts, defined", to: "/notebook/ai/encyclopedia" },
      { label: "Learning Roadmap", note: "zero to hero in 18 weeks", to: "/notebook/ai/roadmap" },
      { label: "AI Contributors", note: "the 100 people building it", to: "/ai-contributors" },
    ],
    footnote:
      "The map, the definitions, and the people behind everything above. Where the data studies and benchmarks will live.",
    seeAll: { label: "See the full notebook", to: "/notebook" },
    active: ["/notebook", "/ai-contributors"],
  },
];

/** Plain links after the menus. About sits last and quieter on purpose. */
const FLAT = [
  { label: "Insights", to: "/insights", dim: false },
  { label: "About", to: "/about", dim: true },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileSection, setMobileSection] = useState<string | null>(null);
  const closeTimer = useRef<number | null>(null);
  const openTimer = useRef<number | null>(null);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setOpenMenu(null);
    setMobileSection(null);
  }, [location.pathname]);

  // Escape closes an open mega menu from anywhere, including keyboard focus.
  useEffect(() => {
    if (!openMenu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenMenu(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openMenu]);

  useEffect(
    () => () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
      if (openTimer.current) window.clearTimeout(openTimer.current);
    },
    []
  );

  // Admin/CMS shell controls its own chrome — public navbar is irrelevant there.
  if (location.pathname?.startsWith("/admin")) return null;

  const path = location.pathname ?? "";
  const isActive = (prefixes: string[]) => prefixes.some((p) => path === p || path.startsWith(`${p}/`));

  // Hover with intent: a short delay in prevents flicker when the pointer
  // crosses a label on its way somewhere else; a delay out lets the pointer
  // travel from the label down into the panel without it snapping shut.
  const hoverOpen = (id: string) => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    if (openTimer.current) window.clearTimeout(openTimer.current);
    openTimer.current = window.setTimeout(() => setOpenMenu(id), 130);
  };
  const hoverClose = () => {
    if (openTimer.current) window.clearTimeout(openTimer.current);
    closeTimer.current = window.setTimeout(() => setOpenMenu(null), 180);
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled || openMenu ? "bg-background/95 backdrop-blur-sm border-b border-border" : "bg-transparent"
        }`}
        onMouseLeave={hoverClose}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-mono text-sm tracking-widest text-foreground hover:text-glow transition-all">
            VP_
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-8">
            {MEGA.map((m) => (
              <div key={m.id} onMouseEnter={() => hoverOpen(m.id)} className="relative">
                <button
                  type="button"
                  aria-expanded={openMenu === m.id}
                  aria-haspopup="true"
                  onClick={() => setOpenMenu(openMenu === m.id ? null : m.id)}
                  className={`font-mono text-xs tracking-wider uppercase transition-all hover:text-foreground flex items-center gap-1 ${
                    isActive(m.active) || openMenu === m.id ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {m.label}
                  <ChevronDown
                    size={13}
                    className={`transition-transform ${openMenu === m.id ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  />
                </button>
              </div>
            ))}
            {FLAT.map((l) => (
              <Link
                key={l.to}
                href={l.to}
                className={`font-mono text-xs tracking-wider uppercase transition-all hover:text-foreground ${
                  path === l.to || path.startsWith(`${l.to}/`)
                    ? "text-foreground"
                    : l.dim
                      ? "text-muted-foreground/60"
                      : "text-muted-foreground"
                }`}
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/contact"
              className="font-mono text-xs tracking-wider uppercase px-4 py-2 bg-foreground text-background rounded-md hover:opacity-90 transition-opacity"
            >
              Contact
            </Link>
            <ThemeToggle className="ml-2" />
          </div>

          {/* Mobile toggle */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              onTouchStart={() => {}}
              className="relative z-[60] flex items-center justify-center w-11 h-11 -mr-2 text-foreground active:scale-95 transition-transform"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              data-testid="mobile-menu-toggle"
            >
              <span className="pointer-events-none">
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </span>
            </button>
          </div>
        </div>

        {/* Mega panel: full-bleed under the bar, desktop only */}
        {MEGA.map((m) =>
          openMenu === m.id ? (
            <div
              key={m.id}
              className="hidden md:block absolute left-0 right-0 top-16 bg-background/98 backdrop-blur-md border-b border-border"
              onMouseEnter={() => {
                if (closeTimer.current) window.clearTimeout(closeTimer.current);
              }}
              data-testid={`mega-${m.id}`}
            >
              <div className="max-w-7xl mx-auto px-6 py-7">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground/50 mb-4">
                  {m.heading}
                </p>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                  {m.items.map((it) => (
                    <Link key={it.to} href={it.to} className="group block">
                      <p className="font-display text-sm font-semibold text-foreground group-hover:text-glow transition-all">
                        {it.label}
                        {it.badge && (
                          <span className="ml-2 font-mono text-[9px] uppercase tracking-wider text-emerald-300/80">
                            {it.badge}
                          </span>
                        )}
                      </p>
                      <p className="font-mono text-[11px] text-muted-foreground leading-relaxed">{it.note}</p>
                    </Link>
                  ))}
                </div>
                <div className="mt-6 pt-4 border-t border-border/60 flex items-start justify-between gap-6 flex-wrap">
                  <p className="font-mono text-[11px] text-muted-foreground/70 leading-relaxed max-w-2xl">
                    {m.footnote}
                  </p>
                  <Link
                    href={m.seeAll.to}
                    className="font-mono text-[11px] text-foreground/85 hover:text-foreground whitespace-nowrap transition-colors"
                  >
                    {m.seeAll.label} →
                  </Link>
                </div>
              </div>
            </div>
          ) : null
        )}
      </nav>

      {/* Mobile menu: each mega menu becomes an accordion section */}
      {mobileOpen && (
        <div
          className="fixed inset-0 top-16 z-40 bg-background/98 backdrop-blur-md overflow-y-auto md:hidden"
          role="dialog"
          aria-modal="true"
          data-testid="mobile-menu-panel"
        >
          <div className="px-6 py-8 flex flex-col gap-6">
            {MEGA.map((m) => (
              <div key={m.id}>
                <button
                  type="button"
                  aria-expanded={mobileSection === m.id}
                  onClick={() => setMobileSection(mobileSection === m.id ? null : m.id)}
                  className="w-full flex items-center justify-between font-mono text-base tracking-widest uppercase text-foreground"
                >
                  {m.label}
                  <ChevronDown
                    size={16}
                    className={`transition-transform ${mobileSection === m.id ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  />
                </button>
                {mobileSection === m.id && (
                  <div className="mt-4 pl-3 border-l border-border flex flex-col gap-4">
                    {m.items.map((it) => (
                      <Link key={it.to} href={it.to} onClick={() => setMobileOpen(false)} className="block">
                        <p className="font-display text-sm font-semibold text-foreground">
                          {it.label}
                          {it.badge && (
                            <span className="ml-2 font-mono text-[9px] uppercase tracking-wider text-emerald-300/80">
                              {it.badge}
                            </span>
                          )}
                        </p>
                        <p className="font-mono text-[11px] text-muted-foreground">{it.note}</p>
                      </Link>
                    ))}
                    <Link
                      href={m.seeAll.to}
                      onClick={() => setMobileOpen(false)}
                      className="font-mono text-[11px] text-foreground/85"
                    >
                      {m.seeAll.label} →
                    </Link>
                  </div>
                )}
              </div>
            ))}
            {FLAT.map((l) => (
              <Link
                key={l.to}
                href={l.to}
                onClick={() => setMobileOpen(false)}
                className={`font-mono text-base tracking-widest uppercase ${
                  path === l.to ? "text-foreground text-glow" : "text-muted-foreground"
                }`}
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/contact"
              onClick={() => setMobileOpen(false)}
              className="font-mono text-sm tracking-widest uppercase px-5 py-3 bg-foreground text-background rounded-md text-center"
            >
              Contact
            </Link>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
