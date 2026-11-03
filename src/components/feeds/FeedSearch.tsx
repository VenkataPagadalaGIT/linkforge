"use client";
/**
 * The search box for everything: topics and concepts, videos, courses, guides, books, papers, repos, the news, people and
 * companies. With nothing typed it says what exists and lists each kind. Typing narrows it. "See as a feed" turns the
 * results into a social feed, because the point is to find a topic and scroll every source on it.
 * The index is one file, fetched the first time someone opens search, so the feed itself stays light.
 */
import * as React from "react";
import { BookOpen, Building2, FileText, FolderGit2, GraduationCap, Hash, MessageSquare, Newspaper, PlaySquare, ScrollText, Search, User, X as Close } from "lucide-react";
import { KIND_LABELS, buildIndex, countKinds, isBrowseQuery, search, type SearchDoc, type SearchIndex, type SearchKind } from "@/lib/feed-search";

const ORDER: SearchKind[] = ["topic", "news", "video", "course", "guide", "book", "paper", "repo", "person", "company", "post"];
const BLURB: Record<SearchKind, string> = {
  topic: "Every roadmap topic and Encyclopedia concept",
  news: "Stories, ranked by freshness and evidence",
  video: "Lessons and explainers you can play here",
  course: "Full courses, free and paid",
  guide: "Explainers and how-tos",
  book: "Books",
  paper: "Research papers",
  repo: "Code on GitHub",
  person: "The people who shaped AI",
  company: "Companies and everything else in the AI graph",
  post: "Posts from every platform, inside each story",
};
const ICON: Record<SearchKind, React.ReactNode> = {
  topic: <Hash size={18} aria-hidden="true" />,
  video: <PlaySquare size={18} aria-hidden="true" />,
  course: <GraduationCap size={18} aria-hidden="true" />,
  book: <BookOpen size={18} aria-hidden="true" />,
  repo: <FolderGit2 size={18} aria-hidden="true" />,
  guide: <FileText size={18} aria-hidden="true" />,
  paper: <ScrollText size={18} aria-hidden="true" />,
  news: <Newspaper size={18} aria-hidden="true" />,
  post: <MessageSquare size={18} aria-hidden="true" />,
  person: <User size={18} aria-hidden="true" />,
  company: <Building2 size={18} aria-hidden="true" />,
};
const PAGE = 40;

function Row({ d }: { d: SearchDoc }) {
  return (
    <li>
      <a href={d.href} data-result className="flex items-center gap-3 rounded-xl px-2 py-2 outline-none hover:bg-white/[0.07] focus-visible:bg-white/[0.1] focus-visible:ring-2 focus-visible:ring-white/40">
        {d.thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={d.thumb} alt="" loading="lazy" width={72} height={40} className="h-10 w-[72px] shrink-0 rounded-md bg-white/10 object-cover" />
        ) : (
          <span className="grid h-10 w-[72px] shrink-0 place-items-center rounded-md bg-white/[0.07] text-white/70">{ICON[d.kind]}</span>
        )}
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 block text-[14px] font-semibold leading-snug text-white">{d.title}</span>
          {d.sub && <span className="mt-0.5 block truncate text-[12px] text-white/65">{d.sub}</span>}
        </span>
        <span className="shrink-0 rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/80">{KIND_LABELS[d.kind].one}</span>
      </a>
    </li>
  );
}

const feedLink = (q: string, kind: string, platform: string) => {
  const u = new URLSearchParams();
  if (q.trim()) u.set("q", q.trim());
  if (kind !== "all") u.set("kind", kind);
  if (platform) u.set("platform", platform);
  return `/feeds/search?${u.toString()}`;
};

export function FeedSearch({ open, onClose, initialQuery = "" }: { open: boolean; onClose: () => void; initialQuery?: string }) {
  const [docs, setDocs] = React.useState<SearchDoc[] | null>(null);
  const [failed, setFailed] = React.useState(false);
  const [q, setQ] = React.useState(initialQuery);
  const [kind, setKind] = React.useState<SearchKind | "all">("all");
  const [platform, setPlatform] = React.useState("");
  const [shown, setShown] = React.useState(PAGE);
  const input = React.useRef<HTMLInputElement>(null);
  const list = React.useRef<HTMLDivElement>(null);
  const index = React.useRef<SearchIndex | null>(null);

  const load = React.useCallback(() => {
    setFailed(false);
    fetch("/feeds/search.json")
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((d: SearchDoc[]) => {
        index.current = buildIndex(d);
        setDocs(d);
      })
      .catch(() => setFailed(true));
  }, []);

  React.useEffect(() => {
    if (open && initialQuery) setQ(initialQuery);
  }, [open, initialQuery]);

  React.useEffect(() => {
    if (!open) return;
    if (!docs) load();
    const t = window.setTimeout(() => input.current?.focus(), 30);
    return () => window.clearTimeout(t);
  }, [open, docs, load]);

  const hits = React.useMemo(() => (index.current && q.trim() ? search(index.current, q, 3000).map((h) => h.doc) : []), [q, docs]); // eslint-disable-line react-hooks/exhaustive-deps
  // Browsing a kind with nothing typed lists all of it, in the index's own order.
  const pool = q.trim() ? hits : kind !== "all" && docs ? docs.filter((d) => d.kind === kind) : [];
  const counts = React.useMemo(() => countKinds(q.trim() && !isBrowseQuery(q) ? hits : docs ?? []), [q, hits, docs]);
  const inKind = kind === "all" ? pool : pool.filter((d) => d.kind === kind);
  const platforms = React.useMemo(() => {
    const m = new Map<string, number>();
    inKind.forEach((d) => d.platform && m.set(d.platform, (m.get(d.platform) ?? 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [inKind]);
  const result = platform ? inKind.filter((d) => d.platform === platform) : inKind;
  const starters = React.useMemo(() => (docs ?? []).filter((d) => d.kind === "topic").slice(0, 5), [docs]);
  const topNews = React.useMemo(() => (docs ?? []).filter((d) => d.kind === "news").slice(0, 5), [docs]);

  React.useEffect(() => {
    setShown(PAGE);
  }, [q, kind, platform]);
  if (!open) return null;

  const browsing = (Boolean(q.trim()) && !isBrowseQuery(q)) || kind !== "all";
  const onKey = (ev: React.KeyboardEvent) => {
    if (ev.key === "Escape") {
      ev.stopPropagation();
      onClose();
      return;
    }
    if (ev.key === "Enter" && (ev.target as HTMLElement).tagName === "INPUT" && browsing && result.length) {
      window.location.href = feedLink(q, kind, platform);
      return;
    }
    if (ev.key !== "ArrowDown" && ev.key !== "ArrowUp") return;
    const items = Array.from(list.current?.querySelectorAll<HTMLAnchorElement>("[data-result]") ?? []);
    if (!items.length) return;
    ev.preventDefault();
    const at = items.indexOf(document.activeElement as HTMLAnchorElement);
    if (ev.key === "ArrowUp" && at <= 0) {
      input.current?.focus();
      return;
    }
    items[Math.min(items.length - 1, Math.max(0, at + (ev.key === "ArrowDown" ? 1 : -1)))]?.focus();
  };
  const chip = (on: boolean) => `flex min-h-[32px] shrink-0 items-center gap-1 rounded-full px-3 text-[12px] font-semibold transition ${on ? "bg-white text-black" : "bg-white/[0.08] text-white/85 hover:bg-white/15"}`;

  return (
    <div role="dialog" aria-modal="true" aria-label="Search everything" onKeyDown={onKey} className="absolute inset-0 z-[80] flex flex-col bg-[#0b0d12] sm:bg-[#0b0d12]/95 sm:backdrop-blur">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col overflow-hidden">
        <div className="flex items-center gap-2 px-3 pt-3">
          <label className="flex min-h-[44px] min-w-0 flex-1 items-center gap-2 rounded-xl bg-white/[0.08] px-3 focus-within:ring-2 focus-within:ring-white/30">
            <Search size={18} className="shrink-0 text-white/65" aria-hidden="true" />
            <span className="sr-only">Search topics, videos, courses, books, news, people</span>
            <input ref={input} type="search" value={q} onChange={(e) => { setQ(e.target.value); setKind("all"); setPlatform(""); }} placeholder="Search any topic, video, book or news" className="min-w-0 flex-1 bg-transparent text-[16px] text-white outline-none placeholder:text-white/55" autoComplete="off" enterKeyHint="search" />
          </label>
          <button type="button" onClick={onClose} aria-label="Close search" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"><Close size={18} /></button>
        </div>
        {browsing && docs && (
          <>
            <div role="group" aria-label="Filter by kind" className="mt-2 flex gap-1.5 overflow-x-auto px-3 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button type="button" aria-pressed={kind === "all"} onClick={() => { setKind("all"); setPlatform(""); }} className={chip(kind === "all")}>All {q.trim() ? <span className={kind === "all" ? "text-black/60" : "text-white/60"}>{hits.length}</span> : null}</button>
              {ORDER.map((k) => {
                const n = counts[k] ?? 0;
                if (!n) return null;
                return (
                  <button key={k} type="button" aria-pressed={kind === k} onClick={() => { setKind(k); setPlatform(""); }} className={chip(kind === k)}>
                    {KIND_LABELS[k].many} <span className={kind === k ? "text-black/60" : "text-white/60"}>{n}</span>
                  </button>
                );
              })}
            </div>
            {platforms.length > 1 && (
              <div role="group" aria-label="Filter by platform" className="mt-1 flex gap-1.5 overflow-x-auto px-3 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {platforms.slice(0, 10).map(([p, n]) => (
                  <button key={p} type="button" aria-pressed={platform === p} onClick={() => setPlatform(platform === p ? "" : p)} className={`flex min-h-[28px] shrink-0 items-center gap-1 rounded-full border px-2.5 text-[11px] font-semibold ${platform === p ? "border-white bg-white text-black" : "border-white/15 text-white/80"}`}>
                    {p} <span className={platform === p ? "text-black/60" : "text-white/55"}>{n}</span>
                  </button>
                ))}
              </div>
            )}
            {result.length > 0 && (
              <a href={feedLink(q, kind, platform)} className="mx-3 mt-1.5 flex min-h-[44px] items-center justify-center rounded-xl bg-[#ef4444] px-4 text-[14px] font-bold text-white hover:bg-[#dc2626]">
                See {result.length === 1 ? "it" : `all ${result.length}`} as a feed
              </a>
            )}
          </>
        )}
        <div ref={list} className="mt-1 min-h-0 flex-1 overflow-y-auto px-1 pb-8">
          <p className="sr-only" aria-live="polite">{browsing ? `${result.length} results` : ""}</p>
          {failed ? (
            <div className="px-3 py-8 text-center">
              <p className="text-sm text-white/85">Search could not load just now.</p>
              <button type="button" onClick={load} className="mt-3 rounded-full bg-white px-4 py-2 text-sm font-bold text-black">Try again</button>
            </div>
          ) : !docs ? (
            <p className="px-3 py-8 text-center text-sm text-white/70">Loading search...</p>
          ) : !browsing ? (
            <div className="px-2 pt-3">
              <h2 className="px-2 text-[12px] font-semibold uppercase tracking-wider text-white/70">What&apos;s here</h2>
              <ul className="mt-1">
                {ORDER.map((k) => (counts[k] ? (
                  <li key={k}>
                    <button type="button" onClick={() => setKind(k)} className="flex min-h-[48px] w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left hover:bg-white/[0.07]">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/[0.08] text-white/85">{ICON[k]}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14px] font-semibold text-white">{KIND_LABELS[k].many}</span>
                        <span className="block truncate text-[12px] text-white/65">{BLURB[k]}</span>
                      </span>
                      <span className="shrink-0 text-[13px] font-bold tabular-nums text-white">{counts[k]}</span>
                    </button>
                  </li>
                ) : null))}
              </ul>
              <h2 className="mt-4 px-2 text-[12px] font-semibold uppercase tracking-wider text-white/70">Top stories</h2>
              <ul className="mt-1">{topNews.map((d) => <Row key={d.id} d={d} />)}</ul>
              <h2 className="mt-4 px-2 text-[12px] font-semibold uppercase tracking-wider text-white/70">Start learning</h2>
              <ul className="mt-1">{starters.map((d) => <Row key={d.id} d={d} />)}</ul>
            </div>
          ) : result.length ? (
            <>
              <ul>{result.slice(0, shown).map((d) => <Row key={d.id} d={d} />)}</ul>
              {result.length > shown && (
                <button type="button" onClick={() => setShown((n) => n + PAGE)} className="mx-2 mt-2 min-h-[44px] w-[calc(100%-1rem)] rounded-xl bg-white/[0.08] text-[14px] font-semibold text-white hover:bg-white/15">
                  Show more ({result.length - shown} left)
                </button>
              )}
            </>
          ) : (
            <p className="px-3 py-8 text-center text-sm text-white/75">Nothing matches &ldquo;{q.trim()}&rdquo;. Try fewer words, or clear the filters.</p>
          )}
        </div>
      </div>
    </div>
  );
}
