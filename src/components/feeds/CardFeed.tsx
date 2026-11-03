"use client";
/**
 * The feed shell for Learn, News and search results: one full-screen post at a time, Feed or Swipe, tap to read, a short
 * Tune panel. A story's own feed of sources (KnowledgeFeed) opens from a News card.
 *
 *  - Learn: everything on the AI Roadmap and in the AI Encyclopedia, in learning order. The reader's choices decide what.
 *  - News: every story, filed by subject, ranked by freshness and evidence (news-rank.ts), never by engagement.
 *  - Search: find a topic, then scroll every source on it, in social form.
 *
 * No blank screens: a video plays, a resource shows the picture its own page offers, a topic shows a wall of its sources,
 * and anything without a picture gets a designed cover. Rewards serve learning: a streak, "Learned", a finished topic.
 * Data loads on demand (/feeds/*.json), so the page stays light however large the catalog gets.
 */
import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Bookmark, ChevronDown, ChevronUp, CircleCheck, ExternalLink, Flame, Heart, MessageCircle, Play, RotateCcw, Search, Share2, SlidersHorizontal, Volume2, VolumeX, X as Close } from "lucide-react";
import type { LearnFormat, LearnLevel, LearnPhase, LearnTopic } from "@/data/learnCatalog";
import { DEFAULT_LEARN, FORMATS, LEVELS, buildLearnFeed, byId, resourceFits, resourcesOf, topicFits, youtubeEmbed, type LearnData, type LearnPrefs } from "@/lib/learn-feed";
import { KIND_LABELS, buildIndex, search, type SearchDoc, type SearchKind } from "@/lib/feed-search";
import type { StoryCard } from "@/lib/story-index";
import { Celebrate, Chip, ModeTabs, PanelSection, PlatformPicker, Poster, SwipeTop, SwitchRow, ToggleRow, TopicTuner, ViewToggle, store, useClicks, useStreak, useWide, type Station } from "@/components/feeds/controls";
import { FeedSearch } from "@/components/feeds/FeedSearch";

type Mode = "learn" | "news" | "search";

interface Card {
  id: string;
  kind: "intro" | "resource" | "story" | "end";
  title: string;
  kicker?: string;
  creator?: string;
  platform?: string;
  format?: string;
  image?: string;
  images?: string[];
  youtube?: { id?: string; list?: string };
  noEmbed?: boolean;
  /** Opens elsewhere. */
  url?: string;
  /** A page on this site. */
  href?: string;
  cta?: string;
  body?: string;
  tip?: string;
  tools?: string;
  access?: string;
  level?: string;
  topic?: LearnTopic;
  color?: string;
  emoji?: string;
  meta?: string[];
  stat?: { value: string; label: string };
  logos?: StoryCard["logos"];
  checked?: boolean;
}

interface NewsPrefs {
  subjects: string[];
  window: "all" | "7" | "30" | "365";
  sort: "ranked" | "newest";
}
const DEFAULT_NEWS: NewsPrefs = { subjects: [], window: "all", sort: "ranked" };
interface SharedPrefs {
  view: "scroll" | "swipe";
  sound: boolean;
}

const read = <T,>(k: string, fallback: T): T => {
  try {
    const v = JSON.parse(window.localStorage.getItem(k) || "null");
    return v && typeof v === "object" ? { ...fallback, ...v } : fallback;
  } catch {
    return fallback;
  }
};
const write = (k: string, v: unknown) => {
  try {
    window.localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* private mode: settings last for this visit */
  }
};

const accessLabel = (a?: string) => (a === "paid" ? "Paid" : a === "freemium" ? "Free tier" : "Free");
const formatLabel = (f?: string) => (f && KIND_LABELS[f as SearchKind] ? KIND_LABELS[f as SearchKind].one : "");
const opensOn = (c: Card) => c.platform || (c.url ? c.url.replace(/^https?:\/\/(www\.)?/, "").split("/")[0] : "");
const external = (u?: string) => Boolean(u && /^https?:/.test(u));
const NICE: Record<string, string> = { x: "X", youtube: "YouTube", tiktok: "TikTok", instagram: "Instagram", reddit: "Reddit", hackernews: "Hacker News", news: "News", web: "Official sites", binance: "Official sites" };
const phaseKicker = (t: LearnTopic, p?: LearnPhase) => (t.path === "roadmap" ? `Week ${t.week} · Phase ${p?.n}: ${p?.label}` : `AI Encyclopedia · ${p?.label ?? ""}`);

export function CardFeed({ mode }: { mode: Mode }) {
  const wide = useWide();
  const streak = useStreak();
  const [shared, setSharedState] = React.useState<SharedPrefs>({ view: "scroll", sound: true });
  const [lp, setLpState] = React.useState<LearnPrefs>(DEFAULT_LEARN);
  const [np, setNpState] = React.useState<NewsPrefs>(DEFAULT_NEWS);
  const [sq, setSq] = React.useState("");
  const [sKinds, setSKinds] = React.useState<SearchKind[]>([]);
  const [sPlatforms, setSPlatforms] = React.useState<string[]>([]);
  const [learn, setLearn] = React.useState<LearnData | null>(null);
  const [stories, setStories] = React.useState<StoryCard[] | null>(null);
  const [docs, setDocs] = React.useState<SearchDoc[] | null>(null);
  const [failed, setFailed] = React.useState(false);
  const [ready, setReady] = React.useState(false);
  const [current, setCurrent] = React.useState(0);
  const [dir, setDir] = React.useState(1);
  const [playing, setPlaying] = React.useState<{ id: string; muted: boolean; since: number; start: number } | null>(null);
  const [reading, setReading] = React.useState<string | null>(null);
  const [settings, setSettings] = React.useState(false);
  const [searching, setSearching] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);
  const [liked, setLiked] = React.useState<string[]>([]);
  const [saved, setSaved] = React.useState<string[]>([]);
  const [done, setDone] = React.useState<string[]>([]);
  const [seen, setSeen] = React.useState<string[]>([]);
  const [finished, setFinished] = React.useState<string[]>([]);
  const [party, setParty] = React.useState<{ title: string; sub: string } | null>(null);
  const [burst, setBurst] = React.useState<{ x: number; y: number; k: number } | null>(null);
  const [onboard, setOnboard] = React.useState(false);
  const scroller = React.useRef<HTMLDivElement>(null);
  const column = React.useRef<HTMLDivElement>(null);
  const press = React.useRef<{ x: number; y: number; t: number } | null>(null);
  const lastTap = React.useRef(0);
  const single = React.useRef<number | null>(null);
  const start = React.useRef<string | null>(null);
  const placed = React.useRef(false);
  const lastKey = React.useRef<string | null>(null);
  const lastTopic = React.useRef<string | null>(null);
  const visitOnly = React.useRef(false);
  const view = shared.view;
  const click = useClicks(shared.sound);
  const res = React.useMemo(() => (learn ? byId(learn) : new Map()), [learn]);
  const phaseOf = React.useMemo(() => new Map((learn?.phases ?? []).map((p) => [p.id, p])), [learn]);
  const K = `kgf:${mode === "search" ? "learn" : mode}`;

  const setShared = (patch: Partial<SharedPrefs>) =>
    setSharedState((p) => {
      const n = { ...p, ...patch };
      write("kgf:shared", n);
      return n;
    });
  const setLp = (patch: Partial<LearnPrefs>) =>
    setLpState((p) => {
      const n = { ...p, ...patch };
      if (!visitOnly.current) write("kgf:learn:prefs2", { ...n, only: null });
      return n;
    });
  const setNp = (patch: Partial<NewsPrefs>) =>
    setNpState((p) => {
      const n = { ...p, ...patch };
      write("kgf:news:prefs", n);
      return n;
    });

  // First load: saved settings, then what the address asks for.
  React.useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const v = q.get("view");
    setSharedState({ ...read<SharedPrefs>("kgf:shared", { view: "scroll", sound: true }), ...(v === "swipe" || v === "scroll" ? { view: v } : {}) });
    setLiked(store.get(`${K}:liked`));
    setSaved(store.get(`${K}:saved`));
    setDone(store.get(`${K}:done`));
    setSeen(store.get(`${K}:seen`));
    setFinished(store.get("kgf:learn:finished"));
    start.current = q.get("p");
    const fail = () => setFailed(true);
    const json = (r: Response) => {
      if (!r.ok) throw new Error(String(r.status));
      return r.json();
    };
    if (mode === "learn") {
      const saved = read<LearnPrefs>("kgf:learn:prefs2", DEFAULT_LEARN);
      const t = q.get("topic");
      const ph = q.get("phase");
      let base: LearnPrefs = { ...DEFAULT_LEARN, ...saved, only: null };
      if (t || start.current) {
        // A link or a search result opens exactly that, whatever the reader's own filters would hide: this visit only.
        visitOnly.current = true;
        base = { ...DEFAULT_LEARN, only: t };
      } else if (ph) base = { ...base, phase: ph };
      setLpState(base);
      let fresh = false;
      try {
        fresh = !t && !start.current && !ph && !window.localStorage.getItem("kgf:learn:prefs2") && !window.localStorage.getItem("kgf:learn:onboarded");
      } catch {
        /* storage blocked: no picker */
      }
      if (fresh) setOnboard(true);
      fetch("/feeds/learn.json").then(json).then(setLearn).catch(fail);
    } else if (mode === "news") {
      const s = q.get("subject");
      setNpState({ ...read<NewsPrefs>("kgf:news:prefs", DEFAULT_NEWS), ...(s ? { subjects: [s] } : {}) });
      fetch("/feeds/news.json").then(json).then((d: { stories: StoryCard[] }) => setStories(d.stories)).catch(fail);
    } else {
      setSq(q.get("q") ?? "");
      const k = q.get("kind") as SearchKind | null;
      if (k) setSKinds([k]);
      const pl = q.get("platform");
      if (pl) setSPlatforms([pl]);
      fetch("/feeds/search.json").then(json).then(setDocs).catch(fail);
    }
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Each mode's cards --------------------------------------------------------------------------------------------
  const learnPosts = React.useMemo(() => (learn ? buildLearnFeed(learn, lp, res) : []), [learn, lp, res]);
  const today = React.useMemo(() => new Date().toISOString().slice(0, 10), []);
  const storyFits = React.useCallback(
    (s: StoryCard, ignoreSubjects = false) => {
      if (np.window !== "all" && (Date.parse(today) - Date.parse(s.date)) / 86_400_000 > Number(np.window)) return false;
      return ignoreSubjects || !np.subjects.length || np.subjects.some((x) => s.subjects.includes(x));
    },
    [np, today]
  );
  const storyList = React.useMemo(() => {
    const list = (stories ?? []).filter((s) => storyFits(s));
    return np.sort === "newest" ? [...list].sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title)) : list;
  }, [stories, storyFits, np.sort]);
  const searchIndex = React.useMemo(() => (docs ? buildIndex(docs) : null), [docs]);
  const searchHits = React.useMemo(() => {
    if (!searchIndex) return [];
    if (sq.trim()) return search(searchIndex, sq, 3000).map((h) => h.doc);
    return (docs ?? []).filter((d) => sKinds.includes(d.kind));
  }, [searchIndex, sq, docs, sKinds]);
  const searchShown = React.useMemo(() => searchHits.filter((d) => (!sKinds.length || sKinds.includes(d.kind)) && (!sPlatforms.length || (d.platform && sPlatforms.includes(d.platform)))), [searchHits, sKinds, sPlatforms]);

  const cards: Card[] = React.useMemo(() => {
    if (mode === "learn") {
      const out: Card[] = learnPosts.map((p) => {
        const ph = phaseOf.get(p.topic.phase);
        if (p.kind === "topic") {
          return {
            id: p.id, kind: "intro", title: p.topic.topic, kicker: phaseKicker(p.topic, ph), body: p.topic.description, tip: p.topic.proTips, tools: p.topic.tools, level: p.topic.difficulty, images: p.images,
            topic: p.topic, color: ph?.color, emoji: p.topic.emoji, meta: [`${p.shown} ${p.shown === 1 ? "source" : "sources"}`, ...(p.topic.milestone ? ["Milestone"] : [])], href: p.topic.page, cta: p.topic.page ? "Read the full concept" : undefined,
          };
        }
        const r = p.r;
        return { id: r.id, kind: "resource", title: r.title, creator: r.creator, platform: r.platform, format: r.format, image: r.image, youtube: r.youtube, noEmbed: r.noEmbed, url: external(r.url) ? r.url : undefined, href: external(r.url) ? undefined : r.url, access: r.access ?? "free", topic: p.topic, checked: r.status === "ok", level: p.topic.difficulty };
      });
      return out.length ? [...out, { id: "end", kind: "end", title: "" }] : out;
    }
    if (mode === "news") {
      const out: Card[] = storyList.map((s) => ({
        id: s.id, kind: "story", title: s.title, kicker: s.kicker, body: s.summary, image: s.image, youtube: s.video, stat: s.stat, logos: s.logos, meta: s.why, href: s.feedHref ?? s.href,
        cta: s.feedHref ? `See all ${s.sources} sources` : "Read the story", creator: s.kicker, platform: s.subjects[0],
      }));
      return out.length ? [...out, { id: "end", kind: "end", title: "" }] : out;
    }
    const out: Card[] = searchShown.map((d) => {
      if (d.kind === "topic") return { id: d.id, kind: "intro", title: d.title, kicker: d.sub, body: d.text, href: d.href, cta: "Open every source on this", color: "#ef4444", level: d.level };
      if (d.kind === "news" || d.kind === "person" || d.kind === "company") return { id: d.id, kind: "story", title: d.title, kicker: KIND_LABELS[d.kind].one, body: d.text?.slice(0, 280), image: d.thumb, href: d.href, cta: d.kind === "news" ? "Read the story" : "Open", meta: d.sub ? [d.sub] : [], creator: d.sub };
      if (d.kind === "post") return { id: d.id, kind: "resource", title: d.title, creator: d.sub, platform: NICE[d.platform ?? ""] ?? d.platform, format: "post", image: d.thumb, url: d.url, href: d.href, body: d.text };
      return { id: d.id, kind: "resource", title: d.title, creator: d.sub?.split(" · ")[0], platform: d.platform, format: d.kind, image: d.thumb, youtube: d.youtube, noEmbed: d.noEmbed, url: external(d.url) ? d.url : undefined, href: d.href, access: d.free ? "free" : "paid" };
    });
    return out.length ? [...out, { id: "end", kind: "end", title: "" }] : out;
  }, [mode, learnPosts, phaseOf, storyList, searchShown]);

  const items = cards.filter((c) => c.kind !== "end" && c.kind !== "intro").length;
  const loaded = !failed && (mode === "learn" ? Boolean(learn) : mode === "news" ? Boolean(stories) : Boolean(docs));
  const post = cards[current] ?? cards[0];

  // --- The strip across the top --------------------------------------------------------------------------------------
  const countLearn = React.useCallback((patch: Partial<LearnPrefs>) => (learn ? buildLearnFeed(learn, { ...lp, ...patch, only: null }, res).filter((p) => p.kind === "res").length : 0), [learn, lp, res]);
  const stations: Station[] = React.useMemo(() => {
    if (mode === "learn" && learn) {
      return [{ id: "all", label: "Everything", count: countLearn({ phase: "all" }) }, ...learn.phases.map((p) => ({ id: p.id, label: p.path === "roadmap" ? `${p.n}. ${p.label}` : p.label, count: countLearn({ phase: p.id }) }))];
    }
    if (mode === "news" && stories) {
      const m = new Map<string, number>();
      stories.filter((s) => storyFits(s, true)).forEach((s) => s.subjects.forEach((x) => m.set(x, (m.get(x) ?? 0) + 1)));
      return [{ id: "all", label: "Top stories", count: stories.filter((s) => storyFits(s, true)).length }, ...[...m.entries()].sort((a, b) => b[1] - a[1]).map(([x, n]) => ({ id: x, label: x, count: n }))];
    }
    if (mode === "search") {
      const m = new Map<string, number>();
      searchHits.forEach((d) => m.set(d.kind, (m.get(d.kind) ?? 0) + 1));
      return [{ id: "all", label: "All", count: searchHits.length }, ...[...m.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => ({ id: k, label: KIND_LABELS[k as SearchKind].many, count: n }))];
    }
    return [];
  }, [mode, learn, stories, countLearn, storyFits, searchHits]);
  const stationNow = mode === "learn" ? lp.phase : mode === "news" ? np.subjects[0] ?? "all" : sKinds[0] ?? "all";
  const station = Math.max(0, stations.findIndex((s) => s.id === stationNow));
  const tune = (i: number) => {
    const id = stations[Math.max(0, Math.min(stations.length - 1, i))]?.id ?? "all";
    if (mode === "learn") setLp({ phase: id, only: null });
    else if (mode === "news") setNp({ subjects: id === "all" ? [] : [id] });
    else setSKinds(id === "all" ? [] : [id as SearchKind]);
  };
  const feedKey = `${mode}|${JSON.stringify(lp)}|${JSON.stringify(np)}|${sq}|${sKinds.join()}|${sPlatforms.join()}|${loaded}`;

  // --- Placing the feed ----------------------------------------------------------------------------------------------
  // Once the data is in: go to the linked post, or pick up at the first post not yet seen.
  React.useEffect(() => {
    if (!ready || !loaded || placed.current || !cards.length) return;
    placed.current = true;
    lastKey.current = feedKey;
    document.body.style.overflow = "hidden";
    let at = start.current ? cards.findIndex((c) => c.id === start.current || c.id === `t-${start.current}`) : -1;
    if (at < 0 && mode === "learn" && !start.current && !lp.only && !onboard) {
      const first = cards.findIndex((c) => c.kind !== "end" && !seen.includes(c.id));
      if (first > 0) {
        at = first;
        setToast("Picked up where you left off");
        window.setTimeout(() => setToast(null), 2200);
      }
    }
    if (at > 0) {
      setCurrent(at);
      requestAnimationFrame(() => scroller.current?.scrollTo({ top: at * scroller.current.clientHeight, behavior: "auto" }));
    }
    document.documentElement.classList.remove("kgf-new");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, loaded, cards]);
  React.useEffect(
    () => () => {
      document.body.style.overflow = "";
    },
    []
  );

  // New choices, new feed: back to its first post.
  React.useEffect(() => {
    if (!placed.current || lastKey.current === null || lastKey.current === feedKey) return;
    lastKey.current = feedKey;
    setCurrent(0);
    setDir(1);
    setPlaying(null);
    scroller.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [feedKey]);

  // The address keeps the place, so a link can be shared and back lands here.
  React.useEffect(() => {
    if (!placed.current) return;
    const url = new URL(window.location.href);
    const id = cards[current]?.id;
    if (id && id !== "end" && current > 0) url.searchParams.set("p", id);
    else url.searchParams.delete("p");
    if (mode === "learn") {
      if (lp.only) url.searchParams.set("topic", lp.only);
      else url.searchParams.delete("topic");
    }
    if (view === "swipe") url.searchParams.set("view", "swipe");
    else url.searchParams.delete("view");
    if (url.href !== window.location.href) window.history.replaceState(window.history.state, "", url);
  }, [current, cards, lp.only, view, mode]);

  React.useEffect(() => {
    if (view !== "scroll") return;
    requestAnimationFrame(() => {
      const el = scroller.current;
      if (el) el.scrollTo({ top: current * el.clientHeight, behavior: "auto" });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  // Seen, finished topics, and the moment one is done.
  React.useEffect(() => {
    if (!placed.current || onboard) return;
    const c = cards[current];
    if (!c || c.kind === "end") return;
    let nextSeen = seen;
    if (!seen.includes(c.id)) {
      nextSeen = [...seen, c.id];
      setSeen(nextSeen);
      store.set(`${K}:seen`, nextSeen);
    }
    if (mode !== "learn") return;
    const tid = c.topic?.id ?? null;
    const prev = lastTopic.current;
    lastTopic.current = tid;
    if (prev && tid && prev !== tid && !finished.includes(prev) && learn) {
      const t = learn.topics.find((x) => x.id === prev);
      if (t && resourcesOf(t, res).every((r) => nextSeen.includes(r.id))) {
        const all = [...finished, prev];
        setFinished(all);
        store.set("kgf:learn:finished", all);
        setParty({ title: "Topic finished", sub: `${t.topic.split(" · ")[0]} · ${all.length} of ${learn.topics.length} topics` });
        click("pick");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, cards, onboard]);

  // A video plays by itself, muted, a moment after it is on screen, like every social feed. Not for someone who asked for less motion or less data.
  React.useEffect(() => {
    const c = cards[current];
    if (!c || !c.youtube || c.noEmbed || !youtubeEmbed(c.youtube, true) || onboard || reading || settings || searching) return;
    const calm = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches || (navigator as unknown as { connection?: { saveData?: boolean } }).connection?.saveData;
    if (calm) return;
    const t = window.setTimeout(() => setPlaying((p) => (p?.id === c.id ? p : { id: c.id, muted: true, since: Date.now(), start: 0 })), 650);
    return () => window.clearTimeout(t);
  }, [current, cards, onboard, reading, settings, searching]);

  // The next pictures load ahead, so scrolling never shows an empty frame.
  React.useEffect(() => {
    for (let i = current + 1; i <= current + 3; i++) {
      const src = cards[i]?.image;
      if (src) new window.Image().src = src;
    }
  }, [current, cards]);

  const go = React.useCallback(
    (i: number, behavior: ScrollBehavior = "smooth") => {
      const n = Math.max(0, Math.min(cards.length - 1, i));
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
    [cards.length, view, current]
  );
  const onScroll = (ev: React.UIEvent<HTMLDivElement>) => {
    const el = ev.currentTarget;
    const i = Math.max(0, Math.min(cards.length - 1, Math.round(el.scrollTop / Math.max(1, el.clientHeight))));
    if (i === current) return;
    setCurrent(i);
    setPlaying(null);
  };

  const openRead = React.useCallback((id: string) => {
    setReading(id);
    window.history.pushState({ ...(window.history.state ?? {}), kgfRead: id }, "", window.location.href);
  }, []);
  const closeRead = React.useCallback(() => {
    if ((window.history.state as { kgfRead?: string } | null)?.kgfRead) window.history.back();
    else setReading(null);
  }, []);
  React.useEffect(() => {
    const pop = () => setReading(null);
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
    return v;
  };
  const like = (c: Card, on?: boolean) => flip(liked, setLiked, `${K}:liked`, c.id, on);
  const share = async (c: Card) => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: c.title, url });
      else {
        await navigator.clipboard.writeText(url);
        say("Link copied");
      }
    } catch {
      /* the person closed the share sheet */
    }
  };
  const swipe = (d: 1 | -1) => {
    const c = cards[current];
    if (!c) return;
    if (d === 1) like(c, true);
    click("tick");
    if (current < cards.length - 1) {
      setDir(d);
      setCurrent(current + 1);
      setPlaying(null);
    }
  };

  const onPointerDown = (ev: React.PointerEvent) => {
    press.current = (ev.target as HTMLElement).closest("button,a,iframe,input,[data-no-tap]") ? null : { x: ev.clientX, y: ev.clientY, t: Date.now() };
  };
  const onPointerUp = (ev: React.PointerEvent) => {
    const d = press.current;
    press.current = null;
    const c = cards[current];
    if (!d || !c || c.kind === "end") return;
    if (Math.abs(ev.clientX - d.x) > 10 || Math.abs(ev.clientY - d.y) > 10 || Date.now() - d.t > 500) return;
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (single.current) window.clearTimeout(single.current);
      single.current = null;
      lastTap.current = 0;
      like(c, true);
      const r = column.current?.getBoundingClientRect();
      setBurst({ x: ev.clientX - (r?.left ?? 0), y: ev.clientY - (r?.top ?? 0), k: now });
      return;
    }
    lastTap.current = now;
    single.current = window.setTimeout(() => {
      single.current = null;
      openRead(c.id);
    }, 300);
  };

  React.useEffect(() => {
    const k = (ev: KeyboardEvent) => {
      if ((ev.target as HTMLElement | null)?.closest?.("[role=slider],input,textarea")) return;
      if (onboard || searching) return;
      if (reading || settings) {
        if (ev.key === "Escape") {
          if (reading) closeRead();
          else setSettings(false);
        }
        return;
      }
      const c = cards[current];
      if (ev.key === "/") setSearching(true);
      else if (!c) return;
      else if (view === "swipe") {
        if (ev.key === "ArrowRight") swipe(1);
        else if (ev.key === "ArrowLeft") swipe(-1);
        else if (ev.key === "ArrowUp" || ev.key === "Backspace") go(current - 1);
        else if ((ev.key === "Enter" || ev.key === "r") && c.kind !== "end") openRead(c.id);
        else return;
      } else if (ev.key === "ArrowDown" || ev.key === "j") go(current + 1);
      else if (ev.key === "ArrowUp" || ev.key === "k") go(current - 1);
      else if ((ev.key === "Enter" || ev.key === "r") && c.kind !== "end") openRead(c.id);
      else if (ev.key === "l") like(c);
      else return;
      ev.preventDefault();
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  });

  // --- What a post looks like ----------------------------------------------------------------------------------------
  const nextStation = stations[station + 1];
  const stage = (c: Card, i: number) => {
    if (c.kind === "end") {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center px-6 pb-[var(--kgf-bottom)] pt-[var(--kgf-top)] text-center" style={{ background: "radial-gradient(100% 70% at 50% 30%, #7f1d1d, #07080c)" }}>
          <p className="font-display text-3xl font-black text-white">{mode === "news" ? "You're caught up" : mode === "search" ? "That's everything on it" : lp.only ? "That's this topic" : "You reached the end of your picks"}</p>
          <p className="mt-2 text-sm text-white/85">{items} {mode === "news" ? "stories" : "sources"} in this feed.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {mode === "learn" && lp.only && <button type="button" onClick={() => { click("pick"); setLp({ only: null }); }} className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-black">Back to everything</button>}
            {mode === "learn" && !lp.only && lp.phase !== "all" && nextStation && <button type="button" onClick={() => { click("pick"); tune(station + 1); }} className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-black">Next: {nextStation.label}</button>}
            <button type="button" onClick={() => setSearching(true)} className="rounded-full bg-white/15 px-5 py-2.5 text-sm font-semibold text-white">Search something else</button>
            <button type="button" onClick={() => go(0)} className="rounded-full bg-white/15 px-5 py-2.5 text-sm font-semibold text-white">Start again</button>
          </div>
        </div>
      );
    }
    if (c.kind === "intro") {
      return (
        <div className="relative h-full w-full overflow-hidden bg-black">
          {c.images && c.images.length > 0 ? (
            <div className={`absolute inset-0 grid opacity-55 ${c.images.length > 3 ? "grid-cols-2 grid-rows-3" : "grid-cols-1"}`} aria-hidden="true">
              {c.images.slice(0, c.images.length > 3 ? 6 : 3).map((src, k) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={k} src={src} alt="" className="h-full w-full object-cover" />
              ))}
            </div>
          ) : (
            <span className="absolute -right-6 top-[18%] select-none text-[170px] leading-none opacity-30" aria-hidden="true">{c.emoji || "✦"}</span>
          )}
          <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, rgba(0,0,0,0.45) 0%, ${c.color ?? "#ef4444"}55 45%, rgba(0,0,0,0.92) 100%)` }} aria-hidden="true" />
          <div className="relative flex h-full flex-col justify-center pb-[var(--kgf-bottom)] pl-6 pr-[var(--kgf-rail)] pt-[var(--kgf-top)]">
            <p className="text-[12px] font-bold uppercase tracking-wider text-white/90">{c.kicker}</p>
            <h2 className="mt-2 font-display text-[34px] font-black leading-[1.05] text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.6)]">{c.emoji ? `${c.emoji} ` : ""}{c.title}</h2>
            {c.body && <p className="mt-3 line-clamp-5 text-[15px] leading-snug text-white/95 [text-shadow:0_1px_6px_rgba(0,0,0,0.7)]">{c.body}</p>}
            <p className="mt-4 flex flex-wrap items-center gap-1.5 text-[12px] font-semibold text-white">
              {c.level && <span className="rounded bg-black/45 px-2 py-0.5 capitalize backdrop-blur">{c.level}</span>}
              {c.meta?.map((m) => <span key={m} className={`rounded px-2 py-0.5 backdrop-blur ${m === "Milestone" ? "bg-[#ef4444]" : "bg-black/45"}`}>{m}</span>)}
            </p>
            {c.cta && c.href && mode === "search" && <a href={c.href} className="mt-4 inline-flex w-fit items-center rounded-full bg-white px-4 py-2.5 text-sm font-bold text-black" data-no-tap>{c.cta}</a>}
          </div>
        </div>
      );
    }
    if (c.kind === "story") {
      return (
        <div className="relative h-full w-full overflow-hidden bg-black">
          {c.image ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.image} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-45 blur-2xl" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.image} alt="" className="absolute inset-x-0 top-[var(--kgf-top)] max-h-[40%] w-full object-contain" />
            </>
          ) : (
            <div className="absolute inset-0" style={{ background: "radial-gradient(90% 60% at 20% 15%, #7f1d1d, transparent), radial-gradient(90% 60% at 100% 90%, #1e3a8a, #07080c)" }} aria-hidden="true" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/35 to-black/90" aria-hidden="true" />
          <div className="relative flex h-full flex-col justify-end pb-[calc(var(--kgf-bottom)-40px)] pl-5 pr-[var(--kgf-rail)] pt-[var(--kgf-top)]">
            {c.logos && (
              <div className="mb-3 flex items-center gap-2 text-[13px] font-bold text-white">
                {[c.logos.left, c.logos.right].map((l, k) => (
                  <span key={k} className="flex items-center gap-1.5 rounded-lg bg-white px-2 py-1 text-black">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={l.onLight} alt={l.name} className="h-5 w-auto" />
                  </span>
                ))}
              </div>
            )}
            {!c.image && c.stat && (
              <div className="mb-3">
                <p className="font-display text-[52px] font-black leading-none text-white">{c.stat.value}</p>
                <p className="mt-1 text-[13px] font-semibold text-white/85">{c.stat.label}</p>
              </div>
            )}
            {c.kicker && <p className="text-[12px] font-bold uppercase tracking-wider text-[#fca5a5]">{c.kicker}</p>}
            <h2 className="mt-1.5 line-clamp-4 font-display text-[28px] font-black leading-[1.08] text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.6)]">{c.title}</h2>
            {c.body && <p className="mt-2 line-clamp-3 text-[14px] leading-snug text-white/90">{c.body}</p>}
            {c.meta && c.meta.length > 0 && <p className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-semibold text-white">{c.meta.slice(0, 4).map((m) => <span key={m} className={`rounded px-1.5 py-0.5 ${m === "Live" ? "bg-[#ef4444]" : "bg-white/15"}`}>{m}</span>)}</p>}
            {c.href && <a href={c.href} className="mt-3 inline-flex w-fit items-center rounded-full bg-white px-4 py-2.5 text-sm font-bold text-black" data-no-tap>{c.cta}</a>}
          </div>
        </div>
      );
    }
    const embed = playing?.id === c.id && i === current ? youtubeEmbed(c.youtube, playing.muted, playing.start) : null;
    return (
      <div className="relative h-full w-full overflow-hidden bg-black">
        {c.image ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.image} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-55 blur-2xl" />
            <div className={`absolute inset-0 flex items-center justify-center ${c.format === "book" ? "px-16" : ""}`}>
              {embed ? (
                <iframe key={`${c.id}-${playing?.muted}`} title={c.title} src={embed} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen className="aspect-video w-full border-0" data-no-tap />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.image} alt={c.title} className={c.format === "book" ? "max-h-[55%] rounded-md object-contain shadow-2xl" : "w-full object-contain"} onError={(ev) => ((ev.currentTarget.style.display = "none"))} />
              )}
            </div>
          </>
        ) : embed ? (
          <div className="absolute inset-0 flex items-center bg-black">
            <iframe key={`${c.id}-${playing?.muted}`} title={c.title} src={embed} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen className="aspect-video w-full border-0" data-no-tap />
          </div>
        ) : (
          <Poster title={c.title} creator={c.creator} format={c.format} platform={c.platform} />
        )}
        {c.youtube && !embed && youtubeEmbed(c.youtube, false) && !c.noEmbed && (
          <button type="button" onClick={() => setPlaying({ id: c.id, muted: false, since: Date.now(), start: 0 })} aria-label={`Play ${c.title}`} className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/60 text-white ring-2 ring-white/70 backdrop-blur">
            <Play size={26} fill="currentColor" />
          </button>
        )}
        {embed && playing?.muted && (
          <button
            type="button"
            onClick={() => setPlaying((p) => (p ? { ...p, muted: false, start: Math.floor((Date.now() - p.since) / 1000) } : p))}
            className="absolute left-1/2 top-[calc(50%+min(29vw,140px))] z-20 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-black/75 px-3.5 py-2 text-[13px] font-bold text-white ring-1 ring-white/30 backdrop-blur"
            data-no-tap
          >
            <VolumeX size={15} /> Tap for sound
          </button>
        )}
        {c.url && (c.noEmbed || !c.youtube) && (
          <a href={c.url} target="_blank" rel="noopener noreferrer" className="absolute bottom-[calc(var(--kgf-bottom)+4px)] left-5 z-20 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-black shadow-xl" data-no-tap>
            Open on {opensOn(c)} <ExternalLink size={14} />
          </a>
        )}
        {!c.url && c.href && (
          <a href={c.href} className="absolute bottom-[calc(var(--kgf-bottom)+4px)] left-5 z-20 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-black shadow-xl" data-no-tap>Open</a>
        )}
      </div>
    );
  };

  const caption = (c: Card, small = false) => {
    if (c.kind === "end" || c.kind === "story") return null;
    return (
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/90 via-black/55 to-transparent px-3 pb-5 pl-4 pr-16 pt-16">
        <div className="pointer-events-auto">
          {c.kind === "resource" && (
            <>
              <div className="flex items-center gap-2">
                <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full bg-white text-[13px] font-black text-black" aria-hidden="true">{(c.creator || c.platform || "?").slice(0, 1).toUpperCase()}</span>
                <p className="min-w-0 truncate text-[15px] font-bold text-white">{c.creator || c.platform}</p>
              </div>
              <p className="mt-1.5 line-clamp-2 text-[14px] leading-snug text-white">{c.title}</p>
            </>
          )}
          {c.kind === "intro" && c.tip && <p className="line-clamp-3 text-[13px] leading-snug text-white/95"><b>{c.topic?.path === "encyclopedia" ? "Used in:" : "Pro tip:"}</b> {c.tip}</p>}
          <button type="button" onClick={() => openRead(c.id)} className="mt-0.5 text-[13px] font-semibold text-white/90">Read more</button>
          {!small && (
            <p className="mt-1 truncate text-[12px] text-white/85">
              {c.topic && <span className="mr-1.5 rounded bg-white/90 px-1.5 py-px text-[10px] font-bold text-black">{c.topic.path === "encyclopedia" ? "AI Encyclopedia" : "AI Roadmap"}</span>}
              {c.kind === "resource" ? [formatLabel(c.format), c.format !== "post" ? accessLabel(c.access) : null, c.topic?.topic.split(" · ")[0]].filter(Boolean).join(" · ") : null}
            </p>
          )}
        </div>
      </div>
    );
  };

  const rail = (c: Card) => {
    if (c.kind === "end") return null;
    const isLiked = liked.includes(c.id);
    const isSaved = saved.includes(c.id);
    const isDone = done.includes(c.id);
    return (
      <div className="absolute bottom-28 right-2 z-20 flex flex-col items-center gap-4 [filter:drop-shadow(0_1px_3px_rgba(0,0,0,0.9))]" data-no-tap>
        <button type="button" onClick={() => like(c)} aria-pressed={isLiked} aria-label="Like" className="flex flex-col items-center text-white">
          <motion.span whileTap={{ scale: 0.8 }}><Heart size={32} className={isLiked ? "text-[#ef4444]" : "text-white"} fill={isLiked ? "#ef4444" : "rgba(0,0,0,0.25)"} strokeWidth={isLiked ? 0 : 2} /></motion.span>
          <span className="text-[12px] font-semibold">Like</span>
        </button>
        {mode !== "news" && (
          <button
            type="button"
            onClick={() => {
              const v = flip(done, setDone, `${K}:done`, c.id);
              if (!isDone) {
                click("pick");
                say(`${v?.length ?? 1} learned so far`);
              }
            }}
            aria-pressed={isDone}
            aria-label="Mark as learned"
            className="flex flex-col items-center text-white"
          >
            <motion.span animate={isDone ? { scale: [1, 1.35, 1] } : { scale: 1 }} transition={{ duration: 0.3 }}><CircleCheck size={32} className={isDone ? "text-[#22c55e]" : "text-white"} /></motion.span>
            <span className="text-[12px] font-semibold">{isDone ? "Learned" : "Learned?"}</span>
          </button>
        )}
        <button type="button" onClick={() => openRead(c.id)} aria-label="Read" className="flex flex-col items-center text-white">
          <MessageCircle size={30} fill="rgba(0,0,0,0.25)" />
          <span className="text-[12px] font-semibold">Read</span>
        </button>
        <button type="button" onClick={() => flip(saved, setSaved, `${K}:saved`, c.id)} aria-pressed={isSaved} aria-label="Save" className="flex flex-col items-center text-white">
          <Bookmark size={28} className={isSaved ? "text-[#facc15]" : "text-white"} fill={isSaved ? "#facc15" : "rgba(0,0,0,0.25)"} strokeWidth={isSaved ? 0 : 2} />
          <span className="text-[12px] font-semibold">Save</span>
        </button>
        <button type="button" onClick={() => share(c)} aria-label="Share" className="flex flex-col items-center text-white">
          <Share2 size={28} />
          <span className="text-[12px] font-semibold">Share</span>
        </button>
      </div>
    );
  };

  const readCard = reading ? cards.find((c) => c.id === reading) ?? null : null;
  const sheetBody = (c: Card) => {
    const t = c.topic;
    const siblings = t && learn ? resourcesOf(t, res).filter((r) => r.id !== c.id) : [];
    return (
      <>
        <h2 className="font-display text-2xl font-black leading-tight text-white">{c.title}</h2>
        {c.kind === "resource" && <p className="mt-1.5 text-sm text-white/85">{[c.creator, formatLabel(c.format), c.format !== "post" ? accessLabel(c.access) : null].filter(Boolean).join(" · ")}</p>}
        {c.kicker && c.kind !== "resource" && <p className="mt-1.5 text-xs font-semibold text-white/75">{c.kicker}</p>}
        {c.kind === "resource" && c.topic && <p className="mt-1 text-xs text-white/70">{c.topic.path === "encyclopedia" ? "In the AI Encyclopedia" : "On the AI Roadmap"}{c.checked && learn?.checkedAt ? ` · link checked ${learn.checkedAt}` : ""}</p>}
        {c.url && <a href={c.url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-black">Open on {opensOn(c)} <ExternalLink size={14} /></a>}
        {!c.url && c.href && <a href={c.href} className="mt-4 inline-flex items-center rounded-full bg-white px-4 py-2.5 text-sm font-bold text-black">{c.cta ?? "Open"}</a>}
        {c.body && c.kind !== "resource" && <p className="mt-3 text-[15px] leading-relaxed text-white/90">{c.body}</p>}
        {c.body && c.kind === "resource" && <p className="mt-3 text-[15px] leading-relaxed text-white/90">{c.body}</p>}
        {c.meta && c.kind === "story" && <p className="mt-3 text-[12px] font-semibold text-white/75">Why it is here: {c.meta.join(" · ")}</p>}
        {t && c.kind === "resource" && (
          <>
            <h3 className="mt-6 text-[13px] font-bold uppercase tracking-wider text-white/75">Part of: {t.topic}</h3>
            <p className="mt-1.5 text-[15px] leading-relaxed text-white/90">{t.description}</p>
          </>
        )}
        {t?.proTips && <p className="mt-3 rounded-2xl bg-white/[0.06] p-3 text-[14px] leading-relaxed text-white/90"><b>{t.path === "encyclopedia" ? "Used in:" : "Pro tip:"}</b> {t.proTips}</p>}
        {t?.tools && <p className="mt-3 text-[14px] leading-relaxed text-white/85"><b className="text-white">Tools:</b> {t.tools}</p>}
        {siblings.length > 0 && (
          <section className="mt-5">
            <h3 className="text-[13px] font-bold uppercase tracking-wider text-white/75">{c.kind === "resource" ? "Also on this topic" : "On this topic"} · {siblings.length}</h3>
            <ul className="mt-2 space-y-1">
              {siblings.map((r) => (
                <li key={r.id}>
                  <a href={r.url} target={external(r.url) ? "_blank" : undefined} rel="noopener noreferrer" className="flex items-center gap-2.5 rounded-xl p-2 text-[14px] leading-snug text-white/90 hover:bg-white/[0.07]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {r.image ? <img src={r.image} alt="" loading="lazy" className="h-9 w-14 shrink-0 rounded bg-white/10 object-cover" /> : <span className="h-9 w-14 shrink-0 rounded bg-white/[0.08]" aria-hidden="true" />}
                    <span className="min-w-0"><span className="line-clamp-2 block">{r.title}</span><span className="block truncate text-[12px] text-white/65">{r.creator} · {accessLabel(r.access)}</span></span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </>
    );
  };
  const sheet = readCard && readCard.kind !== "end" && (
    <motion.aside
      key={readCard.id}
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
        <button type="button" onClick={closeRead} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"><Close size={18} /></button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6" onPointerDownCapture={(ev) => ev.stopPropagation()}>{sheetBody(readCard)}</div>
      <div className="shrink-0 border-t border-white/10 p-3">
        <button type="button" onClick={closeRead} className="w-full rounded-full bg-white/10 py-3 text-sm font-bold text-white hover:bg-white/15">Back to the feed</button>
      </div>
    </motion.aside>
  );

  // --- The Tune panel: a search bar, platforms, and the rest folded away ------------------------------------------------
  const countLine = mode === "learn" ? `${items} sources` : mode === "news" ? `${items} stories` : `${items} results`;
  const changed =
    mode === "learn"
      ? (lp.off.length || lp.only ? 1 : 0) + (lp.levels.length ? 1 : 0) + (lp.formats.length || lp.freeOnly ? 1 : 0) + (lp.phase !== "all" ? 1 : 0) + (lp.platforms.length ? 1 : 0)
      : mode === "news"
        ? (np.subjects.length ? 1 : 0) + (np.window !== "all" ? 1 : 0) + (np.sort !== "ranked" ? 1 : 0)
        : (sKinds.length ? 1 : 0) + (sPlatforms.length ? 1 : 0);
  const reset = () => {
    click("stop");
    if (mode === "learn") {
      visitOnly.current = false;
      setLp({ ...DEFAULT_LEARN });
    } else if (mode === "news") setNp({ ...DEFAULT_NEWS });
    else {
      setSKinds([]);
      setSPlatforms([]);
    }
  };
  const platformItems = React.useMemo(() => {
    const m = new Map<string, number>();
    if (mode === "learn" && learn) buildLearnFeed(learn, { ...lp, platforms: [] }, res).forEach((p) => p.kind === "res" && m.set(p.r.platform, (m.get(p.r.platform) ?? 0) + 1));
    if (mode === "search") searchHits.filter((d) => !sKinds.length || sKinds.includes(d.kind)).forEach((d) => d.platform && m.set(d.platform, (m.get(d.platform) ?? 0) + 1));
    return [...m.entries()].map(([id, count]) => ({ id, label: NICE[id] ?? id, count }));
  }, [mode, learn, lp, res, searchHits, sKinds]);

  const panelTop = (
    <div className="space-y-2 px-2">
      <button type="button" onClick={() => setSearching(true)} className="flex min-h-[44px] w-full items-center gap-2 rounded-xl border border-white/[0.14] bg-[#15151a] px-3 text-left text-[14px] text-white/75 hover:bg-white/[0.07]">
        <Search size={16} aria-hidden="true" /> <span className="truncate">{mode === "search" && sq ? sq : "Search any topic, video, book or news"}</span>
      </button>
      <p className="flex items-center justify-between text-[12px] text-white/70" aria-live="polite">
        <span><b className="text-white">{countLine}</b>{streak > 1 ? <span className="ml-2 inline-flex items-center gap-0.5 text-[#fb923c]"><Flame size={12} aria-hidden="true" /> {streak}-day streak</span> : null}</span>
        {changed > 0 && <button type="button" onClick={reset} className="font-semibold text-white/85 underline-offset-2 hover:underline">Reset</button>}
      </p>
      {mode === "learn" && lp.only && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-[#ef4444]/40 bg-[#ef4444]/10 py-1.5 pl-3 pr-1.5">
          <span className="min-w-0 truncate text-[13px] text-white">Only: <b>{learn?.topics.find((t) => t.id === lp.only)?.topic}</b></span>
          <button type="button" onClick={() => { click("tick"); visitOnly.current = false; setLp({ only: null }); }} className="min-h-[36px] shrink-0 rounded-full bg-white/[0.12] px-3 text-[12px] font-semibold text-white">Show all</button>
        </div>
      )}
    </div>
  );
  const toggleIn = <T extends string>(list: T[], all: T[], id: T): T[] => {
    const on = list.length ? list : all;
    const next = on.includes(id) ? on.filter((x) => x !== id) : [...on, id];
    return next.length === all.length ? [] : next;
  };
  const lists = (k: string) => {
    if (mode === "learn" && learn) {
      const groups: { path: LearnTopic["path"]; title: string }[] = [{ path: "roadmap", title: "AI Roadmap" }, { path: "encyclopedia", title: "AI Encyclopedia" }];
      const topicsOn = learn.topics.filter((t) => topicFits(t, lp)).length;
      return (
        <>
          <PanelSection id={`${k}-platforms`} title="Platforms" hint="where it comes from" summary={lp.platforms.length ? `${lp.platforms.length} picked` : "All"}>
            <PlatformPicker id={`${k}-pl`} items={platformItems} selected={lp.platforms} onChange={(ids) => setLp({ platforms: ids })} click={click} />
          </PanelSection>
          <PanelSection id={`${k}-format`} title="Format" defaultOpen={false} summary={lp.formats.length ? `${lp.formats.length} of ${FORMATS.length}` : "All"}>
            <div className="flex flex-wrap gap-1.5 px-2">
              {FORMATS.map((f) => (
                <Chip key={f.id} on={!lp.formats.length || lp.formats.includes(f.id)} count={countLearn({ formats: [f.id] })} onClick={() => { click("tick"); const n = toggleIn<LearnFormat>(lp.formats, FORMATS.map((x) => x.id), f.id); if (!n.length && lp.formats.length === 1 && lp.formats[0] === f.id) { say("Keep at least one format on"); return; } setLp({ formats: n }); }}>{f.plural}</Chip>
              ))}
            </div>
            <ul className="mt-1"><SwitchRow id={`${k}-free`} on={lp.freeOnly} label="Free only" onToggle={() => { click("tick"); setLp({ freeOnly: !lp.freeOnly }); }} /></ul>
          </PanelSection>
          <PanelSection id={`${k}-level`} title="Level" defaultOpen={false} summary={lp.levels.length ? `${lp.levels.length} of ${LEVELS.length}` : "All"}>
            <div className="flex flex-wrap gap-1.5 px-2">
              {LEVELS.map((l) => <Chip key={l.id} on={!lp.levels.length || lp.levels.includes(l.id)} onClick={() => { click("tick"); const n = toggleIn<LearnLevel>(lp.levels, LEVELS.map((x) => x.id), l.id); if (!n.length && lp.levels.length === 1 && lp.levels[0] === l.id) { say("Keep at least one level on"); return; } setLp({ levels: n, only: null }); }}>{l.label}</Chip>)}
            </div>
          </PanelSection>
          <PanelSection id={`${k}-topics`} title="Topics" defaultOpen={false} summary={`${topicsOn} of ${learn.topics.length}`}>
            {groups.map((g) => (
              <div key={g.path} className="mt-1">
                <p className="px-2 pb-0.5 pt-1 text-[11px] font-bold uppercase tracking-wider text-white/60">{g.title}</p>
                {learn.phases.filter((p) => p.path === g.path).map((p) => {
                  const ts = learn.topics.filter((t) => t.phase === p.id);
                  return (
                    <PanelSection key={p.id} id={`${k}-ph-${p.id}`} title={p.path === "roadmap" ? `${p.n}. ${p.label}` : p.label} defaultOpen={lp.phase === p.id} summary={`${ts.length}`}>
                      <ul>
                        {ts.map((t) => {
                          const list = resourcesOf(t, res).filter((r) => resourceFits(r, lp));
                          return (
                            <ToggleRow key={t.id} checked={!lp.off.includes(t.id)} label={t.topic} count={list.length} seen={list.filter((r) => seen.includes(r.id)).length} focused={lp.only === t.id} dim={Boolean(lp.only) && lp.only !== t.id} onToggle={() => { click("tick"); setLp({ off: lp.off.includes(t.id) ? lp.off.filter((x) => x !== t.id) : [...lp.off, t.id], only: null }); }} onOnly={() => { click("pick"); setLp({ only: t.id }); }} />
                          );
                        })}
                      </ul>
                    </PanelSection>
                  );
                })}
              </div>
            ))}
          </PanelSection>
        </>
      );
    }
    if (mode === "news") {
      const windows: { id: NewsPrefs["window"]; label: string }[] = [{ id: "all", label: "Any time" }, { id: "7", label: "This week" }, { id: "30", label: "This month" }, { id: "365", label: "This year" }];
      return (
        <>
          <PanelSection id={`${k}-subjects`} title="Subjects" hint="what it is about" summary={np.subjects.length ? `${np.subjects.length} picked` : "All"}>
            <PlatformPicker id={`${k}-sub`} items={stations.filter((s) => s.id !== "all").map((s) => ({ id: s.id, label: s.label, count: s.count }))} selected={np.subjects} onChange={(ids) => setNp({ subjects: ids })} click={click} allLabel="All subjects" searchLabel="Search subjects" />
          </PanelSection>
          <PanelSection id={`${k}-when`} title="When" defaultOpen={false} summary={windows.find((w) => w.id === np.window)?.label}>
            <div className="flex flex-wrap gap-1.5 px-2">{windows.map((w) => <Chip key={w.id} on={np.window === w.id} onClick={() => { click("tick"); setNp({ window: w.id }); }}>{w.label}</Chip>)}</div>
          </PanelSection>
          <PanelSection id={`${k}-sort`} title="Order" defaultOpen={false} summary={np.sort === "ranked" ? "Ranked" : "Newest"}>
            <div className="flex flex-wrap gap-1.5 px-2">
              <Chip on={np.sort === "ranked"} onClick={() => { click("tick"); setNp({ sort: "ranked" }); }}>Ranked</Chip>
              <Chip on={np.sort === "newest"} onClick={() => { click("tick"); setNp({ sort: "newest" }); }}>Newest</Chip>
            </div>
            <p className="mt-2 px-2 text-[12px] leading-snug text-white/70">Ranked by how new a story is and how well it is evidenced: sources read, documents kept, claims checked. Never by what keeps people scrolling.</p>
          </PanelSection>
        </>
      );
    }
    return (
      <PanelSection id={`${k}-platforms`} title="Platforms" hint="where it comes from" summary={sPlatforms.length ? `${sPlatforms.length} picked` : "All"}>
        <PlatformPicker id={`${k}-pl`} items={platformItems} selected={sPlatforms} onChange={setSPlatforms} click={click} />
      </PanelSection>
    );
  };
  const deck = (
    <aside className={`h-full w-[320px] shrink-0 flex-col gap-4 overflow-y-auto border-r border-white/[0.06] px-3 py-5 ${readCard ? "hidden xl:flex" : "hidden lg:flex"}`} aria-label="Tune your feed">
      <div className="flex items-center justify-between gap-3 px-2">
        <h2 className="font-display text-[20px] font-bold leading-tight text-white">Tune your feed</h2>
        <button type="button" onClick={() => setShared({ sound: !shared.sound })} aria-pressed={shared.sound} aria-label={shared.sound ? "Clicks on" : "Clicks off"} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white/75 hover:bg-white/10">{shared.sound ? <Volume2 size={17} /> : <VolumeX size={17} />}</button>
      </div>
      {panelTop}
      {lists("deck")}
    </aside>
  );
  const settingsSheet = (
    <AnimatePresence>
      {settings && (
        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 32, stiffness: 320 }} className="absolute inset-0 z-50 flex flex-col bg-[#0d0f14]" role="dialog" aria-modal="true" aria-label="Tune your feed">
          <div className="flex items-center justify-between gap-2 px-4 pb-2 pt-4">
            <p className="font-display text-xl font-black">Tune your feed</p>
            <button type="button" onClick={() => setSettings(false)} className="min-h-[44px] rounded-full bg-white px-4 text-sm font-bold text-black">Done</button>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto px-2 pb-8">
            {panelTop}
            {lists("sheet")}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // --- The top of the screen -----------------------------------------------------------------------------------------
  const topicCards = post?.topic ? cards.map((c, i) => ({ c, i })).filter((x) => x.c.topic?.id === post.topic?.id) : [];
  const line = mode === "learn" && post?.topic ? `${post.topic.topic.split(" · ")[0]} · ${current + 1} of ${cards.length}` : cards.length ? `${current + 1} of ${cards.length}` : "";
  const header = (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-30 bg-gradient-to-b from-black/90 via-black/60 to-transparent pb-5 pt-3">
      <div className="pointer-events-auto flex items-center justify-between gap-1.5 px-2.5">
        <a href={mode === "learn" ? "/notebook/ai/roadmap" : mode === "news" ? "/ai-updates" : "/feeds"} aria-label="Back" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-black/40 text-white max-[349px]:hidden"><ArrowLeft size={20} /></a>
        <ModeTabs mode={mode === "learn" ? "learn" : "news"} />
        <ViewToggle view={view} onChange={(v) => { click("pick"); setShared({ view: v }); }} />
        <button type="button" onClick={() => setSearching(true)} aria-label="Search" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-black/40 text-white"><Search size={18} /></button>
        <button type="button" onClick={() => setSettings(true)} aria-label={`Tune your feed${changed ? `: ${changed} changed` : ""}`} className="flex h-9 shrink-0 items-center gap-1 rounded-full bg-black/40 px-2.5 text-[13px] font-bold text-white lg:hidden">
          <SlidersHorizontal size={16} />
          {changed > 0 && <span className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[#ef4444] px-1 text-[11px] font-bold text-white">{changed}</span>}
        </button>
      </div>
      {mode === "search" && sq && (
        <p className="pointer-events-auto mt-1.5 truncate px-3 text-[13px] font-semibold text-white">
          &ldquo;{sq}&rdquo; <span className="font-normal text-white/75">· {searchShown.length} results</span>
        </p>
      )}
      {stations.length > 1 && (
        <div className="pointer-events-auto mt-2">
          <TopicTuner items={stations} index={station} onPick={tune} click={click} onEdit={() => setSettings(true)} editLabel="+ More" label="Drag to choose what the feed shows" />
        </div>
      )}
      <div className="pointer-events-auto mt-1.5 px-3">
        {mode === "learn" && topicCards.length > 1 && topicCards.length <= 40 && (
          <div className="mb-1 flex gap-0.5" aria-hidden="true">
            {topicCards.map((x) => <span key={x.c.id} className={`h-[3px] min-w-0 flex-1 rounded-full ${x.i <= current ? "bg-white" : "bg-white/30"}`} />)}
          </div>
        )}
        <p className="flex items-center justify-between gap-2 text-[11px] font-semibold text-white/90">
          <span className="min-w-0 truncate">{line}</span>
          {streak > 1 && <span className="flex shrink-0 items-center gap-0.5 text-[#fb923c]"><Flame size={12} aria-hidden="true" />{streak}</span>}
        </p>
      </div>
    </div>
  );

  const skeleton = (
    <div className="kgf-body flex h-full flex-col justify-end gap-3 p-5 pb-32" aria-label="Loading">
      <span className="h-8 w-3/4 animate-pulse rounded-lg bg-white/10" />
      <span className="h-4 w-full animate-pulse rounded bg-white/10" />
      <span className="h-4 w-5/6 animate-pulse rounded bg-white/10" />
    </div>
  );
  const nothing = (
    <div className="kgf-body flex h-full flex-col items-center justify-center px-8 text-center">
      <p className="font-display text-2xl font-black text-white">{failed ? "This could not load just now" : mode === "search" ? `Nothing found${sq ? ` for "${sq}"` : ""}` : "Nothing matches your picks"}</p>
      <p className="mt-2 text-sm text-white/85">{failed ? "Check the connection and try again." : mode === "search" ? "Try fewer words, or a different spelling." : "The feed never fills itself with random posts. Turn something back on."}</p>
      {failed ? (
        <button type="button" onClick={() => window.location.reload()} className="mt-4 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-black">Try again</button>
      ) : mode === "search" ? (
        <button type="button" onClick={() => setSearching(true)} className="mt-4 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-black">Search again</button>
      ) : (
        <button type="button" onClick={reset} className="mt-4 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-black">Reset to everything</button>
      )}
    </div>
  );

  const scrollView = (
    <div ref={scroller} onScroll={onScroll} onPointerDown={onPointerDown} onPointerUp={onPointerUp} role="feed" aria-busy={!loaded} className="kgf-body h-[100dvh] snap-y snap-mandatory overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {cards.map((c, i) => (
        <article key={c.id} id={c.id} aria-posinset={i + 1} aria-setsize={cards.length} aria-label={c.title || "End of the feed"} data-title={c.title} className="relative h-[100dvh] snap-start snap-always overflow-hidden">
          {Math.abs(i - current) <= 2 ? (
            <>
              {stage(c, i)}
              {caption(c)}
              {rail(c)}
            </>
          ) : null}
        </article>
      ))}
    </div>
  );
  const swipeView = (
    <div className="kgf-body absolute inset-x-0 bottom-0 top-[136px] px-3 pb-28" style={{ "--kgf-top": "32px", "--kgf-bottom": "150px", "--kgf-rail": "20px" } as React.CSSProperties}>
      <div className="relative h-full">
        {cards[current + 1] && (
          <div className="absolute inset-0 translate-y-3 scale-[0.94] overflow-hidden rounded-[28px] opacity-60" aria-hidden="true">{stage(cards[current + 1], current + 1)}</div>
        )}
        <AnimatePresence initial={false} custom={dir}>
          {post && (
            <SwipeTop key={post.id} dir={dir} canDrag onSwipe={swipe} onTap={() => post.kind !== "end" && openRead(post.id)}>
              <div data-title={post.title} className="h-full w-full">
                {stage(post, current)}
                {caption(post, true)}
              </div>
            </SwipeTop>
          )}
        </AnimatePresence>
      </div>
      <div className="absolute inset-x-0 bottom-5 flex items-center justify-center gap-4" data-no-tap>
        <button type="button" onClick={() => go(current - 1)} disabled={current === 0} aria-label="Back one card" className="grid h-12 w-12 place-items-center rounded-full bg-white/10 text-[#facc15] disabled:opacity-30"><RotateCcw size={20} /></button>
        <button type="button" onClick={() => swipe(-1)} disabled={current >= cards.length - 1} aria-label="Skip" className="grid h-16 w-16 place-items-center rounded-full bg-white text-[#64748b] shadow-xl transition active:scale-90 disabled:opacity-30"><Close size={30} strokeWidth={3} /></button>
        <button type="button" onClick={() => swipe(1)} disabled={current >= cards.length - 1} aria-label="Like and next" className="grid h-16 w-16 place-items-center rounded-full bg-white shadow-xl transition active:scale-90 disabled:opacity-30"><Heart size={28} fill="#ef4444" strokeWidth={0} /></button>
        <button type="button" onClick={() => post && post.kind !== "end" && openRead(post.id)} aria-label="Read" className="grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white"><MessageCircle size={20} /></button>
      </div>
    </div>
  );

  // First visit to Learn: ask before showing.
  const finish = () => {
    try {
      window.localStorage.setItem("kgf:learn:onboarded", "1");
    } catch {
      /* private mode: the picker may return next visit */
    }
    click("pick");
    setOnboard(false);
  };
  const picker = mode === "learn" && onboard && (
    <div className="absolute inset-0 z-[60] flex flex-col bg-[#0b0d12]" role="dialog" aria-modal="true" aria-label="What do you want to learn?">
      <div className="flex-1 overflow-y-auto px-5 pb-6 pt-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#f87171]">Learn · AI Roadmap + AI Encyclopedia</p>
        <h2 className="mt-2 font-display text-3xl font-black leading-tight">What do you want to learn?</h2>
        <p className="mt-3 text-sm text-white/85">Every video, course, guide, book, paper and repo, in learning order. Your feed shows only what you pick, never random posts.</p>
        <h3 className="mt-6 font-display text-lg font-black">Your level</h3>
        <div className="mt-2 flex flex-wrap gap-2">{LEVELS.map((l) => <Chip key={l.id} on={!lp.levels.length || lp.levels.includes(l.id)} onClick={() => { click("tick"); const n = toggleIn<LearnLevel>(lp.levels, LEVELS.map((x) => x.id), l.id); if (!n.length && lp.levels.length === 1) return; setLp({ levels: n }); }}>{l.label}</Chip>)}</div>
        <h3 className="mt-6 font-display text-lg font-black">How you learn best</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {FORMATS.map((f) => <Chip key={f.id} on={!lp.formats.length || lp.formats.includes(f.id)} count={countLearn({ formats: [f.id] })} onClick={() => { click("tick"); const n = toggleIn<LearnFormat>(lp.formats, FORMATS.map((x) => x.id), f.id); if (!n.length && lp.formats.length === 1) return; setLp({ formats: n }); }}>{f.plural}</Chip>)}
          <Chip on={lp.freeOnly} onClick={() => { click("tick"); setLp({ freeOnly: !lp.freeOnly }); }}>Free only</Chip>
        </div>
      </div>
      <div className="border-t border-white/10 p-4">
        <button type="button" disabled={!items} onClick={finish} className="w-full rounded-full bg-white py-3.5 text-[15px] font-black text-black disabled:opacity-40">{items ? `Start learning: ${items} sources` : "Loading..."}</button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center overflow-hidden bg-black font-sans text-white" role="dialog" aria-modal="true" aria-label={mode === "learn" ? "Learn feed" : mode === "news" ? "News feed" : "Search results as a feed"} style={{ "--kgf-top": "128px", "--kgf-bottom": "150px", "--kgf-rail": "64px" } as React.CSSProperties}>
      {post?.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.image} alt="" aria-hidden="true" className="pointer-events-none absolute inset-0 hidden h-full w-full scale-110 object-cover opacity-30 blur-3xl sm:block" />
      )}
      <div className="relative flex h-full">
        {deck}
        <div ref={column} className="relative h-[100dvh] w-screen overflow-hidden bg-black sm:w-[min(100vw,calc(100dvh*9/16))] sm:max-w-[480px] sm:shadow-2xl">
          {header}
          {!loaded && !failed ? skeleton : cards.length ? (view === "scroll" ? scrollView : swipeView) : nothing}
          <AnimatePresence>
            {burst && (
              <motion.span key={burst.k} initial={{ scale: 0.2, opacity: 0.95, rotate: -12 }} animate={{ scale: 1.5, opacity: 0, y: -60 }} transition={{ duration: 0.8 }} onAnimationComplete={() => setBurst(null)} className="pointer-events-none absolute z-40 text-[#ef4444]" style={{ left: burst.x - 40, top: burst.y - 40 }}>
                <Heart size={80} fill="currentColor" strokeWidth={0} />
              </motion.span>
            )}
          </AnimatePresence>
          <AnimatePresence>{party && <Celebrate title={party.title} sub={party.sub} onDone={() => setParty(null)} />}</AnimatePresence>
          <AnimatePresence>{!wide && sheet}</AnimatePresence>
          {settingsSheet}
          {picker}
          <AnimatePresence>
            {toast && (
              <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute bottom-24 left-1/2 z-[70] -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-black">{toast}</motion.p>
            )}
          </AnimatePresence>
        </div>
        <AnimatePresence>{wide && sheet}</AnimatePresence>
      </div>
      {view === "scroll" && cards.length > 0 && (
        <div className="absolute right-6 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-center gap-3 sm:flex">
          <button type="button" onClick={() => go(current - 1)} disabled={current === 0} aria-label="Previous post" className="grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-30"><ChevronUp size={24} /></button>
          <button type="button" onClick={() => go(current + 1)} disabled={current === cards.length - 1} aria-label="Next post" className="grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-30"><ChevronDown size={24} /></button>
        </div>
      )}
      <FeedSearch open={searching} onClose={() => setSearching(false)} initialQuery={mode === "search" ? sq : ""} />
    </div>
  );
}
