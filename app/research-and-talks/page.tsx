import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import FeaturedTalk from "@/components/talks/FeaturedTalk";
import TalkVideo from "@/components/talks/TalkVideo";
import { jsonLdScript } from "@/lib/jsonld";
import { buildResearchTalksGraph } from "@/lib/researchTalksLd";
import { OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/site";
import { linkedPapers, authorRole, accessNote, citationLine, GOOGLE_SCHOLAR_URL } from "@/data/research";
import PaperCover from "@/components/research/PaperCover";
import {
  BRIGHTONSEO_2026,
  KIND_LABEL,
  RECOGNITION,
  TALKS,
  byDateDesc,
  formatTalkDate,
  linkVerb,
} from "@/data/talks";

export const dynamic = "force-static";

const TITLE = "Research, Talks & Interviews";
const DESCRIPTION =
  "Peer-reviewed papers on AI and search, the brightonSEO San Diego 2026 talk on industrial level classification with intent, podcasts, interviews and recognition. Every item links to its source.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/research-and-talks",
    // A plain-text edition of this page for clients that would rather read
    // markdown than strip a nav and a few hundred utility classes out of HTML.
    types: { "text/markdown": "/research-and-talks.md" },
  },
  openGraph: {
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
    type: "website",
    url: `${SITE_URL}/research-and-talks`,
    title: TITLE,
    description: DESCRIPTION,
  },
};

const media = TALKS.filter((t) => t.kind !== "workshop").sort(byDateDesc);
const workshops = TALKS.filter((t) => t.kind === "workshop");
const peerReviewed = linkedPapers.filter((p) => p.review === "peer-reviewed");
const preprints = linkedPapers.filter((p) => p.review === "preprint");

export default function Page() {
  const graph = buildResearchTalksGraph(TITLE, DESCRIPTION);

  return (
    <div className="min-h-screen bg-background pt-32 pb-20 px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(graph) }} />

      <div className="max-w-6xl mx-auto">
        <Breadcrumbs className="mb-4" trail={[{ href: "/", label: "Home" }, { label: "Research & Talks" }]} />
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground text-glow mb-3">
          Research & Talks
        </h1>
        <p className="font-mono text-[11px] text-muted-foreground mb-8">
          {peerReviewed.length} peer-reviewed papers · {preprints.length} preprint · {BRIGHTONSEO_2026.event} ·{" "}
          {media.length} podcasts, interviews and talks · every item linked to its source
        </p>

        {/* Featured first: the recording and the session, before any list. */}
        <section id={BRIGHTONSEO_2026.slug} aria-label="brightonSEO San Diego 2026" className="mb-16 scroll-mt-28">
          <FeaturedTalk />
        </section>

        {/* Research papers */}
        <section id="papers" aria-labelledby="papers-h" className="mb-16 scroll-mt-28">
          <div className="flex flex-wrap items-baseline justify-between gap-3 mb-5">
            <h2 id="papers-h" className="font-display text-2xl font-bold text-foreground">
              Research papers
            </h2>
            <a
              href={GOOGLE_SCHOLAR_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[11px] border border-border px-3 py-1.5 text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
            >
              Google Scholar profile ↗
            </a>
          </div>
          {/* The page itself, not a card about the page. A row of titles is a
              bibliography, and a bibliography is a set of claims; the first
              page shows the journal header, the byline with Venkata's position
              in it, and the abstract, which is the evidence. */}
          <ol className="border-t border-border">
            {linkedPapers.map((p) => {
              const access = accessNote(p);
              return (
                <li
                  key={p.slug}
                  id={p.slug}
                  className="grid sm:grid-cols-[minmax(0,190px)_minmax(0,1fr)] gap-x-7 gap-y-4 py-7 border-b border-border scroll-mt-28"
                >
                  <PaperCover paper={p} />

                  <div className="min-w-0 flex flex-col">
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] mb-2">
                      <span
                        className={
                          p.review === "peer-reviewed"
                            ? "text-emerald-700 dark:text-emerald-300"
                            : "text-muted-foreground"
                        }
                      >
                        {p.review === "peer-reviewed" ? "Peer reviewed" : "Preprint"}
                      </span>
                      <span className="text-muted-foreground"> · {p.year}</span>
                      {access && <span className="text-muted-foreground"> · {access}</span>}
                    </p>
                    <h3 className="font-display text-lg font-bold text-foreground leading-snug text-balance">
                      <a
                        href={p.doiUrl ?? p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline decoration-border underline-offset-4"
                      >
                        {p.title}
                      </a>
                    </h3>
                    <p className="font-mono text-[11px] text-foreground/85 mt-2">
                      {citationLine(p)}
                      {p.pages ? ` · ${p.pages} pages` : ""}
                      {p.postedOnline ? ` · Posted ${p.postedOnline}` : ""}
                    </p>
                    {p.authors && (
                      // The full byline in printed order, with his name marked.
                      // "Co-author, 4th of 5" next to five visible names is a
                      // record; the name alone would read as sole authorship.
                      <p className="font-mono text-[10px] text-muted-foreground mt-1.5 leading-relaxed">
                        {p.authors.map((a, i) => (
                          <span key={a}>
                            {i > 0 && ", "}
                            <span className={i + 1 === p.authorPosition ? "text-foreground font-semibold" : ""}>
                              {a}
                            </span>
                          </span>
                        ))}
                        {authorRole(p) && ` · ${authorRole(p)}`}
                      </p>
                    )}
                    <p className="font-mono text-xs text-muted-foreground leading-relaxed mt-3">
                      {p.summary}
                    </p>
                    {p.keywords && p.keywords.length > 0 && (
                      // The authors' own keywords, as printed on the paper.
                      // They fill the column beside a tall page image with
                      // something a reader and a retrieval system both use.
                      <ul className="flex flex-wrap gap-1.5 mt-4">
                        {p.keywords.map((k) => (
                          <li
                            key={k}
                            className="font-mono text-[10px] text-muted-foreground/80 border border-border px-2 py-0.5"
                          >
                            {k}
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-5">
                      <a
                        href={p.doiUrl ?? p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-[11px] text-foreground underline decoration-border hover:decoration-foreground transition-colors"
                      >
                        {p.doiUrl ? "DOI" : p.host} ↗
                      </a>
                      {p.doiUrl && (
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-[11px] text-muted-foreground underline decoration-border hover:text-foreground transition-colors"
                        >
                          {p.publisher ?? p.host} ↗
                        </a>
                      )}
                      <Link
                        href="/publications"
                        className="font-mono text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Full record
                      </Link>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        {/* Workshops, then the tool the talk's method became */}
        <section aria-labelledby="work-h" className="mb-16">
          <h2 id="work-h" className="font-display text-2xl font-bold text-foreground mb-5">
            Talks & workshops
          </h2>
          {workshops.map((t) => (
            // One real box carries the anchor (display:contents has none), and
            // the tool card sits under the workshop text so the text column
            // fills the height of the vertical video instead of a second card
            // stretching to match it with nothing inside.
            <article
              key={t.slug}
              id={t.slug}
              className="grid sm:grid-cols-[minmax(0,220px)_minmax(0,1fr)] gap-6 items-start scroll-mt-28"
            >
              {t.video && <TalkVideo video={t.video} title={`${t.title}, ${t.outlet}`} />}
              <div className="flex flex-col gap-5">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-2">
                    {KIND_LABEL[t.kind]} · {formatTalkDate(t.date)}
                  </p>
                  <h3 className="font-display text-xl font-bold text-foreground">{t.title}</h3>
                  <p className="font-mono text-xs text-foreground/85 mt-1">{t.outlet}</p>
                  <p className="font-mono text-xs text-muted-foreground leading-relaxed mt-3 max-w-xl">{t.summary}</p>
                </div>
                <div className="border border-border p-5 max-w-xl">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-1.5">
                    The method from the talk, built
                  </p>
                  <h3 className="font-display text-lg font-bold text-foreground">Audience Personas</h3>
                  <p className="font-mono text-xs text-muted-foreground leading-relaxed mt-2 mb-4">
                    The talk&apos;s argument as a tool: build any audience and see where it actually is, with the
                    margin of error drawn rather than hidden.
                  </p>
                  <Link
                    href="/personas"
                    className="inline-block font-mono text-[11px] border border-foreground/40 px-3 py-1.5 text-foreground hover:bg-foreground/5 transition-colors"
                  >
                    Open Audience Personas
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </section>

        {/* Podcasts, interviews, talks: the thumbnail leads, because a row of
            text links reads as a bibliography and nobody clicks those. */}
        <section aria-labelledby="media-h" className="mb-16">
          <h2 id="media-h" className="font-display text-2xl font-bold text-foreground mb-5">
            Podcasts & interviews
          </h2>
          <ol className="border-t border-border">
            {media.map((t) => {
              const primary = t.links[0];
              const verb = primary ? linkVerb(primary.url) : "Open";
              return (
                <li
                  key={t.slug}
                  id={t.slug}
                  className="grid sm:grid-cols-[minmax(0,260px)_minmax(0,1fr)] gap-x-6 gap-y-4 py-6 border-b border-border scroll-mt-28"
                >
                  {t.thumb && primary && (
                    // Duplicate of the title link for sighted pointer users;
                    // hidden from the tab order so keyboards meet it once.
                    <a
                      href={primary.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      tabIndex={-1}
                      aria-hidden="true"
                      className="group relative block aspect-video overflow-hidden border border-border bg-card"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={t.thumb}
                        alt=""
                        width={640}
                        height={360}
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                      <span className="absolute right-2 bottom-2 flex items-center gap-1.5 bg-background/90 border border-border px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-foreground">
                        {verb === "Watch" && (
                          <svg width="9" height="9" viewBox="0 0 12 12" aria-hidden="true">
                            <path d="M2 1l9 5-9 5z" fill="currentColor" />
                          </svg>
                        )}
                        {verb}
                        {t.minutes ? ` · ${t.minutes} min` : ""}
                      </span>
                    </a>
                  )}
                  <div className="min-w-0 flex flex-col">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-1.5">
                      {t.outlet} · <time dateTime={t.date}>{formatTalkDate(t.date)}</time> · {KIND_LABEL[t.kind]}
                    </p>
                    <h3 className="font-display text-lg font-semibold text-foreground leading-snug text-balance">
                      {primary ? (
                        <a
                          href={primary.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline decoration-border underline-offset-4"
                        >
                          {t.title}
                        </a>
                      ) : (
                        t.title
                      )}
                    </h3>
                    <p className="font-mono text-xs text-muted-foreground leading-relaxed mt-2">{t.summary}</p>
                    <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3">
                      {t.links.map((l) => (
                        <a
                          key={l.url}
                          href={l.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-[11px] text-foreground underline decoration-border hover:decoration-foreground whitespace-nowrap transition-colors"
                        >
                          {l.label} ↗
                        </a>
                      ))}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        {/* Recognition, worded exactly as the sources support */}
        <section aria-labelledby="rec-h" className="mb-16">
          <h2 id="rec-h" className="font-display text-2xl font-bold text-foreground mb-2">
            Recognition
          </h2>
          <p className="font-mono text-[11px] text-muted-foreground mb-5 max-w-2xl leading-relaxed">
            Each line says what its source says, and no more.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {RECOGNITION.map((r) => (
              <article key={r.slug} id={r.slug} className="border border-border flex flex-col scroll-mt-28">
                {r.thumb && (
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    tabIndex={-1}
                    aria-hidden="true"
                    className="group relative block aspect-video overflow-hidden border-b border-border bg-card"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={r.thumb}
                      alt=""
                      width={640}
                      height={360}
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  </a>
                )}
                <div className="p-4 flex flex-col flex-1">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2">
                    {r.source}
                    {r.publishedOn ? ` on ${r.publishedOn}` : ""} · {formatTalkDate(r.date)}
                  </p>
                  <h3 className="font-display text-sm font-semibold text-foreground leading-snug text-balance">
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline decoration-border underline-offset-4"
                    >
                      {r.claim}
                    </a>
                  </h3>
                  {r.quote && (
                    <blockquote className="font-mono text-[11px] text-muted-foreground leading-relaxed mt-3 border-l-2 border-border pl-3">
                      &ldquo;{r.quote}&rdquo;
                    </blockquote>
                  )}
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[11px] text-foreground underline decoration-border hover:decoration-foreground mt-auto pt-4 self-start transition-colors"
                  >
                    {linkVerb(r.url)} at {r.publishedOn ?? r.source} ↗
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="rel-h">
          <h2 id="rel-h" className="font-display text-xl font-bold text-foreground mb-4">
            Related
          </h2>
          <ul className="grid sm:grid-cols-2 gap-2 font-mono text-xs">
            <li>
              <Link href="/personas" className="text-muted-foreground underline decoration-border hover:text-foreground transition-colors">
                Audience Personas: build any audience and see where it is
              </Link>
            </li>
            <li>
              <Link href="/publications" className="text-muted-foreground underline decoration-border hover:text-foreground transition-colors">
                Publications: full records, abstracts and keywords
              </Link>
            </li>
            <li>
              <Link href="/notebook/conference" className="text-muted-foreground underline decoration-border hover:text-foreground transition-colors">
                Conference Notebook: talks and speakers I have tracked
              </Link>
            </li>
            <li>
              <Link href="/about" className="text-muted-foreground underline decoration-border hover:text-foreground transition-colors">
                About me
              </Link>
            </li>
          </ul>
          <p className="font-mono text-[11px] text-muted-foreground mt-4">
            Reading this as a machine?{" "}
            <a
              href="/research-and-talks.md"
              className="text-foreground underline decoration-border hover:decoration-foreground transition-colors"
            >
              This page in markdown
            </a>{" "}
            ·{" "}
            <a
              href="/llms.txt"
              className="text-foreground underline decoration-border hover:decoration-foreground transition-colors"
            >
              llms.txt
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
