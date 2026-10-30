"use client";
/**
 * Navbar: the owner's IA (2026-10-30, eight points). Three doors and the CTA:
 *   Venkata Pagadala: about, experience, projects, research, talks and writing. Research and talks live under
 *     the person, so "Research & Talks" is no longer a door of its own.
 *   Notebooks: the AI, Business and Conference notebooks, AI Updates, the feeds, and Learn, which holds every
 *     guide, classified once in src/data/learnHub.ts. The /guides and /notebook hubs render that same list.
 *   User First Intelligence: the framework and all the persona work.
 *   Contact.
 *
 * Explore in 3D is no longer a menu. Any page with a 3D scene carries a small "3D" badge read from
 * src/data/threeD.ts, and the /3d hub stays one click away. Each URL appears in exactly one menu. Labels are
 * written for someone who has never seen the site: a recruiter or a first-time learner should know what is
 * behind each door without clicking.
 *
 * Labels and slugs are independent: the section a visitor reads as "Learn" is still served from /guides/*, so
 * the site can read differently without moving a single page.
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
import { LEARN_HUB, with3d } from "@/data/learnHub";
import { linkedPapers } from "@/data/research";
import { TALKS, RECOGNITION } from "@/data/talks";

interface MenuItem {
  label: string;
  /** Plain-English descriptor: the label is the door, this explains it. */
  note: string;
  to: string;
  /** Flags a new arrival in the menu. */
  badge?: string;
  /** Small labels after the name: "3D" for anything you can fly through, "NEW" for a new arrival. */
  badges?: string[];
}
interface MenuSection {
  /** Small-caps section title inside the panel, per the owner's IA. */
  title: string;
  items: MenuItem[];
}
interface MegaMenu {
  id: string;
  label: string;
  /** Where the label goes with scripts off (a hub that lists the whole section). Defaults to seeAll. */
  hub?: string;
  /** Small-caps heading above the item grid. */
  heading: string;
  sections: MenuSection[];
  /** Closing line under the panel: what the section holds and how to read its badges. */
  footnote: string;
  /** Index link so hub pages never become orphans, and the menu can overflow. */
  seeAll: { label: string; to: string };
  /** Any path under these prefixes marks the parent as active. */
  active: string[];
}

/** Research & Talks: papers, talks, media and recognition, from their data. */
const RESEARCH_MENU: MegaMenu = {
  id: "research",
  label: "Research & Talks",
  heading: "Papers, talks, interviews and recognition",
  sections: [
    {
      title: "Research papers",
      items: [
        ...linkedPapers.map((p) => ({
          label: p.shortTitle,
          note: `${p.review === "peer-reviewed" ? "Peer reviewed" : "Preprint"}, ${p.venue}, ${p.year}`,
          to: `/research-and-talks#${p.slug}`,
        })),
        { label: "Google Scholar", note: "every paper and its citations", to: "/research-and-talks#papers" },
      ],
    },
    {
      title: "Talks & workshops",
      items: [
        { label: "User-First Intelligence", note: "the framework behind the research", to: "/guides/user-first-intelligence", badge: "NEW" },
        { label: "brightonSEO San Diego 2026", note: "industrial level classification with intent", to: "/research-and-talks#brightonseo-san-diego-2026", badge: "NEW" },
        ...TALKS.filter((t) => t.kind === "workshop").map((t) => ({ label: t.title, note: t.outlet, to: `/research-and-talks#${t.slug}` })),
      ],
    },
    {
      title: "Podcasts & interviews",
      items: TALKS.filter((t) => t.kind === "podcast" || t.kind === "interview" || t.kind === "talk").map((t) => ({
        label: t.outlet,
        note: t.date.slice(0, 4),
        to: `/research-and-talks#${t.slug}`,
      })),
    },
    {
      title: "Recognition",
      items: RECOGNITION.map((r) => ({ label: r.source, note: r.date.slice(0, 4), to: `/research-and-talks#${r.slug}` })),
    },
  ],
  footnote:
    "Every paper, talk and mention links to its source, and each one is worded to match what that source actually says.",
  seeAll: { label: "Research, talks and media", to: "/research-and-talks" },
  active: ["/research-and-talks", "/publications"],
};

/** User First Intelligence: the framework and all the persona work behind one door (owner IA, point 4). */
const UFI_ITEMS: MenuItem[] = [
  { label: "User-First Intelligence", note: "the framework: people before algorithms", to: "/guides/user-first-intelligence", badges: ["NEW"] },
  { label: "Audience Personas", note: "build any audience, see the margin of error", to: "/personas" },
  { label: "Persona Builder", note: "answer the framework's questions, grade the evidence", to: "/personas/builder", badges: ["NEW"] },
  { label: "Persona Fanout Journey", note: "one query, every buyer, the whole journey", to: "/personas/fanout-journey" },
  { label: "Global Persona Framework", note: "every dimension, with its rule and evidence", to: "/personas/framework" },
  { label: "Every Figure & Source", note: "all published cells, with sample sizes", to: "/personas/data" },
];
/** The Learn list also carries the framework guide; in the menu it has its own door, so it is shown there once. */
const UFI_URLS = new Set(UFI_ITEMS.map((it) => it.to));

const MEGA: MegaMenu[] = [
  {
    id: "me",
    label: "Venkata Pagadala",
    hub: "/about",
    heading: "Who I am, what I research, where I speak",
    sections: [
      {
        title: "About",
        items: [
          { label: "About me", note: "who I am and what I build", to: "/about" },
          { label: "Experience", note: "the roles, in order", to: "/experience" },
          { label: "Projects", note: "what I have built", to: "/projects" },
          { label: "Solutions", note: "how I can help a team", to: "/solutions" },
        ],
      },
      {
        title: "Research",
        items: [...RESEARCH_MENU.sections[0].items, { label: "Publications", note: "published research on AI and search", to: "/publications" }],
      },
      {
        title: "Talks",
        items: [
          ...RESEARCH_MENU.sections[1].items.filter((it) => !UFI_URLS.has(it.to)),
          { label: "Podcasts, interviews and recognition", note: "every appearance, with its source", to: "/research-and-talks" },
        ],
      },
      {
        title: "Writing",
        items: [
          { label: "Insights", note: "essays on AI, search, and systems", to: "/insights" },
          { label: "Every LinkedIn post", note: "the archive, by year and by topic", to: "/venkata-pagadala-universe" },
          { label: "The Living Portrait", note: "65k tiles wearing a neural net", to: "/#living-portrait", badges: ["3D"] },
        ],
      },
    ],
    footnote: "Every paper, talk and mention links to its source, and each one is worded to match what that source actually says.",
    seeAll: { label: "Research, talks and media", to: "/research-and-talks" },
    active: ["/about", "/experience", "/projects", "/solutions", "/research-and-talks", "/publications", "/insights", "/venkata-pagadala-universe", "/credits"],
  },
  {
    id: "notebooks",
    label: "Notebooks",
    hub: "/notebook",
    heading: "Working notes kept in public, and every guide to learn from",
    sections: [
      {
        title: "Notebooks",
        items: [
          { label: "AI Notebook", note: "the hub: chapters, timeline, contributors", to: "/notebook/ai" },
          { label: "Business Notebook", note: "market and industry intelligence", to: "/notebook/business" },
          { label: "Conference Notebook", note: "3 conferences, 69 talks, 78 speakers", to: "/notebook/conference" },
          { label: "AI Updates", note: "AI news with primary sources", to: "/ai-updates" },
          { label: "Knowledge Graph Feeds", note: "each story read from every platform, as a feed", to: "/feeds", badges: ["NEW"] },
          { label: "Everything in 3D", note: "every 3D scene, the 2040 city game included", to: "/3d" },
        ],
      },
      ...LEARN_HUB.map((sec) => ({ title: `Learn: ${sec.title}`, items: sec.items.filter((it) => !UFI_URLS.has(it.to)) })),
    ].map((sec) => ({ ...sec, items: sec.items.map(with3d) })),
    footnote: "Learn holds every guide, grouped by subject. 3D marks a page you can explore in 3D; NEW marks a recent arrival.",
    seeAll: { label: "Learn: every guide", to: "/guides" },
    active: ["/notebook", "/ai-updates", "/ai-contributors", "/guides", "/3d", "/3d-game", "/feeds"],
  },
  {
    id: "ufi",
    label: "User First Intelligence",
    heading: "People before algorithms: the framework, and the persona tools that apply it",
    sections: [{ title: "User First Intelligence", items: UFI_ITEMS }],
    footnote: "The persona tools are part of User-First Intelligence: who the audience is, and where they actually are.",
    seeAll: { label: "Read the framework", to: "/guides/user-first-intelligence" },
    active: ["/guides/user-first-intelligence", "/personas"],
  },
];

const FLAT: { label: string; to: string; dim: boolean }[] = [];

/**
 * The single active door. Prefixes overlap (/notebook/ai/map is both under
 * /notebook/ai and a 3D experience; /guides/how-llms-work is under /guides),
 * so the longest matching prefix wins and exactly one label lights up.
 */
function activeDoor(path: string): string | null {
  let best: { id: string; len: number } | null = null;
  const consider = (id: string, prefixes: string[]) => {
    for (const p of prefixes) {
      if (path === p || path.startsWith(`${p}/`)) {
        if (!best || p.length > best.len) best = { id, len: p.length };
      }
    }
  };
  MEGA.forEach((m) => consider(m.id, m.active));
  FLAT.forEach((f) => consider(f.to, [f.to]));
  return best ? (best as { id: string; len: number }).id : null;
}

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
  const door = activeDoor(path);

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

          {/* Desktop, from lg. Three doors, Contact and the theme toggle need
              about 700px, so they fit at 1024px; seven doors needed xl. At md
              (768px) the old labels collided with the logo, so below lg the
              drawer takes over. */}
          <div className="hidden lg:flex items-center gap-8">
            {MEGA.map((m) => (
              <div key={m.id} onMouseEnter={() => hoverOpen(m.id)} className="relative">
                {/* A real link, JS-enhanced into a menu toggle. On locked-down
                    corporate networks the security proxy blocks our scripts
                    (Chrome reports it as CORB), so with no JS this navigates
                    to the section's hub page instead of clicking into nothing.
                    With JS, preventDefault keeps the click-to-toggle behavior. */}
                <a
                  href={m.hub ?? m.seeAll.to}
                  aria-expanded={openMenu === m.id}
                  aria-haspopup="true"
                  onClick={(e) => {
                    e.preventDefault();
                    setOpenMenu(openMenu === m.id ? null : m.id);
                  }}
                  className={`font-mono text-xs tracking-wider uppercase transition-all hover:text-foreground flex items-center gap-1 ${
                    door === m.id || openMenu === m.id ? "text-foreground" : "text-muted-foreground"
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
                  door === l.to
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
          <div className="lg:hidden flex items-center gap-2">
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
              className="hidden lg:block absolute left-0 right-0 top-16 z-50 bg-background border-b border-border shadow-2xl"
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
                              {[...(it.badges ?? []), ...(it.badge ? [it.badge] : [])].map((b) => (
                                <span key={b} className={`ml-2 font-mono text-[9px] uppercase tracking-wider ${b === "3D" ? "text-sky-700/90 dark:text-sky-300/90" : "text-emerald-700/80 dark:text-emerald-300/80"}`}>
                                  {b}
                                </span>
                              ))}
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
          className="fixed inset-0 top-16 z-40 bg-background overflow-y-auto lg:hidden"
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
                  href={m.hub ?? m.seeAll.to}
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
                              {[...(it.badges ?? []), ...(it.badge ? [it.badge] : [])].map((b) => (
                                <span key={b} className={`ml-2 font-mono text-[9px] uppercase tracking-wider ${b === "3D" ? "text-sky-700/90 dark:text-sky-300/90" : "text-emerald-700/80 dark:text-emerald-300/80"}`}>
                                  {b}
                                </span>
                              ))}
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
