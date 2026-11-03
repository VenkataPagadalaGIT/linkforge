"use client";
import * as React from "react";
import { getNode } from "@/data/aiOntology";
import { logoUrl } from "@/data/aiLogos";
import { feedFor, feedUrl } from "@/lib/ai-feed";

/**
 * The watchlist: entities a reader follows, kept in this browser only (nothing is sent anywhere). For each, the
 * items dated after the reader last opened it count as new. Email alerts come later, from the server-side table
 * ontology.watch, once the mail service is set up.
 */

const KEY = "ai-graph-watchlist";
const SEEN = "ai-graph-watch-seen";
const EVENT = "ai-graph-watchlist-change";

function read<T>(key: string, fallback: T): T {
  try {
    const v = JSON.parse(localStorage.getItem(key) ?? "null");
    return v ?? fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage blocked: the list lasts for this visit only
  }
  window.dispatchEvent(new Event(EVENT));
}

export function useWatchlist() {
  const [ids, setIds] = React.useState<string[]>([]);
  const [seen, setSeen] = React.useState<Record<string, string>>({});
  React.useEffect(() => {
    const sync = () => {
      setIds(read<string[]>(KEY, []).filter((x) => typeof x === "string" && getNode(x)));
      setSeen(read<Record<string, string>>(SEEN, {}));
    };
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  const toggle = React.useCallback((id: string) => {
    const cur = read<string[]>(KEY, []);
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    write(KEY, next);
    // Following starts the clock: only what comes after counts as new.
    if (!cur.includes(id)) write(SEEN, { ...read<Record<string, string>>(SEEN, {}), [id]: new Date().toISOString().slice(0, 10) });
  }, []);
  /** The reader looked at this entity now: its items so far are no longer new. */
  const markSeen = React.useCallback((id: string) => {
    const s = read<Record<string, string>>(SEEN, {});
    const today = new Date().toISOString().slice(0, 10);
    if (read<string[]>(KEY, []).includes(id) && s[id] !== today) write(SEEN, { ...s, [id]: today });
  }, []);
  const newCount = React.useCallback((id: string) => feedFor(id).filter((it) => it.date > (seen[id] ?? "9999")).length, [seen]);
  return { ids, has: (id: string) => ids.includes(id), toggle, markSeen, newCount, seen };
}

export function FollowButton({ id, compact }: { id: string; compact?: boolean }) {
  const w = useWatchlist();
  const on = w.has(id);
  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={() => w.toggle(id)}
        aria-pressed={on}
        title={on ? "Stop following (kept in this browser only)" : "Follow: new filings, deals, releases and news show on your watchlist (kept in this browser only)"}
        className={`border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.15em] ${
          on ? "border-emerald-700/50 text-emerald-700 dark:border-emerald-300/50 dark:text-emerald-300" : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
        }`}
        data-testid="ai-follow"
      >
        {on ? "★ Following" : "☆ Follow"}
      </button>
      {!compact && (
        <a href={feedUrl(id)} className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground underline hover:text-foreground" title="RSS feed for this entity">
          RSS
        </a>
      )}
    </span>
  );
}

/** The strip above the dashboard: what the reader follows, with how much is new since they last looked. */
export function WatchlistStrip({ onPick }: { onPick: (id: string) => void }) {
  const w = useWatchlist();
  if (!w.ids.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5 border-b border-border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em]" data-testid="ai-watchlist">
      <span className="mr-1 font-bold text-foreground">Watchlist</span>
      {w.ids.map((id) => {
        const n = getNode(id)!;
        const fresh = w.newCount(id);
        const logo = logoUrl(id);
        return (
          <button
            key={id}
            type="button"
            onClick={() => {
              onPick(id);
              w.markSeen(id);
            }}
            className="inline-flex items-center gap-1.5 border border-border px-1.5 py-0.5 normal-case tracking-normal text-foreground/90 hover:border-foreground/40"
            title={fresh ? `${fresh} new since you last looked` : "Nothing new since you last looked"}
          >
            {logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="" width={12} height={12} className="h-3 w-3 bg-white object-contain" />
            )}
            {n.name.replace(/\s*\([^)]*\)\s*$/, "")}
            {fresh > 0 && <span className="bg-emerald-700 px-1 text-[9px] font-bold text-white dark:bg-emerald-300 dark:text-black">{fresh} new</span>}
          </button>
        );
      })}
      <a href="/api/ai/feed.xml" className="ml-auto text-muted-foreground underline hover:text-foreground" title="RSS feed for everything new across the graph">
        All of AI RSS
      </a>
    </div>
  );
}
