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
 *
 * Tuned by the reader (owner, 2026-10-30): one control per decision. Angles decide what the feed holds, platforms where
 * it comes from, and the Focus dial narrows to one angle for now (a tuner strip on phones, a knob on desktop, with detent
 * clicks). Feed or Swipe, all saved and applied at once. Rendered on the server (no portal), so the feed is the first paint, not the text page beneath it.
 */
import * as React from "react";
import { AnimatePresence, motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import { ArrowLeft, Bookmark, Check, ChevronDown, ChevronUp, ExternalLink, Heart, MessageCircle, Play, Plus, RotateCcw, Search, Share2, SlidersHorizontal, Volume2, VolumeX, X as Close } from "lucide-react";
import { EVENTS, type EventClaim, type EventFact, type EventFile, type EventSourceCard, type Verdict } from "@/data/events";
import { TopicGraph } from "@/components/graph/TopicGraph";
import { Ago, Embed, PlatformMark, who } from "@/components/events/EventSources";
import { coverOf } from "@/components/feeds/cover";
import { Chip, FocusDial, ModeTabs, PanelSection, SwipeTop, SwitchRow, ToggleRow, TopicTuner, ViewToggle, store, useClicks, useWide, type Station } from "@/components/feeds/controls";
import { FeedSearch } from "@/components/feeds/FeedSearch";

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

/** Angles: what a post is about inside one story, so the feed can hold the set someone keeps on, or focus on one (owner, 2026-10-30). Subjects, the story-level taxonomy, sit above these. */
const TOPICS: { id: string; label: string }[] = [
  { id: "live", label: "Live updates" },
  { id: "money", label: "The money" },
  { id: "who", label: "Who did it" },
  { id: "how", label: "How it happened" },
  { id: "customers", label: "Customers" },
  { id: "markets", label: "Markets" },
  { id: "theories", label: "Theories" },
  { id: "official", label: "Official word" },
  { id: "investigators", label: "Investigators" },
  // Every post belongs to an angle the reader can switch off; nothing reaches the feed around their choices.
  { id: "more", label: "More coverage" },
];
/** Words that put a post under a topic. Generic on purpose, so the next story's posts sort without new rules. */
const KEYWORDS: [string, RegExp][] = [
  // "The money" is where it went, not the headline figure every post repeats: frozen, traced, laundered, recovered.
  ["money", /frozen|freez|recover|launder|mixer|tornado|bridg|on-?chain|trac(e|ed|ing)\b|tether|usdt|circle|usdc|stolen funds|wallet address/i],
  ["who", /north korea|lazarus|trader ?traitor|dprk|pyongyang|attribut|state-?sponsored|hacker group/i],
  ["how", /private key|multi-?sig|signer|smart contract|exploit|vulnerab|breach|hot wallet|cold wallet|phish|compromis|laptop|malware|pre-?signed|root cause/i],
  ["customers", /withdraw|deposits?\b|customers?|safu|compensat|reimburs|refund|cover (every|all|the) loss|their money|user funds/i],
  ["markets", /\bprices?\b|sell-?off|dump(ed|ing)?\b|crash|rall(y|ies)|trading (halt|paus)|halted trading|volatil|\bbnb (fell|drop|price)|market cap/i],
];
const topicsOfText = (t: string) => KEYWORDS.filter(([, re]) => re.test(t)).map(([id]) => id);

/** Platforms someone can switch on or off. "Our explainers" are this site's own posts. */
const PLATFORMS: { id: string; label: string }[] = [
  { id: "kgf", label: "Our explainers" },
  { id: "news", label: "News" },
  { id: "x", label: "X" },
  { id: "tiktok", label: "TikTok" },
  { id: "youtube", label: "YouTube" },
  { id: "instagram", label: "Instagram" },
  { id: "reddit", label: "Reddit" },
  { id: "hackernews", label: "Hacker News" },
  { id: "web", label: "Official sites" },
];
const PRESETS: { label: string; ids: string[] }[] = [
  { label: "Everything", ids: [] },
  { label: "Social only", ids: ["x", "tiktok", "youtube", "instagram", "reddit"] },
  { label: "Video only", ids: ["tiktok", "youtube", "instagram"] },
  { label: "News and official", ids: ["kgf", "news", "web"] },
];

type View = "scroll" | "swipe";
interface Prefs {
  /** "all" (For You) or one topic id: what the dial is tuned to. */
  topic: string;
  /** Topics left out of For You. */
  off: string[];
  /** Platforms switched on; empty means all. */
  platforms: string[];
  view: View;
  sound: boolean;
}
const DEFAULT_PREFS: Prefs = { topic: "all", off: [], platforms: [], view: "scroll", sound: true };
const PREFS_KEY = "kgf:prefs";
function readPrefs(): Prefs {
  try {
    const v = JSON.parse(window.localStorage.getItem(PREFS_KEY) || "null");
    return v && typeof v === "object" ? { ...DEFAULT_PREFS, ...v } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}
function writePrefs(p: Prefs) {
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(p));
  } catch {
    /* private mode: the settings last for this visit */
  }
}
/**
 * Runs before the feed paints. Someone arriving with saved settings, or on a link to one post, would otherwise see
 * the default first post for a moment and then a jump: the flicker. The feed body stays hidden (the frame does not)
 * until it is in place.
 */
const PREPAINT = `try{if(!localStorage.getItem("kgf:prefs")&&!localStorage.getItem("kgf:onboarded"))document.documentElement.classList.add("kgf-new");var q=location.search,s=JSON.parse(localStorage.getItem("${"kgf:prefs"}")||"null");if(/[?&](p|chapter|topic|view)=/.test(q)||(s&&((s.topic&&s.topic!=="all")||(s.platforms||[]).length||(s.off||[]).length||s.view==="swipe")))document.documentElement.classList.add("kgf-wait")}catch(e){}`;

type Author = { name: string; handle: string; avatar?: string | null; platform?: string; ours?: boolean; profile?: string | null };
type Evidence = { quote: string; url: string | null; author: string | null };
type Base = { id: string; chapter: Chapter; author: Author; time: string | null; caption: string; tags: string[]; evidence: Evidence[]; image?: string | null; topics?: string[] };
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

/** The opening and closing posts frame every tuned version of the feed. */
const FRAME = new Set<Post["kind"]>(["intro", "end"]);
const platformOf = (p: Post) => (p.kind !== "source" ? "kgf" : p.s.platform === "binance" ? "web" : p.s.platform);
const FACT_TOPIC: Record<string, string> = { impact: "money", counted: "money", frozen: "money", held: "money", users: "customers", access: "customers", markets: "markets", record: "markets", how: "how", keys: "how", who: "who", regulators: "who" };

function topicsFor(p: Post, e: EventFile): string[] {
  const t = new Set<string>();
  const add = (xs: string[]) => xs.forEach((x) => t.add(x));
  switch (p.kind) {
    case "intro":
    case "timeline":
    case "next":
      t.add("live");
      break;
    case "fact":
      p.facts.forEach((f) => (FACT_TOPIC[f.key] ? t.add(FACT_TOPIC[f.key]) : add(topicsOfText(`${f.label} ${f.value} ${f.note ?? ""}`))));
      break;
    case "money":
      t.add("money");
      break;
    case "people":
      t.add("who");
      break;
    case "theories":
    case "score":
      t.add("theories");
      break;
    case "claim":
      t.add("theories");
      add(topicsOfText(p.claim.claim));
      break;
    case "source": {
      const s = p.s;
      if (s.group === "official") add(["official", "live"]);
      if (s.group === "investigators") t.add("investigators");
      if (s.claims.length) t.add("theories");
      s.claims.forEach((sc) => add(topicsOfText(e.claims.find((c) => c.key === sc.key)?.claim ?? "")));
      add(topicsOfText(`${s.title} ${s.excerpt ?? ""}`));
      break;
    }
  }
  return t.size || FRAME.has(p.kind) ? [...t] : ["more"];
}

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
  const list: Post[] = [
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
  return list.map((p) => ({ ...p, topics: topicsFor(p, e) }));
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
function ClaimStage({ c, answer, onAnswer, bare = false }: { c: EventClaim; answer: boolean | undefined; onAnswer: (yes: boolean) => void; bare?: boolean }) {
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
    <div className="flex h-full w-full flex-col items-center justify-center pb-[var(--kgf-bottom)] pl-5 pr-[var(--kgf-rail)] pt-[var(--kgf-top)]" data-no-tap>
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
          {!bare && (
            <>
          <div className="mt-6 flex items-center gap-8">
            <button type="button" onClick={() => onAnswer(false)} aria-label="False" className="grid h-16 w-16 place-items-center rounded-full bg-white text-[#ef4444] shadow-xl ring-1 ring-black/5 transition active:scale-90"><Close size={30} strokeWidth={3} /></button>
            <button type="button" onClick={() => onAnswer(true)} aria-label="True" className="grid h-16 w-16 place-items-center rounded-full bg-white text-[#16a34a] shadow-xl ring-1 ring-black/5 transition active:scale-90"><Check size={30} strokeWidth={3} /></button>
          </div>
          <p className="mt-3 text-xs text-white/60">Swipe right for true, left for false</p>
            </>
          )}
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

/**
 * A platform's mark on a dark disc, so a white brand mark (X) still shows on a chip that is switched on (white). The
 * Hacker News file in public/events/platforms is empty (the icon set has no such slug), so it gets its orange "Y".
 */
const PlatformIcon = ({ id }: { id: string }) => (
  <span aria-hidden="true" className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-black/85 text-white">
    {id === "kgf" ? <span className="text-[10px] leading-none text-[#ef4444]">●</span> : id === "hackernews" ? <span className="grid h-3 w-3 place-items-center rounded-[2px] bg-[#ff6600] text-[8px] font-black leading-none">Y</span> : <PlatformMark platform={id} size={11} />}
  </span>
);

/** One story as a social feed, tuned by topic and platform. `slug` picks the story. */
export function KnowledgeFeed({ slug }: { slug: string }) {
  const e = EVENTS[slug];
  const posts = React.useMemo(() => (e ? buildPosts(e) : []), [e]);
  const wide = useWide();
  const [prefs, setPrefsState] = React.useState<Prefs>(DEFAULT_PREFS);
  const [ready, setReady] = React.useState(false);
  const [live, setLive] = React.useState(false);
  const [current, setCurrent] = React.useState(0);
  const [dir, setDir] = React.useState(1);
  const [answers, setAnswers] = React.useState<Record<string, boolean>>({});
  const [liked, setLiked] = React.useState<string[]>([]);
  const [saved, setSaved] = React.useState<string[]>([]);
  const [following, setFollowing] = React.useState<string[]>([]);
  const [playing, setPlaying] = React.useState<string | null>(null);
  const [read, setRead] = React.useState<string | null>(null);
  const [settings, setSettings] = React.useState(false);
  const [searching, setSearching] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);
  const [announce, setAnnounce] = React.useState("");
  const [burst, setBurst] = React.useState<{ x: number; y: number; k: number } | null>(null);
  const [coach, setCoach] = React.useState<View | null>(null);
  const [onboard, setOnboard] = React.useState(false);
  const [pickTopics, setPickTopics] = React.useState<string[]>([]);
  const [pickPlatforms, setPickPlatforms] = React.useState<string[]>(() => PLATFORMS.map((x) => x.id));
  const [seen, setSeen] = React.useState<string[]>([]);
  const scroller = React.useRef<HTMLDivElement>(null);
  const column = React.useRef<HTMLDivElement>(null);
  const press = React.useRef<{ x: number; y: number; t: number } | null>(null);
  const lastTap = React.useRef<number>(0);
  const single = React.useRef<number | null>(null);
  const lastKey = React.useRef<string | null>(null);
  const page = `/notebook/events/${slug}`;
  const click = useClicks(prefs.sound);
  const view = prefs.view;

  const setPrefs = React.useCallback((patch: Partial<Prefs>) => {
    setPrefsState((p) => {
      const n = { ...p, ...patch };
      writePrefs(n);
      return n;
    });
  }, []);

  // The feed: the story's posts, keeping the platforms switched on, then tuned to one topic or to the topics For You
  // includes. The opening and closing posts frame every version.
  const platformOk = React.useCallback((p: Post) => !prefs.platforms.length || prefs.platforms.includes(platformOf(p)), [prefs.platforms]);
  const inForYou = React.useCallback((p: Post) => (p.topics ?? []).some((t) => !prefs.off.includes(t)), [prefs.off]);
  const feed = React.useMemo(
    () => posts.filter((p) => FRAME.has(p.kind) || (platformOk(p) && (prefs.topic === "all" ? inForYou(p) : (p.topics ?? []).includes(prefs.topic)))),
    [posts, platformOk, inForYou, prefs.topic]
  );
  const feedKey = `${prefs.topic}|${prefs.platforms.join(",")}|${prefs.off.join(",")}`;
  const body = posts.filter((p) => !FRAME.has(p.kind));
  const topicCount = (id: string) => body.filter((p) => platformOk(p) && (p.topics ?? []).includes(id)).length;
  const platformCount = (id: string) => body.filter((p) => platformOf(p) === id && (prefs.topic === "all" ? inForYou(p) : (p.topics ?? []).includes(prefs.topic))).length;
  const seenSet = new Set(seen);
  const seenIn = (test: (p: Post) => boolean) => body.filter((p) => seenSet.has(p.id) && test(p)).length;
  const stations: Station[] = [
    { id: "all", label: "All angles", count: body.filter((p) => platformOk(p) && inForYou(p)).length, seen: seenIn((p) => platformOk(p) && inForYou(p)) },
    // "More coverage" is a catch-all, not something to focus on: it stays in the list, off the dial.
    ...TOPICS.filter((t) => (!prefs.off.includes(t.id) && t.id !== "more") || t.id === prefs.topic)
      .map((t) => ({ ...t, count: topicCount(t.id), seen: seenIn((p) => platformOk(p) && (p.topics ?? []).includes(t.id)) }))
      .filter((t) => t.count > 0 || t.id === prefs.topic),
  ];
  const station = Math.max(0, stations.findIndex((s) => s.id === prefs.topic));
  const tune = (i: number) => setPrefs({ topic: stations[Math.max(0, Math.min(stations.length - 1, i))].id });
  const allIds = PLATFORMS.map((x) => x.id);
  const onPlatforms = prefs.platforms.length ? prefs.platforms : allIds;

  // Saved settings, likes and saves; a link's ?topic= and ?view= apply to this visit without overwriting them.
  React.useEffect(() => {
    if (!e) return;
    setLiked(store.get(`kgf:liked:${slug}`));
    setSaved(store.get(`kgf:saved:${slug}`));
    setFollowing(store.get("kgf:following"));
    setSeen(store.get(`kgf:seen:${slug}`));
    let fresh = false;
    try {
      fresh = !window.localStorage.getItem(PREFS_KEY) && !window.localStorage.getItem("kgf:onboarded");
    } catch {
      /* storage blocked: no picker, the feed opens on everything */
    }
    if (fresh) setOnboard(true);
    const q = new URLSearchParams(window.location.search);
    const t = q.get("topic");
    const v = q.get("view");
    setPrefsState({
      ...readPrefs(),
      ...(t && (t === "all" || TOPICS.some((x) => x.id === t)) ? { topic: t } : {}),
      ...(v === "swipe" || v === "scroll" ? { view: v } : {}),
    });
    const today = new Date().toISOString().slice(0, 10);
    setLive(today >= e.window[0] && today <= e.window[1]);
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // Once the settings are in: lock the page behind the feed, go to the linked post, then show the feed.
  React.useEffect(() => {
    if (!ready) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const q = new URLSearchParams(window.location.search);
    const p = q.get("p");
    const ch = q.get("chapter");
    const start = p ? feed.findIndex((x) => x.id === p) : ch ? feed.findIndex((x) => x.chapter === ch) : -1;
    lastKey.current = feedKey;
    const reveal = () => document.documentElement.classList.remove("kgf-wait", "kgf-new");
    if (start > 0) {
      setCurrent(start);
      requestAnimationFrame(() => {
        const el = scroller.current;
        if (el) el.scrollTo({ top: start * el.clientHeight, behavior: "auto" });
        requestAnimationFrame(reveal);
      });
    } else requestAnimationFrame(reveal);
    return () => {
      document.body.style.overflow = prev;
      reveal();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // New settings, new feed: back to its first post, and say so for screen readers.
  React.useEffect(() => {
    if (!ready || lastKey.current === null || lastKey.current === feedKey) return;
    lastKey.current = feedKey;
    setCurrent(0);
    setDir(1);
    setPlaying(null);
    scroller.current?.scrollTo({ top: 0, behavior: "auto" });
    setAnnounce(`${prefs.topic === "all" ? "All angles" : TOPICS.find((t) => t.id === prefs.topic)?.label}: ${feed.length} posts`);
  }, [feedKey, ready, feed.length, prefs.topic]);

  // The address keeps the place and the tuning, so back from the full page lands here and a link can be shared.
  React.useEffect(() => {
    if (!ready) return;
    const url = new URL(window.location.href);
    url.searchParams.delete("chapter");
    const id = feed[current]?.id;
    if (id && current > 0) url.searchParams.set("p", id);
    else url.searchParams.delete("p");
    if (prefs.topic === "all") url.searchParams.delete("topic");
    else url.searchParams.set("topic", prefs.topic);
    if (view === "swipe") url.searchParams.set("view", "swipe");
    else url.searchParams.delete("view");
    if (url.href !== window.location.href) window.history.replaceState(window.history.state, "", url);
  }, [ready, current, feed, prefs.topic, view]);

  // Switching back to the scrolling feed lands on the card the swipe view was on.
  React.useEffect(() => {
    if (!ready || view !== "scroll") return;
    requestAnimationFrame(() => {
      const el = scroller.current;
      if (el) el.scrollTo({ top: current * el.clientHeight, behavior: "auto" });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  // A first-time hint for each view, once.
  React.useEffect(() => {
    if (!ready || onboard) return;
    const shown = store.get("kgf:coach");
    if (!shown.includes(view)) {
      setCoach(view);
      store.set("kgf:coach", [...shown, view]);
    }
  }, [ready, view, onboard]);

  // What has been read in this story: the tuner shows progress per topic, so a reader can finish one and move on.
  React.useEffect(() => {
    if (!ready || onboard) return;
    const id = feed[current]?.id;
    if (!id || seen.includes(id)) return;
    const next = [...seen, id];
    setSeen(next);
    store.set(`kgf:seen:${slug}`, next);
  }, [ready, onboard, current, feed, seen, slug]);

  const go = React.useCallback(
    (i: number, behavior: ScrollBehavior = "smooth") => {
      const n = Math.max(0, Math.min(feed.length - 1, i));
      if (view === "swipe") {
        setDir(n >= current ? 1 : -1);
        setCurrent(n);
        setPlaying(null);
        return;
      }
      const el = scroller.current;
      if (!el) return;
      const top = n * el.clientHeight;
      el.scrollTo({ top, behavior });
      // a smooth scroll that stalls (a busy tab, a throttled frame) must never leave the feed between two posts
      window.setTimeout(() => {
        if (Math.abs(el.scrollTop - top) > 2) el.scrollTo({ top, behavior: "auto" });
      }, 650);
    },
    [feed.length, view, current]
  );

  // The post in view is the scroll position over the screen height (every post is exactly one screen tall).
  const onScroll = (ev: React.UIEvent<HTMLDivElement>) => {
    const el = ev.currentTarget;
    const i = Math.max(0, Math.min(feed.length - 1, Math.round(el.scrollTop / Math.max(1, el.clientHeight))));
    if (i === current) return;
    setCurrent(i);
    setPlaying(null);
    setCoach(null);
  };

  // Reading opens a history entry, so the phone's back gesture closes the sheet and returns to the feed.
  const openRead = React.useCallback((id: string) => {
    setRead(id);
    window.history.pushState({ ...(window.history.state ?? {}), kgfRead: id }, "", window.location.href);
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
  const chapters = CHAPTERS.filter((ch) => feed.some((p) => p.chapter === ch.id));
  const jumpChapter = (d: 1 | -1) => {
    const ci = chapters.findIndex((c) => c.id === feed[current]?.chapter);
    const next = chapters[Math.max(0, Math.min(chapters.length - 1, ci + d))];
    if (next) go(feed.findIndex((p) => p.chapter === next.id));
  };
  const answer = (key: string, yes: boolean) => setAnswers((a) => ({ ...a, [key]: yes }));

  // Swipe view: right likes, left skips; on a claim not yet called, right is true and left is false.
  const swipe = (d: 1 | -1) => {
    const p = feed[current];
    if (!p) return;
    if (p.kind === "claim" && answers[p.claim.key] === undefined) {
      answer(p.claim.key, d === 1);
      click("pick");
      return;
    }
    if (d === 1) like(p, true);
    click("tick");
    if (current < feed.length - 1) {
      setDir(d);
      setCurrent(current + 1);
      setPlaying(null);
    }
  };
  const togglePlatform = (id: string) => {
    const next = onPlatforms.includes(id) ? onPlatforms.filter((x) => x !== id) : [...onPlatforms, id];
    if (!next.length) {
      say("Keep at least one platform on");
      click("stop");
      return;
    }
    click("tick");
    setPrefs({ platforms: next.length === allIds.length ? [] : next });
  };
  const toggleTopic = (id: string) => {
    const off = prefs.off.includes(id) ? prefs.off.filter((x) => x !== id) : [...prefs.off, id];
    if (off.length === TOPICS.length) {
      say("Keep at least one angle on");
      click("stop");
      return;
    }
    click("tick");
    setPrefs({ off, topic: "all" });
  };

  // Scrolling feed: tap to read, double-tap to like, swipe sideways to change chapter (a claim takes sideways itself).
  const onPointerDown = (ev: React.PointerEvent) => {
    press.current = (ev.target as HTMLElement).closest("button,a,iframe,input,[data-no-tap]") ? null : { x: ev.clientX, y: ev.clientY, t: Date.now() };
  };
  const onPointerUp = (ev: React.PointerEvent) => {
    const d = press.current;
    press.current = null;
    if (!d) return;
    const p = feed[current];
    if (!p) return;
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
      if ((ev.target as HTMLElement | null)?.closest?.("[role=slider],input,textarea")) return;
      if (onboard || searching) return;
      if (ev.key === "/" && !read && !settings) {
        ev.preventDefault();
        setSearching(true);
        return;
      }
      if (read || settings) {
        if (ev.key === "Escape") {
          if (read) closeRead();
          else setSettings(false);
        }
        return;
      }
      const p = feed[current];
      if (!p) return;
      const open = p.kind === "claim" && answers[p.claim.key] === undefined;
      if (view === "swipe") {
        if (ev.key === "ArrowRight") swipe(1);
        else if (ev.key === "ArrowLeft") swipe(-1);
        else if (ev.key === "ArrowUp" || ev.key === "Backspace") go(current - 1);
        else if (ev.key === "Enter" || ev.key === "r") openRead(p.id);
        else return;
      } else if (ev.key === "ArrowDown" || ev.key === "j") go(current + 1);
      else if (ev.key === "ArrowUp" || ev.key === "k") go(current - 1);
      else if (open && (ev.key === "ArrowRight" || ev.key === "ArrowLeft")) answer(p.claim.key, ev.key === "ArrowRight");
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

  if (!e) return null;
  const post = feed[current] ?? feed[0];
  const chapter = post?.chapter ?? "happened";
  const answered = e.claims.filter((c) => answers[c.key] !== undefined);
  const correct = answered.filter((c) => (answers[c.key] ? c.verdict === "true" : c.verdict === "false" || c.verdict === "misleading")).length;
  const readPost = read ? posts.find((p) => p.id === read) ?? null : null;
  const backdrop = post?.image ?? feed[0]?.image ?? null;
  const filtered = prefs.platforms.length > 0;

  const stage = (p: Post, i: number) => {
    switch (p.kind) {
      case "intro":
        return (
          <div className="relative h-full w-full" style={{ background: DARK }}>
            {p.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30 blur-[2px]" />
            )}
            <div className="relative flex h-full flex-col justify-center pb-[var(--kgf-bottom)] pl-6 pr-[var(--kgf-rail)] pt-[var(--kgf-top)]">
              {live && <span className="mb-3 inline-flex w-fit items-center gap-1.5 rounded bg-[#ef4444] px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-white"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> Live</span>}
              <h2 className="font-display text-[40px] font-black leading-[1.02] text-white">{e.title}</h2>
              <p className="mt-4 text-base leading-snug text-white/85"><mark className="hl hl-y text-black">{p.caption}</mark></p>
            </div>
          </div>
        );
      case "timeline":
        return (
          <div className="h-full w-full pb-[var(--kgf-bottom)] pl-5 pr-[var(--kgf-rail)] pt-[var(--kgf-top)]" style={{ background: DARK }}>
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
          <div className="flex h-full w-full flex-col justify-center pb-[var(--kgf-bottom)] pl-6 pr-[var(--kgf-rail)] pt-[var(--kgf-top)]" style={{ background: TONE[p.facts[0].status] ?? DARK }}>
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
          <div className="flex h-full w-full flex-col justify-center px-6 pb-[var(--kgf-bottom)] pt-[var(--kgf-top)]" style={{ background: DARK }}>
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
          <div className="flex h-full w-full flex-col justify-center pb-[var(--kgf-bottom)] pl-5 pr-[var(--kgf-rail)] pt-[var(--kgf-top)]" style={{ background: DARK }}>
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
          <div className="relative flex h-full w-full flex-col items-center justify-center px-6 pb-[var(--kgf-bottom)] pt-[var(--kgf-top)] text-center" style={{ background: DARK }}>
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
          <div className="flex h-full w-full flex-col items-center justify-center px-6 pb-[var(--kgf-bottom)] pt-[var(--kgf-top)] text-center" style={{ background: DARK }}>
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
            <ClaimStage c={p.claim} answer={answers[p.claim.key]} onAnswer={(yes) => answer(p.claim.key, yes)} bare={view === "swipe"} />
          </div>
        );
      case "score":
        return (
          <div className="flex h-full w-full flex-col items-center justify-center px-6 pb-[var(--kgf-bottom)] pt-[var(--kgf-top)] text-center" style={{ background: DARK }}>
            <p className="text-[12px] font-bold uppercase tracking-wider text-white/70">Your round</p>
            <p className="mt-2 font-display text-[72px] font-black leading-none text-white">{correct}<span className="text-white/35">/{answered.length || e.claims.length}</span></p>
            <p className="mt-3 text-sm text-white/75">{answered.length ? "called right, counting misleading claims as false" : "Swipe back up to play the round."}</p>
          </div>
        );
      case "next":
        return (
          <div className="flex h-full w-full flex-col justify-center px-6 pb-[var(--kgf-bottom)] pt-[var(--kgf-top)]" style={{ background: DARK }}>
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
              <div className="absolute inset-0 flex items-center pb-[var(--kgf-bottom)] pl-4 pr-[var(--kgf-rail)] pt-[var(--kgf-top)]" style={{ background: DARK }}>
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
            {s.views ? <span className="absolute left-3 top-[var(--kgf-chip)] rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white">▶ {compact(s.views)} views</span> : null}
          </div>
        );
      }
      case "end":
        return (
          <div className="flex h-full w-full flex-col items-center justify-center px-6 pb-[var(--kgf-bottom)] pt-[var(--kgf-top)] text-center" style={{ background: DARK }}>
            <p className="font-display text-3xl font-black text-white">{prefs.topic === "all" ? "You're caught up" : `You've finished ${stations[station]?.label}`}</p>
            <p className="mt-2 text-sm text-white/75">{prefs.topic === "all" ? `Every post you picked, ${feed.length} in all.` : `${feed.length} posts on this angle, every one with its sources.`}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {stations[station + 1] && (
                <button type="button" onClick={() => { click("pick"); tune(station + 1); }} className="rounded-full bg-[#ef4444] px-5 py-2.5 text-sm font-bold text-white">
                  Next angle: {stations[station + 1].label}
                </button>
              )}
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
      <div className="absolute bottom-28 right-2 z-20 flex flex-col items-center gap-4 [filter:drop-shadow(0_1px_3px_rgba(0,0,0,0.9))]" data-no-tap>
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

  const caption = (p: Post, compact = false) => (
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
      {!compact && <p className="mt-1 truncate text-[13px] font-semibold text-white">{p.tags.join(" ")}</p>}
      {!compact && p.evidence.length > 0 && (
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

  const changed = (prefs.off.length ? 1 : 0) + (prefs.platforms.length ? 1 : 0) + (prefs.topic !== "all" ? 1 : 0);
  const header = (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-30 bg-gradient-to-b from-black/85 via-black/55 to-transparent pb-5 pt-3">
      <div className="pointer-events-auto flex items-center justify-between gap-1.5 px-2.5">
        <a href={page} aria-label="Back to the full page" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-black/40 text-white max-[349px]:hidden"><ArrowLeft size={20} /></a>
        <ModeTabs mode="news" />
        <ViewToggle view={view} onChange={(v) => { click("pick"); setPrefs({ view: v }); }} />
        <button type="button" onClick={() => setSearching(true)} aria-label="Search" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-black/40 text-white"><Search size={18} /></button>
        <button type="button" onClick={() => setSettings(true)} aria-label={`Tune your feed${changed ? `: ${changed} changed` : ""}`} className="flex h-9 shrink-0 items-center gap-1 rounded-full bg-black/40 px-2.5 text-[13px] font-bold text-white lg:hidden">
          <SlidersHorizontal size={16} />
          {changed > 0 && <span className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[#ef4444] px-1 text-[11px] font-bold text-white">{changed}</span>}
        </button>
      </div>
      <div className="pointer-events-auto mt-2">
        <TopicTuner items={stations} index={station} onPick={tune} click={click} onEdit={() => setSettings(true)} editLabel="+ Angles" label="Angles in this story: drag to focus the feed" />
      </div>
      {filtered && (
        <button type="button" onClick={() => setSettings(true)} className="pointer-events-auto mx-3 mt-1.5 inline-flex max-w-[calc(100%-1.5rem)] items-center gap-1.5 overflow-hidden rounded-full bg-white/15 px-3 py-1 text-[12px] font-semibold text-white">
          <span className="flex shrink-0 items-center gap-1">{onPlatforms.slice(0, 5).map((id) => <PlatformIcon key={id} id={id} />)}</span>
          <span className="truncate">{onPlatforms.length} of {PLATFORMS.length} platforms · Change</span>
        </button>
      )}
      <div className="pointer-events-auto mt-2 px-3">
        {view === "scroll" ? (
          <>
            <div className="flex gap-1" role="tablist" aria-label="Chapters">
              {chapters.map((ch) => {
                const idx = feed.flatMap((p, i) => (p.chapter === ch.id ? [i] : []));
                const done = idx.filter((i) => i < current).length + (chapter === ch.id ? 1 : 0);
                return (
                  <button key={ch.id} type="button" role="tab" aria-selected={chapter === ch.id} aria-label={ch.label} onClick={() => go(idx[0])} className="h-3 min-w-0 flex-1">
                    <span className="block h-[3px] overflow-hidden rounded-full bg-white/30">
                      <span className="block h-full rounded-full bg-white" style={{ width: `${idx.length ? (100 * done) / idx.length : 0}%` }} />
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-0.5 text-[11px] font-semibold text-white/80">{CHAPTERS.find((c) => c.id === chapter)?.label} · {current + 1} of {feed.length}</p>
          </>
        ) : (
          <p className="text-[11px] font-semibold text-white/80">Card {current + 1} of {feed.length}</p>
        )}
      </div>
    </div>
  );

  const scrollView = (
    <div ref={scroller} onScroll={onScroll} onPointerDown={onPointerDown} onPointerUp={onPointerUp} role="feed" aria-busy={!ready} className="kgf-body h-[100dvh] snap-y snap-mandatory overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {feed.map((p, i) => (
        <article key={p.id} id={p.id} aria-posinset={i + 1} aria-setsize={feed.length} aria-label={p.caption} className="relative h-[100dvh] snap-start snap-always overflow-hidden">
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
  );

  const claimOpen = post?.kind === "claim" && answers[post.claim.key] === undefined;
  const swipeView = (
    <div className={`kgf-body absolute inset-x-0 bottom-0 ${filtered ? "top-[184px]" : "top-[150px]"} px-3 pb-28`} style={{ "--kgf-top": "32px", "--kgf-bottom": "168px", "--kgf-chip": "14px", "--kgf-rail": "20px" } as React.CSSProperties}>
      <div className="relative h-full">
        {feed[current + 1] && (
          <div className="absolute inset-0 translate-y-3 scale-[0.94] overflow-hidden rounded-[28px] opacity-60" aria-hidden="true">
            {stage(feed[current + 1], current + 1)}
          </div>
        )}
        <AnimatePresence initial={false} custom={dir}>
          {post && (
            <SwipeTop key={post.id} dir={dir} canDrag={!claimOpen} onSwipe={swipe} onTap={() => openRead(post.id)}>
              {stage(post, current)}
              {caption(post, true)}
            </SwipeTop>
          )}
        </AnimatePresence>
      </div>
      <div className="absolute inset-x-0 bottom-5 flex items-center justify-center gap-4" data-no-tap>
        <button type="button" onClick={() => go(current - 1)} disabled={current === 0} aria-label="Back one card" className="grid h-12 w-12 place-items-center rounded-full bg-white/10 text-[#facc15] disabled:opacity-30">
          <RotateCcw size={20} />
        </button>
        <button type="button" onClick={() => swipe(-1)} disabled={!claimOpen && current >= feed.length - 1} aria-label={claimOpen ? "False" : "Skip"} className="grid h-16 w-16 place-items-center rounded-full bg-white text-[#64748b] shadow-xl transition active:scale-90 disabled:opacity-30">
          <Close size={30} strokeWidth={3} className={claimOpen ? "text-[#ef4444]" : ""} />
        </button>
        <button type="button" onClick={() => swipe(1)} disabled={!claimOpen && current >= feed.length - 1} aria-label={claimOpen ? "True" : "Like and next"} className="grid h-16 w-16 place-items-center rounded-full bg-white shadow-xl transition active:scale-90 disabled:opacity-30">
          {claimOpen ? <Check size={30} strokeWidth={3} className="text-[#16a34a]" /> : <Heart size={28} fill="#ef4444" strokeWidth={0} />}
        </button>
        <button type="button" onClick={() => post && openRead(post.id)} aria-label="Read" className="grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white">
          <MessageCircle size={20} />
        </button>
      </div>
    </div>
  );

  // The Topics and Platforms lists, one block for the panel beside the feed (lg and up) and the sheet (phones, tablets).
  const matchCount = feed.filter((p) => !FRAME.has(p.kind)).length;
  // The story these topics belong to. One today; when there are more, this becomes the story switcher.
  const storyCover = coverOf(e);
  const primarySubject = (e.subjects ?? []).find((t) => t.role === "primary");
  const storyCard = (
    <a href={page} className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.04] p-2.5 transition-colors hover:bg-white/[0.07]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {storyCover && <img src={storyCover} alt="" width={48} height={48} className="h-12 w-12 shrink-0 rounded-lg object-cover" />}
      <span className="min-w-0">
        <span className="block text-[10px] font-semibold uppercase tracking-wider text-white/45">Story{live ? " · Live" : ""}</span>
        <span className="line-clamp-2 block text-[14px] font-bold leading-snug text-white">{e.title}</span>
        <span className="block text-[11px] text-white/50">{e.sources.length} sources · {e.claims.length} claims checked</span>
        {primarySubject && <span className="mt-0.5 block truncate text-[11px] text-white/40" title={primarySubject.path.join(" > ")}>{primarySubject.path.slice(-2).join(" › ")}</span>}
      </span>
    </a>
  );
  const focused = prefs.topic !== "all";
  const focusStation = stations[station];
  const summary = (
    <div aria-live="polite" className="rounded-2xl border border-white/[0.07] bg-[#15151a] p-4">
      <p className="flex items-baseline gap-2"><span className="font-display text-[40px] font-bold leading-none tracking-tight text-white">{matchCount}</span><span className="text-[14px] text-white/80">posts in your feed</span></p>
      <div className="mt-2.5 flex flex-wrap gap-1.5 text-[12px] font-semibold text-white/90">
        <span className="rounded-full bg-white/[0.08] px-2.5 py-1">{TOPICS.length - prefs.off.length} of {TOPICS.length} angles</span>
        <span className="rounded-full bg-white/[0.08] px-2.5 py-1">{onPlatforms.length} of {PLATFORMS.length} platforms</span>
      </div>
      {focused && (
        <div className="mt-2.5 flex items-center justify-between gap-2 rounded-xl border border-[#ef4444]/40 bg-[#ef4444]/10 py-1.5 pl-3 pr-1.5">
          <span className="min-w-0 truncate text-[13px] text-white">Focus: <b>{focusStation?.label}</b></span>
          <button type="button" onClick={() => { click("tick"); setPrefs({ topic: "all" }); }} className="min-h-[36px] shrink-0 rounded-full bg-white/[0.12] px-3 text-[12px] font-semibold text-white">Show all</button>
        </div>
      )}
    </div>
  );
  const searchBox = (
    <button type="button" onClick={() => setSearching(true)} className="flex min-h-[42px] w-full items-center gap-2 rounded-xl border border-white/[0.12] bg-[#15151a] px-3 text-left text-[14px] text-white/65 hover:bg-white/[0.07]">
      <Search size={16} aria-hidden="true" /> Search topics, videos, books, news
    </button>
  );
  const focusDial = (
    <section aria-label="Focus on one angle" className="px-2">
      <p className="mb-1.5 flex items-baseline justify-between text-[12px] font-semibold uppercase tracking-wider text-white/65">Focus <span className="text-[11px] font-normal normal-case tracking-normal text-white/55">Optional</span></p>
      <FocusDial items={stations} index={station} onPick={tune} click={click} meta={focused ? `${focusStation?.count ?? 0} posts${focusStation?.seen ? ` · ${focusStation.seen} seen` : ""} · only this angle` : "Turn to focus on one angle. More coverage stays in the list."} />
    </section>
  );
  const lists = (k: string) => (
    <>
      <PanelSection id={`${k}-topics`} title="Angles" hint="what you want to know" summary={`${TOPICS.length - prefs.off.length} of ${TOPICS.length} on`}>
        <ul>
          {TOPICS.map((t) => (
            <ToggleRow
              key={t.id}
              checked={!prefs.off.includes(t.id)}
              label={t.label}
              count={topicCount(t.id)}
              seen={seenIn((p) => platformOk(p) && (p.topics ?? []).includes(t.id))}
              focused={prefs.topic === t.id}
              dim={focused && prefs.topic !== t.id}
              onToggle={() => toggleTopic(t.id)}
              onOnly={() => { click("pick"); setPrefs({ off: TOPICS.map((x) => x.id).filter((id) => id !== t.id), topic: "all" }); }}
            />
          ))}
        </ul>
      </PanelSection>
      <PanelSection id={`${k}-platforms`} title="Platforms" hint="where it comes from" summary={`${onPlatforms.length} of ${PLATFORMS.length} on`}>
        <div className="mb-1.5 flex flex-wrap gap-1.5 px-2">
          {PRESETS.map((pr) => {
            const on = pr.ids.length ? pr.ids.length === onPlatforms.length && pr.ids.every((x) => onPlatforms.includes(x)) : !prefs.platforms.length;
            return (
              <button key={pr.label} type="button" aria-pressed={on} onClick={() => { click("pick"); setPrefs({ platforms: pr.ids }); }} className={`rounded-full px-2.5 py-1.5 text-[12px] font-semibold transition ${on ? "bg-white text-black" : "bg-white/[0.08] text-white/80 hover:bg-white/15"}`}>
                {pr.label}
              </button>
            );
          })}
        </div>
        <ul>
          {PLATFORMS.map((pl) => (
            <SwitchRow
              key={pl.id}
              id={`${k}-pl-${pl.id}`}
              on={onPlatforms.includes(pl.id)}
              label={pl.label}
              icon={<PlatformIcon id={pl.id} />}
              count={platformCount(pl.id)}
              onToggle={() => togglePlatform(pl.id)}
              onOnly={() => { click("pick"); setPrefs({ platforms: [pl.id] }); }}
            />
          ))}
        </ul>
      </PanelSection>
    </>
  );

  // Beside the feed from lg (landscape tablets up); while reading below xl the panel steps aside for the reader.
  const deck = (
    <aside className={`h-full w-[340px] shrink-0 flex-col gap-5 overflow-y-auto border-r border-white/[0.06] px-3 py-5 ${readPost ? "hidden xl:flex" : "hidden lg:flex"}`} aria-label="Tune your feed">
      <div className="flex items-start justify-between gap-3 px-2">
        <div>
          <h2 className="font-display text-[22px] font-bold leading-tight text-white">Tune your feed</h2>
          <p className="mt-0.5 text-[13px] text-white/70">Only what you pick reaches your feed.</p>
        </div>
        <button type="button" onClick={() => setPrefs({ sound: !prefs.sound })} aria-pressed={prefs.sound} aria-label={prefs.sound ? "Dial clicks on" : "Dial clicks off"} className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/[0.12] text-white/80 hover:bg-white/10">
          {prefs.sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
      </div>
      <div className="space-y-3 px-2">
        {summary}
        {searchBox}
        {storyCard}
      </div>
      {focusDial}
      {lists("deck")}
      <button type="button" onClick={() => { click("stop"); setPrefs({ ...DEFAULT_PREFS, sound: prefs.sound, view }); }} className="self-start px-2 text-[13px] font-semibold text-white/70 hover:text-white">
        Reset to everything
      </button>
    </aside>
  );

  const settingsSheet = (
    <AnimatePresence>
      {settings && (
        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 32, stiffness: 320 }} className="absolute inset-0 z-50 flex flex-col bg-[#0d0f14]" role="dialog" aria-modal="true" aria-label="Tune your feed">
          <div className="flex items-center justify-between gap-2 px-4 pb-2 pt-4">
            <p className="font-display text-xl font-black">Tune your feed</p>
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={() => setPrefs({ sound: !prefs.sound })} aria-pressed={prefs.sound} aria-label={prefs.sound ? "Dial clicks on" : "Dial clicks off"} className="grid h-11 w-11 place-items-center rounded-full border border-white/[0.12] text-white/80">{prefs.sound ? <Volume2 size={18} /> : <VolumeX size={18} />}</button>
              <button type="button" onClick={() => setSettings(false)} className="min-h-[44px] rounded-full bg-white px-4 text-sm font-bold text-black">Done</button>
            </div>
          </div>
          <div className="flex-1 space-y-5 overflow-y-auto px-4 pb-8">
            {summary}
            {storyCard}
            <div className="-mx-2">{focusDial}</div>
            <div className="-mx-2 space-y-4">{lists("sheet")}</div>
            <section>
              <h3 className="mb-2 text-[12px] font-bold uppercase tracking-wider text-white/55">Stories</h3>
              <ul className="space-y-3">
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
                <li className="pt-1 text-center text-xs text-white/50">More stories as each one is read from every platform.</li>
              </ul>
            </section>
            <button
              type="button"
              onClick={() => {
                setPickTopics(TOPICS.map((t) => t.id).filter((id) => !prefs.off.includes(id)));
                setPickPlatforms(onPlatforms);
                setSettings(false);
                setOnboard(true);
              }}
              className="w-full rounded-full bg-white/10 py-3 text-sm font-bold text-white hover:bg-white/15"
            >
              Pick angles and platforms again
            </button>
            <div className="flex items-center justify-between pt-2">
              <button type="button" onClick={() => { click("stop"); setPrefs({ ...DEFAULT_PREFS, sound: prefs.sound }); }} className="text-sm font-semibold text-white/60 underline-offset-4 hover:underline">Reset to everything</button>
              <a href="/" className="text-sm font-semibold text-white/60 underline-offset-4 hover:underline">venkatapagadala.com</a>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // First visit: ask what to learn and from where, before any post. The feed then shows only that.
  const pickedMatch = body.filter((p) => pickPlatforms.includes(platformOf(p)) && (p.topics ?? []).some((t) => pickTopics.includes(t))).length;
  const finishPicking = (everything: boolean) => {
    try {
      window.localStorage.setItem("kgf:onboarded", "1");
    } catch {
      /* private mode: the picker may return next visit */
    }
    if (everything) setPrefs({ topic: "all", off: [], platforms: [] });
    else setPrefs({ topic: "all", off: TOPICS.map((t) => t.id).filter((id) => !pickTopics.includes(id)), platforms: pickPlatforms.length === PLATFORMS.length ? [] : pickPlatforms });
    click("pick");
    setOnboard(false);
    document.documentElement.classList.remove("kgf-new");
  };
  const picker = (
    <div className="kgf-onboard absolute inset-0 z-[60] flex-col bg-[#0b0d12]" data-open={onboard ? "true" : "false"} role="dialog" aria-modal="true" aria-label="What do you want to learn?">
      <div className="flex-1 overflow-y-auto px-5 pb-6 pt-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#ef4444]">Knowledge Graph Feeds</p>
        <h2 className="mt-2 font-display text-3xl font-black leading-tight">What do you want to learn?</h2>
        <div className="mt-4">{storyCard}</div>
        <p className="mt-4 text-sm text-white/70">Pick the angles you want on this story. Your feed shows only these, never random posts.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {TOPICS.map((t) => (
            <Chip key={t.id} on={pickTopics.includes(t.id)} count={topicCount(t.id)} onClick={() => { click("tick"); setPickTopics((x) => (x.includes(t.id) ? x.filter((y) => y !== t.id) : [...x, t.id])); }}>
              {t.label}
            </Chip>
          ))}
        </div>
        <h3 className="mt-7 font-display text-xl font-black">From where?</h3>
        <p className="mt-1 text-sm text-white/70">Keep the platforms you want to learn from: one, four, or all of them.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {PLATFORMS.map((pl) => (
            <Chip
              key={pl.id}
              on={pickPlatforms.includes(pl.id)}
              onClick={() => {
                const next = pickPlatforms.includes(pl.id) ? pickPlatforms.filter((y) => y !== pl.id) : [...pickPlatforms, pl.id];
                if (!next.length) {
                  say("Keep at least one platform");
                  return;
                }
                click("tick");
                setPickPlatforms(next);
              }}
            >
              <PlatformIcon id={pl.id} /> {pl.label}
            </Chip>
          ))}
        </div>
      </div>
      <div className="border-t border-white/10 p-4">
        <button type="button" disabled={!pickTopics.length || !pickedMatch} onClick={() => finishPicking(false)} className="w-full rounded-full bg-white py-3.5 text-[15px] font-black text-black disabled:opacity-40">
          {!pickTopics.length ? "Pick at least one angle" : pickedMatch ? `Start learning: ${pickedMatch} posts` : "No posts match yet: add an angle or platform"}
        </button>
        <button type="button" onClick={() => finishPicking(true)} className="mt-2 w-full py-2 text-sm font-semibold text-white/60 hover:text-white">Show me everything</button>
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center overflow-hidden bg-black font-sans text-white"
      role="dialog"
      aria-modal="true"
      aria-label={`Knowledge Graph Feeds: ${e.title}`}
      style={{ "--kgf-top": "172px", "--kgf-bottom": "176px", "--kgf-chip": "172px", "--kgf-rail": "64px" } as React.CSSProperties}
    >
      <script dangerouslySetInnerHTML={{ __html: PREPAINT }} />
      <style>{`@keyframes kgf-marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}.kgf-marquee{display:inline-block;padding-right:2rem;animation:kgf-marquee 14s linear infinite}@media (prefers-reduced-motion: reduce){.kgf-marquee{animation:none}}.kgf-wait .kgf-body{visibility:hidden}.kgf-onboard{display:none}.kgf-new .kgf-onboard,.kgf-onboard[data-open=true]{display:flex}`}</style>
      {/* the desktop backdrop: the post in view, blurred, like Shorts and TikTok on the web */}
      {backdrop && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={backdrop} alt="" aria-hidden="true" className="pointer-events-none absolute inset-0 hidden h-full w-full scale-110 object-cover opacity-30 blur-3xl sm:block" />
      )}
      <div className="relative flex h-full">
        {deck}
        <div ref={column} className="relative h-[100dvh] w-screen overflow-hidden bg-black sm:w-[min(100vw,calc(100dvh*9/16))] sm:max-w-[480px] sm:shadow-2xl">
          {header}
          {view === "scroll" ? scrollView : swipeView}
          <AnimatePresence>
            {burst && (
              <motion.span key={burst.k} initial={{ scale: 0.2, opacity: 0.95, rotate: -12 }} animate={{ scale: 1.5, opacity: 0, y: -60 }} transition={{ duration: 0.8 }} onAnimationComplete={() => setBurst(null)} className="pointer-events-none absolute z-40 text-[#ef4444]" style={{ left: burst.x - 40, top: burst.y - 40 }}>
                <Heart size={80} fill="currentColor" strokeWidth={0} />
              </motion.span>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {coach && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCoach(null)} className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-black/75 px-8 text-center">
                <motion.span animate={coach === "swipe" ? { x: [0, 36, 0, -36, 0] } : { y: [0, -24, 0] }} transition={{ repeat: Infinity, duration: 1.6 }} className="text-5xl" aria-hidden="true">☝</motion.span>
                <p className="font-display text-2xl font-black">{coach === "swipe" ? "Swipe right to like, left to skip" : "Swipe up for the next post"}</p>
                <p className="max-w-[280px] text-sm text-white/80">
                  {coach === "swipe" ? "Tap a card to read it. On a claim, right means true and left means false." : "Tap a post to read it, double-tap to like. Drag the strip at the top to focus on one angle."}
                </p>
                <span className="rounded-full bg-white px-5 py-2 text-sm font-bold text-black">Got it</span>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>{!wide && sheet}</AnimatePresence>
          {settingsSheet}
          {picker}
          <AnimatePresence>
            {toast && (
              <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute bottom-24 left-1/2 z-[70] -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-black">
                {toast}
              </motion.p>
            )}
          </AnimatePresence>
          <p className="sr-only" aria-live="polite">{announce}</p>
        </div>
        <AnimatePresence>{wide && sheet}</AnimatePresence>
      </div>

      {view === "scroll" && (
        <div className="absolute right-6 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-center gap-3 sm:flex">
          <button type="button" onClick={() => go(current - 1)} disabled={current === 0} aria-label="Previous post" className="grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-30"><ChevronUp size={24} /></button>
          <button type="button" onClick={() => go(current + 1)} disabled={current === feed.length - 1} aria-label="Next post" className="grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-30"><ChevronDown size={24} /></button>
        </div>
      )}
      <FeedSearch open={searching} onClose={() => setSearching(false)} />
      <ul className="absolute bottom-6 right-6 z-30 hidden space-y-0.5 text-right text-[11px] text-white/60 xl:block" aria-label="Keyboard shortcuts">
        {view === "scroll" ? (
          <>
            <li>↑ ↓ next post</li>
            <li>← → chapter</li>
          </>
        ) : (
          <>
            <li>→ like · ← skip</li>
            <li>↑ back one card</li>
          </>
        )}
        <li>Enter read</li>
        <li>/ search</li>
        <li>Esc close</li>
      </ul>
    </div>
  );
}
