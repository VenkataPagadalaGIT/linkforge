"use client";
import * as React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight, ExternalLink, Heart, Layers, LayoutGrid, Newspaper, Play, Smartphone, X as Close, FileSearch, ArrowUp } from "lucide-react";
import type { EventFile, EventSourceCard, SourceGroup, Verdict } from "@/data/events";

const LABEL: Record<string, string> = { youtube: "YouTube", tiktok: "TikTok", instagram: "Instagram", x: "X", reddit: "Reddit", hackernews: "Hacker News", news: "News", web: "Report", binance: "Binance" };
const BRAND: Record<string, string> = { youtube: "#FF0000", tiktok: "#25F4EE", instagram: "#E4405F", x: "#e5e7eb", reddit: "#FF4500", hackernews: "#F0652F", binance: "#F0B90B" };
const VERDICT: Record<Verdict, { label: string; color: string }> = {
  true: { label: "True", color: "#16a34a" },
  false: { label: "False", color: "#ef4444" },
  misleading: { label: "Misleading", color: "#d97706" },
  unconfirmed: { label: "Unconfirmed", color: "#2563eb" },
};
const PORTRAIT = new Set(["tiktok", "instagram"]);
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const compact = (v: number) => (v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(v >= 1e4 ? 0 : 1)}K` : String(v));
const reach = (s: EventSourceCard) =>
  s.views ? `${compact(s.views)} views` : s.likes ? `${compact(s.likes)} likes` : s.points ? `${compact(s.points)} points` : s.comments ? `${compact(s.comments)} comments` : null;

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

function VerdictChips({ s }: { s: EventSourceCard }) {
  if (!s.claims.length) return null;
  return (
    <span className="mt-1 flex flex-wrap gap-1">
      {s.claims.slice(0, 2).map((c) => (
        <span key={c.key} className="px-1 py-px font-mono text-[8px] font-bold uppercase tracking-[0.1em] text-white" style={{ background: VERDICT[c.verdict].color }}>
          {VERDICT[c.verdict].label}
        </span>
      ))}
    </span>
  );
}

function Media({ s, playing, className = "" }: { s: EventSourceCard; playing?: boolean; className?: string }) {
  if (playing && s.embed) return <Embed s={s} />;
  return (
    <div className={`relative overflow-hidden bg-neutral-900 ${className}`}>
      {s.thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={s.thumb} alt={`${LABEL[s.platform] ?? s.platform}: ${s.title}`} loading="lazy" decoding="async" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center" style={{ background: `linear-gradient(135deg, ${BRAND[s.platform] ?? "#334155"}33, #0a0a0a)` }}>
          {s.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.logo} alt="" width={40} height={40} loading="lazy" className="h-10 w-10 rounded" />
          ) : (
            <PlatformMark platform={s.platform} size={32} />
          )}
          <span className="line-clamp-2 font-mono text-[10px] uppercase tracking-[0.14em] text-white/80">{s.publisher || s.domain || LABEL[s.platform]}</span>
        </div>
      )}
      <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/75 px-1.5 py-1 font-mono text-[9px] text-white">
        <PlatformMark platform={s.platform} size={12} />
        {LABEL[s.platform] ?? s.platform}
      </span>
      {s.embed && (
        <span className="absolute inset-0 grid place-items-center" aria-hidden="true">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-black/60 text-white ring-1 ring-white/40">
            <Play size={16} fill="currentColor" />
          </span>
        </span>
      )}
      {reach(s) && <span className="absolute bottom-2 right-2 bg-black/75 px-1.5 py-0.5 font-mono text-[9px] text-white">{reach(s)}</span>}
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

function Card({ s, onOpen }: { s: EventSourceCard; onOpen: (s: EventSourceCard) => void }) {
  const portrait = PORTRAIT.has(s.platform);
  return (
    <article className={`shrink-0 snap-start ${portrait ? "w-[150px] sm:w-[170px]" : "w-[240px] sm:w-[270px]"}`}>
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
        className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ef4444]"
      >
        <Media s={s} className={`${portrait ? "aspect-[9/16]" : "aspect-video"} transition-transform duration-200 group-hover:scale-[1.03]`} />
        <span className="mt-2 flex min-w-0 items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
          {s.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.logo} alt="" width={14} height={14} loading="lazy" className="h-3.5 w-3.5 shrink-0 rounded-sm" />
          )}
          <span className="truncate">{s.publisher || (s.subreddit ? `r/${s.subreddit}` : s.domain) || LABEL[s.platform]}</span>
          {s.date && <span className="shrink-0">· <Ago iso={s.date} /></span>}
        </span>
        <span className="mt-0.5 line-clamp-2 text-sm leading-snug text-foreground group-hover:underline">{s.title}</span>
        <VerdictChips s={s} />
      </a>
    </article>
  );
}

function Row({ label, items, onOpen }: { label: string; items: EventSourceCard[]; onOpen: (s: EventSourceCard) => void }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const by = (dir: number) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.85, behavior: "smooth" });
  return (
    <section className="min-w-0" aria-label={label}>
      <h3 className="mb-2 flex items-baseline gap-2 font-display text-lg font-bold text-foreground">
        {label} <span className="font-mono text-[10px] font-normal text-muted-foreground">{items.length}</span>
      </h3>
      <div className="relative">
        <div ref={ref} className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:thin]">
          {items.map((s) => (
            <Card key={s.id} s={s} onOpen={onOpen} />
          ))}
        </div>
        <button type="button" onClick={() => by(-1)} aria-label={`Scroll ${label} left`} className="absolute -left-3 top-[30%] hidden h-9 w-9 place-items-center rounded-full bg-black/80 text-white ring-1 ring-white/20 hover:bg-black sm:grid">
          <ChevronLeft size={18} />
        </button>
        <button type="button" onClick={() => by(1)} aria-label={`Scroll ${label} right`} className="absolute -right-3 top-[30%] hidden h-9 w-9 place-items-center rounded-full bg-black/80 text-white ring-1 ring-white/20 hover:bg-black sm:grid">
          <ChevronRight size={18} />
        </button>
      </div>
    </section>
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
        <PlatformMark platform={s.platform} size={12} /> {s.publisher || (s.subreddit ? `r/${s.subreddit}` : s.domain) || LABEL[s.platform]}
        {s.date && <>· <Ago iso={s.date} /></>}
        {reach(s) && <>· {reach(s)}</>}
      </p>
      <p className="mt-1 line-clamp-3 font-display text-lg font-bold leading-snug">{s.title}</p>
      {s.excerpt && <p className="mt-1 line-clamp-3 text-sm text-white/80">&ldquo;{s.excerpt}&rdquo;</p>}
      <VerdictChips s={s} />
    </div>
  );
}

/** Vertical feed, one source per screen, like a short-video app. */
function Feed({ items, start, onClose }: { items: EventSourceCard[]; start: number; onClose: () => void }) {
  const [playing, setPlaying] = React.useState<string | null>(null);
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    ref.current?.children[start]?.scrollIntoView();
  }, [start]);
  return (
    <Overlay onClose={onClose} label="Sources feed">
      <div ref={ref} className="h-[100dvh] snap-y snap-mandatory overflow-y-auto">
        {items.map((s, i) => (
          <section key={s.id} className="flex h-[100dvh] snap-start flex-col items-center justify-center gap-4 py-14" aria-label={`${i + 1} of ${items.length}`}>
            <div className={`w-full ${PORTRAIT.has(s.platform) ? "max-w-[min(420px,90vw)]" : "max-w-3xl px-4"}`}>
              {playing === s.id ? <Embed s={s} /> : <Media s={s} className={PORTRAIT.has(s.platform) ? "aspect-[9/16] max-h-[62vh] mx-auto" : "aspect-video"} />}
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
                      <span className="block font-mono text-[10px] text-white/60">{k.publisher || k.domain || LABEL[k.platform]}</span>
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

/** Every source at a glance: rows by platform (the server HTML, with real links for crawlers and agents), plus a full-screen feed and a swipe deck. */
export function EventSources({ e }: { e: EventFile }) {
  const [mode, setMode] = React.useState<"browse" | "feed" | "swipe">("browse");
  const [player, setPlayer] = React.useState<EventSourceCard | null>(null);
  const [feedStart, setFeedStart] = React.useState(0);
  const byGroup = (g: SourceGroup) => e.sources.filter((s) => s.group === g);
  // The feed leads with what people watch and read most: videos and posts first, then news and reports.
  const feedOrder = React.useMemo(() => {
    const rank: Record<string, number> = { tiktok: 0, youtube: 1, instagram: 2, x: 3, reddit: 4, official: 5, investigators: 6, news: 7, hackernews: 8 };
    return [...e.sources].sort((a, b) => (rank[a.group] ?? 9) - (rank[b.group] ?? 9));
  }, [e.sources]);
  const tabs: { id: typeof mode; label: string; icon: React.ReactNode }[] = [
    { id: "browse", label: "Browse", icon: <LayoutGrid size={14} /> },
    { id: "feed", label: "Feed", icon: <Smartphone size={14} /> },
    { id: "swipe", label: "Swipe", icon: <Layers size={14} /> },
  ];
  return (
    <div data-testid="event-sources">
      <div className="mb-4 flex flex-wrap items-center gap-2" role="group" aria-label="How to view the sources">
        {tabs.map((t) => (
          <button key={t.id} type="button" onClick={() => { setFeedStart(0); setMode(t.id); }} aria-pressed={mode === t.id}
            className={`flex items-center gap-1.5 border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] ${mode === t.id ? "border-[#ef4444] text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>
            {t.icon} {t.label}
          </button>
        ))}
        <span className="font-mono text-[10px] text-muted-foreground">{e.sources.length} sources · tap a video to play it here</span>
      </div>
      <div className="space-y-8">
        {e.groups.map((g) => (
          <Row key={g.id} label={g.label} items={byGroup(g.id)} onOpen={setPlayer} />
        ))}
      </div>
      {mode === "feed" && <Feed items={feedOrder} start={feedStart} onClose={() => setMode("browse")} />}
      {mode === "swipe" && <Swipe items={feedOrder} onClose={() => setMode("browse")} />}
      {player && (
        <Overlay onClose={() => setPlayer(null)} label={`Playing: ${player.title}`}>
          <div className="flex h-[100dvh] flex-col items-center justify-center gap-4 py-14">
            <div className={`w-full ${PORTRAIT.has(player.platform) || player.embed?.type !== "youtube" ? "max-w-[min(440px,92vw)]" : "max-w-4xl px-4"}`}>
              <Embed s={player} />
            </div>
            <Info s={player} />
          </div>
        </Overlay>
      )}
    </div>
  );
}
