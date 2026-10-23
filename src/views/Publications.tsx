"use client";
import ScrollReveal from "@/components/ScrollReveal";
import SEO from "@/components/SEO";
import NeuralNetBackground from "@/components/NeuralNetBackground";
import { ExternalLink, ArrowRight } from "lucide-react";
import { Link } from "@/lib/router-shim";
import { researchPapers, authorRole } from "@/data/research";
import PaperCover from "@/components/research/PaperCover";

/**
 * Published research, and nothing else.
 *
 * This page previously carried the contributors index, research interests, a
 * featured system, active systems, a topic explorer and a solutions overview,
 * which buried the papers under everything else the site could show. A page
 * called Published Research should contain published research, so each entry
 * is now laid out the way a repository lays one out: title, venue, date,
 * summary, the author's own keywords, and a link that opens it.
 */
const Publications = () => {
  return (
    <div className="min-h-screen bg-background pt-32 pb-20 px-6 relative overflow-hidden">
      <SEO
        title="Published Research · Venkata Pagadala"
        description="Peer-reviewed papers on how large language models are disrupting search, AI-assisted SEO, and helpful content for e-commerce. Published on SSRN and in academic journals."
        canonical="https://venkatapagadala.com/publications"
      />
      <div className="fixed inset-0 z-0 pointer-events-none">
        <NeuralNetBackground />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-background/70" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <ScrollReveal>
          <p className="font-mono text-xs tracking-[0.3em] text-muted-foreground mb-4 uppercase">
            Peer-Reviewed
          </p>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground text-glow mb-6">
            Published Research
          </h1>
          <p className="font-mono text-sm text-muted-foreground leading-relaxed mb-4 max-w-2xl">
            Academic work on how artificial intelligence is reshaping search and content
            discovery. Every paper below links to its publisher&apos;s record, and says plainly
            whether it is peer reviewed.
          </p>
          <div className="border border-foreground/30 inline-block px-4 py-2 mb-12 border-glow">
            <span className="font-mono text-[10px] text-foreground tracking-widest uppercase">
              ★ Top Organic Search Voice · LinkedIn
            </span>
          </div>
        </ScrollReveal>

        {/* Contents. Four records, each one long, so the page needs a way in
            that is not scrolling. Real anchors, rendered server-side, and each
            row says the review status up front because that is the thing a
            reader is here to check. */}
        <nav aria-labelledby="toc-h" className="border border-border bg-card/20 p-5 mb-10">
          <h2 id="toc-h" className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-3">
            On this page
          </h2>
          <ol className="space-y-1.5">
            {researchPapers.map((paper, i) => (
              <li key={paper.title} className="flex items-baseline gap-3">
                <span className="font-mono text-[10px] text-muted-foreground/70 tabular-nums w-4 shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <a
                  href={`#${paper.slug}`}
                  className="font-mono text-xs text-foreground underline decoration-border hover:decoration-foreground underline-offset-4 transition-colors"
                >
                  {paper.shortTitle}
                </a>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {paper.year} ·{" "}
                  {paper.review === "peer-reviewed"
                    ? "peer reviewed"
                    : paper.review === "preprint"
                      ? "preprint"
                      : "published"}
                </span>
              </li>
            ))}
          </ol>
        </nav>

        <div className="space-y-6">
          {researchPapers.map((paper, i) => (
            <ScrollReveal key={paper.title} delay={i * 80}>
              <article id={paper.slug} className="border border-border p-8 border-glow-hover scroll-mt-28">
                {/* From sm up it floats, so the record reads as one column of
                    text with the page beside it the way a repository lays one
                    out. On a phone it does not: a 100px float left the title
                    wrapping two words to a line, so there it is a small block
                    above the heading and the text keeps the full width. */}
                <PaperCover paper={paper} className="w-[104px] mb-5 sm:float-right sm:ml-7 sm:mb-4 sm:w-[168px]" />
                <div className="flex items-center justify-between gap-4 mb-4">
                  {/* Every card used to say "Peer-Reviewed Paper", the SSRN
                      preprint included. The label now comes from the record,
                      and a paper whose review status is not established says
                      only what it is. */}
                  <p
                    className={`font-mono text-[10px] tracking-widest uppercase ${
                      paper.review === "peer-reviewed"
                        ? "text-emerald-700 dark:text-emerald-300"
                        : "text-muted-foreground/70"
                    }`}
                  >
                    {paper.review === "peer-reviewed"
                      ? "Peer-Reviewed Paper"
                      : paper.review === "preprint"
                        ? "Preprint · Not Peer Reviewed"
                        : "Journal Paper"}
                  </p>
                  <span className="font-mono text-[10px] text-muted-foreground/70 tracking-widest uppercase flex-shrink-0">
                    {paper.publisher ?? paper.host}
                  </span>
                </div>

                <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground mb-3 leading-snug">
                  {paper.title}
                </h2>

                <p className="font-mono text-xs text-muted-foreground/70 italic mb-4">
                  {paper.venue}
                  {paper.volume && <span className="not-italic">, vol. {paper.volume}</span>}
                  {paper.issue && <span className="not-italic">, no. {paper.issue}</span>}
                  {paper.pageRange && (
                    <span className="not-italic">
                      , {/^\d/.test(paper.pageRange) ? `pp. ${paper.pageRange}` : paper.pageRange}
                    </span>
                  )}
                  {!paper.pages && paper.postedOnline && (
                    <span className="not-italic"> · Published online {paper.postedOnline}</span>
                  )}
                  {paper.pages && paper.postedOnline && (
                    <span className="not-italic">
                      {" "}· {paper.pages} pages · Posted {paper.postedOnline}
                    </span>
                  )}
                </p>

                {!paper.abstract && paper.authors && paper.authors.length > 1 && (
                  <p className="font-mono text-xs text-muted-foreground mb-4">
                    {paper.authors.map((a, idx) => (
                      <span key={a}>
                        {idx > 0 && ", "}
                        <span className={idx + 1 === paper.authorPosition ? "text-foreground" : ""}>{a}</span>
                      </span>
                    ))}
                    <span className="text-muted-foreground/70"> · {authorRole(paper)}</span>
                  </p>
                )}

                {paper.abstract ? (
                  <>
                    <p className="font-mono text-xs text-muted-foreground mb-1">
                      <span className="text-foreground">Venkata Pagadala</span>
                      {paper.affiliation && <span className="text-muted-foreground/70"> · {paper.affiliation}</span>}
                    </p>
                    {paper.dateWritten && (
                      <p className="font-mono text-[11px] text-muted-foreground/70 mb-4">
                        Date written: {paper.dateWritten}
                      </p>
                    )}
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-1.5">
                      Abstract
                    </p>
                    <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-5">
                      {paper.abstract}
                    </p>
                  </>
                ) : (
                  <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-5">
                    {paper.summary}
                  </p>
                )}

                {paper.jel && (
                  <p className="font-mono text-[11px] text-muted-foreground/70 mb-4">
                    JEL classification: {paper.jel}
                  </p>
                )}
                {paper.abstract && paper.ssrnShortUrl && (
                  <div className="border border-border/70 bg-card/30 p-4 mb-5">
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-1.5">
                      Suggested citation
                    </p>
                    <p className="font-mono text-[11px] text-muted-foreground leading-relaxed">
                      Pagadala, Venkata, {paper.title} ({paper.dateWritten}). Available at SSRN:{" "}
                      <a href={paper.ssrnShortUrl} target="_blank" rel="noopener noreferrer" className="text-foreground/85 hover:text-foreground underline decoration-border">
                        {paper.ssrnShortUrl.replace("https://", "")}
                      </a>
                      {paper.doiUrl && (
                        <>
                          {" "}or{" "}
                          <a href={paper.doiUrl} target="_blank" rel="noopener noreferrer" className="text-foreground/85 hover:text-foreground underline decoration-border">
                            doi.org/10.2139/ssrn.6512878
                          </a>
                        </>
                      )}
                    </p>
                  </div>
                )}
                {paper.keywords && paper.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {paper.keywords.map((k) => (
                      <span
                        key={k}
                        className="font-mono text-[10px] text-muted-foreground/70 border border-border px-2 py-1"
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-5 flex-wrap border-t border-border pt-5">
                  <span className="font-mono text-[11px] text-muted-foreground/70">
                    Posted {paper.postedOnline ?? paper.posted ?? paper.year}
                  </span>
                  {paper.doiUrl && (
                    <a
                      href={paper.doiUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-mono text-xs text-foreground hover:text-glow transition-all"
                    >
                      DOI {paper.doiUrl.replace(/^https?:\/\/(dx\.)?doi\.org\//, "")} <ExternalLink size={12} />
                    </a>
                  )}
                  {paper.url ? (
                    <a
                      href={paper.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-mono text-xs text-foreground hover:text-glow transition-all"
                    >
                      Open on {paper.publisher ?? paper.host} <ExternalLink size={12} />
                    </a>
                  ) : (
                    <span className="font-mono text-[11px] text-muted-foreground/70">
                      Published in {paper.venue}
                    </span>
                  )}
                </div>
              </article>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal>
          <div className="border border-foreground/30 p-8 text-center border-glow mt-12">
            <h3 className="font-display text-xl font-bold text-foreground mb-3">
              Interested in collaborating?
            </h3>
            <p className="font-mono text-xs text-muted-foreground mb-6 max-w-md mx-auto">
              Open to research partnerships, investment conversations, and building AI
              systems together.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 border border-foreground px-6 py-3 font-mono text-xs text-foreground hover:bg-foreground hover:text-background transition-all tracking-widest uppercase"
            >
              Let's Talk <ArrowRight size={12} />
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
};

export default Publications;
