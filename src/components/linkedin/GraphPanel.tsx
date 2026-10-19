"use client";
import * as React from "react";
import {
  KIND_LABEL,
  LINKEDIN_ACTIVITY,
  engagementSource,
  linkedinUrl,
  postFromNode,
  formatDateTime,
  formatDay,
  formatDuration,
  postPath,
  readingMinutes,
  thumbUrl,
  topicLabel,
  topicSlug,
  type LiEngagement,
  type LiGraphNode,
  type LiItem,
  type LiPost,
} from "@/data/linkedinArchive";

/**
 * The details of the node pinned in the knowledge graph. Pinning keeps the node's
 * connections lit while the pointer travels, and this panel lists every one of them
 * as a button, so the graph can be walked click by click: an article to its images,
 * an image to its topic, a topic to its names.
 */

interface Props {
  node: LiGraphNode;
  nodeById: Map<string, LiGraphNode>;
  /** Recurring name -> its graph node id. */
  entityIdByLabel: Map<string, string>;
  neighbours: Set<string>;
  itemsByIdx: Map<string, LiItem>;
  postsById: Map<string, LiPost>;
  activeTopic: string | null;
  onPin: (id: string) => void;
  onOpenItem: (idx: string) => void;
  onFilterTopic: (topicId: string | null) => void;
  onClose: () => void;
}

const EYEBROW = "font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70";
const CHIP = "font-mono text-[11px] px-2 py-1 border border-border text-foreground hover:border-foreground/60 text-left";
const PRIMARY = "font-mono text-[11px] uppercase tracking-[0.15em] px-3 py-2 border border-foreground text-foreground text-center hover:bg-foreground hover:text-background transition-colors";
const SECONDARY = "font-mono text-[11px] uppercase tracking-[0.15em] px-3 py-2 border border-border text-muted-foreground text-center hover:text-foreground hover:border-foreground/50 transition-colors";
const plural = (n: number, w: string) => `${n.toLocaleString("en-US")} ${w}${n === 1 ? "" : "s"}`;

function GraphPanel(p: Props) {
  const { node } = p;
  const headingId = React.useId();
  const ref = React.useRef<HTMLElement>(null);
  // Each newly pinned node takes focus (keyboard users land on its details) and starts at the top.
  React.useEffect(() => {
    ref.current?.focus({ preventScroll: true });
    ref.current?.parentElement?.scrollTo(0, 0);
  }, [node.id]);
  const kindLabel = node.type === "post" ? (node.postType === "post" ? "Post" : "Article") : node.type === "topic" ? "Topic" : node.type === "entity" ? "Name" : "Item";
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
      {node.type === "post" && <PostDetails {...p} headingId={headingId} />}
      {node.type === "item" && <ItemDetails {...p} headingId={headingId} />}
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
        <p className="font-mono text-[11px] text-muted-foreground">Not recorded yet.</p>
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

/** Thumbnails of items; each pins its item. */
function Thumbs({ idxs, itemsByIdx, onPin, max = 18 }: { idxs: string[]; itemsByIdx: Map<string, LiItem>; onPin: (id: string) => void; max?: number }) {
  const list = idxs.map((i) => itemsByIdx.get(i)).filter((x): x is LiItem => !!x);
  return (
    <>
      <ul className="grid grid-cols-4 gap-1.5">
        {list.slice(0, max).map((it) => (
          <li key={it.idx}>
            <button type="button" onClick={() => onPin(`i:${it.idx}`)} className="group relative block w-full aspect-square overflow-hidden border border-border hover:border-foreground" title={it.description}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={thumbUrl(it)} alt={it.description} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
              {it.kind === "video" && <span className="absolute bottom-0.5 right-0.5 font-mono text-[9px] px-1 bg-black/80 text-white" aria-hidden="true">▶</span>}
            </button>
          </li>
        ))}
      </ul>
      {list.length > max && <p className="mt-1 font-mono text-[10px] text-muted-foreground/70">and {list.length - max} more in the cards below</p>}
    </>
  );
}

function TopicChips({ ids, onPin }: { ids: string[]; onPin: (id: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {ids.map((t) => (
        <button key={t} type="button" onClick={() => onPin(`t:${t}`)} className={CHIP}>
          {topicLabel(t)}
        </button>
      ))}
    </div>
  );
}

/** Posts and articles as buttons, most reactions first; at most `max`, then a pointer to the full list. */
function PostButtons({ ids, postsById, nodeById, onPin, max = 20, moreHref }: { ids: string[]; postsById: Map<string, LiPost>; nodeById: Map<string, LiGraphNode>; onPin: (id: string) => void; max?: number; moreHref?: string }) {
  const list = ids
    .map((id) => postsById.get(id) ?? (nodeById.get(`p:${id}`) ? postFromNode(nodeById.get(`p:${id}`)!) : undefined))
    .filter((q): q is LiPost => !!q)
    .sort((a, b) => (b.engagement?.reactions ?? -1) - (a.engagement?.reactions ?? -1) || b.date.localeCompare(a.date));
  return (
    <>
      <ul className="flex flex-col gap-1.5">
        {list.slice(0, max).map((q) => (
          <li key={q.id}>
            <button type="button" onClick={() => onPin(`p:${q.id}`)} className={`${CHIP} w-full`}>
              <span className="block text-[10px] text-muted-foreground">
                {q.type === "article" ? "Article" : "Post"} · {formatDay(q.date.slice(0, 10))}
                {q.engagement?.reactions != null ? ` · ${q.engagement.reactions.toLocaleString("en-US")} reactions` : ""}
              </span>
              {q.title}
            </button>
          </li>
        ))}
      </ul>
      {list.length > max && (
        <p className="mt-1 font-mono text-[10px] text-muted-foreground/70">
          and {list.length - max} more
          {moreHref ? (
            <>
              {" "}on <a href={moreHref} className="underline hover:text-foreground">the topic page</a>
            </>
          ) : (
            " in the timeline"
          )}
        </p>
      )}
    </>
  );
}

function PostDetails({ node, postsById, itemsByIdx, nodeById, neighbours, entityIdByLabel, onPin, headingId }: Props & { headingId: string }) {
  const post = postsById.get(node.id.slice(2)) ?? postFromNode(node, [...neighbours].filter((x) => x.startsWith("t:")).map((x) => x.slice(2)));
  const realMedia = post.media.filter((m) => itemsByIdx.has(m));
  const url = linkedinUrl(post);
  const names = post.media
    .flatMap((m) => itemsByIdx.get(m)?.entities ?? [])
    .filter((e, i, a) => a.indexOf(e) === i);
  return (
    <div>
      {post.cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumbUrl({ idx: post.cover })} alt="" className="block w-full h-36 object-cover border border-border mb-3" />
      )}
      <p className={EYEBROW}>
        LinkedIn {post.type} · <time dateTime={post.date}>{formatDateTime(post.date)}</time>
      </p>
      <h3 id={headingId} className="mt-1 font-display text-lg font-bold text-foreground leading-snug">
        <a href={postPath(post)} className="hover:underline">{post.title}</a>
      </h3>
      <p className="mt-1 font-mono text-[11px] text-muted-foreground">
        {post.type === "article" ? `${plural(post.words, "word")} · ${readingMinutes(post.words)} min read · ${plural(post.media.length, "image")}` : `${post.media.length} media`}
        {post.people.length ? ` · ${post.people.length === 1 ? "1 person" : `${post.people.length} people`} named` : ""}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <a href={postPath(post)} className={PRIMARY}>Read it here</a>
        {url ? (
          <a href={url} target="_blank" rel="noopener noreferrer" className={SECONDARY}>On LinkedIn ↗</a>
        ) : (
          <span className={`${SECONDARY} opacity-70`}>Full text on its page</span>
        )}
      </div>
      <Engagement e={post.engagement} />
      {post.excerpt && (
        <Section title={post.type === "post" ? "Text" : "Opening"}>
          <p className="font-mono text-[11px] leading-relaxed text-muted-foreground">{post.excerpt}</p>
        </Section>
      )}
      {post.topics.length > 0 && (
        <Section title="Topics">
          <TopicChips ids={post.topics.filter((t) => nodeById.has(`t:${t}`))} onPin={onPin} />
        </Section>
      )}
      {realMedia.length > 0 && (
        <Section title={`${post.type === "post" ? "Media" : "Images"} in it (${realMedia.length})`}>
          <Thumbs idxs={realMedia} itemsByIdx={itemsByIdx} onPin={onPin} />
        </Section>
      )}
      {post.people.length > 0 && (
        <Section title={`People named (${post.people.length})`}>
          <ul className="flex flex-wrap gap-1.5">
            {post.people.map((x) => (
              <li key={x.url}>
                <a href={x.url} target="_blank" rel="noopener noreferrer" className={`${CHIP} inline-block`}>
                  {x.name} <span aria-hidden="true">↗</span>
                </a>
              </li>
            ))}
          </ul>
        </Section>
      )}
      {names.some((e) => entityIdByLabel.has(e)) && (
        <Section title="Names in its images">
          <EntityChips names={names} byLabel={entityIdByLabel} onPin={onPin} />
        </Section>
      )}
    </div>
  );
}

function EntityChips({ names, byLabel, onPin }: { names: string[]; byLabel: Map<string, string>; onPin: (id: string) => void }) {
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

function ItemDetails({ node, itemsByIdx, postsById, nodeById, entityIdByLabel, onPin, onOpenItem, headingId }: Props & { headingId: string }) {
  const it = itemsByIdx.get(node.idx!);
  if (!it) return null;
  const post = it.post ? postsById.get(it.post) : undefined;
  return (
    <div>
      <button type="button" onClick={() => onOpenItem(it.idx)} className="group relative block w-full border border-border hover:border-foreground mb-3" aria-label={`Open ${KIND_LABEL[it.kind].toLowerCase()} full size`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={thumbUrl(it)} alt="" className="block w-full max-h-56 object-contain bg-black/40" />
        {it.kind === "video" && <span className="absolute bottom-1 right-1 font-mono text-[10px] px-1.5 py-0.5 bg-black/80 text-white">▶ {formatDuration(it.duration)}</span>}
      </button>
      <p className={EYEBROW}>
        {KIND_LABEL[it.kind]} · {formatDay(it.date)} · {it.label}
      </p>
      <h3 id={headingId} className="mt-1 font-display text-base font-bold text-foreground leading-snug">{it.description}</h3>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => onOpenItem(it.idx)} className={PRIMARY}>Open full view</button>
        <a href={post?.url || LINKEDIN_ACTIVITY} target="_blank" rel="noopener noreferrer" className={SECONDARY}>On LinkedIn ↗</a>
      </div>
      {post && (
        <Section title={it.inComment ? "From my comment on the post" : `From the ${post.type}`}>
          <PostButtons ids={[post.id]} postsById={postsById} nodeById={nodeById} onPin={onPin} />
        </Section>
      )}
      {it.topics.filter((t) => t !== "other").length > 0 && (
        <Section title="Topics">
          <TopicChips ids={it.topics.filter((t) => t !== "other" && nodeById.has(`t:${t}`))} onPin={onPin} />
        </Section>
      )}
      {it.entities.length > 0 && (
        <Section title="Names in it">
          <EntityChips names={it.entities} byLabel={entityIdByLabel} onPin={onPin} />
        </Section>
      )}
    </div>
  );
}

function TopicDetails({ node, itemsByIdx, postsById, nodeById, neighbours, entityIdByLabel, activeTopic, onPin, onFilterTopic, headingId }: Props & { headingId: string }) {
  const id = node.label;
  const items = [...itemsByIdx.values()].filter((i) => i.topics.includes(id)).sort((a, b) => b.date.localeCompare(a.date));
  const posts = [...neighbours].filter((n) => n.startsWith("p:")).map((n) => n.slice(2));
  const nameCounts = new Map<string, number>();
  for (const it of items) for (const e of it.entities) nameCounts.set(e, (nameCounts.get(e) ?? 0) + 1);
  const names = [...nameCounts].sort((a, b) => b[1] - a[1]).map(([e]) => e).filter((e) => entityIdByLabel.has(e)).slice(0, 12);
  const years = items.map((i) => i.date.slice(0, 4));
  const active = activeTopic === id;
  return (
    <div>
      <h3 id={headingId} className="font-display text-xl font-bold text-foreground">{topicLabel(id)}</h3>
      <p className="mt-1 font-mono text-[11px] text-muted-foreground">
        {plural(items.length, "item")}
        {posts.length ? ` · ${posts.length} ${posts.length === 1 ? "post or article" : "posts and articles"}` : ""}
        {years.length ? ` · ${years[years.length - 1]} to ${years[0]}` : ""}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {id !== "other" ? <a href={`/linkedin/topics/${topicSlug(id)}`} className={PRIMARY}>Topic page</a> : <span />}
        <button type="button" onClick={() => onFilterTopic(active ? null : id)} aria-pressed={active} className={`${SECONDARY} ${active ? "border-foreground text-foreground" : ""}`}>
          Filter the cards by this topic
        </button>
      </div>
      {posts.length > 0 && (
        <Section title={`Posts and articles (${posts.length})`}>
          <PostButtons ids={posts} postsById={postsById} nodeById={nodeById} onPin={onPin} moreHref={id !== "other" ? `/linkedin/topics/${topicSlug(id)}` : undefined} />
        </Section>
      )}
      {names.length > 0 && (
        <Section title="Names that recur here">
          <EntityChips names={names} byLabel={entityIdByLabel} onPin={onPin} />
        </Section>
      )}
      <Section title="Newest items">
        <Thumbs idxs={items.map((i) => i.idx)} itemsByIdx={itemsByIdx} onPin={onPin} max={12} />
      </Section>
    </div>
  );
}

function EntityDetails({ node, itemsByIdx, postsById, nodeById, neighbours, onPin, headingId }: Props & { headingId: string }) {
  const items = [...neighbours].filter((n) => n.startsWith("i:")).map((n) => itemsByIdx.get(n.slice(2))).filter((x): x is LiItem => !!x).sort((a, b) => b.date.localeCompare(a.date));
  const posts = [...neighbours].filter((n) => n.startsWith("p:")).map((n) => n.slice(2));
  const topicCounts = new Map<string, number>();
  for (const it of items) for (const t of it.topics) if (t !== "other") topicCounts.set(t, (topicCounts.get(t) ?? 0) + 1);
  const years = items.map((i) => i.date.slice(0, 4));
  return (
    <div>
      <h3 id={headingId} className="font-display text-xl font-bold text-foreground">◆ {node.label}</h3>
      <p className="mt-1 font-mono text-[11px] text-muted-foreground">
        In {plural(items.length, "item")}
        {posts.length ? ` and ${posts.length} ${posts.length === 1 ? "post or article" : "posts and articles"}` : ""}
        {years.length ? ` · ${years[years.length - 1]} to ${years[0]}` : ""}
      </p>
      {posts.length > 0 && (
        <Section title="Posts and articles">
          <PostButtons ids={posts} postsById={postsById} nodeById={nodeById} onPin={onPin} />
        </Section>
      )}
      {topicCounts.size > 0 && (
        <Section title="Topics">
          <TopicChips ids={[...topicCounts].sort((a, b) => b[1] - a[1]).map(([t]) => t)} onPin={onPin} />
        </Section>
      )}
      <Section title={`Items (${items.length})`}>
        <Thumbs idxs={items.map((i) => i.idx)} itemsByIdx={itemsByIdx} onPin={onPin} />
      </Section>
    </div>
  );
}
