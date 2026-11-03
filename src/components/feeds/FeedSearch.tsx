"use client";
/**
 * Search across both feeds: roadmap topics, videos, courses, books and repos, and every story's posts and checked claims.
 * The index is one static file, fetched the first time someone opens search, so the feed itself stays light.
 */
import * as React from "react";
import { BookOpen, FolderGit2, GraduationCap, Hash, Newspaper, PlaySquare, Search, X as Close } from "lucide-react";
import { buildIndex, search, type SearchDoc, type SearchIndex, type SearchKind } from "@/lib/feed-search";

const KINDS: { id: SearchKind | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "topic", label: "Topics" },
  { id: "video", label: "Videos" },
  { id: "course", label: "Courses" },
  { id: "book", label: "Books" },
  { id: "repo", label: "Repos" },
  { id: "post", label: "News" },
];
const ICON: Record<SearchKind, React.ReactNode> = {
  topic: <Hash size={18} aria-hidden="true" />,
  video: <PlaySquare size={18} aria-hidden="true" />,
  course: <GraduationCap size={18} aria-hidden="true" />,
  book: <BookOpen size={18} aria-hidden="true" />,
  repo: <FolderGit2 size={18} aria-hidden="true" />,
  post: <Newspaper size={18} aria-hidden="true" />,
};
const WORD: Record<SearchKind, string> = { topic: "Topic", video: "Video", course: "Course", book: "Book", repo: "Repo", post: "News" };

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
          {d.sub && <span className="mt-0.5 block truncate text-[12px] text-white/60">{d.sub}</span>}
        </span>
        <span className="shrink-0 rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/75">{WORD[d.kind]}</span>
      </a>
    </li>
  );
}

export function FeedSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [docs, setDocs] = React.useState<SearchDoc[] | null>(null);
  const [failed, setFailed] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [kind, setKind] = React.useState<SearchKind | "all">("all");
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
    if (!open) return;
    if (!docs) load();
    const t = window.setTimeout(() => input.current?.focus(), 30);
    return () => window.clearTimeout(t);
  }, [open, docs, load]);

  const hits = React.useMemo(() => (index.current && q.trim() ? search(index.current, q, 200) : []), [q, docs]); // eslint-disable-line react-hooks/exhaustive-deps
  const counts = React.useMemo(() => {
    const m: Partial<Record<SearchKind, number>> = {};
    hits.forEach((h) => (m[h.doc.kind] = (m[h.doc.kind] ?? 0) + 1));
    return m;
  }, [hits]);
  const shown = kind === "all" ? hits : hits.filter((h) => h.doc.kind === kind);
  const starters = React.useMemo(() => (docs ?? []).filter((d) => d.kind === "topic").slice(0, 6), [docs]);

  if (!open) return null;

  const onKey = (ev: React.KeyboardEvent) => {
    if (ev.key === "Escape") {
      ev.stopPropagation();
      onClose();
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

  return (
    <div role="dialog" aria-modal="true" aria-label="Search the feeds" onKeyDown={onKey} className="absolute inset-0 z-[80] flex flex-col bg-[#0b0d12] sm:bg-[#0b0d12]/95 sm:backdrop-blur">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col overflow-hidden">
        <div className="flex items-center gap-2 px-3 pt-3">
          <label className="flex min-h-[44px] min-w-0 flex-1 items-center gap-2 rounded-xl bg-white/[0.08] px-3 focus-within:ring-2 focus-within:ring-white/30">
            <Search size={18} className="shrink-0 text-white/60" aria-hidden="true" />
            <span className="sr-only">Search topics, videos, courses, books, repos and news</span>
            <input ref={input} type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search topics, videos, books, news" className="min-w-0 flex-1 bg-transparent text-[16px] text-white outline-none placeholder:text-white/50" autoComplete="off" enterKeyHint="search" />
          </label>
          <button type="button" onClick={onClose} aria-label="Close search" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"><Close size={18} /></button>
        </div>
        {q.trim() && (
          <div role="group" aria-label="Filter results" className="mt-2 flex gap-1.5 overflow-x-auto px-3 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {KINDS.map((k) => {
              const n = k.id === "all" ? hits.length : counts[k.id] ?? 0;
              if (k.id !== "all" && !n) return null;
              return (
                <button key={k.id} type="button" aria-pressed={kind === k.id} onClick={() => setKind(k.id)} className={`flex min-h-[32px] shrink-0 items-center gap-1 rounded-full px-3 text-[12px] font-semibold transition ${kind === k.id ? "bg-white text-black" : "bg-white/[0.08] text-white/80 hover:bg-white/15"}`}>
                  {k.label} <span className={kind === k.id ? "text-black/60" : "text-white/55"}>{n}</span>
                </button>
              );
            })}
          </div>
        )}
        <div ref={list} className="mt-1 min-h-0 flex-1 overflow-y-auto px-1 pb-8">
          <p className="sr-only" aria-live="polite">{q.trim() ? `${shown.length} results` : ""}</p>
          {failed ? (
            <div className="px-3 py-8 text-center">
              <p className="text-sm text-white/80">Search could not load just now.</p>
              <button type="button" onClick={load} className="mt-3 rounded-full bg-white px-4 py-2 text-sm font-bold text-black">Try again</button>
            </div>
          ) : !docs ? (
            <p className="px-3 py-8 text-center text-sm text-white/65">Loading search...</p>
          ) : !q.trim() ? (
            <div className="px-2 pt-3">
              <p className="px-2 text-[12px] font-semibold uppercase tracking-wider text-white/60">Start here</p>
              <ul className="mt-1">{starters.map((d) => <Row key={d.id} d={d} />)}</ul>
            </div>
          ) : shown.length ? (
            <ul>{shown.map((h) => <Row key={h.doc.id} d={h.doc} />)}</ul>
          ) : (
            <p className="px-3 py-8 text-center text-sm text-white/70">Nothing matches &ldquo;{q.trim()}&rdquo;. Try fewer words.</p>
          )}
        </div>
      </div>
    </div>
  );
}
