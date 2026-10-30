"use client";
import * as React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import { ArrowUp, ChevronLeft, ChevronRight, ExternalLink, FileSearch, Heart, Layers, LayoutGrid, Newspaper, Play, Search, Smartphone, X as Close } from "lucide-react";
import type { EventFile, EventSourceCard, Verdict } from "@/data/events";

const LABEL: Record<string, string> = { youtube: "YouTube", tiktok: "TikTok", instagram: "Instagram", x: "X", reddit: "Reddit", hackernews: "Hacker News", news: "News", web: "Report", binance: "Binance" };
const BRAND: Record<string, string> = { youtube: "#FF0000", tiktok: "#25F4EE", instagram: "#E4405F", x: "#e5e7eb", reddit: "#FF4500", hackernews: "#F0652F", binance: "#F0B90B" };
/** Poster backgrounds for items without a picture: each platform's own colours, never a black box. */
const POSTER: Record<string, string> = {
  tiktok: "linear-gradient(150deg, #0f3d3e 0%, #111 45%, #4a0f24 100%)",
  instagram: "linear-gradient(150deg, #5b2a86 0%, #a1245b 55%, #d97a2b 100%)",
  x: "linear-gradient(150deg, #1f2937 0%, #0b0b0b 100%)",
  reddit: "linear-gradient(150deg, #ff5a1f 0%, #8a2a0a 100%)",
  hackernews: "linear-gradient(150deg, #f0652f 0%, #7a2a0c 100%)",
  youtube: "linear-gradient(150deg, #7f1d1d 0%, #111 100%)",
  binance: "linear-gradient(150deg, #3b2f05 0%, #0b0b0b 100%)",
  web: "linear-gradient(150deg, #14532d 0%, #0b0b0b 100%)",
};
const NEWS_HUES = ["#1d4ed8", "#0f766e", "#7c3aed", "#b45309", "#be123c", "#0369a1", "#4d7c0f", "#a21caf"];
const VERDICT: Record<Verdict, { label: string; color: string }> = {
  true: { label: "True", color: "#16a34a" },
  false: { label: "False", color: "#ef4444" },
  misleading: { label: "Misleading", color: "#d97706" },
  unconfirmed: { label: "Unconfirmed", color: "#2563eb" },
};
const PORTRAIT = new Set(["tiktok", "instagram"]);
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const compact = (v: number) => (v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(v >= 1e4 ? 0 : 1)}K` : String(v));
const reachLabel = (s: EventSourceCard) =>
  s.views ? `${compact(s.views)} views` : s.likes ? `${compact(s.likes)} likes` : s.points ? `${compact(s.points)} points` : s.comments ? `${compact(s.comments)} comments` : null;
const who = (s: EventSourceCard) => s.publisher || (s.subreddit ? `r/${s.subreddit}` : s.domain) || LABEL[s.platform] || s.platform;
const hueOf = (key: string) => NEWS_HUES[[...key].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7) % NEWS_HUES.length];

/** "3 hours ago" after load; the plain date in the server HTML, so crawlers and the first paint agree. */
function Ago({ iso }: { iso: string | null }) {
  const [now, setNow] = React.useState<number | null>(null);
  React.useEffect(() => setNow(Date.now()), []);
  if (!iso) return null;
  const t = Date.parse(iso.length === 19 ? iso + "Z" : iso);
  const plain = `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]}`;
  if (!now || Number.isNaN(t)) return <time dateTime={iso}>{plain}</time>;
  const h = Math.round((now - t) / 36e5);
  const label = h < 1 ? "just now" : h < 24 ? `${h} hour${h === 1 ? "" : "s"} ago` : h < 24 * 7 ? `${Math.round(h / 24)} days ago` : plain;
  return <time dateTime={iso} title={plain}>{label}</time>;
}

/** The platform's own mark (Simple Icons), coloured with CSS so it reads on any background. */
export function PlatformMark({ platform, size = 14 }: { platform: string; size?: number }) {
  if (platform === "news") return <Newspaper size={size} aria-hidden="true" />;
  if (platform === "web") return <FileSearch size={size} aria-hidden="true" />;
  const src = `/events/platforms/${platform}.svg`;
  return (
    <span
      aria-hidden="true"
      className="inline-block shrink-0"
      style={{ width: size, height: size, background: BRAND[platform] ?? "currentColor", WebkitMask: `url(${src}) center / contain no-repeat`, mask: `url(${src}) center / contain no-repeat` }}
    />
  );
}

function VerdictChips({ s, max = 2 }: { s: EventSourceCard; max?: number }) {
  if (!s.claims.length) return null;
  return (
    <span className="mt-1 flex flex-wrap gap-1">
      {s.claims.slice(0, max).map((c) => (
        <span key={c.key} className="px-1 py-px font-mono text-[8px] font-bold uppercase tracking-[0.1em] text-white" style={{ background: VERDICT[c.verdict].color }}>
          {VERDICT[c.verdict].label}
        </span>
      ))}
    </span>
  );
}

/** A designed poster for an item without a picture: the platform's colours and the words themselves, large. */
function Poster({ s }: { s: EventSourceCard }) {
  const bg = s.platform === "news" ? `linear-gradient(150deg, ${hueOf(s.domain || s.title)} 0%, #0b0b0b 100%)` : (POSTER[s.platform] ?? POSTER.x);
  const text = (s.excerpt || s.title || "").replace(/\s+/g, " ").trim();
  return (
    <div className="flex h-full w-full flex-col justify-between px-3 pb-9 pt-10 text-white" style={{ background: bg }}>
      <div className="flex items-center gap-2">
        {s.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.avatar} alt="" width={36} height={36} loading="lazy" className="h-9 w-9 rounded-full ring-2 ring-white/30" />
        ) : s.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.logo} alt="" width={28} height={28} loading="lazy" className="h-7 w-7 rounded bg-white/90 p-0.5" />
        ) : null}
        {(s.avatar || s.logo) && <span className="truncate font-mono text-[10px] text-white/85">{who(s)}</span>}
      </div>
      <p className={`font-display font-bold leading-snug ${PORTRAIT.has(s.platform) ? "line-clamp-6 text-[15px]" : "line-clamp-4 text-base"}`}>{text}</p>
      <span className={`truncate font-mono text-[9px] uppercase tracking-[0.16em] text-white/60 ${s.embed ? "pl-10" : ""}`}>{s.subreddit ? `r/${s.subreddit}` : who(s)}</span>
    </div>
  );
}

function Media({ s, className = "", big = false }: { s: EventSourceCard; className?: string; big?: boolean }) {
  return (
    <div className={`relative overflow-hidden bg-neutral-900 ${className}`}>
      {s.thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={s.thumb} alt={`${LABEL[s.platform] ?? s.platform}: ${s.title}`} loading="lazy" decoding="async" className="h-full w-full object-cover" />
      ) : (
        <Poster s={s} />
      )}
      <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/70 px-1.5 py-1 font-mono text-[9px] text-white">
        <PlatformMark platform={s.platform} size={12} />
        {LABEL[s.platform] ?? s.platform}
      </span>
      {s.embed && (
        <span className={`absolute grid place-items-center ${s.thumb ? "inset-0" : "bottom-2 left-2"}`} aria-hidden="true">
          <span className={`grid place-items-center rounded-full bg-black/60 text-white ring-1 ring-white/40 ${big ? "h-14 w-14" : "h-9 w-9"}`}>
            <Play size={big ? 22 : 14} fill="currentColor" />
          </span>
        </span>
      )}
      {reachLabel(s) && <span className="absolute bottom-2 right-2 bg-black/75 px-1.5 py-0.5 font-mono text-[9px] text-white">{reachLabel(s)}</span>}
    </div>
  );
}

/** The platform's official embedded player, loaded only when someone asks for it. */
function Embed({ s }: { s: EventSourceCard }) {
  const e = s.embed!;
  const src =
    e.type === "youtube" ? `https://www.youtube-nocookie.com/embed/${e.id}?autoplay=1&rel=0`
    : e.type === "tiktok" ? `https://www.tiktok.com/embed/v2/${e.id}`
    : e.type === "instagram" ? `https://www.instagram.com/${e.id}/embed`
    : e.type === "x" ? `https://platform.twitter.com/embed/Tweet.html?id=${e.id}&theme=dark&dnt=true`
    : `https://embed.reddit.com${e.id}/?embed=true&theme=dark`;
  const tall = e.type !== "youtube";
  return (
    <iframe
      src={src}
      title={`${LABEL[s.platform] ?? s.platform}: ${s.title}`}
      className={`mx-auto block w-full border-0 bg-black ${tall ? "h-[70vh] max-w-[420px]" : "aspect-video"}`}
      allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
      allowFullScreen
      referrerPolicy="strict-origin-when-cross-origin"
    />
  );
}

function Card({ s, onOpen, width }: { s: EventSourceCard; onOpen: (s: EventSourceCard) => void; width?: string }) {
  const portrait = PORTRAIT.has(s.platform);
  return (
    <article className={`group/card relative shrink-0 snap-start ${width ?? (portrait ? "w-[150px] sm:w-[175px]" : "w-[240px] sm:w-[280px]")}`}>
      <a
        href={s.url ?? undefined}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(ev) => {
          if (s.embed) {
            ev.preventDefault();
            onOpen(s);
          }
        }}
        className="block rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ef4444]"
      >
        <Media s={s} className={`${portrait ? "aspect-[9/16]" : "aspect-video"} rounded-md transition-transform duration-200 group-hover/card:scale-[1.04] group-hover/card:shadow-2xl`} />
        <span className="mt-2 flex min-w-0 items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
          {(s.avatar || s.logo) && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.avatar || s.logo!} alt="" width={14} height={14} loading="lazy" className="h-3.5 w-3.5 shrink-0 rounded-full" />
          )}
          <span className="truncate">{who(s)}</span>
          {s.date && <span className="shrink-0">· <Ago iso={s.date} /></span>}
        </span>
        <span className="mt-0.5 line-clamp-2 text-sm leading-snug text-foreground group-hover/card:underline">{s.title}</span>
        <VerdictChips s={s} />
      </a>
    </article>
  );
}

/** The last tile of a long row: opens every item of that row as a filtered grid. */
function SeeAll({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="grid w-[150px] shrink-0 snap-start place-items-center rounded-md border border-dashed border-border font-mono text-xs text-muted-foreground hover:border-foreground hover:text-foreground">
      See all {count}
    </button>
  );
}

const ROW_MAX = 40;
const CLAIM_ROW_MAX = 12;

function Shelf({ label, aside, children }: { label: string; aside?: React.ReactNode; children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const by = (dir: number) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.85, behavior: "smooth" });
  return (
    <section className="min-w-0" aria-label={label}>
      <h3 className="mb-2 flex flex-wrap items-baseline gap-2 font-display text-lg font-bold text-foreground">
        {label} {aside && <span className="font-mono text-[10px] font-normal text-muted-foreground">{aside}</span>}
      </h3>
      <div className="relative">
        <div ref={ref} className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 pt-1 [scrollbar-width:thin]">
          {children}
        </div>
        <button type="button" onClick={() => by(-1)} aria-label={`Scroll ${label} left`} className="absolute -left-3 top-[32%] hidden h-9 w-9 place-items-center rounded-full bg-black/80 text-white ring-1 ring-white/20 hover:bg-black sm:grid">
          <ChevronLeft size={18} />
        </button>
        <button type="button" onClick={() => by(1)} aria-label={`Scroll ${label} right`} className="absolute -right-3 top-[32%] hidden h-9 w-9 place-items-center rounded-full bg-black/80 text-white ring-1 ring-white/20 hover:bg-black sm:grid">
          <ChevronRight size={18} />
        </button>
      </div>
    </section>
  );
}

/** Netflix's Top 10: big outlined numbers behind the posters. */
function Top10({ items, onOpen }: { items: EventSourceCard[]; onOpen: (s: EventSourceCard) => void }) {
  if (!items.length) return null;
  return (
    <Shelf label="Top 10 most watched and read" aside="views, likes or points as each platform shows them">
      {items.map((s, i) => (
        <div key={s.id} className="flex shrink-0 snap-start items-end">
          <span aria-hidden="true" className="-mr-3 select-none font-display text-[96px] font-black leading-[0.8] text-transparent sm:text-[120px]" style={{ WebkitTextStroke: "2px rgba(239,68,68,0.85)" }}>
            {i + 1}
          </span>
          <Card s={s} onOpen={onOpen} width="w-[140px] sm:w-[160px]" />
        </div>
      ))}
    </Shelf>
  );
}

/** The featured item, full width, with its own play button: the first thing people see. */
function Hero({ s, onOpen, onMore }: { s: EventSourceCard; onOpen: (s: EventSourceCard) => void; onMore: () => void }) {
  return (
    <div className="relative mb-8 overflow-hidden rounded-lg border border-border">
      {s.thumb && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={s.thumb} alt={`${LABEL[s.platform]}: ${s.title}`} className="absolute inset-0 h-full w-full object-cover" />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-black/10" />
      <div className="relative flex min-h-[260px] flex-col justify-end gap-2 p-5 text-white sm:min-h-[320px] sm:max-w-[60%] sm:p-8">
        <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-white/80">
          <PlatformMark platform={s.platform} size={12} /> Featured · {who(s)}
        </span>
        <p className="font-display text-2xl font-bold leading-tight sm:text-3xl">{s.title}</p>
        {s.excerpt && <p className="line-clamp-3 text-sm text-white/80">&ldquo;{s.excerpt}&rdquo;</p>}
        <p className="font-mono text-[10px] text-white/70">
          {reachLabel(s)}
          {s.date && <> · <Ago iso={s.date} /></>}
          {s.transcript && " · transcript read"}
        </p>
        <div className="mt-1 flex flex-wrap gap-2">
          {s.embed && (
            <button type="button" onClick={() => onOpen(s)} className="flex items-center gap-1.5 rounded bg-white px-4 py-2 font-mono text-xs font-bold text-black hover:bg-white/90">
              <Play size={14} fill="currentColor" /> Play
            </button>
          )}
          <button type="button" onClick={onMore} className="rounded bg-white/15 px-4 py-2 font-mono text-xs text-white hover:bg-white/25">
            More {LABEL[s.platform]} videos
          </button>
          {s.url && (
            <a href={s.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 rounded bg-white/15 px-4 py-2 font-mono text-xs text-white hover:bg-white/25">
              Open <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function Overlay({ children, onClose, label }: { children: React.ReactNode; onClose: () => void; label: string }) {
  React.useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", k);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
  // A portal to <body>: the site's page wrapper animates with transforms, which would trap a fixed overlay inside it.
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={label} className="fixed inset-0 z-[200] bg-black">
      <button type="button" onClick={onClose} aria-label="Close" className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20">
        <Close size={20} />
      </button>
      {children}
    </div>,
    document.body,
  );
}

function Info({ s }: { s: EventSourceCard }) {
  return (
    <div className="mx-auto w-full max-w-xl px-4 text-white">
      <p className="flex items-center gap-1.5 font-mono text-[10px] text-white/70">
        <PlatformMark platform={s.platform} size={12} /> {who(s)}
        {s.date && <>· <Ago iso={s.date} /></>}
        {reachLabel(s) && <>· {reachLabel(s)}</>}
      </p>
      <p className="mt-1 line-clamp-3 font-display text-lg font-bold leading-snug">{s.title}</p>
      {s.excerpt && <p className="mt-1 line-clamp-3 text-sm text-white/80">&ldquo;{s.excerpt}&rdquo;</p>}
      <VerdictChips s={s} max={4} />
    </div>
  );
}

/** Vertical feed, one source per screen, like a short-video app. */
function Feed({ items, onClose }: { items: EventSourceCard[]; onClose: () => void }) {
  const [playing, setPlaying] = React.useState<string | null>(null);
  return (
    <Overlay onClose={onClose} label="Sources feed">
      <div className="h-[100dvh] snap-y snap-mandatory overflow-y-auto">
        {items.map((s, i) => (
          <section key={s.id} className="flex h-[100dvh] snap-start flex-col items-center justify-center gap-4 py-14" aria-label={`${i + 1} of ${items.length}`}>
            <div className={`w-full ${PORTRAIT.has(s.platform) ? "max-w-[min(420px,90vw)]" : "max-w-3xl px-4"}`}>
              {playing === s.id ? <Embed s={s} /> : <Media s={s} big className={PORTRAIT.has(s.platform) ? "mx-auto aspect-[9/16] max-h-[62vh] rounded-lg" : "aspect-video rounded-lg"} />}
            </div>
            <Info s={s} />
            <div className="flex gap-2">
              {s.embed && playing !== s.id && (
                <button type="button" onClick={() => setPlaying(s.id)} className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 font-mono text-xs font-bold text-black">
                  <Play size={14} fill="currentColor" /> Play here
                </button>
              )}
              {s.url && (
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 font-mono text-xs text-white">
                  Open on {LABEL[s.platform] ?? "the site"} <ExternalLink size={12} />
                </a>
              )}
            </div>
            <p className="font-mono text-[10px] text-white/50">{i + 1} / {items.length} · swipe or scroll for the next</p>
          </section>
        ))}
      </div>
    </Overlay>
  );
}

/** A card deck: drag right to keep, left to skip, up to open. Buttons and arrow keys do the same. */
function Swipe({ items, onClose }: { items: EventSourceCard[]; onClose: () => void }) {
  const [i, setI] = React.useState(0);
  const [kept, setKept] = React.useState<EventSourceCard[]>([]);
  const [exit, setExit] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-240, 240], [-14, 14]);
  const s = items[i];
  const decide = React.useCallback(
    (dir: "left" | "right" | "up") => {
      if (!s) return;
      setExit(dir === "left" ? { x: -600, y: 0 } : dir === "right" ? { x: 600, y: 0 } : { x: 0, y: -700 });
      if (dir === "right") setKept((k) => [...k, s]);
      if (dir === "up" && s.url) window.open(s.url, "_blank", "noopener,noreferrer");
      setI((n) => n + 1);
    },
    [s],
  );
  React.useEffect(() => {
    const k = (e: KeyboardEvent) => (e.key === "ArrowLeft" ? decide("left") : e.key === "ArrowRight" ? decide("right") : e.key === "ArrowUp" ? decide("up") : null);
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [decide]);
  const end = (_: unknown, info: PanInfo) => {
    if (info.offset.x > 120) decide("right");
    else if (info.offset.x < -120) decide("left");
    else if (info.offset.y < -140) decide("up");
  };
  return (
    <Overlay onClose={onClose} label="Swipe through sources">
      <div className="flex h-[100dvh] flex-col items-center justify-center gap-4 px-4">
        <p className="font-mono text-[10px] text-white/60">
          {Math.min(i + 1, items.length)} / {items.length} · kept {kept.length} · drag right to keep, left to skip, up to open
        </p>
        <div className="relative h-[62vh] w-full max-w-sm">
          <AnimatePresence initial={false} custom={exit}>
            {s ? (
              <motion.div
                key={s.id}
                className="absolute inset-0 cursor-grab touch-none overflow-hidden rounded-2xl bg-neutral-900 shadow-2xl ring-1 ring-white/10 active:cursor-grabbing"
                style={{ x, rotate }}
                drag
                dragSnapToOrigin
                onDragEnd={end}
                initial={{ scale: 0.94, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ x: exit.x, y: exit.y, opacity: 0, transition: { duration: 0.25 } }}
              >
                <Media s={s} className="h-[58%]" />
                <div className="p-3">
                  <Info s={s} />
                </div>
              </motion.div>
            ) : (
              <motion.div key="done" className="absolute inset-0 overflow-y-auto rounded-2xl bg-neutral-900 p-4 text-white" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <p className="font-display text-lg font-bold">You kept {kept.length}</p>
                <ul className="mt-2 space-y-2">
                  {kept.map((k) => (
                    <li key={k.id} className="text-sm">
                      <a href={k.url ?? undefined} target="_blank" rel="noopener noreferrer" className="underline">{k.title}</a>
                      <span className="block font-mono text-[10px] text-white/60">{who(k)}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {s && (
          <div className="flex gap-3">
            <button type="button" onClick={() => decide("left")} aria-label="Skip" className="grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"><Close size={20} /></button>
            <button type="button" onClick={() => decide("up")} aria-label="Open the source" className="grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"><ArrowUp size={20} /></button>
            <button type="button" onClick={() => decide("right")} aria-label="Keep" className="grid h-12 w-12 place-items-center rounded-full bg-[#ef4444] text-white hover:brightness-110"><Heart size={20} /></button>
          </div>
        )}
      </div>
    </Overlay>
  );
}

type Filters = { q: string; group: string; verdict: string; claim: string; lang: string; sort: "reach" | "newest" };
const NO_FILTERS: Filters = { q: "", group: "", verdict: "", claim: "", lang: "", sort: "reach" };

function readFilters(): Filters {
  if (typeof window === "undefined") return NO_FILTERS;
  const p = new URLSearchParams(window.location.search);
  return { q: p.get("q") ?? "", group: p.get("platform") ?? "", verdict: p.get("verdict") ?? "", claim: p.get("claim") ?? "", lang: p.get("lang") ?? "", sort: p.get("sort") === "newest" ? "newest" : "reach" };
}

/** Every source at a glance: a featured hero, a Top 10, rows by platform and by claim (all in the server HTML, with real links
 * for crawlers and agents), filters and search, plus a full-screen feed and a swipe deck. */
export function EventSources({ e }: { e: EventFile }) {
  const [mode, setMode] = React.useState<"browse" | "feed" | "swipe">("browse");
  const [player, setPlayer] = React.useState<EventSourceCard | null>(null);
  const [f, setF] = React.useState<Filters>(NO_FILTERS);
  const [loaded, setLoaded] = React.useState(false);
  React.useEffect(() => {
    setF(readFilters());
    setLoaded(true);
  }, []);
  // Filters live in the address bar, so a filtered view can be shared. Nothing is written until the address has been
  // read, or the first render (no filters yet) would wipe a shared link's filters.
  React.useEffect(() => {
    if (!loaded) return;
    const p = new URLSearchParams(window.location.search);
    const set = (k: string, v: string) => (v ? p.set(k, v) : p.delete(k));
    set("q", f.q); set("platform", f.group); set("verdict", f.verdict); set("claim", f.claim); set("lang", f.lang); set("sort", f.sort === "newest" ? "newest" : "");
    const qs = p.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`);
  }, [f, loaded]);
  const byId = React.useMemo(() => new Map(e.sources.map((s) => [s.id, s])), [e.sources]);
  const filtering = Boolean(f.q || f.group || f.verdict || f.claim || f.lang);
  const results = React.useMemo(() => {
    const q = f.q.trim().toLowerCase();
    const out = e.sources.filter(
      (s) =>
        (!f.group || s.group === f.group) &&
        (!f.verdict || s.claims.some((c) => c.verdict === f.verdict)) &&
        (!f.claim || s.claims.some((c) => c.key === f.claim)) &&
        (!f.lang || s.lang === f.lang) &&
        (!q || `${s.title} ${s.excerpt ?? ""} ${who(s)}`.toLowerCase().includes(q)),
    );
    return f.sort === "newest" ? [...out].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "")) : [...out].sort((a, b) => b.reach - a.reach);
  }, [e.sources, f]);
  const feedOrder = React.useMemo(() => {
    const rank: Record<string, number> = { tiktok: 0, youtube: 1, instagram: 2, x: 3, reddit: 4, official: 5, investigators: 6, news: 7, hackernews: 8 };
    const base = filtering ? results : e.sources;
    return [...base].sort((a, b) => (rank[a.group] ?? 9) - (rank[b.group] ?? 9) || b.reach - a.reach);
  }, [e.sources, results, filtering]);
  const featured = e.featured ? byId.get(e.featured) : undefined;
  const top10 = e.top10.map((id) => byId.get(id)).filter((s): s is EventSourceCard => Boolean(s));
  const claimNames = Object.fromEntries(e.collections.filter((c) => c.id.startsWith("claim-")).map((c) => [c.id.slice(6), c.label.replace(/^Saying /, "")]));
  const rowsFor = (g: string) => e.sources.filter((s) => s.group === g);
  const select = "w-full min-w-0 border border-border bg-background px-2 py-1.5 font-mono text-[11px] text-foreground sm:w-auto";
  return (
    <div data-testid="event-sources">
      {featured && <Hero s={featured} onOpen={setPlayer} onMore={() => setF({ ...NO_FILTERS, group: featured.group })} />}

      <div className="mb-6 space-y-2">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="How to view the sources">
          {([["browse", "Browse", <LayoutGrid key="b" size={14} />], ["feed", "Feed", <Smartphone key="f" size={14} />], ["swipe", "Swipe", <Layers key="s" size={14} />]] as const).map(([id, label, icon]) => (
            <button key={id} type="button" onClick={() => setMode(id)} aria-pressed={mode === id}
              className={`flex items-center gap-1.5 border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] ${mode === id ? "border-[#ef4444] text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>
              {icon} {label}
            </button>
          ))}
          <label className="flex min-w-[180px] flex-1 items-center gap-1.5 border border-border px-2 py-1.5">
            <Search size={13} className="text-muted-foreground" aria-hidden="true" />
            <input value={f.q} onChange={(ev) => setF({ ...f, q: ev.target.value })} placeholder="Search titles, captions, publishers" aria-label="Search the sources"
              className="w-full bg-transparent font-mono text-[11px] text-foreground outline-none placeholder:text-muted-foreground" />
          </label>
        </div>
        <div className="-mx-1 flex flex-nowrap items-center gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] sm:flex-wrap" role="group" aria-label="Filter by platform">
          {[{ id: "", label: "All", count: e.sources.length }, ...e.groups].map((g) => (
            <button key={g.id || "all"} type="button" onClick={() => setF({ ...f, group: g.id })} aria-pressed={f.group === g.id}
              className={`shrink-0 whitespace-nowrap rounded-full border px-2.5 py-1 font-mono text-[10px] ${f.group === g.id ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:text-foreground"}`}>
              {g.label} <span className="opacity-60">{g.count}</span>
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 items-center gap-2 sm:flex sm:flex-wrap">
          <select aria-label="Filter by verdict" value={f.verdict} onChange={(ev) => setF({ ...f, verdict: ev.target.value })} className={select}>
            <option value="">Any verdict</option>
            {(Object.keys(VERDICT) as Verdict[]).map((v) => <option key={v} value={v}>Makes a {VERDICT[v].label.toLowerCase()} claim</option>)}
          </select>
          <select aria-label="Filter by claim" value={f.claim} onChange={(ev) => setF({ ...f, claim: ev.target.value })} className={select}>
            <option value="">Any claim</option>
            {Object.entries(claimNames).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
          </select>
          <select aria-label="Filter by language" value={f.lang} onChange={(ev) => setF({ ...f, lang: ev.target.value })} className={select}>
            <option value="">Any language</option>
            <option value="en">English</option>
            <option value="other">Other languages</option>
          </select>
          <select aria-label="Sort" value={f.sort} onChange={(ev) => setF({ ...f, sort: ev.target.value as Filters["sort"] })} className={select}>
            <option value="reach">Most viewed</option>
            <option value="newest">Newest</option>
          </select>
          {filtering && (
            <button type="button" onClick={() => setF(NO_FILTERS)} className="font-mono text-[11px] text-[#ef4444] underline">Clear filters</button>
          )}
          <span className="font-mono text-[10px] text-muted-foreground">{filtering ? `${results.length} of ${e.sources.length} sources` : `${e.sources.length} sources · tap a video to play it here`}</span>
        </div>
      </div>

      {filtering ? (
        <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 lg:grid-cols-4" aria-live="polite">
          {results.map((s) => <Card key={s.id} s={s} onOpen={setPlayer} width="w-full" />)}
          {!results.length && <p className="col-span-full font-mono text-xs text-muted-foreground">Nothing matches these filters.</p>}
        </div>
      ) : (
        <div className="space-y-8">
          <Top10 items={top10} onOpen={setPlayer} />
          {e.groups.filter((g) => g.id === "official" || g.id === "investigators").map((g) => (
            <Shelf key={g.id} label={g.label} aside={g.count}>
              {rowsFor(g.id).slice(0, ROW_MAX).map((s) => <Card key={s.id} s={s} onOpen={setPlayer} />)}
              {g.count > ROW_MAX && <SeeAll count={g.count} onClick={() => setF({ ...NO_FILTERS, group: g.id })} />}
            </Shelf>
          ))}
          {e.collections.filter((c) => c.id === "wrong").map((c) => (
            <Shelf key={c.id} label={c.label} aside={`${c.ids.length} · check the verdict before you share`}>
              {c.ids.map((id) => byId.get(id)).filter(Boolean).map((s) => <Card key={s!.id} s={s!} onOpen={setPlayer} />)}
            </Shelf>
          ))}
          {e.groups.filter((g) => g.id !== "official" && g.id !== "investigators").map((g) => (
            <Shelf key={g.id} label={g.label} aside={g.count}>
              {rowsFor(g.id).slice(0, ROW_MAX).map((s) => <Card key={s.id} s={s} onOpen={setPlayer} />)}
              {g.count > ROW_MAX && <SeeAll count={g.count} onClick={() => setF({ ...NO_FILTERS, group: g.id })} />}
            </Shelf>
          ))}
          {e.collections.filter((c) => c.id !== "wrong").map((c) => (
            <Shelf key={c.id} label={c.label} aside={`${c.ids.length} · verdict: ${VERDICT[c.verdict].label.toLowerCase()}`}>
              {c.ids.map((id) => byId.get(id)).filter(Boolean).slice(0, CLAIM_ROW_MAX).map((s) => <Card key={s!.id} s={s!} onOpen={setPlayer} />)}
              {c.ids.length > CLAIM_ROW_MAX && <SeeAll count={c.ids.length} onClick={() => setF({ ...NO_FILTERS, claim: c.id.slice(6) })} />}
            </Shelf>
          ))}
        </div>
      )}

      {mode === "feed" && <Feed items={feedOrder} onClose={() => setMode("browse")} />}
      {mode === "swipe" && <Swipe items={feedOrder} onClose={() => setMode("browse")} />}
      {player && (
        <Overlay onClose={() => setPlayer(null)} label={`Playing: ${player.title}`}>
          <div className="flex h-[100dvh] flex-col items-center justify-center gap-4 py-14">
            <div className={`w-full ${player.embed?.type !== "youtube" ? "max-w-[min(440px,92vw)]" : "max-w-4xl px-4"}`}>
              <Embed s={player} />
            </div>
            <Info s={player} />
          </div>
        </Overlay>
      )}
    </div>
  );
}
