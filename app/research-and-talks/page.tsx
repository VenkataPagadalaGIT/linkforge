import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import FeaturedTalk from "@/components/talks/FeaturedTalk";
import TalkVideo from "@/components/talks/TalkVideo";
import { jsonLdScript } from "@/lib/jsonld";
import { OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/site";
import { linkedPapers, authorRole, GOOGLE_SCHOLAR_URL } from "@/data/research";
import {
  BRIGHTONSEO_2026,
  KIND_LABEL,
  RECOGNITION,
  TALKS,
  formatTalkDate,
} from "@/data/talks";

export const dynamic = "force-static";

const TITLE = "Research, Talks & Interviews";
const DESCRIPTION =
  "Peer-reviewed papers on AI and search, the brightonSEO San Diego 2026 talk on industrial level classification with intent, podcasts, interviews and recognition. Every item links to its source.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/research-and-talks" },
  openGraph: {
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
    type: "website",
    url: `${SITE_URL}/research-and-talks`,
    title: TITLE,
    description: DESCRIPTION,
  },
};

const media = TALKS.filter((t) => t.kind !== "workshop");
const workshops = TALKS.filter((t) => t.kind === "workshop");
const peerReviewed = linkedPapers.filter((p) => p.review === "peer-reviewed");
const preprints = linkedPapers.filter((p) => p.review === "preprint");

export default function Page() {
  const person = { "@type": "Person", name: "Venkata Pagadala", url: SITE_URL };

  const eventLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    "@id": `${SITE_URL}/research-and-talks#${BRIGHTONSEO_2026.slug}`,
    name: BRIGHTONSEO_2026.title,
    description: BRIGHTONSEO_2026.summary,
    startDate: BRIGHTONSEO_2026.startDate,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: BRIGHTONSEO_2026.event,
      address: { "@type": "PostalAddress", addressLocality: "San Diego", addressRegion: "CA", addressCountry: "US" },
    },
    performer: person,
    organizer: { "@type": "Organization", name: "brightonSEO", url: "https://brightonseo.com" },
    url: BRIGHTONSEO_2026.links[0].url,
    image: `${SITE_URL}${BRIGHTONSEO_2026.video.poster}`,
  };

  const papersLd = linkedPapers.map((p) => ({
    "@context": "https://schema.org",
    "@type": "ScholarlyArticle",
    "@id": `${SITE_URL}/research-and-talks#${p.slug}`,
    headline: p.title,
    author: (p.authors ?? ["Venkata Pagadala"]).map((name) => ({ "@type": "Person", name })),
    datePublished: p.year,
    isPartOf: { "@type": "Periodical", name: p.venue },
    ...(p.publisher ? { publisher: { "@type": "Organization", name: p.publisher } } : {}),
    url: p.url,
    ...(p.doiUrl ? { sameAs: p.doiUrl } : {}),
    abstract: p.summary,
  }));

  const pageLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${SITE_URL}/research-and-talks#page`,
    name: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/research-and-talks`,
    about: person,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: [
        { name: BRIGHTONSEO_2026.title, url: `${SITE_URL}/research-and-talks#${BRIGHTONSEO_2026.slug}` },
        ...linkedPapers.map((p) => ({ name: p.title, url: `${SITE_URL}/research-and-talks#${p.slug}` })),
        ...TALKS.map((t) => ({ name: t.title, url: `${SITE_URL}/research-and-talks#${t.slug}` })),
        ...RECOGNITION.map((r) => ({ name: r.claim, url: `${SITE_URL}/research-and-talks#${r.slug}` })),
      ].map((it, i) => ({ "@type": "ListItem", position: i + 1, ...it })),
    },
  };

  return (
    <div className="min-h-screen bg-background pt-32 pb-20 px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(pageLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(eventLd) }} />
      {papersLd.map((p) => (
        <script key={p["@id"]} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(p) }} />
      ))}

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
          <div className="grid md:grid-cols-3 gap-4">
            {linkedPapers.map((p) => (
              <article
                key={p.slug}
                id={p.slug}
                className="border border-border bg-card/20 p-5 flex flex-col scroll-mt-28"
              >
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] mb-3">
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
                </p>
                <h3 className="font-display text-base font-bold text-foreground leading-snug text-balance">
                  {p.title}
                </h3>
                <p className="font-mono text-[11px] text-foreground/85 mt-2">
                  {p.venue}
                  {p.volume ? `, vol. ${p.volume}` : ""}
                  {p.issue ? `, no. ${p.issue}` : ""}
                  {p.pageRange ? `, pp. ${p.pageRange}` : ""}
                </p>
                {authorRole(p) && (
                  <p className="font-mono text-[10px] text-muted-foreground mt-1">{authorRole(p)}</p>
                )}
                <p className="font-mono text-[11px] text-muted-foreground leading-relaxed mt-3 flex-1">
                  {p.summary}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-4 pt-3 border-t border-border/60">
                  <a
                    href={p.doiUrl ?? p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[11px] text-foreground underline decoration-border hover:decoration-foreground transition-colors"
                  >
                    {p.doiUrl ? "DOI" : p.host} ↗
                  </a>
                  <Link
                    href="/publications"
                    className="font-mono text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Full record
                  </Link>
                </div>
              </article>
            ))}
          </div>
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

        {/* Podcasts, interviews, talks */}
        <section aria-labelledby="media-h" className="mb-16">
          <h2 id="media-h" className="font-display text-2xl font-bold text-foreground mb-5">
            Podcasts & interviews
          </h2>
          <ol className="border-t border-border">
            {media.map((t) => (
              <li
                key={t.slug}
                id={t.slug}
                className="grid md:grid-cols-[140px_minmax(0,1fr)_auto] gap-x-6 gap-y-2 py-5 border-b border-border scroll-mt-28"
              >
                <div>
                  <p className="font-mono text-[11px] text-foreground tabular-nums">
                    <time dateTime={t.date}>{formatTalkDate(t.date)}</time>
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mt-0.5">
                    {KIND_LABEL[t.kind]}
                    {t.minutes ? ` · ${t.minutes} min` : ""}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
                    {t.outlet}
                  </p>
                  <h3 className="font-display text-base font-semibold text-foreground leading-snug text-balance">
                    {t.title}
                  </h3>
                  <p className="font-mono text-[11px] text-muted-foreground leading-relaxed mt-1.5">{t.summary}</p>
                </div>
                <div className="flex md:flex-col md:items-end gap-x-4 gap-y-1.5">
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
              </li>
            ))}
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
          <div className="grid md:grid-cols-3 gap-4">
            {RECOGNITION.map((r) => (
              <article key={r.slug} id={r.slug} className="border border-border p-5 flex flex-col scroll-mt-28">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
                  {r.source} · {r.date.slice(0, 4)}
                </p>
                <p className="font-display text-sm font-semibold text-foreground leading-snug flex-1">{r.claim}</p>
                {r.quote && (
                  <blockquote className="font-mono text-[11px] text-muted-foreground leading-relaxed mt-3 border-l-2 border-border pl-3">
                    &ldquo;{r.quote}&rdquo;
                  </blockquote>
                )}
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[11px] text-foreground underline decoration-border hover:decoration-foreground mt-4 self-start transition-colors"
                >
                  Read at {r.source} ↗
                </a>
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
        </section>
      </div>
    </div>
  );
}
