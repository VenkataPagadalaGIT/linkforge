"use client";
import * as React from "react";
import {
  KIND_LABEL,
  childTopics,
  engagementSource,
  entryPath,
  formatDateTime,
  formatDay,
  formatDuration,
  getItem,
  getTopic,
  inTopic,
  mostEngaging,
  readingMinutes,
  thumbUrl,
  topicLabel,
  topicPath,
  topicTrail,
  type LiEngagement,
  type LiEntry,
  type LiGraphNode,
  type LiItem,
} from "@/data/linkedinArchive";

/**
 * The details of the node pinned in the knowledge graph. Pinning keeps the node's connections lit while the pointer
 * travels, and this panel lists them as buttons, so the graph can be walked click by click: a post to its topics, a
 * topic to its area and subtopics, a subtopic to its posts, a post to the names in it.
 */

interface Props {
  node: LiGraphNode;
  nodeById: Map<string, LiGraphNode>;
  neighbours: Set<string>;
  entriesByKey: Map<string, LiEntry>;
  /** Recurring name -> its graph node id. */
  entityIdByLabel: Map<string, string>;
  activeTopic: string | null;
  onPin: (id: string) => void;
  onOpenEntry: (key: string, idx?: string) => void;
  onFilterTopic: (topicId: string | null) => void;
  onClose: () => void;
}

const EYEBROW = "font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70";
const CHIP = "font-mono text-[11px] px-2 py-1 border border-border text-foreground hover:border-foreground/60 text-left";
const PRIMARY = "font-mono text-[11px] uppercase tracking-[0.15em] px-3 py-2 border border-foreground text-foreground text-center hover:bg-foreground hover:text-background transition-colors";
const SECONDARY = "font-mono text-[11px] uppercase tracking-[0.15em] px-3 py-2 border border-border text-muted-foreground text-center hover:text-foreground hover:border-foreground/50 transition-colors";
const plural = (n: number, w: string) => `${n.toLocaleString("en-US")} ${w}${n === 1 ? "" : "s"}`;
const LEVEL_NAME = { 1: "Area", 2: "Topic", 3: "Subtopic" } as const;
const entryKindLabel = (e: LiEntry) => (e.kind === "article" ? "Article" : e.kind === "post" ? "Post" : KIND_LABEL[getItem(e.id)?.kind ?? "image"]);

function GraphPanel(p: Props) {
  const { node } = p;
  const headingId = React.useId();
  const ref = React.useRef<HTMLElement>(null);
  // Each newly pinned node takes focus (keyboard users land on its details) and starts at the top.
  React.useEffect(() => {
    ref.current?.focus({ preventScroll: true });
    ref.current?.parentElement?.scrollTo(0, 0);
  }, [node.id]);
  const entry = node.type === "entry" ? p.entriesByKey.get(node.label) : undefined;
  const kindLabel = entry ? entryKindLabel(entry) : node.type === "topic" ? LEVEL_NAME[getTopic(node.label)?.level ?? 2] : "Name";
  return (
    <aside
      ref={ref}
      tabIndex={-1}
      aria-labelledby={headingId}
      className="li-js border border-foreground/40 bg-background p-4 focus:outline-none focus-visible:ring-1 focus-visible:ring-foreground"
      data-testid="linkedin-graph-panel"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <p className={EYEBROW}>Pinned · {kindLabel}</p>
        <button type="button" onClick={p.onClose} className="font-mono text-[11px] px-2 py-0.5 border border-border text-muted-foreground hover:text-foreground" aria-label="Unpin and close (Esc)">
          ✕
        </button>
      </div>
      {entry && <EntryDetails {...p} entry={entry} headingId={headingId} />}
      {node.type === "topic" && <TopicDetails {...p} headingId={headingId} />}
      {node.type === "entity" && <EntityDetails {...p} headingId={headingId} />}
      <p className="mt-5 font-mono text-[10px] text-muted-foreground/70 leading-relaxed">
        Everything connected stays lit while this is pinned. Click any link here, or any lit node, to move along the graph. Esc, ✕ or a click on empty space unpins.
      </p>
    </aside>
  );
}

export default React.memo(GraphPanel);

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-4">
      <h4 className={`${EYEBROW} mb-1.5`}>{title}</h4>
      {children}
    </section>
  );
}

function Engagement({ e }: { e?: LiEngagement }) {
  if (!e)
    return (
      <Section title="Engagement">
        <p className="font-mono text-[11px] text-muted-foreground">Not recorded.</p>
      </Section>
    );
  const rows = (
    [
      ["Reactions", e.reactions],
      ["Comments", e.comments],
      ["Reposts", e.reposts],
      [e.impressionsAtLeast ? "Impressions (at least)" : "Impressions", e.impressions],
      [e.engagementsAtLeast ? "Engagements (at least)" : "Engagements", e.engagements],
    ] as const
  ).filter(([, v]) => v != null);
  return (
    <Section title={`Engagement · as of ${formatDay(e.asOf)}`}>
      <dl className="grid grid-cols-2 gap-2">
        {rows.map(([k, v]) => (
          <div key={k} className="border border-border px-2 py-1.5">
            <dt className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/70">{k}</dt>
            <dd className="font-display text-lg font-bold text-foreground">{v!.toLocaleString("en-US")}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-1 font-mono text-[10px] text-muted-foreground/70">Source: {engagementSource(e)}</p>
    </Section>
  );
}

/** The path to a topic, root first; each step pins its node. */
function Trail({ id, onPin, nodeById }: { id: string; onPin: (id: string) => void; nodeById: Map<string, LiGraphNode> }) {
  const trail = topicTrail(id);
  return (
    <nav aria-label="Topic path" className="flex flex-wrap items-center gap-1 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
      {trail.map((t, k) => (
        <React.Fragment key={t.id}>
          {k > 0 && <span aria-hidden="true">›</span>}
          {k < trail.length - 1 && nodeById.has(`t:${t.id}`) ? (
            <button type="button" onClick={() => onPin(`t:${t.id}`)} className="underline decoration-dotted underline-offset-2 hover:text-foreground">
              {t.label}
            </button>
          ) : (
            <span className={k === trail.length - 1 ? "text-foreground" : ""}>{t.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

/** Topic chips for an entry: each L2 topic with its area, then the L3 subtopics. */
function EntryTopics({ entry, nodeById, onPin }: { entry: LiEntry; nodeById: Map<string, LiGraphNode>; onPin: (id: string) => void }) {
  if (!entry.topics.length) return <p className="font-mono text-[11px] text-muted-foreground">No topic yet.</p>;
  return (
    <div className="flex flex-col gap-1.5">
      {entry.topics.map((t, k) => {
        const area = getTopic(t)?.parent;
        const subs = entry.subtopics.filter((s) => getTopic(s)?.parent === t);
        return (
          <div key={t} className="flex flex-wrap items-center gap-1.5">
            {area && nodeById.has(`t:${area}`) && (
              <button type="button" onClick={() => onPin(`t:${area}`)} className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground">
                {topicLabel(area)} ›
              </button>
            )}
            <button type="button" onClick={() => onPin(`t:${t}`)} className={`${CHIP} ${k === 0 ? "border-foreground/60" : ""}`} title={k === 0 ? "Main topic" : undefined}>
              {topicLabel(t)}
            </button>
            {subs.map((s) => (
              <button key={s} type="button" onClick={() => onPin(`t:${s}`)} className={`${CHIP} text-muted-foreground`}>
                ⬡ {topicLabel(s)}
              </button>
            ))}
          </div>
        );
      })}
    </div>
  );
}

/** Thumbnails; each opens the entry's viewer. */
function Thumbs({ idxs, onOpen, max = 12 }: { idxs: string[]; onOpen: (idx: string) => void; max?: number }) {
  const list = idxs.map((i) => getItem(i)).filter((x): x is LiItem => !!x);
  return (
    <>
      <ul className="grid grid-cols-4 gap-1.5">
        {list.slice(0, max).map((it) => (
          <li key={it.idx}>
            <button type="button" onClick={() => onOpen(it.idx)} className="group relative block w-full aspect-square overflow-hidden border border-border hover:border-foreground" title={it.description}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={thumbUrl(it)} alt={it.description} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
              {it.kind === "video" && <span className="absolute bottom-0.5 right-0.5 font-mono text-[9px] px-1 bg-black/80 text-white" aria-hidden="true">▶</span>}
            </button>
          </li>
        ))}
      </ul>
      {list.length > max && <p className="mt-1 font-mono text-[10px] text-muted-foreground/70">and {list.length - max} more in its viewer</p>}
    </>
  );
}

/** Entries as buttons that pin them; at most `max`, then a pointer to the full list. */
function EntryButtons({ list, onPin, max = 12, moreHref }: { list: LiEntry[]; onPin: (id: string) => void; max?: number; moreHref?: string }) {
  return (
    <>
      <ul className="flex flex-col gap-1.5">
        {list.slice(0, max).map((q) => (
          <li key={q.key}>
            <button type="button" onClick={() => onPin(`e:${q.key}`)} className={`${CHIP} w-full`}>
              <span className="block text-[10px] text-muted-foreground">
                {entryKindLabel(q)} · {formatDay(q.date)}
                {q.engagement?.reactions != null ? ` · ${q.engagement.reactions.toLocaleString("en-US")} reactions` : ""}
              </span>
              <span className="line-clamp-2">{q.title}</span>
            </button>
          </li>
        ))}
      </ul>
      {list.length > max && (
        <p className="mt-1 font-mono text-[10px] text-muted-foreground/70">
          and {list.length - max} more
          {moreHref ? (
            <>
              {" "}on <a href={moreHref} className="underline hover:text-foreground">its page</a>
            </>
          ) : (
            " in the cards below"
          )}
        </p>
      )}
    </>
  );
}

function NameChips({ names, byLabel, onPin }: { names: string[]; byLabel: Map<string, string>; onPin: (id: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {names.map((e) =>
        byLabel.has(e) ? (
          <button key={e} type="button" onClick={() => onPin(byLabel.get(e)!)} className={CHIP}>
            ◆ {e}
          </button>
        ) : (
          <span key={e} className="font-mono text-[11px] px-2 py-1 text-muted-foreground">{e}</span>
        ),
      )}
    </div>
  );
}

function EntryDetails({ entry, nodeById, entityIdByLabel, onPin, onOpenEntry, headingId }: Props & { entry: LiEntry; headingId: string }) {
  const cover = entry.media[0] ? getItem(entry.media[0]) : undefined;
  const media = entry.media.filter((m) => getItem(m));
  const commentMedia = (entry.commentMedia ?? []).filter((m) => getItem(m));
  const isMedia = entry.kind === "media";
  const open = (idx?: string) => onOpenEntry(entry.key, idx);
  return (
    <div>
      {cover && (
        <button type="button" onClick={() => open()} className="group relative block w-full border border-border hover:border-foreground mb-3" aria-label="Open it in the viewer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={thumbUrl(cover)} alt="" className="block w-full max-h-48 object-cover" />
          {cover.kind === "video" && <span className="absolute bottom-1 right-1 font-mono text-[10px] px-1.5 py-0.5 bg-black/80 text-white">▶ {formatDuration(cover.duration)}</span>}
        </button>
      )}
      <p className={EYEBROW}>
        {entryKindLabel(entry)} ·{" "}
        <time dateTime={entry.date}>{entry.date.length > 10 ? formatDateTime(entry.date) : formatDay(entry.date)}</time>
      </p>
      <h3 id={headingId} className="mt-1 font-display text-lg font-bold text-foreground leading-snug">
        {isMedia ? entry.title : <a href={entryPath(entry)} className="hover:underline">{entry.title}</a>}
      </h3>
      <p className="mt-1 font-mono text-[11px] text-muted-foreground">
        {entry.kind === "article" && entry.words ? `${plural(entry.words, "word")} · ${readingMinutes(entry.words)} min read · ` : ""}
        {isMedia ? cover?.label ?? "" : plural(media.length, "media item")}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {isMedia ? (
          <button type="button" onClick={() => open()} className={PRIMARY}>Open full view</button>
        ) : (
          <a href={entryPath(entry)} className={PRIMARY}>Read it here</a>
        )}
        {entry.url ? (
          <a href={entry.url} target="_blank" rel="noopener noreferrer" className={SECONDARY}>On LinkedIn ↗</a>
        ) : media.length > 0 && !isMedia ? (
          <button type="button" onClick={() => open()} className={SECONDARY}>Open the media</button>
        ) : (
          <span />
        )}
      </div>
      {!isMedia && <Engagement e={entry.engagement} />}
      {entry.excerpt && (
        <Section title={entry.kind === "article" ? "Opening" : entry.kind === "post" ? "Text" : "What it shows"}>
          <p className="font-mono text-[11px] leading-relaxed text-muted-foreground line-clamp-[10]">{entry.excerpt}</p>
        </Section>
      )}
      <Section title="Topics">
        <EntryTopics entry={entry} nodeById={nodeById} onPin={onPin} />
      </Section>
      {!isMedia && media.length > 0 && (
        <Section title={`Media in it (${media.length})`}>
          <Thumbs idxs={media} onOpen={open} />
        </Section>
      )}
      {commentMedia.length > 0 && (
        <Section title={`In my comments on it (${commentMedia.length})`}>
          <Thumbs idxs={commentMedia} onOpen={open} />
        </Section>
      )}
      {entry.names.length > 0 && (
        <Section title="Names in it">
          <NameChips names={entry.names} byLabel={entityIdByLabel} onPin={onPin} />
        </Section>
      )}
    </div>
  );
}

function TopicDetails({ node, nodeById, entriesByKey, entityIdByLabel, activeTopic, onPin, onFilterTopic, headingId }: Props & { headingId: string }) {
  const t = getTopic(node.label);
  const all = React.useMemo(() => [...entriesByKey.values()], [entriesByKey]);
  const entries = React.useMemo(() => (t ? all.filter((e) => inTopic(e, t.id)).sort((a, b) => b.date.localeCompare(a.date)) : []), [all, t]);
  if (!t) return null;
  const kids = childTopics(t.id)
    .map((c) => ({ c, n: entries.filter((e) => inTopic(e, c.id)).length }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n);
  const nameCounts = new Map<string, number>();
  for (const e of entries) for (const n of e.names) nameCounts.set(n, (nameCounts.get(n) ?? 0) + 1);
  const names = [...nameCounts].sort((a, b) => b[1] - a[1]).map(([e]) => e).filter((e) => entityIdByLabel.has(e)).slice(0, 12);
  const years = entries.map((e) => e.date.slice(0, 4));
  const posts = entries.filter((e) => e.kind !== "media");
  const active = activeTopic === t.id;
  return (
    <div>
      {t.level > 1 && <Trail id={t.id} onPin={onPin} nodeById={nodeById} />}
      <h3 id={headingId} className="mt-1 font-display text-xl font-bold text-foreground">
        {t.level === 3 ? "⬡ " : ""}
        {t.label}
      </h3>
      {t.description && <p className="mt-1 font-mono text-[11px] leading-relaxed text-muted-foreground">{t.description}</p>}
      <p className="mt-1.5 font-mono text-[11px] text-foreground/80">
        {posts.length.toLocaleString("en-US")} {posts.length === 1 ? "post or article" : "posts and articles"}
        {entries.length > posts.length ? ` · ${plural(entries.length - posts.length, "media item")} on their own` : ""}
        {years.length ? ` · ${years[years.length - 1]} to ${years[0]}` : ""}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <a href={topicPath(t.id)} className={PRIMARY}>{LEVEL_NAME[t.level]} page</a>
        <button type="button" onClick={() => onFilterTopic(active ? null : t.id)} aria-pressed={active} className={`${SECONDARY} ${active ? "border-foreground text-foreground" : ""}`}>
          {active ? "Clear the filter" : "Show only these"}
        </button>
      </div>
      {kids.length > 0 && (
        <Section title={t.level === 1 ? `Topics in it (${kids.length})` : `Subtopics (${kids.length})`}>
          <div className="flex flex-wrap gap-1.5">
            {kids.map(({ c, n }) =>
              nodeById.has(`t:${c.id}`) ? (
                <button key={c.id} type="button" onClick={() => onPin(`t:${c.id}`)} className={CHIP}>
                  {c.level === 3 ? "⬡ " : ""}
                  {c.label} <span className="text-muted-foreground">{n}</span>
                </button>
              ) : (
                <a key={c.id} href={topicPath(c.id)} className={CHIP}>
                  {c.label} <span className="text-muted-foreground">{n}</span>
                </a>
              ),
            )}
          </div>
        </Section>
      )}
      {posts.length > 0 && (
        <Section title="Most engaging">
          <EntryButtons list={mostEngaging(posts, posts.length)} onPin={onPin} max={8} moreHref={topicPath(t.id)} />
        </Section>
      )}
      {names.length > 0 && (
        <Section title="Names that recur here">
          <NameChips names={names} byLabel={entityIdByLabel} onPin={onPin} />
        </Section>
      )}
    </div>
  );
}

function EntityDetails({ node, neighbours, entriesByKey, nodeById, onPin, headingId }: Props & { headingId: string }) {
  const entries = [...neighbours]
    .filter((n) => n.startsWith("e:"))
    .map((n) => entriesByKey.get(n.slice(2)))
    .filter((x): x is LiEntry => !!x)
    .sort((a, b) => b.date.localeCompare(a.date));
  const counts = new Map<string, number>();
  for (const e of entries) for (const t of e.topics) counts.set(t, (counts.get(t) ?? 0) + 1);
  const years = entries.map((e) => e.date.slice(0, 4));
  return (
    <div>
      <h3 id={headingId} className="font-display text-xl font-bold text-foreground">◆ {node.label}</h3>
      <p className="mt-1 font-mono text-[11px] text-muted-foreground">
        In {plural(entries.length, "post")}
        {years.length ? ` · ${years[years.length - 1]} to ${years[0]}` : ""}
      </p>
      {counts.size > 0 && (
        <Section title="Topics">
          <div className="flex flex-wrap gap-1.5">
            {[...counts]
              .sort((a, b) => b[1] - a[1])
              .filter(([t]) => nodeById.has(`t:${t}`))
              .map(([t, n]) => (
                <button key={t} type="button" onClick={() => onPin(`t:${t}`)} className={CHIP}>
                  {topicLabel(t)} <span className="text-muted-foreground">{n}</span>
                </button>
              ))}
          </div>
        </Section>
      )}
      <Section title={`Posts (${entries.length})`}>
        <EntryButtons list={entries} onPin={onPin} max={14} />
      </Section>
    </div>
  );
}
