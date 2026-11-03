"use client";
import * as React from "react";
import { TOPIC_NODES, topicPath, type LiTopicNode } from "@/data/linkedinArchive";

/**
 * The topic tree as a sidebar: L1 areas, their L2 topics and L3 subtopics, each with its count.
 * "filter" mode (the archive hub): a click selects the topic (cards and graph follow) and a small arrow opens its
 * page. "link" mode (topic pages): every row is a link to its page. Rows are real links either way, so the tree
 * works without JavaScript (every branch then shows, open).
 */

interface Props {
  counts: Map<string, number>;
  active: string | null;
  mode: "filter" | "link";
  onSelect?: (id: string | null) => void;
  /** Total shown on the "All" row. */
  total?: number;
  /** Filter mode: a last row for entries with no topic (short replies and reshares), so nothing is out of reach. */
  extra?: { id: string; label: string; count: number };
}

/** Without JavaScript the toggles hide and every branch shows. */
const NOSCRIPT_STYLE = { __html: "<style>.li-js{display:none!important}.li-collapse{display:block!important}</style>" };
const isPlain = (e: React.MouseEvent) => e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;

export default function TopicTree({ counts, active, mode, onSelect, total, extra }: Props) {
  const byParent = React.useMemo(() => {
    const m = new Map<string | null, LiTopicNode[]>();
    for (const n of TOPIC_NODES) {
      if (!(counts.get(n.id) ?? 0)) continue;
      const k = n.parent;
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(n);
    }
    // largest first within each level
    for (const list of m.values()) list.sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0));
    return m;
  }, [counts]);
  // The active topic's branch starts open; areas open and close on demand.
  const activeTrail = React.useMemo(() => {
    const ids = new Set<string>();
    for (let n = TOPIC_NODES.find((x) => x.id === active); n; n = TOPIC_NODES.find((x) => x.id === n!.parent)) ids.add(n.id);
    return ids;
  }, [active]);
  const [open, setOpen] = React.useState<Set<string>>(() => new Set(activeTrail));
  React.useEffect(() => setOpen((o) => new Set([...o, ...activeTrail])), [activeTrail]);
  const toggle = (id: string) => setOpen((o) => { const n = new Set(o); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const row = (n: LiTopicNode) => {
    const kids = byParent.get(n.id) ?? [];
    const isOpen = open.has(n.id);
    const isActive = active === n.id;
    const pad = n.level === 1 ? "pl-0" : n.level === 2 ? "pl-4" : "pl-8";
    return (
      <li key={n.id}>
        <div className={`group flex items-center gap-1 ${pad}`}>
          {kids.length > 0 ? (
            <button
              type="button"
              onClick={() => toggle(n.id)}
              aria-expanded={isOpen}
              aria-label={`${isOpen ? "Collapse" : "Expand"} ${n.label}`}
              className="li-js w-4 shrink-0 font-mono text-[10px] text-muted-foreground hover:text-foreground"
            >
              {isOpen ? "▾" : "▸"}
            </button>
          ) : (
            <span className="w-4 shrink-0" aria-hidden="true" />
          )}
          <a
            href={topicPath(n.id)}
            onClick={(e) => {
              if (mode !== "filter" || !onSelect || !isPlain(e)) return;
              e.preventDefault();
              onSelect(isActive ? null : n.id);
              if (kids.length && !isOpen) toggle(n.id);
            }}
            aria-current={isActive ? "true" : undefined}
            className={`flex-1 min-w-0 flex items-baseline justify-between gap-2 py-1 px-1.5 font-mono leading-snug border-l-2 transition-colors ${
              isActive ? "border-foreground bg-foreground/[0.08] text-foreground" : "border-transparent text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]"
            } ${n.level === 1 ? "text-[12px] font-semibold text-foreground/90" : n.level === 2 ? "text-[11.5px]" : "text-[11px]"}`}
            data-testid={`linkedin-tree-${n.slug}`}
          >
            <span className="min-w-0 break-words">{n.label}</span>
            <span className="shrink-0 text-[10px] text-muted-foreground/70 tabular-nums">{counts.get(n.id)}</span>
          </a>
          {mode === "filter" && (
            <a href={topicPath(n.id)} className="li-js shrink-0 px-1 font-mono text-[10px] text-muted-foreground/70 opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-foreground" aria-label={`${n.label}: open its page`} title="Open the topic page">
              ↗
            </a>
          )}
        </div>
        {kids.length > 0 && (
          // Closed branches are hidden from the first paint; without JavaScript every branch shows (noscript style).
          <ul className={isOpen ? "" : "li-collapse"}>{kids.map(row)}</ul>
        )}
      </li>
    );
  };

  return (
    <nav aria-label="Topics" data-testid="linkedin-topic-tree">
      <style>{`.li-collapse{display:none}`}</style>
      <noscript dangerouslySetInnerHTML={NOSCRIPT_STYLE} />
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-2">Browse by topic</p>
      <ul className="space-y-0.5">
        {mode === "filter" && (
          <li>
            <button
              type="button"
              onClick={() => onSelect?.(null)}
              aria-pressed={!active}
              className={`li-js w-full flex items-baseline justify-between gap-2 py-1 px-1.5 ml-5 font-mono text-[12px] border-l-2 ${
                !active ? "border-foreground bg-foreground/[0.08] text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              style={{ width: "calc(100% - 1.25rem)" }}
            >
              <span>Everything</span>
              <span className="text-[10px] text-muted-foreground/70 tabular-nums">{total}</span>
            </button>
          </li>
        )}
        {(byParent.get(null) ?? []).map(row)}
        {mode === "filter" && extra && extra.count > 0 && (
          <li className="li-js pt-1">
            <button
              type="button"
              onClick={() => onSelect?.(active === extra.id ? null : extra.id)}
              aria-pressed={active === extra.id}
              className={`w-full flex items-baseline justify-between gap-2 py-1 px-1.5 ml-5 font-mono text-[11px] italic border-l-2 ${
                active === extra.id ? "border-foreground bg-foreground/[0.08] text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              style={{ width: "calc(100% - 1.25rem)" }}
              data-testid="linkedin-tree-unsorted"
            >
              <span>{extra.label}</span>
              <span className="text-[10px] text-muted-foreground/70 tabular-nums not-italic">{extra.count}</span>
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
}
