"use client";
/**
 * Learn: everything on the AI Roadmap as a feed (owner, 2026-11-03). Same hands as the News feed: one full-screen post
 * at a time, Feed or Swipe, tap to read, the Tune panel. Different engine: the order is the roadmap's own learning order
 * and the reader's choices decide everything (phase, topics, level, format, free or not), so someone learns in sequence
 * instead of being shown what keeps them scrolling. The controls are shared with News in controls.tsx.
 *
 * Honest labels: a post says it is on the AI Roadmap and when its link was last checked. Dead links never reach the feed.
 * Rendered on the server like the News feed; a plain list of everything sits beneath it for readers without JavaScript.
 */
import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, BookOpen, Bookmark, ChevronDown, ChevronUp, CircleCheck, ExternalLink, FolderGit2, GraduationCap, Heart, MessageCircle, Play, PlaySquare, RotateCcw, Search, Share2, SlidersHorizontal, Volume2, VolumeX, X as Close, type LucideIcon } from "lucide-react";
import { LEARN_CHECKED_AT, LEARN_PHASES, LEARN_TOPICS, type LearnFormat, type LearnLevel, type LearnResource } from "@/data/learnCatalog";
import { DEFAULT_LEARN, FORMATS, LEVELS, buildLearnFeed, liveResources, resourceFits, topicFits, topicOfResource, youtubeEmbed, youtubeThumb, type LearnPost, type LearnPrefs } from "@/lib/learn-feed";
import { Chip, FocusDial, ModeTabs, PanelSection, SwipeTop, SwitchRow, ToggleRow, TopicTuner, ViewToggle, store, useClicks, useWide, type Station } from "@/components/feeds/controls";
import { FeedSearch } from "@/components/feeds/FeedSearch";

const PREFS_KEY = "kgf:learn:prefs";
const ONBOARDED = "kgf:learn:onboarded";
const PHASE = new Map(LEARN_PHASES.map((p) => [p.id, p]));
const FORMAT_ICON: Record<LearnFormat, LucideIcon> = { video: PlaySquare, course: GraduationCap, book: BookOpen, repo: FolderGit2 };
const FORMAT_LABEL = Object.fromEntries(FORMATS.map((f) => [f.id, f.label])) as Record<LearnFormat, string>;
const FORMAT_BG: Record<LearnFormat, string> = {
  video: "linear-gradient(160deg, #450a0a 0%, #0b0d12 70%)",
  course: "linear-gradient(160deg, #0b1d4d 0%, #0b0d12 70%)",
  book: "linear-gradient(160deg, #3b2506 0%, #0b0d12 70%)",
  repo: "linear-gradient(160deg, #052e2b 0%, #0b0d12 70%)",
};
const checkedOn = (() => {
  const [y, m, d] = LEARN_CHECKED_AT.split("-").map(Number);
  return y ? `${d} ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1]} ${y}` : "";
})();

function readPrefs(): LearnPrefs {
  try {
    const v = JSON.parse(window.localStorage.getItem(PREFS_KEY) || "null");
    return v && typeof v === "object" ? { ...DEFAULT_LEARN, ...v, only: null } : DEFAULT_LEARN;
  } catch {
    return DEFAULT_LEARN;
  }
}
function writePrefs(p: LearnPrefs) {
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(p));
  } catch {
    /* private mode: the settings last for this visit */
  }
}

// Runs before the feed paints, so saved settings or a link to one post never flash the default first post.
const PREPAINT = `try{var q=location.search,s=JSON.parse(localStorage.getItem("${PREFS_KEY}")||"null");if(!s&&!localStorage.getItem("${ONBOARDED}")&&!/[?&](p|topic)=/.test(q))document.documentElement.classList.add("kgf-new");if(/[?&](p|topic|view)=/.test(q)||s||localStorage.getItem("kgf:learn:seen"))document.documentElement.classList.add("kgf-wait")}catch(e){}`;

const accessLabel = (r: LearnResource) => (r.access === "paid" ? "Paid" : r.access === "freemium" ? "Free tier" : "Free");
const opensOn = (r: LearnResource) => (r.youtube ? "YouTube" : r.format === "repo" ? "GitHub" : r.url.replace(/^https?:\/\/(www\.)?/, "").split("/")[0]);

export function LearnFeed() {
  const wide = useWide();
  const [prefs, setPrefsState] = React.useState<LearnPrefs>(DEFAULT_LEARN);
  const [ready, setReady] = React.useState(false);
  const [current, setCurrent] = React.useState(0);
  const [dir, setDir] = React.useState(1);
  const [playing, setPlaying] = React.useState<string | null>(null);
  const [read, setRead] = React.useState<string | null>(null);
  const [settings, setSettings] = React.useState(false);
  const [searching, setSearching] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);
  const [announce, setAnnounce] = React.useState("");
  const [liked, setLiked] = React.useState<string[]>([]);
  const [saved, setSaved] = React.useState<string[]>([]);
  const [done, setDone] = React.useState<string[]>([]);
  const [seen, setSeen] = React.useState<string[]>([]);
  const [onboard, setOnboard] = React.useState(false);
  const scroller = React.useRef<HTMLDivElement>(null);
  const press = React.useRef<{ x: number; y: number; t: number } | null>(null);
  const lastKey = React.useRef<string | null>(null);
  const start = React.useRef(0);
  const click = useClicks(prefs.sound);
  const view = prefs.view;

  const setPrefs = React.useCallback((patch: Partial<LearnPrefs>) => {
    setPrefsState((p) => {
      const n = { ...p, ...patch };
      writePrefs(n);
      return n;
    });
  }, []);

  const feed = React.useMemo(() => buildLearnFeed(prefs), [prefs]);
  const feedKey = `${prefs.phase}|${prefs.only}|${prefs.off.join(",")}|${prefs.levels.join(",")}|${prefs.formats.join(",")}|${prefs.freeOnly}`;
  const items = feed.filter((p) => p.kind === "res").length;
  const seenSet = React.useMemo(() => new Set(seen), [seen]);

  // Counts answer "how many if I turned this on", given every other choice; a resource counts once, as in the feed.
  const countFor = React.useCallback((patch: Partial<LearnPrefs>) => buildLearnFeed({ ...prefs, ...patch }).filter((p) => p.kind === "res").length, [prefs]);
  const seenFor = React.useCallback((patch: Partial<LearnPrefs>) => buildLearnFeed({ ...prefs, ...patch }).filter((p) => p.kind === "res" && seenSet.has(p.id)).length, [prefs, seenSet]);
  const stations: Station[] = React.useMemo(
    () => [
      { id: "all", label: "All phases", count: countFor({ phase: "all", only: null }), seen: seenFor({ phase: "all", only: null }) },
      ...LEARN_PHASES.map((p) => ({ id: p.id, label: `${p.n}. ${p.label}`, count: countFor({ phase: p.id, only: null }), seen: seenFor({ phase: p.id, only: null }) })),
    ],
    [countFor, seenFor]
  );
  const station = Math.max(0, stations.findIndex((s) => s.id === prefs.phase));
  const tune = (i: number) => setPrefs({ phase: stations[Math.max(0, Math.min(stations.length - 1, i))].id, only: null });
  const topicsOn = LEARN_TOPICS.filter((t) => topicFits(t, prefs)).length;
  const formatsOn = prefs.formats.length || FORMATS.length;
  const changed = (prefs.off.length || prefs.only ? 1 : 0) + (prefs.levels.length ? 1 : 0) + (prefs.formats.length || prefs.freeOnly ? 1 : 0) + (prefs.phase !== "all" ? 1 : 0);

  React.useEffect(() => {
    setLiked(store.get("kgf:learn:liked"));
    setSaved(store.get("kgf:learn:saved"));
    setDone(store.get("kgf:learn:done"));
    const seenNow = store.get("kgf:learn:seen");
    setSeen(seenNow);
    const q = new URLSearchParams(window.location.search);
    const p = q.get("p");
    const t = q.get("topic");
    const v = q.get("view");
    let base: LearnPrefs = { ...readPrefs(), ...(v === "swipe" || v === "scroll" ? { view: v } : {}) };
    if (t && LEARN_TOPICS.some((x) => x.id === t)) base = { ...base, only: t };
    // A link or a search result opens that post even if the reader's own filters would hide it: this visit only.
    if (p && !buildLearnFeed(base).some((x) => x.id === p)) {
      const home = topicOfResource(p);
      base = { ...DEFAULT_LEARN, sound: base.sound, view: base.view, only: home?.id ?? null };
    }
    let fresh = false;
    try {
      fresh = !window.localStorage.getItem(PREFS_KEY) && !window.localStorage.getItem(ONBOARDED) && !p && !t;
    } catch {
      /* storage blocked: no picker, the feed opens on everything */
    }
    if (fresh) setOnboard(true);
    const list = buildLearnFeed(base);
    const linked = p ? list.findIndex((x) => x.id === p) : -1;
    // Pick up at the first post not yet seen, so a returning reader carries on rather than starting again.
    const resume = linked >= 0 || fresh || t ? -1 : list.findIndex((x) => x.kind !== "end" && !seenNow.includes(x.id));
    start.current = linked >= 0 ? linked : resume > 0 ? resume : 0;
    if (resume > 0) {
      setToast("Picked up where you left off");
      window.setTimeout(() => setToast(null), 2200);
    }
    setPrefsState(base);
    setReady(true);
  }, []);

  React.useEffect(() => {
    if (!ready) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    lastKey.current = feedKey;
    const reveal = () => document.documentElement.classList.remove("kgf-wait", "kgf-new");
    if (start.current > 0) {
      setCurrent(start.current);
      requestAnimationFrame(() => {
        scroller.current?.scrollTo({ top: start.current * scroller.current.clientHeight, behavior: "auto" });
        requestAnimationFrame(reveal);
      });
    } else requestAnimationFrame(reveal);
    return () => {
      document.body.style.overflow = prev;
      reveal();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  React.useEffect(() => {
    if (!ready || lastKey.current === null || lastKey.current === feedKey) return;
    lastKey.current = feedKey;
    setCurrent(0);
    setDir(1);
    setPlaying(null);
    scroller.current?.scrollTo({ top: 0, behavior: "auto" });
    setAnnounce(`${items} resources match`);
  }, [feedKey, ready, items]);

  // The address keeps the place and the tuning, so a link can be shared and back lands here.
  React.useEffect(() => {
    if (!ready) return;
    const url = new URL(window.location.href);
    const id = feed[current]?.id;
    if (id && current > 0) url.searchParams.set("p", id);
    else url.searchParams.delete("p");
    if (prefs.only) url.searchParams.set("topic", prefs.only);
    else url.searchParams.delete("topic");
    if (view === "swipe") url.searchParams.set("view", "swipe");
    else url.searchParams.delete("view");
    if (url.href !== window.location.href) window.history.replaceState(window.history.state, "", url);
  }, [ready, current, feed, prefs.only, view]);

  React.useEffect(() => {
    if (!ready || view !== "scroll") return;
    requestAnimationFrame(() => {
      const el = scroller.current;
      if (el) el.scrollTo({ top: current * el.clientHeight, behavior: "auto" });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  React.useEffect(() => {
    if (!ready || onboard) return;
    const id = feed[current]?.id;
    if (!id || id === "end" || seen.includes(id)) return;
    const next = [...seen, id];
    setSeen(next);
    store.set("kgf:learn:seen", next);
  }, [ready, onboard, current, feed, seen]);

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
      window.setTimeout(() => {
        if (Math.abs(el.scrollTop - top) > 2) el.scrollTo({ top, behavior: "auto" });
      }, 650);
    },
    [feed.length, view, current]
  );
  const onScroll = (ev: React.UIEvent<HTMLDivElement>) => {
    const el = ev.currentTarget;
    const i = Math.max(0, Math.min(feed.length - 1, Math.round(el.scrollTop / Math.max(1, el.clientHeight))));
    if (i === current) return;
    setCurrent(i);
    setPlaying(null);
  };

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

  const say = (t: string) => {
    setToast(t);
    window.setTimeout(() => setToast(null), 1600);
  };
  const flip = (list: string[], set: (v: string[]) => void, key: string, id: string, on?: boolean) => {
    const has = list.includes(id);
    if (on && has) return;
    const v = has ? list.filter((x) => x !== id) : [...list, id];
    set(v);
    store.set(key, v);
  };
  const like = (p: LearnPost, on?: boolean) => flip(liked, setLiked, "kgf:learn:liked", p.id, on);
  const share = async (p: LearnPost) => {
    const url = `${window.location.origin}/feeds/learn?p=${encodeURIComponent(p.id)}`;
    const title = p.kind === "res" ? p.r.title : p.kind === "topic" ? p.topic.topic : "Learn";
    try {
      if (navigator.share) await navigator.share({ title, url });
      else {
        await navigator.clipboard.writeText(url);
        say("Link copied");
      }
    } catch {
      /* the person closed the share sheet */
    }
  };
  const swipe = (d: 1 | -1) => {
    const p = feed[current];
    if (!p) return;
    if (d === 1) like(p, true);
    click("tick");
    if (current < feed.length - 1) {
      setDir(d);
      setCurrent(current + 1);
      setPlaying(null);
    }
  };

  const toggleTopic = (id: string) => {
    const off = prefs.off.includes(id) ? prefs.off.filter((x) => x !== id) : [...prefs.off, id];
    if (off.length === LEARN_TOPICS.length) {
      say("Keep at least one topic on");
      click("stop");
      return;
    }
    click("tick");
    setPrefs({ off, only: null });
  };
  const toggleLevel = (id: LearnLevel) => {
    const on = prefs.levels.length ? prefs.levels : LEVELS.map((l) => l.id);
    const next = on.includes(id) ? on.filter((x) => x !== id) : [...on, id];
    if (!next.length) {
      say("Keep at least one level on");
      click("stop");
      return;
    }
    click("tick");
    setPrefs({ levels: next.length === LEVELS.length ? [] : next, only: null });
  };
  const toggleFormat = (id: LearnFormat) => {
    const on = prefs.formats.length ? prefs.formats : FORMATS.map((f) => f.id);
    const next = on.includes(id) ? on.filter((x) => x !== id) : [...on, id];
    if (!next.length) {
      say("Keep at least one format on");
      click("stop");
      return;
    }
    click("tick");
    setPrefs({ formats: next.length === FORMATS.length ? [] : next });
  };

  const onPointerDown = (ev: React.PointerEvent) => {
    press.current = (ev.target as HTMLElement).closest("button,a,iframe,input,[data-no-tap]") ? null : { x: ev.clientX, y: ev.clientY, t: Date.now() };
  };
  const onPointerUp = (ev: React.PointerEvent) => {
    const d = press.current;
    press.current = null;
    const p = feed[current];
    if (!d || !p || p.kind === "end") return;
    if (Math.abs(ev.clientX - d.x) > 10 || Math.abs(ev.clientY - d.y) > 10 || Date.now() - d.t > 500) return;
    openRead(p.id);
  };

  React.useEffect(() => {
    const k = (ev: KeyboardEvent) => {
      if ((ev.target as HTMLElement | null)?.closest?.("[role=slider],input,textarea")) return;
      if (onboard || searching) return;
      if (read || settings) {
        if (ev.key === "Escape") {
          if (read) closeRead();
          else setSettings(false);
        }
        return;
      }
      const p = feed[current];
      if (ev.key === "/") setSearching(true);
      else if (!p) return;
      else if (view === "swipe") {
        if (ev.key === "ArrowRight") swipe(1);
        else if (ev.key === "ArrowLeft") swipe(-1);
        else if (ev.key === "ArrowUp" || ev.key === "Backspace") go(current - 1);
        else if ((ev.key === "Enter" || ev.key === "r") && p.kind !== "end") openRead(p.id);
        else return;
      } else if (ev.key === "ArrowDown" || ev.key === "j") go(current + 1);
      else if (ev.key === "ArrowUp" || ev.key === "k") go(current - 1);
      else if ((ev.key === "Enter" || ev.key === "r") && p.kind !== "end") openRead(p.id);
      else if (ev.key === "l") like(p);
      else return;
      ev.preventDefault();
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  });

  const post = feed[current] ?? feed[0];
  const backdrop = post?.kind === "res" ? youtubeThumb(post.r) : null;
  const here = post && post.kind !== "end" ? post.topic : null;
  const herePhase = here ? PHASE.get(here.phase) : PHASE.get(prefs.phase);
  const nextPhase = stations[station + 1];

  const stage = (p: LearnPost, i: number) => {
    if (p.kind === "end") {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center px-6 pb-[var(--kgf-bottom)] pt-[var(--kgf-top)] text-center" style={{ background: FORMAT_BG.course }}>
          <p className="font-display text-3xl font-black text-white">{prefs.only ? "You finished this topic" : prefs.phase === "all" ? "You reached the end of your picks" : `You finished ${stations[station]?.label}`}</p>
          <p className="mt-2 text-sm text-white/80">{items} resources in this feed, in the roadmap&apos;s order.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {prefs.only ? (
              <button type="button" onClick={() => { click("pick"); setPrefs({ only: null }); }} className="rounded-full bg-[#ef4444] px-5 py-2.5 text-sm font-bold text-white">Back to everything you picked</button>
            ) : (
              nextPhase && prefs.phase !== "all" && (
                <button type="button" onClick={() => { click("pick"); tune(station + 1); }} className="rounded-full bg-[#ef4444] px-5 py-2.5 text-sm font-bold text-white">Next: {nextPhase.label}</button>
              )
            )}
            <a href="/notebook/ai/roadmap" className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-black">See the roadmap</a>
            <button type="button" onClick={() => go(0)} className="rounded-full bg-white/15 px-5 py-2.5 text-sm font-semibold text-white">Start again</button>
          </div>
        </div>
      );
    }
    if (p.kind === "topic") {
      const t = p.topic;
      const ph = PHASE.get(t.phase);
      return (
        <div className="flex h-full w-full flex-col justify-center pb-[var(--kgf-bottom)] pl-6 pr-[var(--kgf-rail)] pt-[var(--kgf-top)]" style={{ background: `linear-gradient(160deg, ${ph?.color ?? "#ef4444"}55 0%, #0b0d12 62%)` }}>
          <p className="text-[12px] font-bold uppercase tracking-wider text-white/80">Week {t.week} · Phase {ph?.n}: {ph?.label}</p>
          <h2 className="mt-2 font-display text-[34px] font-black leading-[1.05] text-white">{t.topic}</h2>
          <p className="mt-3 line-clamp-5 text-[15px] leading-snug text-white/90">{t.description}</p>
          <p className="mt-4 flex flex-wrap items-center gap-1.5 text-[12px] font-semibold text-white">
            <span className="rounded bg-white/15 px-2 py-0.5 capitalize">{t.difficulty}</span>
            <span className="rounded bg-white/15 px-2 py-0.5">{p.shown} {p.shown === 1 ? "resource" : "resources"}</span>
            {t.milestone && <span className="rounded bg-[#ef4444] px-2 py-0.5">Milestone</span>}
          </p>
        </div>
      );
    }
    const r = p.r;
    const thumb = youtubeThumb(r);
    const embed = youtubeEmbed(r);
    if (playing === r.id && embed && i === current) {
      return (
        <div className="absolute inset-0 z-10 flex items-center bg-black" data-no-tap>
          <iframe title={r.title} src={embed} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen className="aspect-video w-full border-0" />
        </div>
      );
    }
    if (thumb) {
      return (
        <div className="relative h-full w-full bg-black">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={thumb} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-50 blur-2xl" />
          <div className="absolute inset-0 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={thumb} alt={r.title} className="w-full object-contain" />
          </div>
          {embed ? (
            <button type="button" onClick={() => setPlaying(r.id)} aria-label={`Play ${r.title}`} className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/60 text-white ring-2 ring-white/70 backdrop-blur">
              <Play size={26} fill="currentColor" />
            </button>
          ) : (
            <a href={r.url} target="_blank" rel="noopener noreferrer" className="absolute left-1/2 top-1/2 inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-white px-4 py-2.5 text-sm font-bold text-black">Watch on YouTube <ExternalLink size={14} /></a>
          )}
        </div>
      );
    }
    const Icon = FORMAT_ICON[r.format];
    return (
      <div className="flex h-full w-full flex-col justify-center pb-[var(--kgf-bottom)] pl-6 pr-[var(--kgf-rail)] pt-[var(--kgf-top)]" style={{ background: FORMAT_BG[r.format] }}>
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-white"><Icon size={24} aria-hidden={true} /></span>
        <p className="mt-4 text-[12px] font-bold uppercase tracking-wider text-white/80">{FORMAT_LABEL[r.format]} · {accessLabel(r)}</p>
        <h2 className="mt-1.5 line-clamp-5 font-display text-[28px] font-black leading-[1.1] text-white">{r.title}</h2>
        <a href={r.url} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-black" data-no-tap>Open on {opensOn(r)} <ExternalLink size={14} /></a>
      </div>
    );
  };

  const caption = (p: LearnPost, small = false) => {
    if (p.kind === "end") return null;
    const t = p.topic;
    return (
      <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/90 via-black/55 to-transparent px-3 pb-5 pl-4 pr-16 pt-16">
        {p.kind === "res" && (
          <>
            <div className="flex items-center gap-2">
              <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full bg-white text-[13px] font-black text-black" aria-hidden="true">{p.r.creator.slice(0, 1).toUpperCase()}</span>
              <p className="min-w-0 truncate text-[15px] font-bold text-white">{p.r.creator}</p>
            </div>
            <p className="mt-1.5 line-clamp-2 text-[14px] leading-snug text-white">{p.r.title}</p>
          </>
        )}
        {p.kind === "topic" && t.proTips && <p className="line-clamp-3 text-[13px] leading-snug text-white/90"><b>Pro tip:</b> {t.proTips}</p>}
        <button type="button" onClick={() => openRead(p.id)} className="mt-0.5 text-[13px] font-semibold text-white/85">Read more</button>
        {!small && (
          <p className="mt-1 truncate text-[12px] text-white/75">
            <span className="mr-1.5 rounded bg-white/90 px-1.5 py-px text-[10px] font-bold text-black">On the AI Roadmap</span>
            {p.kind === "res" && p.r.status === "ok" && checkedOn ? `Link checked ${checkedOn}` : t.topic}
          </p>
        )}
      </div>
    );
  };

  const rail = (p: LearnPost) => {
    if (p.kind === "end") return null;
    const isLiked = liked.includes(p.id);
    const isSaved = saved.includes(p.id);
    const isDone = done.includes(p.id);
    return (
      <div className="absolute bottom-28 right-2 z-20 flex flex-col items-center gap-4 [filter:drop-shadow(0_1px_3px_rgba(0,0,0,0.9))]" data-no-tap>
        <button type="button" onClick={() => like(p)} aria-pressed={isLiked} aria-label="Like" className="flex flex-col items-center text-white">
          <motion.span whileTap={{ scale: 0.8 }}><Heart size={32} className={isLiked ? "text-[#ef4444]" : "text-white"} fill={isLiked ? "#ef4444" : "rgba(0,0,0,0.25)"} strokeWidth={isLiked ? 0 : 2} /></motion.span>
          <span className="text-[12px] font-semibold drop-shadow">Like</span>
        </button>
        <button type="button" onClick={() => { flip(done, setDone, "kgf:learn:done", p.id); if (!isDone) click("pick"); }} aria-pressed={isDone} aria-label="Mark as learned" className="flex flex-col items-center text-white">
          <CircleCheck size={32} className={isDone ? "text-[#22c55e]" : "text-white"} />
          <span className="text-[12px] font-semibold drop-shadow">{isDone ? "Learned" : "Learned?"}</span>
        </button>
        <button type="button" onClick={() => openRead(p.id)} aria-label="Read" className="flex flex-col items-center text-white">
          <MessageCircle size={30} fill="rgba(0,0,0,0.25)" />
          <span className="text-[12px] font-semibold drop-shadow">Read</span>
        </button>
        <button type="button" onClick={() => flip(saved, setSaved, "kgf:learn:saved", p.id)} aria-pressed={isSaved} aria-label="Save" className="flex flex-col items-center text-white">
          <Bookmark size={28} className={isSaved ? "text-[#facc15]" : "text-white"} fill={isSaved ? "#facc15" : "rgba(0,0,0,0.25)"} strokeWidth={isSaved ? 0 : 2} />
          <span className="text-[12px] font-semibold drop-shadow">Save</span>
        </button>
        <button type="button" onClick={() => share(p)} aria-label="Share" className="flex flex-col items-center text-white">
          <Share2 size={28} />
          <span className="text-[12px] font-semibold drop-shadow">Share</span>
        </button>
      </div>
    );
  };

  const readPost = read ? buildLearnFeed({ ...DEFAULT_LEARN }).find((p) => p.id === read) ?? feed.find((p) => p.id === read) ?? null : null;
  const sheetBody = (p: LearnPost) => {
    if (p.kind === "end") return null;
    const t = p.topic;
    const ph = PHASE.get(t.phase);
    const siblings = liveResources(t).filter((r) => p.kind !== "res" || r.id !== p.r.id);
    return (
      <>
        {p.kind === "res" ? (
          <>
            <h2 className="font-display text-xl font-black leading-snug text-white">{p.r.title}</h2>
            <p className="mt-1.5 text-sm text-white/80">{p.r.creator} · {FORMAT_LABEL[p.r.format]} · {accessLabel(p.r)}</p>
            <p className="mt-1 text-xs text-white/65">On the AI Roadmap{p.r.status === "ok" && checkedOn ? ` · link checked ${checkedOn}` : ""}</p>
            <a href={p.r.url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-black">Open on {opensOn(p.r)} <ExternalLink size={14} /></a>
            <h3 className="mt-6 text-[13px] font-bold uppercase tracking-wider text-white/70">Part of: {t.topic}</h3>
          </>
        ) : (
          <h2 className="font-display text-2xl font-black leading-tight text-white">{t.topic}</h2>
        )}
        <p className="mt-1.5 text-xs font-semibold text-white/70">Week {t.week} · Phase {ph?.n}: {ph?.label} · <span className="capitalize">{t.difficulty}</span></p>
        <p className="mt-2 text-[15px] leading-relaxed text-white/90">{t.description}</p>
        {t.proTips && <p className="mt-3 rounded-2xl bg-white/[0.06] p-3 text-[14px] leading-relaxed text-white/90"><b>Pro tip:</b> {t.proTips}</p>}
        {t.tools && <p className="mt-3 text-[14px] leading-relaxed text-white/80"><b className="text-white">Tools:</b> {t.tools}</p>}
        {siblings.length > 0 && (
          <section className="mt-5">
            <h3 className="text-[13px] font-bold uppercase tracking-wider text-white/70">{p.kind === "res" ? "Also in this topic" : "In this topic"} · {siblings.length}</h3>
            <ul className="mt-2 space-y-1">
              {siblings.map((r) => {
                const Icon = FORMAT_ICON[r.format];
                return (
                  <li key={r.id}>
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2.5 rounded-xl p-2 text-[14px] leading-snug text-white/90 hover:bg-white/[0.07]">
                      <Icon size={16} className="mt-0.5 shrink-0 text-white/65" aria-hidden={true} />
                      <span className="min-w-0"><span className="block">{r.title}</span><span className="block text-[12px] text-white/60">{r.creator} · {accessLabel(r)}</span></span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </>
    );
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
      <div className="flex shrink-0 items-center justify-end px-4 pb-1 pt-3">
        <button type="button" onClick={closeRead} aria-label="Back to the feed" className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"><Close size={18} /></button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6" onPointerDownCapture={(ev) => ev.stopPropagation()}>{sheetBody(readPost)}</div>
      <div className="flex shrink-0 gap-2 border-t border-white/10 p-3">
        <button type="button" onClick={closeRead} className="flex-1 rounded-full bg-white/10 py-3 text-sm font-bold text-white hover:bg-white/15">Back to the feed</button>
        <a href="/notebook/ai/roadmap" className="flex-1 rounded-full bg-white py-3 text-center text-sm font-bold text-black">See the roadmap</a>
      </div>
    </motion.aside>
  );

  const tuneBadge = changed > 0 && <span className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[#ef4444] px-1 text-[11px] font-bold text-white">{changed}</span>;
  const header = (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-30 bg-gradient-to-b from-black/90 via-black/60 to-transparent pb-5 pt-3">
      <div className="pointer-events-auto flex items-center justify-between gap-1.5 px-2.5">
        <a href="/notebook/ai/roadmap" aria-label="Back to the AI Roadmap" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-black/40 text-white max-[349px]:hidden"><ArrowLeft size={20} /></a>
        <ModeTabs mode="learn" />
        <ViewToggle view={view} onChange={(v) => { click("pick"); setPrefs({ view: v }); }} />
        <button type="button" onClick={() => setSearching(true)} aria-label="Search" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-black/40 text-white"><Search size={18} /></button>
        <button type="button" onClick={() => setSettings(true)} aria-label={`Tune your feed${changed ? `: ${changed} changed` : ""}`} className="flex h-9 shrink-0 items-center gap-1 rounded-full bg-black/40 px-2.5 text-[13px] font-bold text-white lg:hidden">
          <SlidersHorizontal size={16} />
          {tuneBadge}
        </button>
      </div>
      <div className="pointer-events-auto mt-2">
        <TopicTuner items={stations} index={station} onPick={tune} click={click} onEdit={() => setSettings(true)} editLabel="+ Topics" label="Roadmap phases: drag to focus the feed" />
      </div>
      <p className="mt-1.5 truncate px-3 text-[11px] font-semibold text-white/85">
        {here ? <>{herePhase ? `Phase ${herePhase.n}` : ""} · {here.topic} · </> : null}{current + 1} of {feed.length}
      </p>
    </div>
  );

  const scrollView = (
    <div ref={scroller} onScroll={onScroll} onPointerDown={onPointerDown} onPointerUp={onPointerUp} role="feed" aria-busy={!ready} className="kgf-body h-[100dvh] snap-y snap-mandatory overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {feed.map((p, i) => (
        <article key={p.id} id={p.id} aria-posinset={i + 1} aria-setsize={feed.length} aria-label={p.kind === "res" ? p.r.title : p.kind === "topic" ? p.topic.topic : "End of the feed"} className="relative h-[100dvh] snap-start snap-always overflow-hidden">
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

  const swipeView = (
    <div className="kgf-body absolute inset-x-0 bottom-0 top-[136px] px-3 pb-28" style={{ "--kgf-top": "32px", "--kgf-bottom": "150px", "--kgf-rail": "20px" } as React.CSSProperties}>
      <div className="relative h-full">
        {feed[current + 1] && (
          <div className="absolute inset-0 translate-y-3 scale-[0.94] overflow-hidden rounded-[28px] opacity-60" aria-hidden="true">
            {stage(feed[current + 1], current + 1)}
          </div>
        )}
        <AnimatePresence initial={false} custom={dir}>
          {post && (
            <SwipeTop key={post.id} dir={dir} canDrag onSwipe={swipe} onTap={() => post.kind !== "end" && openRead(post.id)}>
              {stage(post, current)}
              {caption(post, true)}
            </SwipeTop>
          )}
        </AnimatePresence>
      </div>
      <div className="absolute inset-x-0 bottom-5 flex items-center justify-center gap-4" data-no-tap>
        <button type="button" onClick={() => go(current - 1)} disabled={current === 0} aria-label="Back one card" className="grid h-12 w-12 place-items-center rounded-full bg-white/10 text-[#facc15] disabled:opacity-30"><RotateCcw size={20} /></button>
        <button type="button" onClick={() => swipe(-1)} disabled={current >= feed.length - 1} aria-label="Skip" className="grid h-16 w-16 place-items-center rounded-full bg-white text-[#64748b] shadow-xl transition active:scale-90 disabled:opacity-30"><Close size={30} strokeWidth={3} /></button>
        <button type="button" onClick={() => swipe(1)} disabled={current >= feed.length - 1} aria-label="Like and next" className="grid h-16 w-16 place-items-center rounded-full bg-white shadow-xl transition active:scale-90 disabled:opacity-30"><Heart size={28} fill="#ef4444" strokeWidth={0} /></button>
        <button type="button" onClick={() => post && post.kind !== "end" && openRead(post.id)} aria-label="Read" className="grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white"><MessageCircle size={20} /></button>
      </div>
    </div>
  );

  // The panel: one control per decision, and it always says what is on.
  const summary = (
    <div aria-live="polite" className="rounded-2xl border border-white/[0.07] bg-[#15151a] p-4">
      <p className="flex items-baseline gap-2"><span className="font-display text-[40px] font-bold leading-none tracking-tight text-white">{items}</span><span className="text-[14px] text-white/80">resources in your feed</span></p>
      <div className="mt-2.5 flex flex-wrap gap-1.5 text-[12px] font-semibold text-white/90">
        <span className="rounded-full bg-white/[0.08] px-2.5 py-1">{topicsOn} of {LEARN_TOPICS.length} topics</span>
        <span className="rounded-full bg-white/[0.08] px-2.5 py-1">{formatsOn} of {FORMATS.length} formats</span>
        {prefs.freeOnly && <span className="rounded-full bg-white/[0.08] px-2.5 py-1">Free only</span>}
      </div>
      {prefs.only && (
        <div className="mt-2.5 flex items-center justify-between gap-2 rounded-xl border border-[#ef4444]/40 bg-[#ef4444]/10 py-1.5 pl-3 pr-1.5">
          <span className="min-w-0 truncate text-[13px] text-white">Only: <b>{LEARN_TOPICS.find((t) => t.id === prefs.only)?.topic}</b></span>
          <button type="button" onClick={() => { click("tick"); setPrefs({ only: null }); }} className="min-h-[36px] shrink-0 rounded-full bg-white/[0.12] px-3 text-[12px] font-semibold text-white">Show all</button>
        </div>
      )}
    </div>
  );
  const searchBox = (
    <button type="button" onClick={() => setSearching(true)} className="flex min-h-[42px] w-full items-center gap-2 rounded-xl border border-white/[0.12] bg-[#15151a] px-3 text-left text-[14px] text-white/65 hover:bg-white/[0.07]">
      <Search size={16} aria-hidden="true" /> Search topics, videos, books, news
    </button>
  );
  const lists = (k: string) => (
    <>
      <PanelSection id={`${k}-level`} title="Level" summary={prefs.levels.length ? `${prefs.levels.length} of ${LEVELS.length} on` : "All"}>
        <div className="flex flex-wrap gap-1.5 px-2">
          {LEVELS.map((l) => (
            <Chip key={l.id} on={!prefs.levels.length || prefs.levels.includes(l.id)} onClick={() => toggleLevel(l.id)}>{l.label}</Chip>
          ))}
        </div>
      </PanelSection>
      <PanelSection id={`${k}-format`} title="Format" hint="how you want to learn" summary={`${formatsOn} of ${FORMATS.length} on`}>
        <ul>
          {FORMATS.map((f) => {
            const Icon = FORMAT_ICON[f.id];
            return (
              <SwitchRow
                key={f.id}
                id={`${k}-fmt-${f.id}`}
                on={!prefs.formats.length || prefs.formats.includes(f.id)}
                label={f.plural}
                icon={<Icon size={16} className="shrink-0 text-white/75" aria-hidden={true} />}
                count={countFor({ formats: [f.id] })}
                onToggle={() => toggleFormat(f.id)}
                onOnly={() => { click("pick"); setPrefs({ formats: [f.id] }); }}
              />
            );
          })}
          <SwitchRow id={`${k}-free`} on={prefs.freeOnly} label="Free only" onToggle={() => { click("tick"); setPrefs({ freeOnly: !prefs.freeOnly }); }} />
        </ul>
      </PanelSection>
      <PanelSection id={`${k}-topics`} title="Topics" hint="in learning order" summary={`${topicsOn} of ${LEARN_TOPICS.length} on`}>
        {LEARN_PHASES.filter((p) => prefs.phase === "all" || p.id === prefs.phase).map((p) => {
          const ts = LEARN_TOPICS.filter((t) => t.phase === p.id);
          return (
            <PanelSection key={p.id} id={`${k}-ph-${p.id}`} title={`${p.n}. ${p.label}`} summary={`${ts.filter((t) => !prefs.off.includes(t.id)).length} of ${ts.length}`} defaultOpen={prefs.phase === p.id || here?.phase === p.id}>
              <ul>
                {ts.map((t) => {
                  const res = liveResources(t).filter((r) => resourceFits(r, prefs));
                  return (
                    <ToggleRow
                      key={t.id}
                      checked={!prefs.off.includes(t.id)}
                      label={t.topic}
                      count={res.length}
                      seen={res.filter((r) => seenSet.has(r.id)).length}
                      focused={prefs.only === t.id}
                      dim={Boolean(prefs.only) && prefs.only !== t.id}
                      onToggle={() => toggleTopic(t.id)}
                      onOnly={() => { click("pick"); setPrefs({ only: t.id }); }}
                    />
                  );
                })}
              </ul>
            </PanelSection>
          );
        })}
      </PanelSection>
    </>
  );
  const focus = (
    <section aria-label="Focus on one phase" className="px-2">
      <p className="mb-1.5 flex items-baseline justify-between text-[12px] font-semibold uppercase tracking-wider text-white/65">Focus <span className="text-[11px] font-normal normal-case tracking-normal text-white/55">Optional</span></p>
      <FocusDial items={stations} index={station} onPick={tune} click={click} meta={`${stations[station]?.count ?? 0} resources${stations[station]?.seen ? ` · ${stations[station]?.seen} seen` : ""}`} />
    </section>
  );
  const resetAll = () => { click("stop"); setPrefs({ ...DEFAULT_LEARN, sound: prefs.sound, view }); };
  const deck = (
    <aside className={`h-full w-[340px] shrink-0 flex-col gap-5 overflow-y-auto border-r border-white/[0.06] px-3 py-5 ${readPost ? "hidden xl:flex" : "hidden lg:flex"}`} aria-label="Tune your feed">
      <div className="flex items-start justify-between gap-3 px-2">
        <div>
          <h2 className="font-display text-[22px] font-bold leading-tight text-white">Tune your feed</h2>
          <p className="mt-0.5 text-[13px] text-white/70">The AI Roadmap, in learning order.</p>
        </div>
        <button type="button" onClick={() => setPrefs({ sound: !prefs.sound })} aria-pressed={prefs.sound} aria-label={prefs.sound ? "Dial clicks on" : "Dial clicks off"} className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/[0.12] text-white/80 hover:bg-white/10">
          {prefs.sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
      </div>
      <div className="space-y-3 px-2">{summary}{searchBox}</div>
      {focus}
      {lists("deck")}
      <button type="button" onClick={resetAll} className="self-start px-2 text-[13px] font-semibold text-white/70 hover:text-white">Reset to everything</button>
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
            <div className="-mx-2">{focus}</div>
            <div className="-mx-2 space-y-4">{lists("sheet")}</div>
            <button type="button" onClick={resetAll} className="text-sm font-semibold text-white/75 underline-offset-4 hover:underline">Reset to everything</button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // First visit: ask where to start before any post. The feed then shows only that.
  const finish = (patch?: Partial<LearnPrefs>) => {
    try {
      window.localStorage.setItem(ONBOARDED, "1");
    } catch {
      /* private mode: the picker may return next visit */
    }
    setPrefs({ ...patch });
    click("pick");
    setOnboard(false);
    document.documentElement.classList.remove("kgf-new");
  };
  const picker = (
    <div className="kgf-onboard absolute inset-0 z-[60] flex-col bg-[#0b0d12]" data-open={onboard ? "true" : "false"} role="dialog" aria-modal="true" aria-label="What do you want to learn?">
      <div className="flex-1 overflow-y-auto px-5 pb-6 pt-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#f87171]">Learn · The AI Roadmap</p>
        <h2 className="mt-2 font-display text-3xl font-black leading-tight">What do you want to learn?</h2>
        <p className="mt-3 text-sm text-white/80">Everything on the roadmap, in learning order. Your feed shows only what you pick, never random posts.</p>
        <h3 className="mt-6 font-display text-lg font-black">Your level</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {LEVELS.map((l) => <Chip key={l.id} on={!prefs.levels.length || prefs.levels.includes(l.id)} onClick={() => toggleLevel(l.id)}>{l.label}</Chip>)}
        </div>
        <h3 className="mt-6 font-display text-lg font-black">How you learn best</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {FORMATS.map((f) => <Chip key={f.id} on={!prefs.formats.length || prefs.formats.includes(f.id)} count={countFor({ formats: [f.id] })} onClick={() => toggleFormat(f.id)}>{f.plural}</Chip>)}
          <Chip on={prefs.freeOnly} onClick={() => { click("tick"); setPrefs({ freeOnly: !prefs.freeOnly }); }}>Free only</Chip>
        </div>
        <h3 className="mt-6 font-display text-lg font-black">Where to start</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {stations.map((s, i) => <Chip key={s.id} on={i === station} count={s.count} onClick={() => { click("tick"); tune(i); }}>{s.label}</Chip>)}
        </div>
      </div>
      <div className="border-t border-white/10 p-4">
        <button type="button" disabled={!items} onClick={() => finish()} className="w-full rounded-full bg-white py-3.5 text-[15px] font-black text-black disabled:opacity-40">{items ? `Start learning: ${items} resources` : "Nothing matches yet: turn something on"}</button>
        <button type="button" onClick={() => finish({ ...DEFAULT_LEARN, sound: prefs.sound, view })} className="mt-2 w-full py-2 text-sm font-semibold text-white/75 hover:text-white">Show me everything</button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center overflow-hidden bg-black font-sans text-white" role="dialog" aria-modal="true" aria-label="Learn: the AI Roadmap as a feed" style={{ "--kgf-top": "128px", "--kgf-bottom": "150px", "--kgf-rail": "64px" } as React.CSSProperties}>
      <script dangerouslySetInnerHTML={{ __html: PREPAINT }} />
      <style>{`.kgf-wait .kgf-body{visibility:hidden}.kgf-onboard{display:none}.kgf-new .kgf-onboard,.kgf-onboard[data-open=true]{display:flex}`}</style>
      {backdrop && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={backdrop} alt="" aria-hidden="true" className="pointer-events-none absolute inset-0 hidden h-full w-full scale-110 object-cover opacity-30 blur-3xl sm:block" />
      )}
      <div className="relative flex h-full">
        {deck}
        <div className="relative h-[100dvh] w-screen overflow-hidden bg-black sm:w-[min(100vw,calc(100dvh*9/16))] sm:max-w-[480px] sm:shadow-2xl">
          {header}
          {feed.length ? (view === "scroll" ? scrollView : swipeView) : (
            <div className="kgf-body flex h-full flex-col items-center justify-center px-8 text-center">
              <p className="font-display text-2xl font-black text-white">Nothing matches your picks</p>
              <p className="mt-2 text-sm text-white/80">The feed never fills itself with random posts. Turn a topic, level or format back on.</p>
              <button type="button" onClick={resetAll} className="mt-4 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-black">Reset to everything</button>
            </div>
          )}
          <AnimatePresence>{!wide && sheet}</AnimatePresence>
          {settingsSheet}
          {picker}
          <AnimatePresence>
            {toast && (
              <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute bottom-24 left-1/2 z-[70] -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-black">{toast}</motion.p>
            )}
          </AnimatePresence>
          <p className="sr-only" aria-live="polite">{announce}</p>
        </div>
        <AnimatePresence>{wide && sheet}</AnimatePresence>
      </div>
      {view === "scroll" && feed.length > 0 && (
        <div className="absolute right-6 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-center gap-3 sm:flex">
          <button type="button" onClick={() => go(current - 1)} disabled={current === 0} aria-label="Previous post" className="grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-30"><ChevronUp size={24} /></button>
          <button type="button" onClick={() => go(current + 1)} disabled={current === feed.length - 1} aria-label="Next post" className="grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-30"><ChevronDown size={24} /></button>
        </div>
      )}
      <FeedSearch open={searching} onClose={() => setSearching(false)} />
    </div>
  );
}

