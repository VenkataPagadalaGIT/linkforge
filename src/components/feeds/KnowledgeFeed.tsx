"use client";
/**
 * Knowledge Graph Feeds, "My Own Social Media": one story as a social feed (owner, 2026-10-30: "not feel like real
 * social media like X, Snap, TikTok, YouTube Shorts, Tinder; pick best from each... Social as default, swipe options,
 * then click to read and click back to read more").
 *
 * Borrowed from each: TikTok and Shorts (one full-screen post at a time, swipe up, the action rail on the right,
 * the caption bottom left, double-tap to like), Snapchat (the story bar, one segment per chapter), X (the creator
 * row, the platform's own counts, a context note on a post that makes a claim), Tinder (swipe a claim true or false),
 * YouTube Shorts on desktop (a phone column, up and down buttons, the read panel beside it). Tap a post to read it:
 * a sheet with every quote and its source. Back closes the sheet; "Read more" opens the full page at that part. The
 * feed keeps its place in the URL (?p=), so back from the full page lands on the same post.
 *
 * Honest by construction: a count shows only where the platform published one, our own posts carry "Sourced"
 * instead of a verified tick, and the real posts in the feed are the platforms' own, linked.
 */
import * as React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import { ArrowLeft, Bookmark, Check, ChevronDown, ChevronUp, ExternalLink, Heart, MessageCircle, Play, Plus, Share2, X as Close } from "lucide-react";
import { EVENTS, type EventClaim, type EventFact, type EventFile, type EventSourceCard, type Verdict } from "@/data/events";
import { TopicGraph } from "@/components/graph/TopicGraph";
import { Ago, Embed, PlatformMark, who } from "@/components/events/EventSources";
import { coverOf } from "@/components/feeds/cover";

type Chapter = "happened" | "impact" | "details" | "graph" | "theories" | "next" | "sources";
const CHAPTERS: { id: Chapter; label: string; anchor: string }[] = [
  { id: "happened", label: "What happened", anchor: "what-happened" },
  { id: "impact", label: "The impact", anchor: "impact" },
  { id: "details", label: "The details", anchor: "details" },
  { id: "graph", label: "How it connects", anchor: "graph" },
  { id: "theories", label: "Theories", anchor: "claims" },
  { id: "next", label: "What's next", anchor: "next" },
  { id: "sources", label: "Sources", anchor: "sources" },
];
const VERDICT: Record<Verdict, { label: string; color: string }> = {
  true: { label: "True", color: "#16a34a" },
  false: { label: "False", color: "#ef4444" },
  misleading: { label: "Misleading", color: "#d97706" },
  unconfirmed: { label: "Unconfirmed", color: "#2563eb" },
};
const PLATFORM: Record<string, string> = { news: "News", x: "X", reddit: "Reddit", youtube: "YouTube", tiktok: "TikTok", instagram: "Instagram", hackernews: "Hacker News", web: "Web" };
const PORTRAIT = new Set(["tiktok", "instagram"]);
/** Embeds that are videos get a play button; an X or Reddit post opens on its platform from the reader instead. */
const VIDEO = new Set(["youtube", "tiktok", "instagram"]);
const TONE: Record<string, string> = {
  official: "linear-gradient(160deg, #7f1d1d 0%, #ef4444 45%, #111 100%)",
  independent: "linear-gradient(160deg, #0b1d4d 0%, #2563eb 50%, #0a0a0a 100%)",
  reported: "linear-gradient(160deg, #2e1065 0%, #7c3aed 50%, #0a0a0a 100%)",
  disputed: "linear-gradient(160deg, #451a03 0%, #d97706 50%, #0a0a0a 100%)",
};
const DARK = "radial-gradient(120% 80% at 20% 0%, rgba(239,68,68,0.35), transparent 60%), radial-gradient(120% 80% at 100% 100%, rgba(37,99,235,0.30), transparent 60%), #07080c";

const compact = (v: number) => (v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(v >= 1e4 ? 0 : 1)}K` : String(v));
const usd = (v: number) => (v >= 1e9 ? `$${(v / 1e9).toFixed(2)}B` : `$${Math.round(v / 1e6)}M`);
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const utc = (iso: string) => `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]}, ${iso.slice(11, 16)} UTC`;
const host = (u: string | null) => (u ? u.replace(/^https?:\/\/(www\.)?/, "").split("/")[0] : "");
const hashtag = (s: string) => "#" + s.replace(/'/g, "").replace(/[^A-Za-z0-9 ]/g, " ").trim().split(/\s+/).map((w) => w[0].toUpperCase() + w.slice(1)).join("");

/** "@binance" from an X or TikTok URL; otherwise the subreddit or the site. */
function handleOf(s: EventSourceCard): string {
  const m = s.url?.match(/(?:x|twitter)\.com\/([A-Za-z0-9_]+)\/status/) ?? s.url?.match(/tiktok\.com\/@([A-Za-z0-9_.]+)/) ?? s.url?.match(/instagram\.com\/([A-Za-z0-9_.]+)\//);
  if (m) return `@${m[1]}`;
  if (s.subreddit) return `r/${s.subreddit}`;
  return s.domain || PLATFORM[s.platform] || s.platform;
}

type Author = { name: string; handle: string; avatar?: string | null; platform?: string; ours?: boolean; profile?: string | null };
type Evidence = { quote: string; url: string | null; author: string | null };
type Base = { id: string; chapter: Chapter; author: Author; time: string | null; caption: string; tags: string[]; evidence: Evidence[]; image?: string | null };
type Post =
  | (Base & { kind: "intro" })
  | (Base & { kind: "timeline" })
  | (Base & { kind: "fact"; title: string; facts: EventFact[] })
  | (Base & { kind: "money" })
  | (Base & { kind: "people" })
  | (Base & { kind: "graph" })
  | (Base & { kind: "theories" })
  | (Base & { kind: "claim"; claim: EventClaim })
  | (Base & { kind: "score" })
  | (Base & { kind: "next" })
  | (Base & { kind: "source"; s: EventSourceCard })
  | (Base & { kind: "end" });

const US: Author = { name: "Knowledge Graph Feeds", handle: "every line sourced", ours: true };

/** The story as posts, in the owner's order, with the platforms' own posts between ours instead of all at the end. */
function buildPosts(e: EventFile): Post[] {
  const story = hashtag(e.title.split(",")[0].replace(/^the\s+/i, ""));
  const tags = (ch: Chapter) => [story, hashtag(CHAPTERS.find((c) => c.id === ch)!.label)];
  const facts = (keys: string[]) => keys.map((k) => e.facts.find((x) => x.key === k)).filter((x): x is EventFact => Boolean(x));
  const evidenceOf = (fs: EventFact[]) => fs.flatMap((f) => f.evidence.map((x) => ({ quote: x.quote, url: x.url, author: x.author })));
  const used = new Set<string>();
  const take = (list: EventSourceCard[], n: number) => {
    const out = list.filter((s) => !used.has(s.id)).slice(0, n);
    out.forEach((s) => used.add(s.id));
    return out;
  };
  const byReach = (a: EventSourceCard, b: EventSourceCard) => b.reach - a.reach;
  const official = take(e.sources.filter((s) => s.group === "official").sort((a, b) => (a.date ?? "").localeCompare(b.date ?? "")), 4);
  const investigators = take(e.sources.filter((s) => s.group === "investigators").sort(byReach), 3);
  const news = take(e.sources.filter((s) => s.group === "news").sort(byReach), 3);
  const rank: Record<string, number> = { tiktok: 0, youtube: 1, instagram: 2, x: 3, reddit: 4, official: 5, investigators: 6, news: 7, hackernews: 8 };
  const rest = e.sources.filter((s) => !used.has(s.id)).sort((a, b) => (rank[a.group] ?? 9) - (rank[b.group] ?? 9) || byReach(a, b));
  const src = (s: EventSourceCard, ch: Chapter): Post => {
    const h = handleOf(s);
    const bare = who(s) === s.domain || who(s) === PLATFORM[s.platform];
    const name = bare && h.startsWith("@") ? h : who(s);
    return {
    kind: "source", id: `s-${s.id}`, chapter: ch, s, time: s.date, caption: s.title, tags: tags(ch), image: s.thumb,
    author: { name, handle: name === h ? PLATFORM[s.platform] ?? s.platform : h, avatar: s.avatar ?? s.logo, platform: s.platform, profile: s.url },
    evidence: s.excerpt ? [{ quote: s.excerpt, url: s.url, author: who(s) }] : [],
    };
  };
  const fact = (id: string, ch: Chapter, title: string, keys: string[]): Post[] => {
    const fs = facts(keys);
    if (!fs.length) return [];
    return [{ kind: "fact", id, chapter: ch, author: US, time: fs[0].evidence[0]?.publishedAt ?? null, title, facts: fs, tags: tags(ch), evidence: evidenceOf(fs), caption: `${title}. ${fs.map((f) => `${f.label}: ${f.value}`).join(". ")}.` }];
  };
  const cover = coverOf(e);
  const first = (e.summary ?? "").split(/(?<=\.)\s/)[0];
  const claimsPosts: Post[] = e.claims.map((c) => ({
    kind: "claim", id: `claim-${c.key}`, chapter: "theories", claim: c, author: US, time: null, tags: tags("theories"),
    caption: `People are saying: "${c.claim}" True or false?`, evidence: c.evidence.map((x) => ({ quote: x.quote, url: x.url, author: x.author })),
  }));
  return [
    { kind: "intro", id: "what-happened", chapter: "happened", author: US, time: e.updatedAt.replace(" ", "T"), caption: first, tags: tags("happened"), image: cover, evidence: evidenceOf(facts(["impact", "counted", "frozen"])) },
    { kind: "timeline", id: "timeline", chapter: "happened", author: US, time: e.moments[0]?.at ?? null, caption: `Minute by minute: ${e.moments.length} moments, each one from its source.`, tags: tags("happened"), evidence: e.moments.map((m) => ({ quote: m.quote, url: m.url, author: m.author })) },
    ...official.map((s) => src(s, "happened")),
    ...fact("the-money", "impact", "How much was taken", ["impact", "counted"]),
    ...fact("frozen", "impact", "Frozen, and still out there", ["frozen", "held"]),
    ...investigators.map((s) => src(s, "impact")),
    ...fact("your-money", "impact", "Customers and withdrawals", ["users", "access"]),
    ...fact("markets", "impact", "Markets and the record", ["markets", "record"]),
    { kind: "money", id: "money-trail", chapter: "impact", author: US, time: null, caption: `${usd(e.money.total)} moved across ${e.money.rows.length} blockchains.${e.money.frozen.length ? ` ${usd(e.money.frozen.reduce((n, f) => n + f.usd, 0))} frozen so far.` : ""}`, tags: tags("impact"), evidence: [...e.money.rows.map((r) => ({ quote: r.quote, url: e.money.source?.url ?? null, author: e.money.source?.author ?? null })), ...e.money.frozen.map((f) => ({ quote: f.quote, url: f.url, author: f.author }))] },
    ...fact("how", "details", "How it happened", ["how", "keys"]),
    ...fact("who", "details", "Who did it", ["who", "regulators"]),
    ...news.map((s) => src(s, "details")),
    { kind: "people", id: "people", chapter: "details", author: US, time: null, caption: `${e.actors.length} people and organizations in this story.`, tags: tags("details"), evidence: [] },
    { kind: "graph", id: "graph", chapter: "graph", author: US, time: null, caption: `How it all connects: ${e.graph.nodes.length} people, places, claims and sources, linked.`, tags: tags("graph"), evidence: [] },
    { kind: "theories", id: "theories", chapter: "theories", author: US, time: null, caption: `${e.claims.length} things people are saying. Swipe each one: right for true, left for false.`, tags: tags("theories"), evidence: [] },
    ...claimsPosts,
    { kind: "score", id: "score", chapter: "theories", author: US, time: null, caption: "Your round, and where to check every claim.", tags: tags("theories"), evidence: [] },
    { kind: "next", id: "next", chapter: "next", author: US, time: null, caption: `What to watch: ${e.watch.length} things that decide what happens next.`, tags: tags("next"), evidence: e.watch.map((w) => ({ quote: w.quote, url: w.url, author: w.author })) },
    ...rest.map((s) => src(s, "sources")),
    { kind: "end", id: "end", chapter: "sources", author: US, time: null, caption: "You're caught up: the whole story and every source.", tags: [story], evidence: [] },
  ];
}

const store = {
  get(k: string): string[] {
    try {
      return JSON.parse(window.localStorage.getItem(k) || "[]");
    } catch {
      return [];
    }
  },
  set(k: string, v: string[]) {
    try {
      window.localStorage.setItem(k, JSON.stringify(v));
    } catch {
      /* private mode: likes and saves last for this visit only */
    }
  },
};

function useWide() {
  const [wide, setWide] = React.useState(false);
  React.useEffect(() => {
    const q = window.matchMedia("(min-width: 1024px)");
    const on = () => setWide(q.matches);
    on();
    q.addEventListener("change", on);
    return () => q.removeEventListener("change", on);
  }, []);
  return wide;
}

function Avatar({ a, size = 36 }: { a: Author; size?: number }) {
  if (a.ours) {
    return (
      <span className="grid shrink-0 place-items-center rounded-full bg-black font-display font-bold text-white ring-2 ring-white" style={{ width: size, height: size, fontSize: size * 0.36 }}>
        <span className="text-[#ef4444]">●</span>
      </span>
    );
  }
  if (a.avatar) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={a.avatar} alt="" width={size} height={size} className="shrink-0 rounded-full bg-white object-cover ring-2 ring-white" style={{ width: size, height: size }} />;
  }
  return (
    <span className="grid shrink-0 place-items-center rounded-full bg-white/15 text-white ring-2 ring-white" style={{ width: size, height: size }}>
      <PlatformMark platform={a.platform ?? "web"} size={size * 0.45} />
    </span>
  );
}

function Quote({ q }: { q: Evidence }) {
  return (
    <li className="border-b border-white/10 py-3 last:border-0">
      <p className="text-[15px] leading-snug text-white/90"><q><mark className="hl hl-b text-black">{q.quote}</mark></q></p>
      {(q.author || q.url) && (
        <p className="mt-1.5 text-xs text-white/55">
          {q.url ? <a href={q.url} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">{q.author || host(q.url)} <ExternalLink size={10} className="inline" /></a> : q.author}
        </p>
      )}
    </li>
  );
}

/** Tinder for claims: drag right for true, left for false, or tap a button; then the verdict, like a context note. */
function ClaimStage({ c, answer, onAnswer }: { c: EventClaim; answer: boolean | undefined; onAnswer: (yes: boolean) => void }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-14, 14]);
  const yes = useTransform(x, [0, 120], [0, 1]);
  const no = useTransform(x, [-120, 0], [1, 0]);
  const v = VERDICT[c.verdict];
  const right = answer === undefined ? null : answer ? c.verdict === "true" : c.verdict === "false" || c.verdict === "misleading";
  const end = (_: unknown, info: PanInfo) => {
    if (info.offset.x > 110) onAnswer(true);
    else if (info.offset.x < -110) onAnswer(false);
  };
  return (
    <div className="flex h-full w-full flex-col items-center justify-center pb-40 pl-5 pr-16 pt-24" data-no-tap>
      {answer === undefined ? (
        <>
          <motion.div drag="x" dragSnapToOrigin onDragEnd={end} style={{ x, rotate }} className="relative w-full max-w-[340px] cursor-grab touch-pan-y rounded-[28px] bg-white p-6 text-black shadow-2xl active:cursor-grabbing">
            <motion.span style={{ opacity: yes }} className="pointer-events-none absolute left-5 top-5 -rotate-12 rounded-md border-4 border-[#16a34a] px-2 font-display text-2xl font-black text-[#16a34a]">TRUE</motion.span>
            <motion.span style={{ opacity: no }} className="pointer-events-none absolute right-5 top-5 rotate-12 rounded-md border-4 border-[#ef4444] px-2 font-display text-2xl font-black text-[#ef4444]">FALSE</motion.span>
            <p className="mt-10 text-[11px] font-semibold uppercase tracking-wider text-black/50">People are saying</p>
            <p className="mt-2 font-display text-[26px] font-bold leading-tight">&ldquo;{c.claim}&rdquo;</p>
            <p className="mt-4 text-xs text-black/55">
              {c.spread.total ? `Seen in ${c.spread.total} posts: ${Object.entries(c.spread.byPlatform).map(([p, n]) => `${PLATFORM[p] ?? p} ${n}`).join(", ")}` : "Not found in what we read"}
            </p>
          </motion.div>
          <div className="mt-6 flex items-center gap-8">
            <button type="button" onClick={() => onAnswer(false)} aria-label="False" className="grid h-16 w-16 place-items-center rounded-full bg-white text-[#ef4444] shadow-xl ring-1 ring-black/5 transition active:scale-90"><Close size={30} strokeWidth={3} /></button>
            <button type="button" onClick={() => onAnswer(true)} aria-label="True" className="grid h-16 w-16 place-items-center rounded-full bg-white text-[#16a34a] shadow-xl ring-1 ring-black/5 transition active:scale-90"><Check size={30} strokeWidth={3} /></button>
          </div>
          <p className="mt-3 text-xs text-white/60">Swipe right for true, left for false</p>
        </>
      ) : (
        <motion.div initial={{ rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} transition={{ duration: 0.35 }} className="w-full max-w-[340px]">
          <p className="font-display text-xl font-bold leading-snug text-white/85">&ldquo;{c.claim}&rdquo;</p>
          <p className="mt-3 inline-block rounded-md px-3 py-1 font-display text-lg font-black text-white" style={{ background: v.color }}>{v.label}</p>
          <p className="mt-2 text-sm font-semibold text-white">{right === null ? "" : right ? "You called it." : `You said ${answer ? "true" : "false"}.`}</p>
          <div className="mt-4 rounded-2xl border border-white/15 bg-white/[0.06] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/55">Context from the sources</p>
            <p className="mt-1.5 text-[15px] leading-snug text-white/90">{c.explain}</p>
          </div>
          <p className="mt-3 text-xs text-white/55">Tap Read for every source behind it</p>
        </motion.div>
      )}
    </div>
  );
}

/** One topic as a social feed. `slug` picks the story. */
export function KnowledgeFeed({ slug }: { slug: string }) {
  const e = EVENTS[slug];
  const posts = React.useMemo(() => (e ? buildPosts(e) : []), [e]);
  const wide = useWide();
  const [mounted, setMounted] = React.useState(false);
  const [current, setCurrent] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, boolean>>({});
  const [liked, setLiked] = React.useState<string[]>([]);
  const [saved, setSaved] = React.useState<string[]>([]);
  const [following, setFollowing] = React.useState<string[]>([]);
  const [playing, setPlaying] = React.useState<string | null>(null);
  const [read, setRead] = React.useState<string | null>(null);
  const [topics, setTopics] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);
  const [burst, setBurst] = React.useState<{ x: number; y: number; k: number } | null>(null);
  const [coach, setCoach] = React.useState(false);
  const scroller = React.useRef<HTMLDivElement>(null);
  const column = React.useRef<HTMLDivElement>(null);
  const press = React.useRef<{ x: number; y: number; t: number } | null>(null);
  const lastTap = React.useRef<number>(0);
  const single = React.useRef<number | null>(null);
  const page = `/notebook/events/${slug}`;

  React.useEffect(() => {
    setMounted(true);
    setLiked(store.get(`kgf:liked:${slug}`));
    setSaved(store.get(`kgf:saved:${slug}`));
    setFollowing(store.get("kgf:following"));
    if (!store.get("kgf:coach").length) {
      setCoach(true);
      store.set("kgf:coach", ["seen"]);
    }
  }, [slug]);

  const go = React.useCallback(
    (i: number, behavior: ScrollBehavior = "smooth") => {
      const el = scroller.current;
      if (!el) return;
      const top = Math.max(0, Math.min(posts.length - 1, i)) * el.clientHeight;
      el.scrollTo({ top, behavior });
      // a smooth scroll that stalls (a busy tab, a throttled frame) must never leave the feed between two posts
      window.setTimeout(() => {
        if (Math.abs(el.scrollTop - top) > 2) el.scrollTo({ top, behavior: "auto" });
      }, 650);
    },
    [posts.length]
  );

  // Start where the link points (?p=post, or ?chapter= from older links), and lock the page behind the feed.
  React.useEffect(() => {
    if (!mounted) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const q = new URLSearchParams(window.location.search);
    const p = q.get("p");
    const ch = q.get("chapter");
    const start = p ? posts.findIndex((x) => x.id === p) : ch ? posts.findIndex((x) => x.chapter === ch) : -1;
    if (start > 0) requestAnimationFrame(() => go(start, "auto"));
    return () => {
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  // The post in view is the scroll position over the screen height (every post is exactly one screen tall).
  const onScroll = (ev: React.UIEvent<HTMLDivElement>) => {
    const el = ev.currentTarget;
    const i = Math.max(0, Math.min(posts.length - 1, Math.round(el.scrollTop / Math.max(1, el.clientHeight))));
    if (i === current) return;
    setCurrent(i);
    setPlaying(null);
    setCoach(false);
    const url = new URL(window.location.href);
    url.searchParams.delete("chapter");
    url.searchParams.set("p", posts[i].id);
    window.history.replaceState(window.history.state, "", url);
  };

  // Reading opens a history entry, so the phone's back gesture closes the sheet and returns to the feed.
  const openRead = React.useCallback((id: string) => {
    setRead(id);
    window.history.pushState({ kgfRead: id }, "", window.location.href);
  }, []);
  const closeRead = React.useCallback(() => {
    if ((window.history.state as { kgfRead?: string } | null)?.kgfRead) window.history.back();
    else setRead(null);
  }, []);
  React.useEffect(() => {
    const pop = () => setRead(null);
    window.addEventListener("popstate", pop);
    return () => window.removeEventListener("popstate", pop);
  }, []);

  const flip = (list: string[], set: (v: string[]) => void, key: string, id: string, on?: boolean) => {
    const has = list.includes(id);
    if (on && has) return;
    const v = has ? list.filter((x) => x !== id) : [...list, id];
    set(v);
    store.set(key, v);
  };
  const like = (p: Post, on?: boolean) => flip(liked, setLiked, `kgf:liked:${slug}`, p.id, on);
  const say = (t: string) => {
    setToast(t);
    window.setTimeout(() => setToast(null), 1600);
  };
  const share = async (p: Post) => {
    const url = `${window.location.origin}/feeds/${slug}?p=${encodeURIComponent(p.id)}`;
    try {
      if (navigator.share) await navigator.share({ title: e.title, text: p.caption, url });
      else {
        await navigator.clipboard.writeText(url);
        say("Link copied");
      }
    } catch {
      /* the person closed the share sheet */
    }
  };
  const chapterStart = (ch: Chapter) => posts.findIndex((p) => p.chapter === ch);
  const jumpChapter = (dir: 1 | -1) => {
    const ci = CHAPTERS.findIndex((c) => c.id === posts[current]?.chapter);
    go(chapterStart(CHAPTERS[Math.max(0, Math.min(CHAPTERS.length - 1, ci + dir))].id));
  };
  const answer = (key: string, yes: boolean) => setAnswers((a) => ({ ...a, [key]: yes }));

  // Tap to read, double-tap to like, swipe sideways to change chapter (on a claim, sideways is the Tinder answer).
  const onPointerDown = (ev: React.PointerEvent) => {
    press.current = (ev.target as HTMLElement).closest("button,a,iframe,input,[data-no-tap]") ? null : { x: ev.clientX, y: ev.clientY, t: Date.now() };
  };
  const onPointerUp = (ev: React.PointerEvent) => {
    const d = press.current;
    press.current = null;
    if (!d) return;
    const p = posts[current];
    const dx = ev.clientX - d.x;
    const dy = ev.clientY - d.y;
    if (Math.abs(dx) > 80 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      jumpChapter(dx < 0 ? 1 : -1);
      return;
    }
    if (Math.abs(dx) > 10 || Math.abs(dy) > 10 || Date.now() - d.t > 500) return;
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (single.current) window.clearTimeout(single.current);
      single.current = null;
      lastTap.current = 0;
      like(p, true);
      const r = column.current?.getBoundingClientRect();
      setBurst({ x: ev.clientX - (r?.left ?? 0), y: ev.clientY - (r?.top ?? 0), k: now });
      return;
    }
    lastTap.current = now;
    single.current = window.setTimeout(() => {
      single.current = null;
      openRead(p.id);
    }, 300);
  };

  React.useEffect(() => {
    const k = (ev: KeyboardEvent) => {
      if (read) {
        if (ev.key === "Escape") closeRead();
        return;
      }
      const p = posts[current];
      if (ev.key === "ArrowDown" || ev.key === "j") go(current + 1);
      else if (ev.key === "ArrowUp" || ev.key === "k") go(current - 1);
      else if (p?.kind === "claim" && answers[p.claim.key] === undefined && (ev.key === "ArrowRight" || ev.key === "ArrowLeft")) answer(p.claim.key, ev.key === "ArrowRight");
      else if (ev.key === "ArrowRight") jumpChapter(1);
      else if (ev.key === "ArrowLeft") jumpChapter(-1);
      else if (ev.key === "Enter" || ev.key === "r") openRead(p.id);
      else if (ev.key === "l") like(p);
      else return;
      ev.preventDefault();
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  });

  if (!e || !mounted) return null;
  const post = posts[current];
  const chapter = post?.chapter ?? "happened";
  const live = new Date().toISOString().slice(0, 10) <= e.window[1];
  const answered = e.claims.filter((c) => answers[c.key] !== undefined);
  const correct = answered.filter((c) => (answers[c.key] ? c.verdict === "true" : c.verdict === "false" || c.verdict === "misleading")).length;
  const readPost = read ? posts.find((p) => p.id === read) ?? null : null;
  const backdrop = post?.image ?? posts[0]?.image ?? null;

  const stage = (p: Post, i: number) => {
    switch (p.kind) {
      case "intro":
        return (
          <div className="relative h-full w-full" style={{ background: DARK }}>
            {p.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30 blur-[2px]" />
            )}
            <div className="relative flex h-full flex-col justify-center pb-44 pl-6 pr-16 pt-28">
              {live && <span className="mb-3 inline-flex w-fit items-center gap-1.5 rounded bg-[#ef4444] px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-white"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> Live</span>}
              <h2 className="font-display text-[40px] font-black leading-[1.02] text-white">{e.title}</h2>
              <p className="mt-4 text-base leading-snug text-white/85"><mark className="hl hl-y text-black">{p.caption}</mark></p>
            </div>
          </div>
        );
      case "timeline":
        return (
          <div className="h-full w-full pb-44 pl-5 pr-16 pt-28" style={{ background: DARK }}>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/55">Minute by minute</p>
            <ol className="relative mt-3 space-y-3 border-l-2 border-[#ef4444]/60 pl-4">
              {e.moments.slice(0, 6).map((m) => (
                <li key={m.at + m.label}>
                  <span className="absolute -left-[7px] mt-1 h-3 w-3 rounded-full border-2 border-black bg-[#ef4444]" aria-hidden="true" />
                  <p className="text-[11px] font-semibold text-white/55">{utc(m.at)}</p>
                  <p className="text-[15px] font-semibold leading-snug text-white">{m.label}</p>
                </li>
              ))}
            </ol>
            {e.moments.length > 6 && <p className="mt-3 text-xs font-semibold text-white/60">+{e.moments.length - 6} more · tap to read</p>}
          </div>
        );
      case "fact":
        return (
          <div className="flex h-full w-full flex-col justify-center pb-44 pl-6 pr-16 pt-24" style={{ background: TONE[p.facts[0].status] ?? DARK }}>
            <p className="text-[12px] font-bold uppercase tracking-wider text-white/75">{p.title}</p>
            {p.facts.map((f) => (
              <div key={f.key} className="mt-5">
                <p className="font-display text-[44px] font-black leading-none text-white">{f.value}</p>
                <p className="mt-1.5 text-sm font-semibold text-white/85">{f.label}</p>
                {f.evidence[0]?.author && <p className="mt-0.5 text-xs text-white/60">per {f.evidence[0].author}{f.evidence.length > 1 ? ` and ${f.evidence.length - 1} more` : ""}</p>}
              </div>
            ))}
          </div>
        );
      case "money": {
        const max = Math.max(...e.money.rows.map((r) => r.usd));
        return (
          <div className="flex h-full w-full flex-col justify-center px-6 pb-44 pt-24" style={{ background: DARK }}>
            <p className="text-[12px] font-bold uppercase tracking-wider text-white/70">The money trail</p>
            <p className="mt-2 font-display text-[44px] font-black leading-none text-white">{usd(e.money.total)}</p>
            <ul className="mt-5 space-y-2.5">
              {e.money.rows.slice(0, 8).map((r) => (
                <li key={r.chain} className="grid grid-cols-[5.5rem_1fr_auto] items-center gap-2 text-sm text-white">
                  <span className="truncate text-white/80">{r.chain}</span>
                  <span className="h-2.5 rounded-full bg-gradient-to-r from-[#ef4444] to-[#f97316]" style={{ width: `${Math.max(3, (r.usd / max) * 100)}%` }} />
                  <span className="text-xs font-semibold tabular-nums">{usd(r.usd)}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      }
      case "people":
        return (
          <div className="flex h-full w-full flex-col justify-center pb-44 pl-5 pr-16 pt-24" style={{ background: DARK }}>
            <p className="text-[12px] font-bold uppercase tracking-wider text-white/70">People in this story</p>
            <ul className="mt-4 grid grid-cols-2 gap-2.5">
              {e.actors.slice(0, 8).map((a) => (
                <li key={a.name} className="rounded-2xl bg-white/[0.07] p-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-sm font-black text-black">{a.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("")}</span>
                  <p className="mt-2 text-sm font-bold leading-tight text-white">{a.name}</p>
                  <p className="text-[11px] leading-snug text-white/60">{a.role}</p>
                </li>
              ))}
            </ul>
          </div>
        );
      case "graph": {
        const kinds = Object.entries(e.graph.nodes.reduce<Record<string, number>>((m, n) => ((m[n.kind] = (m[n.kind] ?? 0) + 1), m), {}));
        return (
          <div className="relative flex h-full w-full flex-col items-center justify-center px-6 pb-44 pt-24 text-center" style={{ background: DARK }}>
            <svg viewBox="-110 -110 220 220" className="h-56 w-56" aria-hidden="true">
              {e.graph.nodes.slice(0, 36).map((n, k, arr) => {
                const a = (k / arr.length) * Math.PI * 2;
                const r = 40 + (k % 3) * 25;
                return (
                  <g key={n.id}>
                    <line x1={0} y1={0} x2={Math.cos(a) * r} y2={Math.sin(a) * r} stroke="rgba(255,255,255,0.18)" />
                    <circle cx={Math.cos(a) * r} cy={Math.sin(a) * r} r={n.kind === "claim" ? 5 : 4} fill={n.verdict ? VERDICT[n.verdict].color : n.kind === "actor" ? "#25F4EE" : "#fff"} />
                  </g>
                );
              })}
              <circle r={14} fill="#ef4444" />
            </svg>
            <p className="mt-4 font-display text-2xl font-black text-white">How it all connects</p>
            <p className="mt-1 text-sm text-white/70">{kinds.map(([k, n]) => `${n} ${k === "category" ? "topics" : `${k}s`}`).join(" · ")}</p>
            <p className="mt-3 text-xs font-semibold text-white/60">Tap to explore the graph</p>
          </div>
        );
      }
      case "theories":
        return (
          <div className="flex h-full w-full flex-col items-center justify-center px-6 pb-44 pt-24 text-center" style={{ background: DARK }}>
            <p className="font-display text-[56px] font-black leading-none text-white">{e.claims.length}</p>
            <p className="mt-2 font-display text-2xl font-bold text-white">things people are saying</p>
            <p className="mt-3 max-w-[300px] text-sm text-white/75">Swipe each one like a dating app: right for true, left for false. Then see the verdict.</p>
            <div className="mt-5 flex flex-wrap justify-center gap-1.5">
              {(Object.keys(VERDICT) as Verdict[]).map((v) => <span key={v} className="rounded-md px-2 py-0.5 text-[11px] font-bold text-white" style={{ background: VERDICT[v].color }}>{VERDICT[v].label}</span>)}
            </div>
          </div>
        );
      case "claim":
        return (
          <div className="h-full w-full" style={{ background: DARK }}>
            <ClaimStage c={p.claim} answer={answers[p.claim.key]} onAnswer={(yes) => answer(p.claim.key, yes)} />
          </div>
        );
      case "score":
        return (
          <div className="flex h-full w-full flex-col items-center justify-center px-6 pb-44 pt-24 text-center" style={{ background: DARK }}>
            <p className="text-[12px] font-bold uppercase tracking-wider text-white/70">Your round</p>
            <p className="mt-2 font-display text-[72px] font-black leading-none text-white">{correct}<span className="text-white/35">/{answered.length || e.claims.length}</span></p>
            <p className="mt-3 text-sm text-white/75">{answered.length ? "called right, counting misleading claims as false" : "Swipe back up to play the round."}</p>
          </div>
        );
      case "next":
        return (
          <div className="flex h-full w-full flex-col justify-center px-6 pb-44 pt-24" style={{ background: DARK }}>
            <p className="text-[12px] font-bold uppercase tracking-wider text-white/70">What happens next</p>
            <ul className="mt-4 space-y-3">
              {e.watch.slice(0, 5).map((w) => (
                <li key={w.label} className="border-l-4 border-[#ef4444] pl-3">
                  <p className="text-[15px] font-bold leading-snug text-white">{w.label}</p>
                  {w.when && <p className="text-xs text-white/60">expected {w.when}</p>}
                </li>
              ))}
            </ul>
          </div>
        );
      case "source": {
        const s = p.s;
        const portrait = PORTRAIT.has(s.platform);
        const isPlaying = playing === s.id && s.embed && VIDEO.has(s.embed.type) && i === current;
        return (
          <div className="relative h-full w-full bg-black">
            {s.thumb ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.thumb} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-50 blur-2xl" aria-hidden="true" />
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.thumb} alt={`${PLATFORM[s.platform] ?? s.platform}: ${s.title}`} className={portrait ? "h-full w-full object-cover" : "w-full object-contain"} />
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex items-center pb-48 pl-4 pr-16 pt-24" style={{ background: DARK }}>
                <div className="w-full rounded-2xl border border-white/15 bg-black/60 p-4 shadow-2xl backdrop-blur">
                  <div className="flex items-center gap-2.5">
                    <Avatar a={p.author} size={40} />
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-bold text-white">{p.author.name}</p>
                      <p className="truncate text-[13px] text-white/55">{p.author.handle}</p>
                    </div>
                    <span className="ml-auto shrink-0 text-white/80"><PlatformMark platform={s.platform} size={16} /></span>
                  </div>
                  <p className="mt-3 text-[19px] leading-snug text-white">{s.excerpt || s.title}</p>
                  <p className="mt-3 text-[13px] text-white/50">
                    {[s.views ? `${compact(s.views)} views` : null, s.likes ? `${compact(s.likes)} likes` : null, s.points ? `${compact(s.points)} points` : null, s.comments ? `${compact(s.comments)} comments` : null].filter(Boolean).join(" · ") || (PLATFORM[s.platform] ?? host(s.url))}
                  </p>
                  {s.embed && VIDEO.has(s.embed.type) && (
                    <button type="button" onClick={() => setPlaying(s.id)} className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-bold text-black">
                      <Play size={14} fill="currentColor" /> Play the video
                    </button>
                  )}
                </div>
              </div>
            )}
            {isPlaying ? (
              <div className="absolute inset-0 z-10 flex items-center bg-black" data-no-tap><Embed s={s} /></div>
            ) : (
              s.thumb && s.embed && VIDEO.has(s.embed.type) && (
                <button type="button" onClick={() => setPlaying(s.id)} aria-label="Play" className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-white ring-2 ring-white/70 backdrop-blur">
                  <Play size={26} fill="currentColor" />
                </button>
              )
            )}
            {s.views ? <span className="absolute left-3 top-24 rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white">▶ {compact(s.views)} views</span> : null}
          </div>
        );
      }
      case "end":
        return (
          <div className="flex h-full w-full flex-col items-center justify-center px-6 pb-44 pt-24 text-center" style={{ background: DARK }}>
            <p className="font-display text-3xl font-black text-white">You&apos;re caught up</p>
            <p className="mt-2 text-sm text-white/75">The whole story and every source, {posts.length} posts.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <a href={page} className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-black">Read the full page</a>
              <button type="button" onClick={() => go(0)} className="rounded-full bg-white/15 px-5 py-2.5 text-sm font-semibold text-white">Start again</button>
            </div>
          </div>
        );
    }
  };

  // A note on a real post that repeats a claim, the way X shows reader context.
  const note = (p: Post) => {
    if (p.kind !== "source" || !p.s.claims.length) return null;
    const c = e.claims.find((x) => x.key === p.s.claims[0].key);
    if (!c) return null;
    const v = VERDICT[p.s.claims[0].verdict];
    return (
      <button type="button" onClick={() => openRead(p.id)} className="mb-2 block w-full rounded-xl border border-white/20 bg-black/55 p-2.5 text-left backdrop-blur">
        <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">Context from the sources</span>
        <span className="mt-0.5 block text-[13px] leading-snug text-white">This post says &ldquo;{c.claim}&rdquo;: <b style={{ color: v.color }}>{v.label}</b></span>
      </button>
    );
  };

  const counts = (p: Post) => {
    if (p.kind !== "source") return { likes: null as number | null, comments: null as number | null };
    return { likes: p.s.likes ?? p.s.points, comments: p.s.comments };
  };

  const rail = (p: Post) => {
    const c = counts(p);
    const isLiked = liked.includes(p.id);
    const isSaved = saved.includes(p.id);
    const follows = following.includes(slug);
    return (
      <div className="absolute bottom-28 right-2 z-20 flex flex-col items-center gap-4" data-no-tap>
        {p.author.ours ? (
          <button type="button" onClick={() => { flip(following, setFollowing, "kgf:following", slug); say(follows ? "Unfollowed this story" : "Following this story"); }} aria-label={follows ? "Unfollow this story" : "Follow this story"} className="relative">
            <Avatar a={p.author} size={46} />
            <span className={`absolute -bottom-2 left-1/2 grid h-5 w-5 -translate-x-1/2 place-items-center rounded-full text-white ${follows ? "bg-white text-black" : "bg-[#ef4444]"}`}>{follows ? <Check size={12} strokeWidth={3} className="text-black" /> : <Plus size={12} strokeWidth={3} />}</span>
          </button>
        ) : (
          <a href={p.author.profile ?? undefined} target="_blank" rel="noopener noreferrer" aria-label={`Open on ${PLATFORM[p.author.platform ?? ""] ?? "the platform"}`} className="relative">
            <Avatar a={p.author} size={46} />
            <span className="absolute -bottom-2 left-1/2 grid h-5 w-5 -translate-x-1/2 place-items-center rounded-full bg-black ring-1 ring-white/40"><PlatformMark platform={p.author.platform ?? "web"} size={11} /></span>
          </a>
        )}
        <button type="button" onClick={() => like(p)} aria-pressed={isLiked} aria-label="Like" className="flex flex-col items-center text-white">
          <motion.span whileTap={{ scale: 0.8 }}><Heart size={34} className={isLiked ? "text-[#ef4444]" : "text-white"} fill={isLiked ? "#ef4444" : "rgba(0,0,0,0.25)"} strokeWidth={isLiked ? 0 : 2} /></motion.span>
          <span className="text-[12px] font-semibold drop-shadow">{c.likes ? compact(c.likes) : "Like"}</span>
        </button>
        <button type="button" onClick={() => openRead(p.id)} aria-label="Read" className="flex flex-col items-center text-white">
          <MessageCircle size={32} fill="rgba(0,0,0,0.25)" />
          <span className="text-[12px] font-semibold drop-shadow">{c.comments ? compact(c.comments) : p.evidence.length ? p.evidence.length : "Read"}</span>
        </button>
        <button type="button" onClick={() => flip(saved, setSaved, `kgf:saved:${slug}`, p.id)} aria-pressed={isSaved} aria-label="Save" className="flex flex-col items-center text-white">
          <Bookmark size={30} className={isSaved ? "text-[#facc15]" : "text-white"} fill={isSaved ? "#facc15" : "rgba(0,0,0,0.25)"} strokeWidth={isSaved ? 0 : 2} />
          <span className="text-[12px] font-semibold drop-shadow">Save</span>
        </button>
        <button type="button" onClick={() => share(p)} aria-label="Share" className="flex flex-col items-center text-white">
          <Share2 size={30} />
          <span className="text-[12px] font-semibold drop-shadow">Share</span>
        </button>
      </div>
    );
  };

  const caption = (p: Post) => (
    <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/85 via-black/50 to-transparent px-3 pb-5 pt-16 pr-16">
      {note(p)}
      <div className="flex items-center gap-2">
        <Avatar a={p.author} size={30} />
        <p className="min-w-0 truncate text-[15px] font-bold text-white">{p.author.name}</p>
        {p.author.ours && <span className="shrink-0 rounded bg-white/90 px-1.5 py-px text-[10px] font-bold text-black">Sourced</span>}
        {!p.author.ours && p.author.platform && <span className="shrink-0 text-white/80"><PlatformMark platform={p.author.platform} size={13} /></span>}
      </div>
      <p className="mt-0.5 truncate text-[12px] text-white/65">
        {p.author.handle}
        {p.time && <> · <Ago iso={p.time} /></>}
      </p>
      {!(p.kind === "source" && !p.s.thumb) && <p className="mt-1.5 line-clamp-2 text-[14px] leading-snug text-white">{p.kind === "intro" ? e.title : p.caption}</p>}
      <button type="button" onClick={() => openRead(p.id)} className="mt-0.5 text-[13px] font-semibold text-white/80">Read more</button>
      <p className="mt-1 truncate text-[13px] font-semibold text-white">{p.tags.join(" ")}</p>
      {p.evidence.length > 0 && (
        <div className="mt-2 flex items-center gap-2 overflow-hidden text-[12px] text-white/80">
          <span aria-hidden="true">♪</span>
          <span className="kgf-marquee whitespace-nowrap">Sources: {Array.from(new Set(p.evidence.map((x) => x.author || host(x.url)).filter(Boolean))).join(" · ")}</span>
        </div>
      )}
    </div>
  );

  const sheetBody = (p: Post) => {
    const quotes = p.evidence.length > 0 && (
      <section className="mt-5">
        <h3 className="text-[13px] font-bold uppercase tracking-wider text-white/60">What the sources say · {p.evidence.length}</h3>
        <ul className="mt-1">{p.evidence.map((q, i) => <Quote key={i} q={q} />)}</ul>
      </section>
    );
    switch (p.kind) {
      case "intro":
        return (
          <>
            <h2 className="font-display text-2xl font-black leading-tight text-white">{e.title}</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-white/90"><mark className="hl hl-y text-black">{p.caption}</mark> {(e.summary ?? "").slice(p.caption.length).trim()}</p>
            <p className="mt-3 text-[15px] leading-relaxed"><mark className="hl hl-g text-black">What to do: rely only on Binance&apos;s official channels, and check a claim&apos;s verdict before you share it.</mark></p>
            {quotes}
          </>
        );
      case "timeline":
        return (
          <>
            <h2 className="font-display text-2xl font-black text-white">Minute by minute</h2>
            <ol className="mt-3 space-y-4">
              {e.moments.map((m) => (
                <li key={m.at + m.label} className="border-l-2 border-[#ef4444] pl-3">
                  <p className="text-xs font-semibold text-white/55">{utc(m.at)}</p>
                  <p className="text-[15px] font-bold text-white">{m.label}</p>
                  <p className="mt-1 text-sm text-white/80"><q><mark className="hl hl-b text-black">{m.quote}</mark></q> {m.url && <a href={m.url} target="_blank" rel="noopener noreferrer" className="text-xs text-white/55 underline">{m.author || host(m.url)}</a>}</p>
                </li>
              ))}
            </ol>
          </>
        );
      case "fact":
        return (
          <>
            <h2 className="font-display text-2xl font-black text-white">{p.title}</h2>
            {p.facts.map((f) => (
              <div key={f.key} className="mt-4 rounded-2xl bg-white/[0.06] p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/55">{f.label}</p>
                <p className="font-display text-3xl font-black text-white">{f.value}</p>
                {f.note && <p className="mt-1 text-sm text-white/70">{f.note}</p>}
              </div>
            ))}
            {quotes}
          </>
        );
      case "money":
        return (
          <>
            <h2 className="font-display text-2xl font-black text-white">The money trail: {usd(e.money.total)}</h2>
            <ul className="mt-3 space-y-1.5 text-sm text-white/85">{e.money.rows.map((r) => <li key={r.chain} className="flex justify-between gap-3"><span>{r.chain}{r.what ? `, ${r.what}` : ""}</span><b className="tabular-nums">{usd(r.usd)}</b></li>)}</ul>
            {e.money.frozen.map((f) => <p key={f.who} className="mt-3 text-sm text-white/85"><b className="text-[#25F4EE]">Frozen {usd(f.usd)}</b> by {f.who}.</p>)}
            {quotes}
          </>
        );
      case "people":
        return (
          <>
            <h2 className="font-display text-2xl font-black text-white">People in this story</h2>
            <ul className="mt-3 divide-y divide-white/10">{e.actors.map((a) => <li key={a.name} className="py-2.5"><p className="font-bold text-white">{a.name}</p><p className="text-sm text-white/65">{a.role}</p></li>)}</ul>
          </>
        );
      case "graph":
        return (
          <>
            <h2 className="mb-3 font-display text-2xl font-black text-white">How it all connects</h2>
            <TopicGraph data={e.graph} title="Knowledge graph" />
          </>
        );
      case "theories":
      case "score":
        return (
          <>
            <h2 className="font-display text-2xl font-black text-white">Every claim, checked</h2>
            <ul className="mt-3 space-y-3">
              {e.claims.map((c) => (
                <li key={c.key} className="rounded-2xl bg-white/[0.06] p-3">
                  <p className="text-[15px] font-semibold text-white">&ldquo;{c.claim}&rdquo;</p>
                  <p className="mt-1 text-sm text-white/75"><b style={{ color: VERDICT[c.verdict].color }}>{VERDICT[c.verdict].label}.</b> {c.explain}</p>
                </li>
              ))}
            </ul>
          </>
        );
      case "claim": {
        const c = p.claim;
        const a = answers[c.key];
        if (a === undefined) {
          return (
            <>
              <h2 className="font-display text-2xl font-black text-white">&ldquo;{c.claim}&rdquo;</h2>
              <p className="mt-3 text-[15px] text-white/80">Make your call first, then read the verdict and every source behind it.</p>
              <div className="mt-4 flex gap-3">
                <button type="button" onClick={() => answer(c.key, false)} className="flex-1 rounded-full bg-white py-3 font-bold text-[#ef4444]">False</button>
                <button type="button" onClick={() => answer(c.key, true)} className="flex-1 rounded-full bg-white py-3 font-bold text-[#16a34a]">True</button>
              </div>
            </>
          );
        }
        return (
          <>
            <h2 className="font-display text-2xl font-black text-white">&ldquo;{c.claim}&rdquo;</h2>
            <p className="mt-3 inline-block rounded-md px-3 py-1 font-display text-lg font-black text-white" style={{ background: VERDICT[c.verdict].color }}>{VERDICT[c.verdict].label}</p>
            <p className="mt-3 text-[15px] leading-relaxed text-white/90">{c.explain}</p>
            {quotes}
            {c.examples.length > 0 && (
              <section className="mt-5">
                <h3 className="text-[13px] font-bold uppercase tracking-wider text-white/60">Posts spreading it</h3>
                <ul className="mt-2 space-y-2">
                  {c.examples.map((x, k) => (
                    <li key={k} className="rounded-xl bg-white/[0.05] p-3 text-sm text-white/85">
                      <span className="mb-1 flex items-center gap-1.5 text-xs text-white/55"><PlatformMark platform={x.platform} size={12} /> {x.who || PLATFORM[x.platform] || x.platform}</span>
                      {x.url ? <a href={x.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{x.text}</a> : x.text}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        );
      }
      case "next":
        return (
          <>
            <h2 className="font-display text-2xl font-black text-white">What happens next</h2>
            <ul className="mt-3 space-y-4">
              {e.watch.map((w) => (
                <li key={w.label} className="border-l-4 border-[#ef4444] pl-3">
                  <p className="font-bold text-white">{w.label}{w.when && <span className="ml-2 text-xs font-normal text-white/55">expected {w.when}</span>}</p>
                  {w.note && <p className="text-sm text-white/70">{w.note}</p>}
                  <p className="mt-1 text-sm text-white/80"><q><mark className="hl hl-b text-black">{w.quote}</mark></q> {w.url && <a href={w.url} target="_blank" rel="noopener noreferrer" className="text-xs text-white/55 underline">{w.author || host(w.url)}</a>}</p>
                </li>
              ))}
            </ul>
          </>
        );
      case "source": {
        const s = p.s;
        return (
          <>
            <h2 className="font-display text-xl font-black leading-snug text-white">{s.title}</h2>
            <p className="mt-2 text-xs text-white/55">
              {[s.views ? `${compact(s.views)} views` : null, s.likes ? `${compact(s.likes)} likes` : null, s.points ? `${compact(s.points)} points` : null, s.comments ? `${compact(s.comments)} comments` : null].filter(Boolean).join(" · ") || `On ${PLATFORM[s.platform] ?? host(s.url)}`}
              {s.transcript ? " · transcript read" : ""}
            </p>
            {s.excerpt && <p className="mt-3 text-[15px] leading-relaxed text-white/90"><q><mark className="hl hl-b text-black">{s.excerpt}</mark></q></p>}
            {s.claims.length > 0 && (
              <section className="mt-5">
                <h3 className="text-[13px] font-bold uppercase tracking-wider text-white/60">Claims in this post</h3>
                <ul className="mt-2 space-y-2">
                  {s.claims.map((sc) => {
                    const c = e.claims.find((x) => x.key === sc.key);
                    return c ? <li key={sc.key} className="rounded-xl bg-white/[0.06] p-3 text-sm text-white/85">&ldquo;{c.claim}&rdquo;: <b style={{ color: VERDICT[sc.verdict].color }}>{VERDICT[sc.verdict].label}.</b> {c.explain}</li> : null;
                  })}
                </ul>
              </section>
            )}
            {s.url && <a href={s.url} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-black">Open on {PLATFORM[s.platform] ?? host(s.url)} <ExternalLink size={14} /></a>}
          </>
        );
      }
      case "end":
        return <h2 className="font-display text-2xl font-black text-white">You&apos;re caught up</h2>;
    }
  };

  const sheet = readPost && (
    <motion.aside
      key={readPost.id}
      role="dialog"
      aria-modal="true"
      aria-label="Read"
      initial={wide ? { opacity: 0, x: 40 } : { y: "100%" }}
      animate={wide ? { opacity: 1, x: 0 } : { y: 0 }}
      exit={wide ? { opacity: 0, x: 40 } : { y: "100%" }}
      transition={{ type: "spring", damping: 32, stiffness: 320 }}
      drag={wide ? false : "y"}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0, bottom: 0.6 }}
      onDragEnd={(_, info) => {
        if (info.offset.y > 120) closeRead();
      }}
      className={wide ? "relative z-30 flex h-full w-[420px] flex-col border-l border-white/10 bg-[#0d0f14]" : "absolute inset-x-0 bottom-0 z-40 flex h-[86%] flex-col rounded-t-3xl bg-[#0d0f14] shadow-2xl"}
    >
      {!wide && <span className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-white/30" aria-hidden="true" />}
      <div className="flex shrink-0 items-center justify-between px-4 pb-2 pt-3">
        <div className="flex min-w-0 items-center gap-2">
          <Avatar a={readPost.author} size={28} />
          <span className="truncate text-sm font-bold text-white">{readPost.author.name}</span>
          {readPost.time && <span className="shrink-0 text-xs text-white/50">· <Ago iso={readPost.time} /></span>}
        </div>
        <button type="button" onClick={closeRead} aria-label="Back to the feed" className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"><Close size={18} /></button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6" onPointerDownCapture={(ev) => ev.stopPropagation()}>
        {sheetBody(readPost)}
      </div>
      <div className="flex shrink-0 gap-2 border-t border-white/10 p-3">
        <button type="button" onClick={closeRead} className="flex-1 rounded-full bg-white/10 py-3 text-sm font-bold text-white hover:bg-white/15">Back to the feed</button>
        <a href={`${page}#${CHAPTERS.find((c) => c.id === readPost.chapter)?.anchor ?? ""}`} className="flex-1 rounded-full bg-white py-3 text-center text-sm font-bold text-black">Read more on the page</a>
      </div>
    </motion.aside>
  );

  const ui = (
    <div className="fixed inset-0 z-[90] flex items-center justify-center overflow-hidden bg-black font-sans text-white" role="dialog" aria-modal="true" aria-label={`Knowledge Graph Feeds: ${e.title}`}>
      <style>{`@keyframes kgf-marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}.kgf-marquee{display:inline-block;padding-right:2rem;animation:kgf-marquee 14s linear infinite}@media (prefers-reduced-motion: reduce){.kgf-marquee{animation:none}}`}</style>
      {/* the desktop backdrop: the post in view, blurred, like Shorts and TikTok on the web */}
      {backdrop && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={backdrop} alt="" aria-hidden="true" className="pointer-events-none absolute inset-0 hidden h-full w-full scale-110 object-cover opacity-30 blur-3xl sm:block" />
      )}
      <div className="relative flex h-full">
        <div ref={column} className="relative h-[100dvh] w-screen overflow-hidden bg-black sm:w-[min(100vw,calc(100dvh*9/16))] sm:max-w-[480px] sm:shadow-2xl">
          {/* top: back to the page, For You and Topics, the story bar */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-30 bg-gradient-to-b from-black/70 to-transparent px-3 pb-8 pt-3">
            <div className="pointer-events-auto flex items-center justify-between">
              <a href={page} aria-label="Back to the full page" className="grid h-9 w-9 place-items-center rounded-full bg-black/40 text-white"><ArrowLeft size={20} /></a>
              <div className="flex items-center gap-5 text-[15px] font-bold">
                <button type="button" onClick={() => setTopics(true)} className="text-white/60 hover:text-white">Topics</button>
                <span className="border-b-2 border-white pb-0.5 text-white">For You</span>
              </div>
              {live ? <span className="rounded bg-[#ef4444] px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">Live</span> : <span className="w-9" />}
            </div>
            <div className="pointer-events-auto mt-3 flex gap-1" role="tablist" aria-label="Chapters">
              {CHAPTERS.map((ch) => {
                const idx = posts.flatMap((p, i) => (p.chapter === ch.id ? [i] : []));
                const done = idx.filter((i) => i < current).length + (chapter === ch.id ? 1 : 0);
                return (
                  <button key={ch.id} type="button" role="tab" aria-selected={chapter === ch.id} aria-label={ch.label} onClick={() => go(idx[0])} className="h-4 min-w-0 flex-1">
                    <span className="block h-[3px] overflow-hidden rounded-full bg-white/30"><span className="block h-full rounded-full bg-white" style={{ width: `${idx.length ? (100 * done) / idx.length : 0}%` }} /></span>
                  </button>
                );
              })}
            </div>
            <p className="mt-0.5 text-[11px] font-semibold text-white/80">{CHAPTERS.find((c) => c.id === chapter)?.label} · {current + 1} of {posts.length}</p>
          </div>

          {/* the feed: one post per screen */}
          <div ref={scroller} onScroll={onScroll} onPointerDown={onPointerDown} onPointerUp={onPointerUp} role="feed" aria-busy="false" className="h-[100dvh] snap-y snap-mandatory overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {posts.map((p, i) => (
              <article key={p.id} id={p.id} aria-posinset={i + 1} aria-setsize={posts.length} aria-label={p.caption} className="relative h-[100dvh] snap-start snap-always overflow-hidden">
                {Math.abs(i - current) <= 2 ? (
                  <>
                    {stage(p, i)}
                    {caption(p)}
                    {rail(p)}
                  </>
                ) : null}
              </article>
            ))}
          </div>

          <AnimatePresence>
            {burst && (
              <motion.span key={burst.k} initial={{ scale: 0.2, opacity: 0.95, rotate: -12 }} animate={{ scale: 1.5, opacity: 0, y: -60 }} transition={{ duration: 0.8 }} onAnimationComplete={() => setBurst(null)} className="pointer-events-none absolute z-40 text-[#ef4444]" style={{ left: burst.x - 40, top: burst.y - 40 }}>
                <Heart size={80} fill="currentColor" strokeWidth={0} />
              </motion.span>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {coach && current === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCoach(false)} className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-5 bg-black/70 text-center">
                <motion.span animate={{ y: [0, -24, 0] }} transition={{ repeat: Infinity, duration: 1.4 }} className="text-5xl" aria-hidden="true">☝</motion.span>
                <p className="font-display text-2xl font-black">Swipe up for the next post</p>
                <p className="max-w-[260px] text-sm text-white/80">Tap a post to read it, double-tap to like, swipe sideways to change chapter.</p>
                <span className="rounded-full bg-white px-5 py-2 text-sm font-bold text-black">Got it</span>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>{!wide && sheet}</AnimatePresence>
          <AnimatePresence>
            {topics && (
              <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 32, stiffness: 320 }} className="absolute inset-0 z-50 flex flex-col bg-[#0d0f14]" role="dialog" aria-label="Topics">
                <div className="flex items-center justify-between px-4 pb-2 pt-4">
                  <p className="font-display text-xl font-black">Topics</p>
                  <button type="button" onClick={() => setTopics(false)} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full bg-white/10"><Close size={18} /></button>
                </div>
                <ul className="flex-1 space-y-3 overflow-y-auto px-4 pb-6">
                  {Object.values(EVENTS).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map((t) => {
                    const thumb = coverOf(t);
                    return (
                      <li key={t.slug}>
                        <a href={`/feeds/${t.slug}`} className="flex gap-3 rounded-2xl bg-white/[0.06] p-3 hover:bg-white/[0.1]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {thumb && <img src={thumb} alt="" className="h-20 w-14 shrink-0 rounded-lg object-cover" />}
                          <span className="min-w-0">
                            <span className="block font-bold leading-snug">{t.title}</span>
                            <span className="mt-1 block text-xs text-white/60">{t.sources.length} sources · {t.claims.length} claims checked</span>
                            {t.slug === slug && <span className="mt-1 inline-block rounded bg-white px-1.5 text-[10px] font-bold text-black">Watching</span>}
                          </span>
                        </a>
                      </li>
                    );
                  })}
                  <li className="pt-2 text-center text-xs text-white/50">More topics as each story is read from every platform.</li>
                  <li className="text-center"><a href="/" className="text-sm font-semibold text-white/80 underline-offset-4 hover:underline">Back to venkatapagadala.com</a></li>
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {toast && (
              <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-black">
                {toast}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        <AnimatePresence>{wide && sheet}</AnimatePresence>
      </div>

      {/* desktop: up and down, like Shorts */}
      <div className="absolute right-6 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-center gap-3 sm:flex">
        <button type="button" onClick={() => go(current - 1)} disabled={current === 0} aria-label="Previous post" className="grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-30"><ChevronUp size={24} /></button>
        <button type="button" onClick={() => go(current + 1)} disabled={current === posts.length - 1} aria-label="Next post" className="grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-30"><ChevronDown size={24} /></button>
      </div>
      <ul className="absolute bottom-6 right-6 z-30 hidden space-y-0.5 text-right text-[11px] text-white/45 xl:block" aria-label="Keyboard shortcuts">
        <li>↑ ↓ next post</li>
        <li>← → chapter</li>
        <li>Enter read</li>
        <li>L like</li>
        <li>Esc close</li>
      </ul>
    </div>
  );
  return createPortal(ui, document.body);
}
