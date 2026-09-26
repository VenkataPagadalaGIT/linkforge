import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import FeaturedTalk from "@/components/talks/FeaturedTalk";
import Slideshow from "@/components/talks/Slideshow";
import { jsonLdScript } from "@/lib/jsonld";
import { buildBrightonRecapGraph } from "@/lib/brightonRecapLd";
import { SITE_URL } from "@/lib/site";
import { BRIGHTONSEO_2026 as T, formatClock, formatTalkDate } from "@/data/talks";
import { TRANSCRIPT, TRANSCRIPT_META } from "@/data/brightonTranscript";
import { PHOTOS, type TalkPhoto } from "@/data/brightonPhotos";
import {
  MY_TALK_POSTS,
  NEXT_TALK_POST,
  SUPPORT_POSTS,
  SUPPORT_TOTALS as N,
  THANK_YOU,
  type MyTalkPost,
  type SupportPost,
} from "@/data/brightonSupport";

export const dynamic = "force-static";

const PATH = "/research-and-talks/brightonseo-san-diego-2026";
const TITLE = "brightonSEO San Diego 2026: Recap and Thank You";
const HEADLINE = "brightonSEO 2026";
/** When this recap went live (deployment 7a5625d4 reached SUCCESS at 18:40 Eastern). */
const PUBLISHED = "2026-09-25T18:40:00-04:00";
const DESCRIPTION = N.posts
  ? `My brightonSEO San Diego 2026 talk and a thank-you to the ${N.people} people behind it: ${N.reactions.toLocaleString("en-US")} reactions across ${N.talkPosts} LinkedIn posts, the video, photos and slides.`
  : "My brightonSEO San Diego 2026 talk on industrial level classification with intent: the video, the slides and a thank-you.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: PATH,
    // The same page as plain markdown, transcript included, for assistants and crawlers.
    types: { "text/markdown": `${PATH}.md` },
  },
  openGraph: {
    type: "website",
    url: `${SITE_URL}${PATH}`,
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: `${SITE_URL}${T.video.poster}`, width: 1920, height: 1080, alt: `${T.title}, ${T.event}` }],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: [`${SITE_URL}${T.video.poster}`] },
};

const PHASES = [
  { id: "before", title: "Before the talk", blurb: "Shout-outs in the days before 15 September." },
  { id: "day", title: "On the day", blurb: "Posted on 15 and 16 September, while the conference ran." },
  { id: "after", title: "After the talk", blurb: "Recaps, takeaways and kind words from the week after." },
] as const;

const day = (iso: string) => formatTalkDate(iso.slice(0, 10));
const n = (v: number) => v.toLocaleString("en-US");
const plural = (v: number, one: string, many = `${one}s`) => `${n(v)} ${v === 1 ? one : many}`;

const linkClass =
  "font-mono text-[11px] border border-border px-3 py-1.5 text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors";
const h2Class = "font-display text-2xl font-bold text-foreground";
const h3Class = "font-display text-lg font-bold text-foreground";

/** A post as LinkedIn's public embed shows it: cropped screenshot on top, the words that matter under it. */
function Shot({ image, alt, href }: { image: { src: string; width: number; height: number }; alt: string; href: string }) {
  // The picture opens the post too. It repeats the name link, so it stays out of the tab order.
  return (
    // Every post screenshot is taller than this frame at card width, so each card's picture is the same height.
    <a href={href} target="_blank" rel="noopener noreferrer" tabIndex={-1} className="relative block h-[16rem] overflow-hidden border-b border-border bg-background">
      <img src={image.src} width={image.width} height={image.height} loading="lazy" decoding="async" alt={alt} className="block w-full h-auto" />
      <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-background to-transparent" />
    </a>
  );
}

function Counts({ reactions, comments }: { reactions: number | null; comments: number | null }) {
  if (reactions === null || comments === null) return <span />;
  return (
    <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
      {plural(reactions, "reaction")} · {plural(comments, "comment")}
    </span>
  );
}

function PostCard({ p }: { p: SupportPost }) {
  return (
    <article id={`post-${p.id}`} className="h-full border border-border bg-card/20 flex flex-col min-w-0 scroll-mt-28">
      {p.image && <Shot image={p.image} href={p.url} alt={`${p.author}'s LinkedIn post of ${day(p.posted)}`} />}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <h4 className="font-display text-base font-bold text-foreground leading-snug">
          <a href={p.url} target="_blank" rel="noopener noreferrer" className="hover:underline underline-offset-4">
            {p.author}
          </a>
        </h4>
        {p.headline && <p className="font-mono text-[11px] text-muted-foreground leading-snug">{p.headline}</p>}
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">
          <time dateTime={p.posted}>{day(p.posted)}</time>
        </p>
        {p.quote ? (
          <blockquote className="font-mono text-xs text-foreground/85 leading-relaxed border-l border-border pl-3 line-clamp-5">“{p.quote}”</blockquote>
        ) : (
          <p className="font-mono text-xs text-muted-foreground leading-relaxed">
            Shared with signed-in LinkedIn members only, so it is linked here rather than shown.
          </p>
        )}
        <div className="mt-auto pt-2 flex flex-wrap items-center justify-between gap-2">
          <Counts reactions={p.reactions} comments={p.comments} />
          <a href={p.url} target="_blank" rel="noopener noreferrer" className={linkClass}>
            Read on LinkedIn ↗
          </a>
        </div>
      </div>
    </article>
  );
}

function MyPostCard({ m }: { m: MyTalkPost }) {
  return (
    <article className="h-full border border-border bg-card/20 flex flex-col min-w-0">
      {m.image && <Shot image={m.image} href={m.url} alt={`My LinkedIn post of ${day(m.posted)}: ${m.label}`} />}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <h4 className="font-display text-base font-bold text-foreground leading-snug">
          <a href={m.url} target="_blank" rel="noopener noreferrer" className="hover:underline underline-offset-4">
            {m.label}
          </a>
        </h4>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">
          <time dateTime={m.posted}>{day(m.posted)}</time>
        </p>
        <div className="mt-auto pt-2 flex flex-wrap items-center justify-between gap-2">
          <Counts reactions={m.reactions} comments={m.comments} />
          <a href={m.url} target="_blank" rel="noopener noreferrer" className={linkClass}>
            Read on LinkedIn ↗
          </a>
        </div>
      </div>
    </article>
  );
}

/**
 * One photo as a slide. Every slide is the same height and each photo keeps
 * its own shape (landscape 4:3, portrait 3:4), so nothing is cropped or
 * letterboxed and there is no empty space under a caption. The small file
 * loads first; the large one is in srcset for high-density screens, and the
 * photo links to it.
 */
function PhotoSlide({ p }: { p: TalkPhoto }) {
  const r = p.width / p.height;
  return (
    <figure className="border border-border bg-card/20 w-min">
      <a href={p.src} target="_blank" rel="noopener noreferrer" className="block">
        <img
          src={p.srcSm}
          srcSet={`${p.srcSm} ${p.widthSm}w, ${p.src} ${p.width}w`}
          sizes={`(min-width: 640px) ${Math.round(352 * r)}px, ${Math.round(240 * r)}px`}
          width={p.width}
          height={p.height}
          loading="lazy"
          decoding="async"
          alt={p.alt}
          className="block h-[15rem] sm:h-[22rem] w-auto max-w-none"
        />
      </a>
      <figcaption className="px-3 py-2 min-h-[3.25rem] font-mono text-[11px] text-muted-foreground leading-snug">{p.caption}</figcaption>
    </figure>
  );
}

/** First letter of a name for the A to Z index: accents folded, punctuation skipped. */
const initialOf = (name: string) =>
  name
    .normalize("NFKD")
    .replace(/[^A-Za-z]/g, "")
    .charAt(0)
    .toUpperCase();
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function Stat({ value, label, split, note }: { value: string; label: string; split?: string; note?: string }) {
  return (
    <div className="border border-border bg-card/20 p-4">
      <p className="font-display text-3xl sm:text-4xl font-bold text-foreground tabular-nums">{value}</p>
      <p className="font-mono text-xs text-foreground mt-1">{label}</p>
      {split && <p className="font-mono text-[11px] text-foreground/85 leading-snug mt-2 tabular-nums">{split}</p>}
      {note && <p className="font-mono text-[11px] text-muted-foreground leading-snug mt-1 tabular-nums">{note}</p>}
    </div>
  );
}

/** Posts, reactions and comments for a set of posts, for the line beside a heading. */
function tally(posts: { reactions: number | null; comments: number | null }[]) {
  const r = posts.reduce((s, p) => s + (p.reactions ?? 0), 0);
  const c = posts.reduce((s, p) => s + (p.comments ?? 0), 0);
  return `${plural(posts.length, "post")} · ${plural(r, "reaction")} · ${plural(c, "comment")}`;
}

type TocItem = { id: string; label: string; count?: number };

function Toc({ items }: { items: TocItem[] }) {
  return (
    <ol className="space-y-0.5">
      {items.map((t, i) => (
        <li key={t.id} className="flex items-baseline gap-2">
          <span className="font-mono text-[10px] text-muted-foreground/70 tabular-nums w-4 shrink-0">{String(i + 1).padStart(2, "0")}</span>
          <a
            href={`#${t.id}`}
            className="font-mono text-xs text-foreground underline decoration-border hover:decoration-foreground underline-offset-4 py-1 leading-snug"
          >
            {t.label}
          </a>
          {t.count ? <span className="font-mono text-[10px] text-muted-foreground tabular-nums">{t.count}</span> : null}
        </li>
      ))}
    </ol>
  );
}

export default function Page() {
  const wall = SUPPORT_POSTS.filter((p) => p.phase !== "next");
  const nextPosts = SUPPORT_POSTS.filter((p) => p.phase === "next");
  const inPhase = (id: string) => wall.filter((p) => p.phase === id);
  const talkDate = formatTalkDate(T.startDate.slice(0, 10));
  const slides = T.links.find((l) => /speakerdeck\.com/.test(l.url));
  const allPosts = [...wall, ...MY_TALK_POSTS];
  const nameGroups = LETTERS.map((letter) => ({ letter, people: THANK_YOU.filter((t) => initialOf(t.name) === letter) }));

  // The page reads in the order its visitors care about: the thank-you and the
  // numbers, every name, then the talk itself, then the posts.
  const toc: TocItem[] = [
    { id: "thank-you", label: "Thank you" },
    ...(THANK_YOU.length ? [{ id: "names", label: "Everyone, by name", count: THANK_YOU.length }] : []),
    { id: "talk", label: "The talk and video" },
    ...(PHOTOS.length ? [{ id: "photos", label: "Photos", count: PHOTOS.length }] : []),
    { id: "slides", label: "Slides" },
    ...(allPosts.length ? [{ id: "posts", label: "LinkedIn posts", count: allPosts.length }] : []),
    ...(TRANSCRIPT.length ? [{ id: "transcript", label: "Transcript", count: TRANSCRIPT.length }] : []),
    ...(NEXT_TALK_POST ? [{ id: "next", label: "What came next" }] : []),
    ...(N.captured ? [{ id: "method", label: "How this was gathered" }] : []),
  ];

  // Every part of the page, marked up as one graph: see src/lib/brightonRecapLd.ts.
  const graph = buildBrightonRecapGraph({ path: PATH, title: TITLE, headline: HEADLINE, description: DESCRIPTION, published: PUBLISHED });

  return (
    <div className="min-h-screen bg-background pt-32 pb-20 px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(graph) }} />

      <div className="max-w-7xl mx-auto">
        <Breadcrumbs
          className="mb-4"
          trail={[
            { href: "/", label: "Home" },
            { href: "/research-and-talks", label: "Research & Talks" },
            { label: "brightonSEO San Diego 2026: recap and thank you" },
          ]}
        />

        <header className="mb-10">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-3">
            San Diego · {T.track} · {talkDate}, 9:15 AM
          </p>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground text-glow mb-4">{HEADLINE}</h1>
          <p className="font-mono text-sm text-muted-foreground leading-relaxed max-w-3xl">
            On {talkDate} I spoke in {T.track} at {T.event}: “{T.title}” ({T.tagline}). This page is my thank-you: the
            numbers, the names, the video and photos, and every post, linked back to where it was written.
          </p>
          <p className="font-mono text-[11px] text-muted-foreground mt-4 flex flex-wrap gap-x-4 gap-y-1">
            <a href={`${PATH}.md`} className="text-foreground underline decoration-border hover:decoration-foreground underline-offset-4">
              Markdown edition, with the full transcript
            </a>
            <a href={TRANSCRIPT_META.vtt} className="text-foreground underline decoration-border hover:decoration-foreground underline-offset-4">
              Captions file (WebVTT)
            </a>
          </p>
        </header>

        <div className="xl:grid xl:grid-cols-[12rem_minmax(0,1fr)] xl:gap-10">
          {/* Contents: a sticky rail from 1280px, a collapsible list below that. Plain anchors, so both work with scripts off. */}
          <aside className="hidden xl:block">
            <nav aria-labelledby="toc-rail-h" className="sticky top-28 border border-border bg-card/20 p-4">
              <h2 id="toc-rail-h" className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-3">
                On this page
              </h2>
              <Toc items={toc} />
            </nav>
          </aside>

          <div className="min-w-0">
            <details className="xl:hidden border border-border bg-card/20 mb-8 group">
              <summary className="cursor-pointer list-none p-4 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                On this page
                <span aria-hidden className="transition-transform group-open:rotate-180">▾</span>
              </summary>
              <nav aria-label="On this page" className="px-4 pb-4">
                <Toc items={toc} />
              </nav>
            </details>

            {/* 1. The thank-you, with the numbers it is for: totals, and my own posts split from everyone else's. */}
            <section id="thank-you" aria-labelledby="thank-you-h" className="mb-14 scroll-mt-28">
              <h2 id="thank-you-h" className={`${h2Class} mb-5`}>
                Thank you to everyone behind these numbers
              </h2>
              {N.posts > 0 && (
                <>
                  {/* The talk's own phrase, set into the frame of the numbers: the people come first. */}
                  <div className="relative border border-border p-3 pt-7 sm:p-4 sm:pt-8 mt-3">
                    <p className="absolute -top-3 left-3 sm:left-4 bg-background px-2 font-display text-base font-bold text-foreground leading-6">
                      User First
                    </p>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                      <Stat
                        value={n(N.reactions)}
                        label="reactions"
                        split={`${n(N.myReactions)} on my ${N.myPosts} posts · ${n(N.theirReactions)} on ${N.posts} posts by others`}
                      />
                      <Stat value={n(N.comments)} label="comments" split={`${n(N.myComments)} on my posts · ${n(N.theirComments)} on theirs`} />
                      <Stat
                        value={n(N.talkPosts)}
                        label="LinkedIn posts about the talk"
                        split={`${N.myPosts} of mine · ${N.posts} by ${plural(N.authors, "person and page", "people and pages")}`}
                        note={`Theirs: ${n(N.before)} before the talk, ${n(N.day)} on the day, ${n(N.after)} after.`}
                      />
                      <Stat value={n(N.people)} label="people thanked by name" split="Everyone who posted about the talk or helped me shape it." />
                    </div>
                  </div>
                  <p className="font-mono text-[11px] text-muted-foreground mt-3">
                    As LinkedIn showed them on {formatTalkDate(N.captured)}. They keep moving.
                  </p>
                </>
              )}
              <div className="mt-8 border-l-2 border-foreground/40 pl-5 max-w-3xl space-y-3">
                <p className="font-mono text-sm text-foreground leading-relaxed">
                  To everyone who supported me, guided me directly, mentored me, and came to the session at brightonSEO: thank
                  you.
                </p>
                <p className="font-mono text-xs text-muted-foreground leading-relaxed">
                  Some of you posted, commented and shared. Some of you guided me through the slides and the presentation. Some of
                  you were in the room in {T.track}. The names I know are below, each linked to LinkedIn.
                </p>
                <p className="font-mono text-xs text-muted-foreground leading-relaxed">
                  To Kelvin Newman, Carmen Aragones and the brightonSEO team, for the stage and for running it so well. And to my
                  mom, to whom the talk was dedicated.
                </p>
              </div>
            </section>

            {/* 2. Every name, one list, one style: nobody is set apart from anybody else. */}
            {THANK_YOU.length > 0 && (
              <section id="names" aria-labelledby="names-h" className="mb-16 scroll-mt-28">
                <div className="flex flex-wrap items-baseline gap-3 mb-1">
                  <h2 id="names-h" className={h2Class}>
                    Everyone, by name
                  </h2>
                  <span className="font-mono text-[11px] text-muted-foreground tabular-nums">{plural(THANK_YOU.length, "name")}</span>
                </div>
                <p className="font-mono text-xs text-muted-foreground mb-4">A to Z by first name. Pick a letter to jump to it; each name opens their LinkedIn.</p>
                {/* A to Z: letters with names are links, the rest are shown but inert, so the alphabet reads whole. */}
                <nav aria-label="Names by first letter" className="flex flex-wrap gap-1 mb-6">
                  {nameGroups.map(({ letter, people }) =>
                    people.length ? (
                      <a
                        key={letter}
                        href={`#names-${letter.toLowerCase()}`}
                        className="font-mono text-xs w-8 h-8 inline-flex items-center justify-center border border-border text-foreground hover:border-foreground/40 hover:bg-foreground/5 transition-colors"
                      >
                        {letter}
                      </a>
                    ) : (
                      <span key={letter} aria-hidden className="font-mono text-xs w-8 h-8 inline-flex items-center justify-center text-muted-foreground/70">
                        {letter}
                      </span>
                    ),
                  )}
                </nav>
                <div className="columns-2 sm:columns-3 lg:columns-4 gap-6">
                  {nameGroups
                    .filter((g) => g.people.length)
                    .map(({ letter, people }) => (
                      <div key={letter} id={`names-${letter.toLowerCase()}`} className="break-inside-avoid mb-5 scroll-mt-28">
                        <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground border-b border-border pb-1 mb-1">
                          {letter}
                        </h3>
                        <ul>
                          {people.map((t) => (
                            <li key={t.url} className="font-mono text-xs py-1">
                              <a
                                href={t.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-foreground underline decoration-border hover:decoration-foreground underline-offset-4"
                              >
                                {t.name}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                </div>
              </section>
            )}

            {/* 3. The talk: what it covered, and the recording as a link rather than a full-height player. */}
            <section id="talk" aria-label="The talk and video" className="mb-14 scroll-mt-28">
              <FeaturedTalk hideLinkTo={PATH} chapterAnchor="#t-" />
              {/* The recording lives on the page, folded: one line until someone asks for it. The player
                  only loads when opened, so the page stays light, and it works with scripts off. */}
              {T.video.linkedinEmbed && (
                <details className="mt-4 group" id="video">
                  <summary className="cursor-pointer list-none inline-flex items-center gap-2 font-mono text-xs border border-foreground/40 px-4 py-2 text-foreground hover:bg-foreground/5 transition-colors">
                    <span aria-hidden>▶</span> Play the full talk here ({Math.round(T.video.duration / 60)} min)
                  </summary>
                  <div className="mt-3 max-w-[552px] border border-border bg-card/20">
                    <iframe
                      src={T.video.linkedinEmbed}
                      title={`Full recording: ${T.title}, ${T.event}, on LinkedIn`}
                      loading="lazy"
                      allowFullScreen
                      className="block w-full h-[820px] border-0"
                    />
                  </div>
                </details>
              )}
              {T.video.linkedinPost && (
                <a
                  href={T.video.linkedinPost}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 ml-0 sm:ml-3 inline-flex items-center gap-2 font-mono text-[11px] text-muted-foreground underline decoration-border hover:text-foreground underline-offset-4"
                >
                  or watch it on LinkedIn ↗
                </a>
              )}
            </section>

            {PHOTOS.length > 0 && (
              <section id="photos" aria-labelledby="photos-h" className="mb-14 scroll-mt-28">
                <div className="flex flex-wrap items-baseline gap-3 mb-1">
                  <h2 id="photos-h" className={h2Class}>
                    Photos
                  </h2>
                  <span className="font-mono text-[11px] text-muted-foreground tabular-nums">{plural(PHOTOS.length, "photo")}</span>
                </div>
                <p className="font-mono text-xs text-muted-foreground mb-4">On stage in {T.track} and around the conference. Select a photo to open it full size.</p>
                <Slideshow label="Photos from the talk" slideClassName="">
                  {PHOTOS.map((p) => (
                    <PhotoSlide key={p.src} p={p} />
                  ))}
                </Slideshow>
              </section>
            )}

            <section id="slides" aria-labelledby="slides-h" className="mb-16 scroll-mt-28">
              <div className="flex flex-wrap items-baseline justify-between gap-3 mb-4">
                <h2 id="slides-h" className={h2Class}>
                  Slides
                </h2>
                {slides && (
                  <a href={slides.url} target="_blank" rel="noopener noreferrer" className={linkClass}>
                    Open on Speaker Deck ↗
                  </a>
                )}
              </div>
              <div className="border border-border bg-card/20 aspect-video max-w-3xl">
                <iframe
                  src={T.slidesPlayer}
                  title={`Slides: ${T.title}, ${T.event}`}
                  loading="lazy"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              </div>
            </section>

            {/* 4. The posts: one sideways row per stretch of time, so 27 posts take four rows, not a wall. */}
            {allPosts.length > 0 && (
              <section id="posts" aria-labelledby="posts-h" className="mb-16 scroll-mt-28">
                <div className="flex flex-wrap items-baseline gap-3 mb-1">
                  <h2 id="posts-h" className={h2Class}>
                    LinkedIn posts
                  </h2>
                  <span className="font-mono text-[11px] text-muted-foreground tabular-nums">{tally(allPosts)}</span>
                </div>
                <p className="font-mono text-xs text-muted-foreground">
                  What people wrote before, during and after the talk, and my own posts about it. Select a post to read it on LinkedIn.
                </p>
                {PHASES.map((ph) => {
                  const posts = inPhase(ph.id);
                  if (!posts.length) return null;
                  return (
                    <div key={ph.id} id={ph.id} className="mt-8 scroll-mt-28">
                      <div className="flex flex-wrap items-baseline gap-3 mb-1">
                        <h3 className={h3Class}>{ph.title}</h3>
                        <span className="font-mono text-[11px] text-muted-foreground tabular-nums">{tally(posts)}</span>
                      </div>
                      <p className="font-mono text-xs text-muted-foreground mb-3">{ph.blurb}</p>
                      <Slideshow label={`LinkedIn posts, ${ph.title.toLowerCase()}`} slideClassName="w-[85%] sm:w-[20rem]">
                        {posts.map((p) => (
                          <PostCard key={p.id} p={p} />
                        ))}
                      </Slideshow>
                    </div>
                  );
                })}
                {MY_TALK_POSTS.length > 0 && (
                  <div id="my-posts" className="mt-8 scroll-mt-28">
                    <div className="flex flex-wrap items-baseline gap-3 mb-1">
                      <h3 className={h3Class}>My posts about it</h3>
                      <span className="font-mono text-[11px] text-muted-foreground tabular-nums">{tally(MY_TALK_POSTS)}</span>
                    </div>
                    <p className="font-mono text-xs text-muted-foreground mb-3">From the announcement to the recap.</p>
                    <Slideshow label="My LinkedIn posts about the talk" slideClassName="w-[85%] sm:w-[20rem]">
                      {MY_TALK_POSTS.map((m) => (
                        <MyPostCard key={m.url} m={m} />
                      ))}
                    </Slideshow>
                  </div>
                )}
              </section>
            )}

            {TRANSCRIPT.length > 0 && (
              <section id="transcript" aria-labelledby="transcript-h" className="mb-16 scroll-mt-28">
                <div className="flex flex-wrap items-baseline justify-between gap-3 mb-2">
                  <h2 id="transcript-h" className={h2Class}>
                    Transcript
                  </h2>
                  <a href={`${PATH}.md`} className={linkClass}>
                    As markdown
                  </a>
                </div>
                <p className="font-mono text-xs text-muted-foreground leading-relaxed max-w-3xl mb-4">
                  {n(TRANSCRIPT_META.words)} words, timed to the recording on LinkedIn. The captions were generated from the room
                  audio and edited for readability; {TRANSCRIPT_META.inaudible} unclear passages are marked [inaudible] rather than
                  guessed. The first lines are the session host&apos;s introduction.
                </p>
                <div className="border border-border bg-card/20 p-5 max-h-[26rem] sm:max-h-[32rem] overflow-y-auto space-y-6">
                  {TRANSCRIPT.map((c) => (
                    <div key={c.at} id={`t-${c.at}`} className="scroll-mt-28">
                      <h3 className="font-display text-base font-bold text-foreground mb-2">
                        <span className="font-mono text-[11px] text-muted-foreground tabular-nums mr-3">{formatClock(c.at)}</span>
                        {c.title}
                      </h3>
                      {c.paragraphs.map((p) => (
                        <p key={p.at} className="font-mono text-xs text-foreground/85 leading-relaxed mb-2">
                          <span className="text-muted-foreground tabular-nums mr-2">[{formatClock(p.at)}]</span>
                          {p.speaker === "host" && <span className="text-muted-foreground mr-1">Host:</span>}
                          {p.text}
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {NEXT_TALK_POST && (
              <section id="next" aria-labelledby="next-h" className="mb-16 scroll-mt-28">
                <h2 id="next-h" className={`${h2Class} mb-3`}>
                  What came next
                </h2>
                <p className="font-mono text-xs text-muted-foreground leading-relaxed max-w-3xl mb-5">
                  The FCDC invited me to take the talk further in its Expert Series on 14 October 2026: building AI agents for
                  marketing functions.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start max-w-3xl">
                  <MyPostCard m={NEXT_TALK_POST} />
                  {nextPosts.map((p) => (
                    <PostCard key={p.id} p={p} />
                  ))}
                </div>
              </section>
            )}

            {N.captured && (
              <section id="method" aria-labelledby="method-h" className="border-t border-border pt-6 scroll-mt-28">
                <h2 id="method-h" className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-3">
                  How this was gathered
                </h2>
                <p className="font-mono text-[11px] text-muted-foreground leading-relaxed max-w-3xl">
                  Collected from LinkedIn on {formatTalkDate(N.captured)}: posts that name me in connection with the talk
                  {N.commenters > 0 ? ", and the comments and reposts on my own posts about it" : ""}. Each post screenshot is
                  LinkedIn&apos;s public embed of the post; posts shared with signed-in members only are linked, not shown.
                  Searches of X, Reddit, Threads, Instagram, Facebook, YouTube and Bluesky found nothing further.
                </p>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
