"use client";
import type { Block } from "@/data/guides";
import TalkVideo from "@/components/talks/TalkVideo";
import Slideshow from "@/components/talks/Slideshow";
import { inline } from "./inline";

/**
 * MediaBlocks: the guide blocks that carry real recordings and real people:
 * slides as presented, stage clips, the full talk and the deck as players,
 * photos, what practitioners said in public, recorded conversations, the tools
 * on this site, and the papers. Everything renders on the server. Players that
 * belong to another site sit behind a click (a <details>, so it works with
 * scripts off) and load nothing until a reader opens them.
 */

type B<K extends Block["kind"]> = Extract<Block, { kind: K }>;

const kicker = "font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground";
const link = "font-mono text-[11px] text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground";
const Html = ({ text, className }: { text: string; className?: string }) => (
  <p className={className} dangerouslySetInnerHTML={{ __html: inline(text) }} />
);
const Caption = ({ text }: { text?: string }) =>
  text ? <Html text={text} className="font-mono text-[11px] text-muted-foreground/80 mt-2 leading-relaxed [overflow-wrap:anywhere]" /> : null;

/** 464 → "7:44". */
export const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
/** "2026-09-11" → "11 September 2026", the same on the server and in every browser. */
const day = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return d ? `${d} ${MONTHS[m - 1]} ${y}` : String(y);
};
const out = { target: "_blank", rel: "noopener noreferrer" } as const;

/* ── One slide, as presented ────────────────────────────────────────── */

export function Slide({ block }: { block: B<"slide"> }) {
  return (
    <figure className="my-8">
      <div className="border border-border bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={block.image.src}
          alt={block.alt}
          width={block.image.width}
          height={block.image.height}
          loading="lazy"
          decoding="async"
          className="block w-full h-auto"
        />
      </div>
      <figcaption className="mt-2">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className={kicker}>
            Slide {block.n} · {block.event}
          </span>
          <a href={`${block.deck}?slide=${block.n}`} {...out} className={link}>
            Open this slide in the deck ↗
          </a>
          {block.listen && (
            <a href={block.listen.href} className={link}>
              ▶ Hear it at {clock(block.listen.at)} in the talk
            </a>
          )}
        </div>
        <Caption text={block.caption} />
      </figcaption>
    </figure>
  );
}

/* ── A stage clip ───────────────────────────────────────────────────── */

export function Clip({ block }: { block: B<"clip"> }) {
  return (
    <figure className="my-8">
      <div className="relative w-full aspect-video border border-border bg-black overflow-hidden">
        <video
          controls
          playsInline
          preload="none"
          poster={block.poster.src}
          width={block.poster.width}
          height={block.poster.height}
          aria-label={`${block.title} (video, ${Math.round(block.duration)} seconds, captioned)`}
          className="absolute inset-0 h-full w-full"
        >
          <source src={block.src} type="video/mp4" />
          <a href={block.src}>Download the clip</a>
        </video>
      </div>
      <figcaption className="mt-3">
        <div className={kicker}>
          On stage · {block.event} · {Math.round(block.duration)} seconds, captioned
        </div>
        <p className="mt-1 font-display text-lg sm:text-xl font-bold leading-snug text-foreground">{block.title}</p>
        <details className="mt-2">
          <summary className={`${link} cursor-pointer`}>Read what I said</summary>
          <blockquote className="mt-2 border-l-2 border-border pl-4 text-sm leading-relaxed text-muted-foreground">
            &ldquo;{block.transcript}&rdquo;
          </blockquote>
        </details>
        {block.chapter && (
          <a href={block.chapter.href} className={`${link} mt-2 inline-block`}>
            The whole part, in the talk: {block.chapter.title} at {clock(block.chapter.at)} ↗
          </a>
        )}
        <Caption text={block.caption} />
      </figcaption>
    </figure>
  );
}

/* ── A third-party player behind a click ────────────────────────────── */

export function Embed({ block }: { block: B<"embed"> }) {
  const deck = block.provider === "speakerdeck";
  return (
    <figure className="my-8">
      <details className="group border border-border bg-card/20">
        <summary className="relative block cursor-pointer list-none [&::-webkit-details-marker]:hidden">
          <span className="relative block group-open:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={block.poster.src}
              alt={block.poster.alt}
              width={block.poster.width}
              height={block.poster.height}
              loading="lazy"
              decoding="async"
              className="block w-full h-auto bg-white"
            />
            <span className="absolute inset-0 flex items-end justify-end p-3">
              <span className="inline-flex items-center gap-2 border border-border bg-background/95 px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-foreground shadow-sm">
                <span aria-hidden>▶</span> {block.open}
              </span>
            </span>
          </span>
          <span className="hidden items-center justify-between gap-3 px-3 py-2 font-mono text-[11px] text-muted-foreground group-open:flex">
            <span>{block.title}</span>
            <span aria-hidden>Close ✕</span>
          </span>
        </summary>
        {deck ? (
          <div className="aspect-video border-t border-border">
            <iframe src={block.src} title={block.title} loading="lazy" allowFullScreen className="h-full w-full border-0" />
          </div>
        ) : (
          <div className="mx-auto max-w-[552px] border-t border-border">
            <iframe src={block.src} title={block.title} loading="lazy" allowFullScreen className="block h-[820px] w-full border-0" />
          </div>
        )}
      </details>
      <figcaption className="mt-2">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className={kicker}>{block.title}</span>
          <a href={block.href} {...out} className={link}>
            {deck ? "Open on Speaker Deck ↗" : "Watch it on LinkedIn ↗"}
          </a>
        </div>
        <Caption text={block.caption} />
        {block.chapters && block.chapters.length > 0 && (
          <ol className="mt-3 flex flex-wrap gap-2" aria-label="Moments in the talk">
            {block.chapters.map((c) => (
              <li key={c.at}>
                <a
                  href={c.href}
                  className="inline-flex items-baseline gap-2 border border-border px-2.5 py-1 font-mono text-[11px] text-foreground hover:bg-foreground/5"
                >
                  <span className="tabular-nums text-muted-foreground">{clock(c.at)}</span>
                  {c.title}
                </a>
              </li>
            ))}
          </ol>
        )}
      </figcaption>
    </figure>
  );
}

/* ── Photos in one sideways row ─────────────────────────────────────── */

export function Gallery({ block }: { block: B<"gallery"> }) {
  return (
    <div className="my-8">
      <Slideshow label={block.label} slideClassName="">
        {block.items.map((p) => (
          <figure key={p.src} className="w-min border border-border bg-card/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.src}
              alt={p.alt}
              width={p.width}
              height={p.height}
              loading="lazy"
              decoding="async"
              className="block h-[13rem] w-auto max-w-none sm:h-[16rem]"
            />
            {p.caption && <figcaption className="min-h-[3rem] px-3 py-2 font-mono text-[11px] leading-snug text-muted-foreground">{p.caption}</figcaption>}
          </figure>
        ))}
      </Slideshow>
      <Caption text={block.caption} />
    </div>
  );
}

/* ── What practitioners said in public ──────────────────────────────── */

export function Voices({ block }: { block: B<"voices"> }) {
  return (
    <div className="my-8">
      <div className="grid gap-4 sm:grid-cols-2">
        {block.items.map((v) => (
          <figure key={v.url} className="flex flex-col border border-border bg-card/20 p-5">
            <span aria-hidden className="font-display text-4xl leading-none" style={{ color: "var(--stage-discover)" }}>
              &ldquo;
            </span>
            <blockquote className="mt-1 flex-1 text-[15px] leading-relaxed text-foreground">{v.quote}</blockquote>
            <figcaption className="mt-4 border-t border-border pt-3">
              <span className="block text-sm font-bold text-foreground">{v.author}</span>
              {v.role && <span className="block font-mono text-[11px] text-muted-foreground">{v.role}</span>}
              <a href={v.url} {...out} className={`${link} mt-1 inline-block`}>
                On LinkedIn, {day(v.date)} ↗
              </a>
            </figcaption>
          </figure>
        ))}
      </div>
      <Caption text={block.caption} />
    </div>
  );
}

/* ── Recorded conversations ─────────────────────────────────────────── */

export function Episodes({ block }: { block: B<"episodes"> }) {
  return (
    <div className="my-8">
      <div className="grid gap-6 sm:grid-cols-2">
        {block.items.map((e) => (
          <article key={e.youtubeId} className="flex flex-col">
            <TalkVideo video={{ poster: e.thumb, youtubeId: e.youtubeId, aspect: "16:9", duration: (e.minutes ?? 0) * 60 }} title={`${e.title} (${e.outlet})`} />
            <div className={`${kicker} mt-3`}>
              {e.outlet} · {day(e.date)}
              {e.minutes ? ` · ${e.minutes} min` : ""}
            </div>
            <h4 className="mt-1 font-display text-base font-bold leading-snug text-foreground">{e.title}</h4>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{e.summary}</p>
            {e.why && <Html text={e.why} className="mt-2 text-sm leading-relaxed text-foreground" />}
          </article>
        ))}
      </div>
      <Caption text={block.caption} />
    </div>
  );
}

/* ── Tools on this site ─────────────────────────────────────────────── */

export function Tools({ block }: { block: B<"tools"> }) {
  return (
    <div className="my-8 grid gap-4 sm:grid-cols-2">
      {block.items.map((t) => (
        <a key={t.href} href={t.href} className="group flex flex-col border border-border bg-card/20 transition-colors hover:border-foreground/40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={t.image.src}
            alt={t.alt}
            width={t.image.width}
            height={t.image.height}
            loading="lazy"
            decoding="async"
            className="block h-auto w-full border-b border-border bg-white"
          />
          <span className="flex flex-1 flex-col p-4">
            <span className="font-display text-base font-bold text-foreground">{t.title}</span>
            <span className="mt-1 flex-1 text-sm leading-relaxed text-muted-foreground">{t.text}</span>
            <span className="mt-3 font-mono text-[11px] text-foreground group-hover:underline">{t.cta ?? "Open the tool"} →</span>
          </span>
        </a>
      ))}
    </div>
  );
}

/* ── Papers ─────────────────────────────────────────────────────────── */

export function Papers({ block }: { block: B<"papers"> }) {
  return (
    <div className="my-8">
      <ol className="divide-y divide-border border-y border-border">
        {block.items.map((p) => (
          <li key={p.url} className="py-4">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              {p.review && (
                <span className="border border-border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-foreground">
                  {p.review === "peer-reviewed" ? "Peer-reviewed" : "Preprint"}
                </span>
              )}
              <span className={kicker}>
                {p.venue} · {p.year}
                {p.role ? ` · ${p.role}` : ""}
              </span>
            </div>
            <a href={p.url} {...out} className="mt-1 block font-display text-base font-bold leading-snug text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground">
              {p.title} ↗
            </a>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{p.summary}</p>
          </li>
        ))}
      </ol>
      {block.request && (
        <aside className="mt-6 border border-foreground/30 bg-card/30 p-5">
          <p className="font-display text-lg font-bold text-foreground">{block.request.title}</p>
          <Html text={block.request.text} className="mt-1 text-sm leading-relaxed text-muted-foreground" />
          <a
            href={block.request.href}
            className="mt-4 inline-flex items-center gap-2 border border-foreground bg-foreground px-4 py-2 font-mono text-xs uppercase tracking-wider text-background hover:opacity-90"
          >
            {block.request.label} →
          </a>
        </aside>
      )}
    </div>
  );
}
