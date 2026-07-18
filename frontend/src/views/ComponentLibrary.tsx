"use client";
import type { ReactNode } from "react";
import { Link } from "@/lib/router-shim";
import type { Guide, GuideAuthor } from "@/data/guides";
import GuideRenderer from "@/components/guides/GuideRenderer";
import AuthorCard from "@/components/guides/AuthorCard";
import FutureCitySceneLazy from "@/components/future/FutureCitySceneLazy";

/**
 * ComponentLibrary: internal, noindex catalog of every reusable piece of the
 * site in one place: tokens, guide blocks, cards, 3D scenes, utilities.
 * The demo Guide below exercises every standalone Block kind, so a renderer
 * change that breaks a block is visible here before it ships in a real guide.
 */

// The real site author; matches the record used by the published guides so
// this card renders exactly what readers see on /guides/*.
const SITE_AUTHOR: GuideAuthor = {
  name: "Venkata Pagadala",
  title: "AI Product Manager (Search · SEO · GEO)",
  org: "AT&T",
  url: "/about",
  bio: "10+ years building entity systems and knowledge graphs at enterprise scale; published the AI Systems Map and the AI Concepts Encyclopedia on this site.",
};

// One record, every standalone Block kind. Never exported and never added to
// the guides array, so it can't leak into the sitemap or the guides index.
const demoGuide: Guide = {
  slug: "library-demo",
  title: "Library Demo",
  metaTitle: "Library Demo (internal)",
  metaDescription: "Internal demo record that exercises every guide Block kind.",
  headline: "Library Demo",
  deck: "A minimal Guide record whose blocks array uses every block type that renders standalone.",
  datePublished: "2026-07-18",
  dateModified: "2026-07-18",
  readingTime: "2 min read",
  tags: ["internal"],
  terms: [
    {
      slug: "demo-term",
      term: "TermCard",
      aka: ["Definition card"],
      oneLiner: "A TermCard renders one DefinedTerm as a structured definition: one-liner, in-depth, analogy, example, and a role row.",
      inDepth: "Terms live on the Guide record, not in the blocks array. A termcard block references a term by slug, so the same definition can feed the on-page card, the JSON-LD DefinedTermSet, and the noscript fallback without drifting apart.",
      analogy: "A dictionary entry with a house style: every term answers the same five questions in the same order.",
      example: "The graph-types guide defines six terms this way, from Taxonomy to Vector Index.",
      agentRole: "Answer engines quote the one-liner; the structured rows give them attributable, self-contained facts.",
    },
  ],
  comparison: [
    {
      type: "Comparison row",
      isA: "One row of the guide's comparison table",
      answers: "How do these things differ?",
      structure: "Seven fixed columns, headers overridable per guide",
      example: "Six graph structures side by side",
      bestFor: "Scannable side-by-side contrast",
      limit: "Fixed shape; long cells wrap",
    },
  ],
  faqs: [
    {
      q: "How do I add a new block type?",
      a: "Extend the Block union in `src/data/guides.ts`, add a case to `BlockView` in `GuideRenderer.tsx`, then add a sample of it to this page so it stays visible.",
    },
  ],
  blocks: [
    { kind: "p", text: "Guides are data records: an ordered array of **Block** objects that `GuideRenderer` maps to components. Everything below is one demo record rendered by the real renderer, so what you see here is exactly what a guide page produces. Inline markdown supports **bold**, *italic*, `code`, and [links](https://schema.org/)." },
    { kind: "h2", text: "Text blocks (h2)", id: "text-blocks" },
    { kind: "h3", text: "A subsection heading (h3)" },
    { kind: "callout", title: "Callout", text: "A bordered aside with a mono kicker title. Use it for the one-line version of a section or a warning the reader must not scroll past." },
    { kind: "list", items: ["Unordered list item with **bold** support", "Second item; the bullet is rendered by the block, not the browser"] },
    { kind: "list", ordered: true, items: ["Ordered list item one", "Ordered list item two"] },
    {
      kind: "decision",
      items: [
        { when: "You need a when-to-use-what table", use: "decision block: left column is the situation, right column is the call." },
        { when: "You need prose instead", use: "p block with inline markdown." },
      ],
    },
    { kind: "h2", text: "Code and media", id: "code-media" },
    {
      kind: "code",
      caption: "Code blocks are plain data: a string plus an optional caption. No syntax highlighting by design; the mono theme carries it.",
      code: `const block: Block = {
  kind: "callout",
  title: "The one-line version",
  text: "Blocks are data, components are the renderer.",
};`,
    },
    {
      kind: "image",
      src: "/guides/screaming-frog/main-window-overview.webp",
      alt: "Screaming Frog SEO Spider main window with crawl data",
      caption: "Image block: explicit width and height prevent layout shift; loading is lazy by default.",
      width: 1372,
      height: 891,
    },
    {
      kind: "tasks",
      title: "Tasks block",
      items: [{ task: "Show what teams use a feature for", how: "Each row pairs a job with **how** the feature does it; the title row is overridable." }],
    },
    { kind: "h2", text: "Structured data blocks", id: "structured-blocks" },
    { kind: "termcard", termSlug: "demo-term" },
    { kind: "comparison" },
    { kind: "faq" },
    {
      kind: "sources",
      items: [{ label: "schema.org", href: "https://schema.org/", note: "Sources render as external links with an optional note line." }],
    },
    {
      kind: "related",
      items: [{ label: "Graph Types for AI Agents (a real guide using these blocks)", href: "/guides/graph-types-for-ai-agents" }],
    },
    {
      kind: "details",
      summary: "Details block: click to expand",
      blocks: [{ kind: "p", text: "A details block nests any other blocks behind a disclosure. Use it for on-ramps and asides that would bloat the main read." }],
    },
  ],
};

const THREE_D_INDEX = [
  {
    label: "LlmExplorer",
    href: "/guides/how-llms-work",
    importPath: "@/components/guides/LlmExplorerLazy",
    note: "3D LLM pipeline: 16 stages, guided token journey.",
  },
  {
    label: "HvacExplorer",
    href: "/guides/hvac-system-troubleshooting",
    importPath: "@/components/guides/HvacExplorerLazy",
    note: "3D split system wired to a fault ontology and symptom diagnoser.",
  },
  {
    label: "AI map",
    href: "/notebook/ai/map",
    importPath: "@/views/AiSystemsMapView",
    note: "The AI value chain as one interactive dependency graph.",
  },
];

const UTILITIES = [
  {
    name: "useWebGL",
    path: "@/lib/webgl",
    note: "Probes WebGL the way the real canvas will request it: high-performance first, plain context second, and reports unusable only when neither works so callers can render static content instead of a black box.",
  },
  {
    name: "deploy-rehearsal.sh",
    path: "scripts/deploy-rehearsal.sh",
    note: "Runs the deployment twice, for real, before it goes live; the two rehearsals catch different failure classes.",
  },
  {
    name: "deploy-watch.sh",
    path: "scripts/deploy-watch.sh",
    note: "Watches a Railway deploy to its verdict while proving the live site never went down.",
  },
];

function Section({ label, usage, children }: { label: string; usage: string; children: ReactNode }) {
  return (
    <section className="mt-14 border-t border-border pt-8">
      <h2 className="font-mono text-xs uppercase tracking-widest text-foreground mb-1">{label}</h2>
      <p className="font-mono text-[11px] text-muted-foreground/70 mb-8">{usage}</p>
      {children}
    </section>
  );
}

// Swatch backgrounds must be literal class names so Tailwind's scanner keeps them.
const SWATCHES = [
  { cls: "bg-background", name: "background" },
  { cls: "bg-foreground", name: "foreground" },
  { cls: "bg-card", name: "card" },
  { cls: "bg-secondary", name: "secondary" },
  { cls: "bg-border", name: "border" },
  { cls: "bg-muted", name: "muted" },
];

export default function ComponentLibrary() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-20 px-6">
      <div className="max-w-5xl mx-auto">
        <p className="font-mono text-[10px] text-muted-foreground/50 tracking-widest uppercase mb-4">
          Internal · noindex
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
          Component Library
        </h1>
        <p className="font-mono text-sm text-muted-foreground leading-relaxed max-w-3xl">
          Every reusable piece of this site, rendered live from the real components and tokens.
          If a change breaks a block, it breaks visibly here first. This page is not linked from
          the nav and carries a noindex robots rule.
        </p>

        <Section
          label="Typography and tokens"
          usage="Tokens live in app/globals.css and tailwind.config.ts; use the semantic classes shown under each sample."
        >
          <div className="space-y-6">
            <div>
              <p className="font-display text-4xl font-bold text-foreground">Display heading</p>
              <p className="font-mono text-[10px] text-muted-foreground/60 mt-1">font-display text-4xl font-bold text-foreground</p>
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-foreground">Section heading</p>
              <p className="font-mono text-[10px] text-muted-foreground/60 mt-1">font-display text-2xl font-bold text-foreground</p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">Mono kicker label</p>
              <p className="font-mono text-[10px] text-muted-foreground/60 mt-1">font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60</p>
            </div>
            <div>
              <p className="font-mono text-sm text-muted-foreground leading-relaxed max-w-2xl">
                Body copy is mono, small, and muted. Emphasis is done by switching to
                <span className="text-foreground font-semibold"> text-foreground</span>, not by size.
              </p>
              <p className="font-mono text-[10px] text-muted-foreground/60 mt-1">font-mono text-sm text-muted-foreground leading-relaxed</p>
            </div>

            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 mb-3">Color tokens</p>
              <div className="flex flex-wrap gap-4">
                {SWATCHES.map((s) => (
                  <div key={s.name} className="text-center">
                    <div className={`w-16 h-16 border border-border ${s.cls}`} />
                    <p className="font-mono text-[10px] text-muted-foreground mt-1">{s.name}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 mb-3">Border treatment</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                <div className="border border-border p-4">
                  <p className="font-mono text-xs text-muted-foreground">Square corners, 1px border-border. No rounded corners, no shadows.</p>
                </div>
                <div className="border-l-2 border-foreground/40 pl-4 py-2">
                  <p className="font-mono text-xs text-muted-foreground">Left-rule accent for pull quotes and one-liners.</p>
                </div>
              </div>
            </div>
          </div>
        </Section>

        <Section
          label="Guide blocks"
          usage='import GuideRenderer from "@/components/guides/GuideRenderer"; blocks are data (the Block union in @/data/guides).'
        >
          <div className="border border-border/60 p-6 sm:p-8">
            <GuideRenderer guide={demoGuide} />
          </div>
        </Section>

        <Section
          label="Cards"
          usage='import AuthorCard from "@/components/guides/AuthorCard"; feeds the same record as the JSON-LD Person.'
        >
          <AuthorCard author={SITE_AUTHOR} dateModified="2026-07-18" readingTime="2 min read" />
        </Section>

        <Section
          label="3D components"
          usage="All 3D scenes are client-only dynamic imports (ssr: false); mount them through their Lazy wrappers."
        >
          <div className="space-y-3 mb-10">
            {THREE_D_INDEX.map((item) => (
              <div key={item.href} className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-1 sm:gap-4 border border-border/60 p-4">
                <Link href={item.href} className="font-mono text-xs text-foreground font-semibold hover:underline underline-offset-4">
                  {item.label}
                </Link>
                <div>
                  <p className="font-mono text-xs text-muted-foreground leading-relaxed">{item.note}</p>
                  <p className="font-mono text-[10px] text-muted-foreground/60 mt-1">
                    import from &quot;{item.importPath}&quot; · live at{" "}
                    <Link href={item.href} className="hover:text-foreground transition-colors">{item.href}</Link>
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="h-[420px] border border-border overflow-hidden">
            <FutureCitySceneLazy />
          </div>
          <p className="font-mono text-[11px] text-muted-foreground/70 mt-2">
            FutureCityScene: candidate homepage background, year 2040. Playable at /3d-game
          </p>
          <p className="font-mono text-[10px] text-muted-foreground/60 mt-1">
            import FutureCitySceneLazy from &quot;@/components/future/FutureCitySceneLazy&quot;
          </p>
        </Section>

        <Section
          label="Utilities"
          usage="Hooks and scripts that support the components above; scripts run from the repo root."
        >
          <div className="space-y-3">
            {UTILITIES.map((u) => (
              <div key={u.path} className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-1 sm:gap-4 border border-border/60 p-4">
                <p className="font-mono text-xs text-foreground font-semibold">{u.name}</p>
                <div>
                  <p className="font-mono text-xs text-muted-foreground leading-relaxed">{u.note}</p>
                  <p className="font-mono text-[10px] text-muted-foreground/60 mt-1">{u.path}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
