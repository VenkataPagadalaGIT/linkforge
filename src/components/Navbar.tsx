"use client";
/**
 * Navbar: the owner's IA. Four doors: How, What & Why AI (Learn, Learn in
 * 3D, SEO & AI, News), Notebooks, Explore in 3D, About Me; the 2040 game as
 * a flat link and Contact as the CTA. Labels are written for someone
 * who has never seen the site: a recruiter or a first-time learner should
 * know what is behind each door without clicking.
 *
 * Labels and slugs are independent: the section a visitor reads as
 * "Teardowns" is still served from /guides/*, so the site can read
 * differently without moving a single page.
 *
 * Progressive enhancement, and it is load-bearing rather than theoretical.
 * Corporate proxies intercept .js and answer with their own block page;
 * Chrome refuses the non-script response (reported as CORB) and NOTHING on
 * the site runs. So every menu label is a real <a href> to its section hub,
 * upgraded by JS into a menu toggle. With scripts blocked, clicking a label
 * navigates to a page listing that whole section; with scripts alive, the
 * panel opens as before. The panel itself renders only while open, so its
 * deep links live in the hubs, the footer and the sitemap instead.
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
interface MenuSection {
  /** Small-caps section title inside the panel, per the owner's IA. */
  title: string;
  items: MenuItem[];
}
interface MegaMenu {
  id: string;
  label: string;
  /** Small-caps heading above the item grid. */
  heading: string;
  sections: MenuSection[];
  /** Closing line: positioning for Teardowns, scope for Research. */
  footnote: string;
  /** Index link so hub pages never become orphans, and the menu can overflow. */
  seeAll: { label: string; to: string };
  /** Any path under these prefixes marks the parent as active. */
  active: string[];
}

const MEGA: MegaMenu[] = [
  {
    id: "ai",
    label: "How, What & Why AI",
    heading: "Free AI education, from zero to frontier",
    sections: [
      {
        title: "Learn",
        items: [
          { label: "AI Encyclopedia", note: "187 concepts, one page each", to: "/notebook/ai/encyclopedia", badge: "NEW" },
          { label: "AI Roadmap", note: "learn AI in 18 weeks + depth tracks", to: "/notebook/ai/roadmap" },
          { label: "AI Contributors", note: "the 100 people building AI", to: "/ai-contributors" },
          { label: "Audience Personas", note: "graded by evidence, sourced", to: "/personas", badge: "NEW" },
          { label: "AI Bookshelf", note: "19 free books, on a 3D shelf", to: "/notebook/ai/shelf", badge: "3D" },
        ],
      },
      {
        title: "Learn AI in 3D",
        items: [
          { label: "How Neural Networks Work in 3D", note: "train one live in your browser", to: "/guides/how-neural-networks-work", badge: "LIVE" },
          { label: "How LLMs Work in 3D", note: "watch a prompt travel 21 stages", to: "/guides/how-llms-work", badge: "3D" },
          { label: "Graph Types for AI Agents", note: "one dataset, six structures", to: "/guides/graph-types-for-ai-agents", badge: "3D" },
        ],
      },
      {
        title: "SEO & AI",
        items: [
          { label: "Screaming Frog Guide 2026", note: "every screen, 76 screenshots", to: "/guides/screaming-frog" },
          { label: "Insights", note: "essays on AI, search, and systems", to: "/insights" },
        ],
      },
      {
        title: "AI News & Updates",
        items: [
          { label: "AI Agent Statistics", note: "the numbers, updated monthly", to: "/notebook/ai/agents", badge: "NEW" },
          { label: "AI Updates", note: "AI news with primary sources", to: "/ai-updates" },
        ],
      },
    ],
    footnote:
      "A complete free path into AI: the encyclopedia, the roadmap, the people, the books, and machines you can fly through and train. Every link opened and checked.",
    seeAll: { label: "Everything in the AI Notebook", to: "/notebook/ai" },
    active: ["/notebook/ai", "/ai-contributors", "/guides", "/ai-updates", "/insights"],
  },
  {
    id: "notebooks",
    label: "Notebooks",
    heading: "Working notes, kept in public",
    sections: [
      {
        title: "Notebooks",
        items: [
          { label: "AI Notebook", note: "the hub: roadmap, encyclopedia, contributors", to: "/notebook/ai" },
          { label: "Business Notebook", note: "market and industry intelligence", to: "/notebook/business" },
          { label: "Conference Notebook", note: "3 conferences, 91 talks, 78 speakers", to: "/notebook/conference" },
        ],
      },
    ],
    footnote:
      "Notebooks are the working layer: what I am tracking, learning, and hearing, published as I go rather than polished after.",
    seeAll: { label: "The full notebook", to: "/notebook" },
    active: ["/notebook/conference", "/notebook/business"],
  },
  {
    id: "explore3d",
    label: "Explore in 3D",
    heading: "Complex systems, taken apart in 3D",
    sections: [
      {
        title: "Explore",
        items: [
          { label: "How HVAC Works in 3D", note: "a full home system, fault library included", to: "/guides/hvac-system-troubleshooting", badge: "3D" },
          { label: "Map of the AI Economy", note: "455 companies, who depends on whom", to: "/notebook/ai/map", badge: "3D" },
        ],
      },
    ],
    footnote:
      "Every scene is generated in code and runs in your browser: no downloads, no model files. The full 3D index lives at /3d.",
    seeAll: { label: "Everything in 3D", to: "/3d" },
    active: ["/3d"],
  },
  {
    id: "about",
    label: "About Me",
    heading: "The person and the papers",
    sections: [
      {
        title: "About",
        items: [
          { label: "About Me", note: "AI systems, research, and search", to: "/about" },
          { label: "Published Papers", note: "peer-reviewed, on SSRN and in journals", to: "/publications" },
        ],
      },
    ],
    footnote:
      "Peer-reviewed research on how large language models are disrupting search, plus the story behind this site.",
    seeAll: { label: "About this site", to: "/about" },
    active: ["/about", "/publications"],
  },
];

/** Plain links after the menus. About sits last and quieter on purpose.
 *  The old flat "3D Game" link grew into the 3D mega menu above. */
const FLAT = [
  { label: "Game: City 2040", to: "/3d-game", dim: false },
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
          scrolled || openMenu ? "bg-background border-b border-border" : "bg-transparent"
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
                {/* A real link, JS-enhanced into a menu toggle. On locked-down
                    corporate networks the security proxy blocks our scripts
                    (Chrome reports it as CORB), so with no JS this navigates
                    to the section's hub page instead of clicking into nothing.
                    With JS, preventDefault keeps the click-to-toggle behavior. */}
                <a
                  href={m.seeAll.to}
                  aria-expanded={openMenu === m.id}
                  aria-haspopup="true"
                  onClick={(e) => {
                    e.preventDefault();
                    setOpenMenu(openMenu === m.id ? null : m.id);
                  }}
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
                </a>
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
                      ? "text-muted-foreground/70"
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

        {/* Mega panel: full-bleed under the bar, desktop only. Rendered on
            open, so its destinations are not in the server HTML; the label
            above is a real link to the section hub, which is how a
            script-blocked browser (and a crawler that does not run JS)
            reaches everything inside. Hubs, footer and sitemap carry the
            deep links. */}
        {MEGA.map((m) =>
          openMenu === m.id ? (
            <div
              key={m.id}
              className="hidden md:block absolute left-0 right-0 top-16 z-50 bg-background border-b border-border shadow-2xl"
              onMouseEnter={() => {
                if (closeTimer.current) window.clearTimeout(closeTimer.current);
              }}
              data-testid={`mega-${m.id}`}
            >
              <div className="max-w-7xl mx-auto px-6 py-7">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70 mb-4">
                  {m.heading}
                </p>
                <div className={`grid gap-x-10 gap-y-6 ${m.sections.length >= 3 ? "grid-cols-2 lg:grid-cols-4" : m.sections.length === 2 ? "grid-cols-2" : "grid-cols-1 lg:grid-cols-3"}`}>
                  {m.sections.map((sec) => (
                    <div key={sec.title} className={m.sections.length === 1 ? "lg:col-span-3 grid lg:grid-cols-3 gap-x-8 gap-y-4" : ""}>
                      {m.sections.length > 1 && (
                        <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground/70 mb-2.5 lg:col-span-3">
                          {sec.title}
                        </p>
                      )}
                      <div className={m.sections.length === 1 ? "contents" : "space-y-4"}>
                        {sec.items.map((it) => (
                          <Link key={it.to} href={it.to} className="group block">
                            <p className="font-display text-sm font-semibold text-foreground group-hover:text-glow transition-all">
                              {it.label}
                              {it.badge && (
                                <span className="ml-2 font-mono text-[9px] uppercase tracking-wider text-emerald-700/80 dark:text-emerald-300/80">
                                  {it.badge}
                                </span>
                              )}
                            </p>
                            <p className="font-mono text-[11px] text-muted-foreground leading-relaxed">{it.note}</p>
                          </Link>
                        ))}
                      </div>
                    </div>
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
          className="fixed inset-0 top-16 z-40 bg-background overflow-y-auto md:hidden"
          role="dialog"
          aria-modal="true"
          data-testid="mobile-menu-panel"
        >
          <div className="px-6 py-8 flex flex-col gap-6">
            {MEGA.map((m) => (
              <div key={m.id}>
                {/* Same progressive enhancement as desktop: without JS the
                    drawer never opens anyway, but keeping the label a real
                    link means any rendering of this list stays navigable. */}
                <a
                  href={m.seeAll.to}
                  aria-expanded={mobileSection === m.id}
                  onClick={(e) => {
                    e.preventDefault();
                    setMobileSection(mobileSection === m.id ? null : m.id);
                  }}
                  className="w-full flex items-center justify-between font-mono text-base tracking-widest uppercase text-foreground"
                >
                  {m.label}
                  <ChevronDown
                    size={16}
                    className={`transition-transform ${mobileSection === m.id ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  />
                </a>
                {mobileSection === m.id && (
                  <div className="mt-4 pl-3 border-l border-border flex flex-col gap-4">
                    {m.sections.map((sec) => (
                      <div key={sec.title} className="flex flex-col gap-4">
                        {m.sections.length > 1 && (
                          <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground/70 -mb-1">
                            {sec.title}
                          </p>
                        )}
                        {sec.items.map((it) => (
                          <Link key={it.to} href={it.to} onClick={() => setMobileOpen(false)} className="block">
                            <p className="font-display text-sm font-semibold text-foreground">
                              {it.label}
                              {it.badge && (
                                <span className="ml-2 font-mono text-[9px] uppercase tracking-wider text-emerald-700/80 dark:text-emerald-300/80">
                                  {it.badge}
                                </span>
                              )}
                            </p>
                            <p className="font-mono text-[11px] text-muted-foreground">{it.note}</p>
                          </Link>
                        ))}
                      </div>
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
