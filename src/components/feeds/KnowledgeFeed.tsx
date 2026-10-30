"use client";
import * as React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import { ArrowLeft, Bookmark, Check, ExternalLink, Heart, LayoutGrid, Play, Share2, X as Close } from "lucide-react";
import { EVENTS, type EventClaim, type EventFact, type EventFile, type EventSourceCard, type Verdict } from "@/data/events";
import { TopicGraph } from "@/components/graph/TopicGraph";
import { Ago, Embed, Media, PlatformMark, VerdictChips, reachLabel, who } from "@/components/events/EventSources";

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
const PLATFORM: Record<string, string> = { news: "News", x: "X", reddit: "Reddit", youtube: "YouTube", tiktok: "TikTok", instagram: "Instagram", hackernews: "Hacker News" };
const usd = (v: number) => (v >= 1e9 ? `$${(v / 1e9).toFixed(2)}B` : `$${Math.round(v / 1e6)}M`);
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const utc = (iso: string) => `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]}, ${iso.slice(11, 16)} UTC`;
const host = (u: string | null) => (u ? u.replace(/^https?:\/\/(www\.)?/, "").split("/")[0] : "");

type Card =
  | { id: string; chapter: Chapter; kind: "headline" }
  | { id: string; chapter: Chapter; kind: "moments" }
  | { id: string; chapter: Chapter; kind: "facts"; title: string; facts: EventFact[] }
  | { id: string; chapter: Chapter; kind: "money" }
  | { id: string; chapter: Chapter; kind: "people" }
  | { id: string; chapter: Chapter; kind: "graph" }
  | { id: string; chapter: Chapter; kind: "theories-intro" }
  | { id: string; chapter: Chapter; kind: "claim"; claim: EventClaim }
  | { id: string; chapter: Chapter; kind: "score" }
  | { id: string; chapter: Chapter; kind: "next" }
  | { id: string; chapter: Chapter; kind: "source"; s: EventSourceCard }
  | { id: string; chapter: Chapter; kind: "end" };

function buildCards(e: EventFile): Card[] {
  const f = (keys: string[]) => keys.map((k) => e.facts.find((x) => x.key === k)).filter((x): x is EventFact => Boolean(x));
  const rank: Record<string, number> = { tiktok: 0, youtube: 1, instagram: 2, x: 3, reddit: 4, official: 5, investigators: 6, news: 7, hackernews: 8 };
  const sources = [...e.sources].sort((a, b) => (rank[a.group] ?? 9) - (rank[b.group] ?? 9) || b.reach - a.reach);
  return [
    { id: "what-happened", chapter: "happened", kind: "headline" },
    { id: "timeline", chapter: "happened", kind: "moments" },
    { id: "the-money", chapter: "impact", kind: "facts", title: "How much was taken", facts: f(["impact", "counted"]) },
    { id: "frozen", chapter: "impact", kind: "facts", title: "Frozen, and still out there", facts: f(["frozen", "held"]) },
    { id: "your-money", chapter: "impact", kind: "facts", title: "Customers and withdrawals", facts: f(["users", "access"]) },
    { id: "markets", chapter: "impact", kind: "facts", title: "Markets and the record", facts: f(["markets", "record"]) },
    { id: "money-trail", chapter: "impact", kind: "money" },
    { id: "how", chapter: "details", kind: "facts", title: "How it happened", facts: f(["how", "keys"]) },
    { id: "who", chapter: "details", kind: "facts", title: "Who did it", facts: f(["who", "regulators"]) },
    { id: "people", chapter: "details", kind: "people" },
    { id: "graph", chapter: "graph", kind: "graph" },
    { id: "theories", chapter: "theories", kind: "theories-intro" },
    ...e.claims.map((c) => ({ id: `claim-${c.key}`, chapter: "theories" as Chapter, kind: "claim" as const, claim: c })),
    { id: "score", chapter: "theories", kind: "score" },
    { id: "next", chapter: "next", kind: "next" },
    ...sources.map((s) => ({ id: `source-${s.id}`, chapter: "sources" as Chapter, kind: "source" as const, s })),
    { id: "end", chapter: "sources", kind: "end" },
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

function Glass({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-3xl border border-white/10 bg-white/[0.045] p-5 shadow-[0_0_60px_rgba(239,68,68,0.10)] backdrop-blur-xl ${className}`}>{children}</div>;
}

function Kicker({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[#25F4EE]">{children}</p>;
}

function Quote({ q, url, author }: { q: string; url: string | null; author: string | null }) {
  return (
    <p className="mt-2 text-sm leading-snug text-white/85">
      <q><mark className="hl hl-b text-black">{q}</mark></q>{" "}
      {url && <a href={url} target="_blank" rel="noopener noreferrer" className="whitespace-nowrap font-mono text-[10px] text-white/60 underline">{author || host(url)}</a>}
    </p>
  );
}

function ClaimCard({ c, answer, onAnswer }: { c: EventClaim; answer: boolean | null | undefined; onAnswer: (yes: boolean) => void }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-12, 12]);
  const yesGlow = useTransform(x, [0, 140], [0, 1]);
  const noGlow = useTransform(x, [-140, 0], [1, 0]);
  const v = VERDICT[c.verdict];
  const right = answer == null ? null : (answer ? c.verdict === "true" : c.verdict === "false" || c.verdict === "misleading");
  const end = (_: unknown, info: PanInfo) => {
    if (info.offset.x > 110) onAnswer(true);
    else if (info.offset.x < -110) onAnswer(false);
  };
  return (
    <div className="relative w-full">
      {answer == null ? (
        <motion.div drag="x" dragSnapToOrigin onDragEnd={end} style={{ x, rotate }} className="touch-pan-y cursor-grab active:cursor-grabbing">
          <Glass className="relative overflow-hidden">
            <motion.span style={{ opacity: yesGlow }} className="pointer-events-none absolute right-4 top-4 rotate-12 rounded border-2 border-[#16a34a] px-2 font-mono text-sm font-bold text-[#16a34a]">TRUE</motion.span>
            <motion.span style={{ opacity: noGlow }} className="pointer-events-none absolute left-4 top-4 -rotate-12 rounded border-2 border-[#ef4444] px-2 font-mono text-sm font-bold text-[#ef4444]">FALSE</motion.span>
            <Kicker>People are saying</Kicker>
            <p className="font-display text-2xl font-bold leading-tight">&ldquo;{c.claim}&rdquo;</p>
            <p className="mt-3 font-mono text-[11px] text-white/60">
              {c.spread.total ? `In ${c.spread.total} items: ` + Object.entries(c.spread.byPlatform).map(([p, n]) => `${PLATFORM[p] ?? p} ${n}`).join(", ") : "Not found in what we read"}
            </p>
            <p className="mt-6 text-center font-display text-lg font-bold">True or false?</p>
            <p className="text-center font-mono text-[10px] text-white/50">swipe right for true, left for false</p>
            <div className="mt-4 flex justify-center gap-3">
              <button type="button" onClick={() => onAnswer(false)} className="flex items-center gap-1.5 rounded-full border border-[#ef4444]/70 px-5 py-2 font-mono text-xs font-bold text-[#ef4444] hover:bg-[#ef4444]/10"><Close size={14} /> False</button>
              <button type="button" onClick={() => onAnswer(true)} className="flex items-center gap-1.5 rounded-full border border-[#16a34a]/70 px-5 py-2 font-mono text-xs font-bold text-[#16a34a] hover:bg-[#16a34a]/10"><Check size={14} /> True</button>
            </div>
          </Glass>
        </motion.div>
      ) : (
        <motion.div initial={{ rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} transition={{ duration: 0.35 }}>
          <Glass>
            <Kicker>The verdict</Kicker>
            <p className="font-display text-lg font-bold leading-snug text-white/80">&ldquo;{c.claim}&rdquo;</p>
            <p className="mt-2 inline-block px-2 py-0.5 font-mono text-sm font-bold text-white" style={{ background: v.color }}>{v.label}</p>
            <p className="mt-2 font-mono text-[11px] text-white/70">{right === null ? "" : right ? "You called it." : `You said ${answer ? "true" : "false"}.`}</p>
            <p className="mt-3 text-sm text-white/90">{c.explain}</p>
            {c.evidence.slice(0, 1).map((ev, i) => <Quote key={i} q={ev.quote} url={ev.url} author={ev.author} />)}
            {c.examples.slice(0, 2).map((x, i) => (
              <p key={i} className="mt-3 border-l-2 border-white/20 pl-3 text-sm text-white/75">
                <span className="mr-1 inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.12em] text-white/50"><PlatformMark platform={x.platform} size={10} /> {PLATFORM[x.platform] ?? x.platform}</span>
                {x.url ? <a href={x.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{x.text}</a> : x.text}
              </p>
            ))}
          </Glass>
        </motion.div>
      )}
    </div>
  );
}

/** One topic as a feed: the story first (what happened, the impact, the details), the graph, a true-or-false round on the
 * theories going around, what comes next, then every source. Scroll or swipe up and down; swipe sideways to change chapter. */
export function KnowledgeFeed({ slug }: { slug: string }) {
  const e = EVENTS[slug];
  const cards = React.useMemo(() => buildCards(e), [e]);
  const [mounted, setMounted] = React.useState(false);
  const [current, setCurrent] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, boolean>>({});
  const [liked, setLiked] = React.useState<string[]>([]);
  const [saved, setSaved] = React.useState<string[]>([]);
  const [playing, setPlaying] = React.useState<string | null>(null);
  const [toast, setToast] = React.useState<string | null>(null);
  const scroller = React.useRef<HTMLDivElement>(null);
  const down = React.useRef<{ x: number; y: number } | null>(null);
  const page = `/notebook/events/${slug}`;

  React.useEffect(() => {
    setMounted(true);
    setLiked(store.get(`kgf:liked:${slug}`));
    setSaved(store.get(`kgf:saved:${slug}`));
  }, [slug]);
  React.useEffect(() => {
    if (!mounted) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const want = new URLSearchParams(window.location.search).get("chapter");
    const start = want ? cards.findIndex((c) => c.chapter === want) : -1;
    if (start > 0) requestAnimationFrame(() => go(start, "auto"));
    return () => {
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);
  // Every card is exactly one screen tall, so the card in view is the scroll position over the screen height
  // (a visibility observer missed cards left between two snap points after a jump).
  const onScroll = (ev: React.UIEvent<HTMLDivElement>) => {
    const el = ev.currentTarget;
    const i = Math.round(el.scrollTop / Math.max(1, el.clientHeight));
    if (i !== current) setCurrent(Math.max(0, Math.min(cards.length - 1, i)));
  };

  // Smooth to the card, then settle exactly on it: a smooth scroll that stalls (a busy tab, a throttled frame) must
  // never leave the feed between two cards.
  const go = (i: number, behavior: ScrollBehavior = "smooth") => {
    const el = scroller.current;
    if (!el) return;
    const top = Math.max(0, Math.min(cards.length - 1, i)) * el.clientHeight;
    el.scrollTo({ top, behavior });
    window.setTimeout(() => {
      if (Math.abs(el.scrollTop - top) > 2) el.scrollTo({ top, behavior: "auto" });
    }, 650);
  };
  const chapterStart = (ch: Chapter) => cards.findIndex((c) => c.chapter === ch);
  const jumpChapter = (dir: 1 | -1) => {
    const ci = CHAPTERS.findIndex((c) => c.id === cards[current]?.chapter);
    const next = CHAPTERS[Math.max(0, Math.min(CHAPTERS.length - 1, ci + dir))];
    go(chapterStart(next.id));
  };
  const answer = (key: string, yes: boolean) => {
    setAnswers((a) => ({ ...a, [key]: yes }));
  };
  const toggle = (list: string[], set: (v: string[]) => void, key: string, id: string) => {
    const v = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
    set(v);
    store.set(key, v);
  };
  const share = async (card: Card) => {
    const url = `${window.location.origin}/feeds/${slug}#${card.id}`;
    try {
      if (navigator.share) await navigator.share({ title: e.title, url });
      else {
        await navigator.clipboard.writeText(url);
        setToast("Link copied");
        setTimeout(() => setToast(null), 1600);
      }
    } catch {
      /* the person closed the share sheet */
    }
  };

  React.useEffect(() => {
    const k = (ev: KeyboardEvent) => {
      const c = cards[current];
      if (ev.key === "ArrowDown" || ev.key === "j") go(current + 1);
      else if (ev.key === "ArrowUp" || ev.key === "k") go(current - 1);
      else if (c?.kind === "claim" && answers[c.claim.key] === undefined && (ev.key === "ArrowRight" || ev.key === "ArrowLeft")) answer(c.claim.key, ev.key === "ArrowRight");
      else if (ev.key === "ArrowRight") jumpChapter(1);
      else if (ev.key === "ArrowLeft") jumpChapter(-1);
      else return;
      ev.preventDefault();
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  });

  if (!e || !mounted) return null;
  const chapter = cards[current]?.chapter ?? "happened";
  const featured = e.featured ? e.sources.find((s) => s.id === e.featured) : undefined;
  const claimsAnswered = e.claims.filter((c) => answers[c.key] !== undefined);
  const correct = claimsAnswered.filter((c) => (answers[c.key] ? c.verdict === "true" : c.verdict === "false" || c.verdict === "misleading")).length;

  const body = (c: Card) => {
    switch (c.kind) {
      case "headline":
        return (
          <div className="w-full">
            {featured?.thumb && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={featured.thumb} alt="" className="mb-4 aspect-video w-full rounded-3xl object-cover opacity-80 ring-1 ring-white/10" />
            )}
            <Glass>
              <Kicker>What happened</Kicker>
              <h1 className="font-display text-3xl font-bold leading-tight">{e.title}</h1>
              {e.summary && <p className="mt-3 text-sm leading-relaxed text-white/85"><mark className="hl hl-y text-black">{e.summary.split(/(?<=\.)\s/)[0]}</mark> {e.summary.split(/(?<=\.)\s/).slice(1).join(" ")}</p>}
              <p className="mt-3 text-sm"><mark className="hl hl-g text-black">What to do: rely only on Binance&apos;s official channels, and check a claim&apos;s verdict before you share it.</mark></p>
              <p className="mt-4 font-mono text-[10px] text-white/50">Swipe up for the story · sideways to change chapter</p>
            </Glass>
          </div>
        );
      case "moments":
        return (
          <Glass className="w-full">
            <Kicker>Minute by minute</Kicker>
            <ol className="relative space-y-2.5 border-l border-white/15 pl-4">
              {e.moments.slice(0, 9).map((m) => (
                <li key={m.at + m.label}>
                  <span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full bg-[#ef4444] shadow-[0_0_10px_#ef4444]" aria-hidden="true" />
                  <p className="font-mono text-[10px] text-white/50">{utc(m.at)}</p>
                  <p className="text-sm font-bold leading-snug">{m.label}</p>
                </li>
              ))}
            </ol>
            <a href={`${page}#what-happened`} className="mt-3 inline-block font-mono text-[10px] text-[#25F4EE] underline">The full timeline with every source</a>
          </Glass>
        );
      case "facts":
        return (
          <Glass className="w-full">
            <Kicker>{CHAPTERS.find((x) => x.id === c.chapter)?.label}</Kicker>
            <p className="mb-3 font-display text-xl font-bold">{c.title}</p>
            <div className="space-y-4">
              {c.facts.map((f) => (
                <div key={f.key}>
                  <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/50">{f.label}</p>
                  <p className="font-display text-2xl font-bold leading-tight text-white">{f.value}</p>
                  {f.note && <p className="text-xs text-white/60">{f.note}</p>}
                  {f.evidence.slice(0, 1).map((ev, i) => <Quote key={i} q={ev.quote} url={ev.url} author={ev.author} />)}
                </div>
              ))}
            </div>
          </Glass>
        );
      case "money": {
        const max = Math.max(...e.money.rows.map((r) => r.usd));
        return (
          <Glass className="w-full">
            <Kicker>The money trail</Kicker>
            <p className="mb-3 font-display text-xl font-bold">{usd(e.money.total)} by blockchain</p>
            <ul className="space-y-2">
              {e.money.rows.map((r) => (
                <li key={r.chain} className="grid grid-cols-[6.5rem_1fr_auto] items-center gap-2 text-sm">
                  <span className="truncate text-white/80">{r.chain}</span>
                  <span className="h-2.5 rounded-full bg-gradient-to-r from-[#ef4444] to-[#f97316] shadow-[0_0_10px_rgba(239,68,68,0.6)]" style={{ width: `${Math.max(2, (r.usd / max) * 100)}%` }} />
                  <span className="font-mono text-xs tabular-nums">{usd(r.usd)}</span>
                </li>
              ))}
            </ul>
            {e.money.frozen.map((fz) => <p key={fz.who} className="mt-3 text-sm text-white/85"><span className="font-bold text-[#25F4EE]">Frozen {usd(fz.usd)}</span> by {fz.who}.</p>)}
          </Glass>
        );
      }
      case "people":
        return (
          <Glass className="w-full">
            <Kicker>People in this story</Kicker>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {e.actors.map((a) => (
                <li key={a.name} className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
                  <p className="text-sm font-bold">{a.name}</p>
                  <p className="text-xs text-white/60">{a.role}</p>
                </li>
              ))}
            </ul>
          </Glass>
        );
      case "graph":
        return (
          <div className="w-full">
            <Kicker>How it all connects</Kicker>
            <TopicGraph data={e.graph} title="Knowledge graph" />
          </div>
        );
      case "theories-intro":
        return (
          <Glass className="w-full text-center">
            <Kicker>Theories and claims</Kicker>
            <p className="font-display text-3xl font-bold leading-tight">{e.claims.length} things people are saying.</p>
            <p className="mt-3 text-sm text-white/80">Guess each one: swipe right for true, left for false. Then see the verdict and the source behind it.</p>
            <div className="mt-5 flex justify-center gap-2 font-mono text-[10px]">
              {(Object.keys(VERDICT) as Verdict[]).map((v) => <span key={v} className="rounded px-2 py-0.5 text-white" style={{ background: VERDICT[v].color }}>{VERDICT[v].label}</span>)}
            </div>
          </Glass>
        );
      case "claim":
        return <ClaimCard c={c.claim} answer={answers[c.claim.key]} onAnswer={(yes) => answer(c.claim.key, yes)} />;
      case "score":
        return (
          <Glass className="w-full text-center">
            <Kicker>Your round</Kicker>
            <p className="font-display text-5xl font-bold">{correct}<span className="text-white/40">/{claimsAnswered.length || e.claims.length}</span></p>
            <p className="mt-2 text-sm text-white/80">{claimsAnswered.length ? "called right, counting misleading claims as false" : "Swipe back up to play the round."}</p>
            <a href={`${page}#claims`} className="mt-4 inline-block font-mono text-[11px] text-[#25F4EE] underline">Every claim, with every source, on the full page</a>
          </Glass>
        );
      case "next":
        return (
          <Glass className="w-full">
            <Kicker>What happens next</Kicker>
            <ul className="space-y-3">
              {e.watch.map((w) => (
                <li key={w.label} className="border-l-2 border-[#ef4444] pl-3">
                  <p className="text-sm font-bold">{w.label}{w.when && <span className="ml-2 font-mono text-[10px] font-normal text-white/50">expected {w.when}</span>}</p>
                  {w.note && <p className="text-xs text-white/65">{w.note}</p>}
                </li>
              ))}
            </ul>
          </Glass>
        );
      case "source": {
        const s = c.s;
        const portrait = s.platform === "tiktok" || s.platform === "instagram";
        return (
          <div className="w-full">
            <div className={`${portrait ? "mx-auto max-w-[300px]" : ""}`}>
              {playing === s.id && s.embed ? <Embed s={s} /> : <Media s={s} big className={`${portrait ? "aspect-[9/16]" : "aspect-video"} rounded-3xl ring-1 ring-white/10`} />}
            </div>
            <div className="mt-3">
              <p className="flex items-center gap-1.5 font-mono text-[10px] text-white/60"><PlatformMark platform={s.platform} size={12} /> {who(s)}{s.date && <> · <Ago iso={s.date} /></>}{reachLabel(s) && <> · {reachLabel(s)}</>}</p>
              <p className="mt-1 line-clamp-3 font-display text-lg font-bold leading-snug">{s.title}</p>
              {s.excerpt && <p className="mt-1 line-clamp-3 text-sm text-white/75">&ldquo;{s.excerpt}&rdquo;</p>}
              <VerdictChips s={s} max={3} />
              <div className="mt-3 flex flex-wrap gap-2">
                {s.embed && playing !== s.id && (
                  <button type="button" onClick={() => setPlaying(s.id)} className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 font-mono text-xs font-bold text-black"><Play size={13} fill="currentColor" /> Play here</button>
                )}
                {s.url && <a href={s.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 rounded-full bg-white/10 px-4 py-2 font-mono text-xs text-white">Open on {PLATFORM[s.platform] ?? host(s.url)} <ExternalLink size={12} /></a>}
              </div>
            </div>
          </div>
        );
      }
      case "end":
        return (
          <Glass className="w-full text-center">
            <Kicker>You&apos;re caught up</Kicker>
            <p className="font-display text-2xl font-bold">That&apos;s the whole story, and every source.</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <a href={page} className="rounded-full bg-white px-4 py-2 font-mono text-xs font-bold text-black">Read the full page</a>
              <a href="/feeds" className="rounded-full bg-white/10 px-4 py-2 font-mono text-xs text-white">All feeds</a>
              <button type="button" onClick={() => go(0)} className="rounded-full bg-white/10 px-4 py-2 font-mono text-xs text-white">Start again</button>
            </div>
          </Glass>
        );
    }
  };

  const ui = (
    <div className="fixed inset-0 z-[90] overflow-hidden bg-[#05060a] text-white" role="dialog" aria-modal="true" aria-label={`Knowledge Graph Feed: ${e.title}`}>
      {/* the futuristic backdrop: two slow glows and a faint graph mesh */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(900px 500px at 15% -10%, rgba(239,68,68,0.22), transparent 70%), radial-gradient(800px 500px at 110% 20%, rgba(37,99,235,0.20), transparent 70%), radial-gradient(700px 400px at 50% 120%, rgba(37,244,238,0.10), transparent 70%)" }} />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

      {/* top: brand, back to the page, chapter progress */}
      <div className="absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-[#05060a] via-[#05060a]/85 to-transparent px-3 pb-6 pt-3 sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2">
          <a href={page} className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 font-mono text-[11px] hover:bg-white/20"><ArrowLeft size={14} /> Full page</a>
          <p className="truncate text-center font-mono text-[10px] uppercase tracking-[0.25em] text-white/70">
            <span className="text-[#ef4444]">●</span> Knowledge Graph Feeds
          </p>
          <a href="/feeds" className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 font-mono text-[11px] hover:bg-white/20"><LayoutGrid size={14} /> All feeds</a>
        </div>
        <div className="mx-auto mt-3 flex max-w-5xl gap-1" role="tablist" aria-label="Chapters">
          {CHAPTERS.map((ch) => {
            const idx = cards.map((c, i) => [c, i] as const).filter(([c]) => c.chapter === ch.id).map(([, i]) => i);
            const done = idx.filter((i) => i < current).length + (cards[current]?.chapter === ch.id ? 1 : 0);
            const pct = idx.length ? (100 * done) / idx.length : 0;
            return (
              <button key={ch.id} type="button" role="tab" aria-selected={chapter === ch.id} onClick={() => go(idx[0])} className="group min-w-0 flex-1 text-left">
                <span className="block h-1 overflow-hidden rounded-full bg-white/15"><span className="block h-full rounded-full bg-gradient-to-r from-[#ef4444] to-[#25F4EE]" style={{ width: `${pct}%` }} /></span>
                <span className={`mt-1 hidden truncate font-mono text-[9px] uppercase tracking-[0.14em] sm:block ${chapter === ch.id ? "text-white" : "text-white/45 group-hover:text-white/80"}`}>{ch.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* the feed: one card per screen */}
      <div
        ref={scroller}
        onScroll={onScroll}
        className="relative z-10 h-[100dvh] snap-y snap-mandatory overflow-y-auto [scrollbar-width:none]"
        onPointerDown={(ev) => (down.current = { x: ev.clientX, y: ev.clientY })}
        onPointerUp={(ev) => {
          const d = down.current;
          down.current = null;
          if (!d || cards[current]?.kind === "claim" || cards[current]?.kind === "graph") return;
          const dx = ev.clientX - d.x, dy = ev.clientY - d.y;
          if (Math.abs(dx) > 90 && Math.abs(dx) > Math.abs(dy) * 1.5) jumpChapter(dx < 0 ? 1 : -1);
        }}
      >
        {cards.map((c, i) => (
          <section key={c.id} id={c.id} data-i={i} className="relative flex h-[100dvh] snap-start items-center justify-center px-4 pb-10 pt-24 sm:px-6" aria-label={`${i + 1} of ${cards.length}`}>
            <div className={`relative flex w-full items-center ${c.kind === "graph" ? "max-w-3xl" : "max-w-[460px]"}`}>
              {Math.abs(i - current) <= 3 ? body(c) : <div className="h-40 w-full" />}
            </div>
            {/* the action rail, like a social app */}
            {c.kind !== "graph" && (
              <div className="absolute bottom-24 right-3 flex flex-col items-center gap-4 sm:right-[max(1rem,calc(50%-330px))]">
                <button type="button" onClick={() => toggle(liked, setLiked, `kgf:liked:${slug}`, c.id)} aria-pressed={liked.includes(c.id)} aria-label="Like" className="flex flex-col items-center gap-0.5 font-mono text-[9px] text-white/70">
                  <span className={`grid h-11 w-11 place-items-center rounded-full ${liked.includes(c.id) ? "bg-[#ef4444] text-white" : "bg-white/10"}`}><Heart size={18} fill={liked.includes(c.id) ? "currentColor" : "none"} /></span>Like
                </button>
                <button type="button" onClick={() => toggle(saved, setSaved, `kgf:saved:${slug}`, c.id)} aria-pressed={saved.includes(c.id)} aria-label="Save" className="flex flex-col items-center gap-0.5 font-mono text-[9px] text-white/70">
                  <span className={`grid h-11 w-11 place-items-center rounded-full ${saved.includes(c.id) ? "bg-[#25F4EE] text-black" : "bg-white/10"}`}><Bookmark size={18} fill={saved.includes(c.id) ? "currentColor" : "none"} /></span>Save
                </button>
                <button type="button" onClick={() => share(c)} aria-label="Share" className="flex flex-col items-center gap-0.5 font-mono text-[9px] text-white/70">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-white/10"><Share2 size={18} /></span>Share
                </button>
                <a href={`${page}#${CHAPTERS.find((x) => x.id === c.chapter)?.anchor}`} aria-label="Open this part of the full page" className="flex flex-col items-center gap-0.5 font-mono text-[9px] text-white/70">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-white/10"><ExternalLink size={18} /></span>Page
                </a>
              </div>
            )}
          </section>
        ))}
      </div>

      <p className="absolute bottom-3 left-1/2 z-20 -translate-x-1/2 font-mono text-[10px] text-white/45">
        {current + 1} / {cards.length} · {saved.length ? `${saved.length} saved · ` : ""}↑↓ next · ←→ chapter
      </p>
      <AnimatePresence>
        {toast && (
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute bottom-10 left-1/2 z-30 -translate-x-1/2 rounded-full bg-white px-4 py-1.5 font-mono text-xs text-black">
            {toast}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
  return createPortal(ui, document.body);
}
