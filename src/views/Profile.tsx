import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { ArrowUpRight, Download, Mail, MapPin, Quote } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import CopyButton from "@/components/profile/CopyButton";
import SocialIcon from "@/components/profile/SocialIcon";
import { PAPER_COVERS } from "@/data/paperCovers";
import { GOOGLE_SCHOLAR_URL, linkedPapers } from "@/data/research";
import { BRIGHTONSEO_2026, RECOGNITION, TALKS, byDateDesc, formatTalkDate } from "@/data/talks";
import { guides } from "@/data/guides";
import { nodes as aiSystemsMapNodes } from "@/data/aiOntology";
import { LINKEDIN_COUNTS } from "@/data/linkedinArchiveServer";
import { UNIVERSE_PATH } from "@/data/universe";
import {
  BIOS,
  LINKEDIN_STATS,
  LINKEDIN_URL,
  PEER_QUOTES,
  PROFILE,
  SOCIAL_PROFILES,
  socialUrl,
  yearsInSearch,
} from "@/data/profile";

/* ── Derived from the data, never typed ─────────────────────────────── */

const media = TALKS.filter((t) => t.kind !== "workshop").sort(byDateDesc);
const latest = media.find((t) => t.thumb && t.links.length > 0);
const talksTotal = TALKS.length + 1;
const recordedMinutes = media.reduce((sum, t) => sum + (t.minutes ?? 0), 0) + BRIGHTONSEO_2026.video.duration / 60;
const peerReviewed = linkedPapers.filter((p) => p.review === "peer-reviewed");
const preprints = linkedPapers.filter((p) => p.review === "preprint");
const covers = linkedPapers.filter((p) => p.slug && PAPER_COVERS[p.slug] && p.coverCredit);
/** "© The Author(s) 2026, CC BY-NC-ND 4.0" from "First page as published. © ..." */
const coverCredits = covers.map((p) => (p.coverCredit ?? "").replace(/^First page[^.]*\.\s*/, "").replace(/\.$/, ""));
const archived = LINKEDIN_COUNTS.posts + LINKEDIN_COUNTS.articles;
const followers = LINKEDIN_STATS[0];
const SHOWN_QUOTES = ["Rodrigo Stockebrand", "Jean-Christophe Chouinard", "Raymond Martinez", "Andrea Volpini"];
const quotes = PEER_QUOTES.filter((q) => SHOWN_QUOTES.includes(q.name));

const gridBg: CSSProperties = {
  backgroundImage:
    "linear-gradient(to right, hsl(var(--border) / 0.55) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border) / 0.55) 1px, transparent 1px)",
  backgroundSize: "28px 28px",
};

/* ── Pieces ─────────────────────────────────────────────────────────── */

interface Action {
  label: string;
  href: string;
  primary?: boolean;
}

const btnBase = "inline-flex items-center justify-center gap-1.5 font-mono text-[11px] tracking-wider uppercase px-3 py-2 transition-colors";
const btnPrimary = `${btnBase} bg-foreground text-background hover:opacity-90`;
const btnSecondary = `${btnBase} border border-border text-foreground hover:border-foreground/40 hover:bg-foreground/5`;
const linkCls = "text-foreground underline decoration-border hover:decoration-foreground underline-offset-4 transition-colors";

function ActionLink({ a }: { a: Action }) {
  const cls = a.primary ? btnPrimary : btnSecondary;
  if (a.href.startsWith("/") || a.href.startsWith("#")) {
    return (
      <Link href={a.href} className={cls}>
        {a.label}
      </Link>
    );
  }
  return (
    <a href={a.href} target="_blank" rel="noopener noreferrer" className={cls}>
      {a.label} <ArrowUpRight size={11} aria-hidden="true" />
    </a>
  );
}

function RoleCard({
  label,
  title,
  media: mediaNode,
  children,
  stats,
  actions,
}: {
  label: string;
  title: string;
  media: ReactNode;
  children: ReactNode;
  stats: [string, string][];
  actions: Action[];
}) {
  return (
    <article className="border border-border bg-background flex flex-col border-glow-hover">
      <div className="relative aspect-video overflow-hidden border-b border-border bg-card">{mediaNode}</div>
      <div className="p-5 flex flex-col flex-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-2">{label}</p>
        <h2 className="font-display text-lg font-bold text-foreground leading-snug text-balance">{title}</h2>
        <div className="font-mono text-xs text-muted-foreground leading-relaxed mt-2">{children}</div>
        <dl className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-border">
          {stats.map(([v, l]) => (
            <div key={l}>
              <dt className="sr-only">{l}</dt>
              <dd className="font-display text-xl font-bold text-foreground tabular-nums">{v}</dd>
              <dd className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5 leading-snug">{l}</dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-wrap gap-2 mt-auto pt-5">
          {actions.map((a) => (
            <ActionLink key={a.href} a={a} />
          ))}
        </div>
      </div>
    </article>
  );
}

function Photo({ src, alt = "", position = "center" }: { src: string; alt?: string; position?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={640}
      height={360}
      loading="lazy"
      decoding="async"
      style={{ objectPosition: position }}
      className="absolute inset-0 w-full h-full object-cover"
    />
  );
}

function SectionTitle({ id, label, title, children }: { id: string; label: string; title: string; children?: ReactNode }) {
  return (
    <header className="mb-6">
      <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground mb-2 uppercase">{label}</p>
      <h2 id={id} className="font-display text-2xl sm:text-3xl font-bold text-foreground text-glow">
        {title}
      </h2>
      {children && <p className="font-mono text-xs text-muted-foreground leading-relaxed mt-3 max-w-2xl">{children}</p>}
    </header>
  );
}

/* ── Page ───────────────────────────────────────────────────────────── */

export default function Profile() {
  const years = yearsInSearch();

  return (
    <div className="min-h-screen bg-background pt-28 pb-20 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <Breadcrumbs className="mb-8" trail={[{ href: "/", label: "Home" }, { label: "Profile" }]} />

        {/* ── Header ── */}
        <header className="text-center mb-12">
          <p className="font-mono text-xs tracking-[0.3em] text-muted-foreground mb-4 uppercase">{"{00}"} · Profile</p>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground text-glow">{PROFILE.name}</h1>
          <p className="font-display text-xl sm:text-2xl text-foreground/85 mt-4">{PROFILE.field}</p>
          <p className="font-mono text-xs text-muted-foreground mt-3">
            {PROFILE.role} at {PROFILE.employer} · Researcher · Speaker
          </p>
        </header>

        <div className="grid lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)] gap-6 items-start">
          {/* ── Aside: who, where, how to reach ── */}
          <aside aria-label="Contact and profiles" className="border border-border p-6 lg:sticky lg:top-28 bg-card/20">
            <div className="mx-auto w-40 h-40 rounded-full border border-border p-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={PROFILE.photo.src}
                alt="Venkata Pagadala"
                width={PROFILE.photo.width}
                height={PROFILE.photo.height}
                loading="eager"
                fetchPriority="high"
                className="w-full h-full rounded-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
              />
            </div>
            <p className="font-display text-xl font-bold text-foreground text-center mt-4">{PROFILE.name}</p>
            <p className="font-mono text-[11px] text-muted-foreground text-center mt-1 leading-relaxed">
              {PROFILE.role}, {PROFILE.employer}
            </p>
            <p className="flex items-center justify-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-2">
              <MapPin size={11} aria-hidden="true" /> {PROFILE.location}
            </p>

            <ul className="grid grid-cols-3 gap-2 mt-6" aria-label="Profiles">
              {SOCIAL_PROFILES.map((s) => (
                <li key={s.id}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`${s.label}: ${s.handle}`}
                    className="flex flex-col items-center gap-1.5 border border-border py-3 px-1 text-muted-foreground hover:text-foreground hover:border-foreground/40 hover:bg-foreground/5 transition-colors"
                  >
                    <SocialIcon id={s.id} size={18} />
                    <span className="font-mono text-[9px] tracking-wide text-center leading-tight">{s.label}</span>
                  </a>
                </li>
              ))}
            </ul>

            <div className="grid grid-cols-2 gap-2 mt-4">
              <Link href="/contact" className={btnPrimary}>
                Contact
              </Link>
              <a href={`mailto:${PROFILE.email}`} className={btnSecondary}>
                <Mail size={11} aria-hidden="true" /> Email
              </a>
            </div>

            <dl className="mt-6 pt-5 border-t border-border space-y-3">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">In search</dt>
                <dd className="font-mono text-xs text-foreground">since 2016</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Followers</dt>
                <dd className="font-mono text-xs text-foreground">{followers.value}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Papers</dt>
                <dd className="font-mono text-xs text-foreground">{linkedPapers.length}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Talks and episodes</dt>
                <dd className="font-mono text-xs text-foreground">{talksTotal}</dd>
              </div>
            </dl>

            <p className="mt-6 font-mono text-[11px] text-center">
              <Link href="/about" className={linkCls}>
                Read the full story
              </Link>
            </p>
          </aside>

          {/* ── Roles ── */}
          <div className="min-w-0 space-y-16">
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              <RoleCard
                label="Speaker"
                title={BRIGHTONSEO_2026.event}
                media={
                  <Link href={`/research-and-talks#${BRIGHTONSEO_2026.slug}`} aria-label={`Watch ${BRIGHTONSEO_2026.title}`} className="group absolute inset-0">
                    <Photo src="/talks/thumbs/brightonseo-on-stage-2026.jpg" />
                    <span className="absolute left-3 bottom-3 bg-background/90 border border-border px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-foreground">
                      {BRIGHTONSEO_2026.track} · {formatTalkDate(BRIGHTONSEO_2026.startDate.slice(0, 10))}
                    </span>
                  </Link>
                }
                stats={[
                  [String(talksTotal), "Talks and episodes"],
                  [`${Math.round(BRIGHTONSEO_2026.video.duration / 60)} min`, "Talk, in chapters"],
                ]}
                actions={[
                  { label: "Watch the talk", href: `/research-and-talks#${BRIGHTONSEO_2026.slug}`, primary: true },
                  { label: "Slides", href: "https://speakerdeck.com/venkatapagadala1/industrial-context-graphs" },
                ]}
              >
                <span className="text-foreground">{BRIGHTONSEO_2026.title}</span>: why a query with zero measured volume can
                still carry real demand, and how to classify that demand by persona and intent.
              </RoleCard>

              <RoleCard
                label="Researcher"
                title="Published research"
                media={
                  <figure className="absolute inset-0 m-0" style={gridBg}>
                    {/* Absolute top and bottom give the row a definite height,
                        so each page can be sized as a share of it. */}
                    <div className="absolute inset-x-0 top-0 bottom-7 flex items-center justify-center gap-3 px-4">
                      {covers.map((p) => {
                        const c = PAPER_COVERS[p.slug as string];
                        return (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={p.slug}
                            src={c.src}
                            alt=""
                            width={c.width}
                            height={c.height}
                            loading="lazy"
                            decoding="async"
                            className="h-[72%] w-auto border border-border bg-white shadow-sm"
                          />
                        );
                      })}
                    </div>
                    <figcaption className="absolute inset-x-0 bottom-1.5 font-mono text-[8px] text-muted-foreground text-center px-3 leading-snug">
                      First pages as published. {coverCredits.join(" · ")}
                    </figcaption>
                  </figure>
                }
                stats={[
                  [String(peerReviewed.length), "Peer-reviewed"],
                  [String(preprints.length), preprints.length === 1 ? "Preprint" : "Preprints"],
                ]}
                actions={[
                  { label: "Read the papers", href: "/research-and-talks#papers", primary: true },
                  { label: "Scholar", href: GOOGLE_SCHOLAR_URL },
                ]}
              >
                Springer Nature&apos;s Discover Artificial Intelligence (2026), the Journal of Digital &amp; Social Media
                Marketing (2024), and a preprint on SSRN on how LLMs are disrupting SEO.
              </RoleCard>

              {latest && (
                <RoleCard
                  label="Podcast guest"
                  title="Podcasts and interviews"
                  media={
                    <a href={latest.links[0].url} target="_blank" rel="noopener noreferrer" aria-label={`Watch ${latest.title}`} className="group absolute inset-0">
                      <Photo src={latest.thumb as string} />
                      <span className="absolute right-2 bottom-2 flex items-center gap-1.5 bg-background/90 border border-border px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-foreground">
                        <svg width="9" height="9" viewBox="0 0 12 12" aria-hidden="true">
                          <path d="M2 1l9 5-9 5z" fill="currentColor" />
                        </svg>
                        Latest{latest.minutes ? ` · ${latest.minutes} min` : ""}
                      </span>
                    </a>
                  }
                  stats={[
                    [String(media.length), "Episodes and sessions"],
                    [`${Math.floor(recordedMinutes / 60)}+ hrs`, "On the record"],
                  ]}
                  actions={[
                    { label: "All episodes", href: "/research-and-talks#media", primary: true },
                    { label: "Latest", href: latest.links[0].url },
                  ]}
                >
                  Latest: <span className="text-foreground">{latest.title}</span> on {latest.outlet}. Also{" "}
                  {media
                    .slice(1, 4)
                    .map((t) => t.outlet)
                    .join(", ")}
                  .
                </RoleCard>
              )}

              <RoleCard
                label="Product leader"
                title={`${PROFILE.employer}`}
                media={
                  <div className="absolute inset-0 flex flex-col justify-between p-5" style={gridBg}>
                    <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Since March 2025</span>
                    <div>
                      <span className="block font-display text-2xl sm:text-3xl font-bold text-foreground leading-tight">
                        Automation
                        <br />
                        AI
                        <br />
                        SEO
                      </span>
                    </div>
                  </div>
                }
                stats={[
                  [`${years}+`, "Years in search"],
                  ["50M+", "Pages managed"],
                ]}
                actions={[
                  { label: "Career", href: "/about#experience", primary: true },
                  { label: "LinkedIn", href: LINKEDIN_URL },
                ]}
              >
                {PROFILE.role}: AI-assisted metadata with guardrails, retrieval-based internal linking, topic clustering and
                structured data at enterprise scale. Before that, SEO product at Apartments.com (CoStar Group).
              </RoleCard>

              <RoleCard
                label="Educator and builder"
                title="Guides and open tools"
                media={
                  <Link href="/guides/ai-agents-for-marketing" aria-label="AI Agents for Marketing, the field guide" className="group absolute inset-0">
                    <Photo src="/posters/ai-agents-for-marketing-og.jpg" position="left center" />
                  </Link>
                }
                stats={[
                  [String(guides.length), "Interactive guides"],
                  [String(aiSystemsMapNodes.length), "Entities in the AI map"],
                ]}
                actions={[
                  { label: "Guides", href: "/guides", primary: true },
                  { label: "GitHub", href: socialUrl("github") },
                ]}
              >
                How LLMs, neural networks and AI agents work, explained in 3D and in code: AI agents for marketing with an
                open-source repository, the AI Systems Map, and Audience Personas.
              </RoleCard>

              <RoleCard
                label="Creator"
                title="Ten years of posts, one graph"
                media={
                  <Link href={UNIVERSE_PATH} aria-label="Open the archive of posts" className="absolute inset-0 flex flex-col justify-between p-5" style={gridBg}>
                    <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                      LinkedIn, {LINKEDIN_COUNTS.firstYear} to {LINKEDIN_COUNTS.lastYear}
                    </span>
                    <span>
                      <span className="block font-display text-5xl font-bold text-foreground text-glow tabular-nums">{archived}</span>
                      <span className="block font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mt-1">
                        posts and articles, archived and connected by topic
                      </span>
                    </span>
                  </Link>
                }
                stats={[
                  [String(archived), "Posts and articles"],
                  [followers.value, "LinkedIn followers"],
                ]}
                actions={[
                  { label: "Open the archive", href: UNIVERSE_PATH, primary: true },
                  { label: "Follow", href: LINKEDIN_URL },
                ]}
              >
                Sharing what I build on LinkedIn since 2016. Every post and article is kept on this site, searchable and
                linked by topic, with its media and engagement.
              </RoleCard>
            </div>

            {/* ── Peers ── */}
            <section aria-labelledby="peers-h" id="peers" className="scroll-mt-28">
              <SectionTitle id="peers-h" label="In their words" title="What peers say">
                From public posts on LinkedIn. Each quote links to where it was said.
              </SectionTitle>
              <div className="grid md:grid-cols-2 gap-4">
                {quotes.map((q) => (
                  <figure key={q.name} className="border border-border p-6 flex flex-col border-glow-hover">
                    <Quote size={16} className="text-muted-foreground mb-3" aria-hidden="true" />
                    <blockquote className="font-display text-lg leading-snug text-foreground text-balance">
                      &ldquo;{q.quote}&rdquo;
                    </blockquote>
                    <figcaption className="mt-auto pt-5 font-mono text-xs">
                      <span className="text-foreground font-semibold">{q.name}</span>
                      <span className="block text-[11px] text-muted-foreground mt-0.5">{q.role}</span>
                      <a
                        href={q.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block text-[10px] text-muted-foreground hover:text-foreground mt-2 underline decoration-border underline-offset-4"
                      >
                        {q.about}, {formatTalkDate(q.date)} ↗
                      </a>
                    </figcaption>
                  </figure>
                ))}
              </div>
              <p className="mt-5 font-mono text-[11px]">
                <Link href="/about#peers" className={linkCls}>
                  More quotes, and recommendations from colleagues
                </Link>
              </p>
            </section>

            {/* ── Recognition ── */}
            <section aria-labelledby="recognition-h" id="recognition" className="scroll-mt-28">
              <SectionTitle id="recognition-h" label="Recognition" title="Lists and mentions">
                Each line says what its source says, and no more.
              </SectionTitle>
              <ul className="grid sm:grid-cols-2 gap-x-8 border-t border-border">
                {[...RECOGNITION].sort(byDateDesc).map((r) => (
                  <li key={r.slug} className="py-4 border-b border-border">
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-display text-sm font-semibold text-foreground leading-snug hover:underline decoration-border underline-offset-4"
                    >
                      {r.claim}
                    </a>
                    <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground mt-1.5">
                      {r.source}
                      {r.publishedOn ? ` on ${r.publishedOn}` : ""} · {formatTalkDate(r.date)}
                    </p>
                  </li>
                ))}
              </ul>
            </section>

            {/* ── Bios and headshot ── */}
            <section aria-labelledby="bios-h" id="bios" className="scroll-mt-28">
              <SectionTitle id="bios-h" label="For organizers and hosts" title="Bios and headshot">
                Use these as they are, or trim them. If a number has moved on by the time you read this, the newer number is
                on this page.
              </SectionTitle>
              <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,220px)] gap-4">
                <div className="space-y-4">
                  {(
                    [
                      ["Short bio", BIOS.short],
                      ["Long bio", BIOS.long],
                    ] as const
                  ).map(([name, text]) => (
                    <article key={name} className="border border-border p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                        <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                          {name} · {text.split(/\s+/).length} words
                        </h3>
                        <CopyButton text={text} label={`Copy ${name.toLowerCase()}`} />
                      </div>
                      <p className="font-mono text-xs text-foreground/85 leading-relaxed">{text}</p>
                    </article>
                  ))}
                </div>
                <figure className="border border-border p-4 m-0 self-start">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={PROFILE.photo.src}
                    alt="Headshot of Venkata Pagadala"
                    width={PROFILE.photo.width}
                    height={PROFILE.photo.height}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-auto border border-border"
                  />
                  <figcaption className="mt-3">
                    <a
                      href={PROFILE.photo.src}
                      download="venkata-pagadala-headshot.jpg"
                      className={`${btnSecondary} w-full`}
                    >
                      <Download size={11} aria-hidden="true" /> Headshot, {PROFILE.photo.width} × {PROFILE.photo.height} JPG
                    </a>
                  </figcaption>
                </figure>
              </div>
            </section>

            {/* ── Elsewhere ── */}
            <section aria-labelledby="elsewhere-h" id="elsewhere" className="scroll-mt-28">
              <SectionTitle id="elsewhere-h" label="Elsewhere" title="Find me online" />
              <ul className="grid sm:grid-cols-2 xl:grid-cols-3 border-t border-l border-border">
                {SOCIAL_PROFILES.map((s) => (
                  <li key={s.id} className="border-b border-r border-border">
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-3.5 text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
                    >
                      <SocialIcon id={s.id} size={16} />
                      <span className="font-mono text-xs text-foreground">{s.label}</span>
                      <span className="font-mono text-[10px] text-muted-foreground truncate ml-auto">{s.handle}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
