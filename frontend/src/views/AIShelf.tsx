"use client";
/**
 * The Complete Shelf: the free-books surface of the AI notebook.
 *
 * The 3D shelf is the way in, not the content. Every volume on it is a real
 * free book already curated in the learning roadmap, so the same nineteen
 * titles are listed below as ordinary links. That list is not a fallback bolted
 * on for crawlers: it is the page working without WebGL, on a slow connection,
 * with a screen reader, or for anyone who would rather just have the links.
 */
import { Link } from "@/lib/router-shim";
import ShelfSceneLazy from "@/components/library/ShelfSceneLazy";
import ScrollReveal from "@/components/ScrollReveal";
import { shelfBooks } from "@/data/libraryShelf";

function BookList({ compact = false }: { compact?: boolean }) {
  return (
    <ol className="border border-border divide-y divide-border/60">
      {shelfBooks.map((b, i) => (
        <li key={b.id} className="p-4 sm:p-5 flex items-start gap-4">
          <span className="font-mono text-[10px] text-muted-foreground/30 pt-1 w-6 shrink-0 tabular-nums">
            {String(i + 1).padStart(2, "0")}
          </span>
          <div className="min-w-0 flex-1">
            <a
              href={b.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-display text-sm font-bold text-foreground hover:text-glow transition-all"
            >
              {b.title}
            </a>
            <p className="font-mono text-[11px] text-muted-foreground/60 mt-0.5">
              {b.author}
              {b.contributorId && (
                <>
                  {" · "}
                  <Link
                    to={`/ai-contributors/${b.contributorId}`}
                    className="underline decoration-dotted hover:text-foreground transition-colors"
                  >
                    profile
                  </Link>
                </>
              )}
              {" · "}
              <span className="text-muted-foreground/40">{b.topic}</span>
            </p>
            {!compact && (
              <p className="font-mono text-[11px] text-muted-foreground leading-relaxed mt-1.5">
                {b.note}
              </p>
            )}
          </div>
          <span className="font-mono text-[9px] text-muted-foreground/40 uppercase tracking-widest border border-border/60 px-2 py-1 shrink-0 hidden sm:block">
            free
          </span>
        </li>
      ))}
    </ol>
  );
}

export default function AIShelf() {
  return (
    <div className="bg-background">
      {/* The shelf fills the viewport under the fixed navbar, so the browse
          controls dock to the frame the reader is actually looking at. */}
      <div className="relative w-full h-[calc(100vh-4rem)] mt-16 border-b border-border overflow-hidden">
        <ShelfSceneLazy
          fallback={
            <div className="h-full w-full overflow-auto px-6 py-10">
              <div className="max-w-3xl mx-auto">
                <p className="font-mono text-xs text-muted-foreground mb-6">
                  This browser cannot run WebGL, so the 3D shelf is not available. Here are
                  the same nineteen books.
                </p>
                <BookList compact />
              </div>
            </div>
          }
        />
        <div className="pointer-events-none absolute top-5 left-6 z-20">
          <h1 className="font-mono text-[11px] tracking-[0.22em] uppercase font-bold flex items-center gap-3" style={{ color: "#2e2418" }}>
            The Complete Shelf
            <span className="hidden sm:inline-block w-10 h-px" style={{ background: "#b3a58c" }} />
            <span className="hidden sm:inline font-normal" style={{ color: "#8a7860" }}>
              An interactive 3D library
            </span>
          </h1>
          <p className="font-mono text-[10px] tracking-[0.18em] uppercase mt-1.5" style={{ color: "#8a7860" }}>
            <span style={{ color: "#5a8a4a" }}>●</span> 19 volumes · every one free to read
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-14">
        <ScrollReveal>
          <p className="font-mono text-sm text-muted-foreground leading-relaxed mb-3 max-w-3xl">
            Nineteen books that take you from your first line of Python to AI safety, and
            every one of them is free to read at the publisher. Not free trials, not first
            chapters, and nothing pirated: these are books the authors and publishers put
            online themselves.
          </p>
          <p className="font-mono text-xs text-muted-foreground/50 mb-10">
            Drag, scroll or use the arrow keys to move along the shelf. Click a spine to
            pull the book out, then orbit and zoom it. Reviewed July 2026.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={60}>
          <h2 className="font-display text-2xl font-bold text-foreground mb-4">
            Every book on the shelf
          </h2>
          <BookList />
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <h2 className="font-display text-2xl font-bold text-foreground mb-4 mt-12">
            How the shelf is built
          </h2>
          <div className="space-y-3 mb-10">
            {[
              "Every volume is generated geometry: a rounded case, an inset paper block, and a foil motif stamped a fraction of a millimetre proud of the cloth so it catches the key light. There are no model files and no textures, so the whole library ships as code you can diff.",
              "Proportions are authored per book rather than randomised, because a shelf only reads as real when the volumes disagree with each other. The thin cloth pamphlet next to the thick reference is the entire effect.",
              "Browsing rails the camera along one axis at a fixed height. Letting you orbit the whole run made the spines unreadable from every angle worth looking at, so the rail is a constraint on purpose. Orbit, pan and zoom are handed over once a book is out.",
              "The shelf is measured in metres at roughly 1:1 scale, so the tall references stand about 25cm and the pamphlets about 20cm, the way they would on a real shelf.",
            ].map((t) => (
              <div key={t.slice(0, 28)} className="border-l border-border pl-4">
                <p className="font-mono text-xs text-muted-foreground leading-relaxed">{t}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>

        <ScrollReveal delay={140}>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { to: "/notebook/ai/roadmap", label: "The full roadmap", note: "400+ free resources across 28 topics" },
              { to: "/notebook/ai/encyclopedia", label: "Concepts encyclopedia", note: "123 concepts, explained and cross-linked" },
              { to: "/ai-contributors", label: "Top 100 contributors", note: "The people who built the field" },
            ].map((c) => (
              <Link
                key={c.to}
                to={c.to}
                className="border border-border p-4 hover:bg-secondary/20 border-glow-hover transition-all"
              >
                <p className="font-display text-sm font-bold text-foreground mb-1">{c.label} →</p>
                <p className="font-mono text-[10px] text-muted-foreground/60 leading-relaxed">{c.note}</p>
              </Link>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
