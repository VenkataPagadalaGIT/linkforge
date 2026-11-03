/**
 * Search across the feeds: topics and concepts, every resource, the news, each story's posts, people and companies. Small
 * enough to run in the browser from one static file today; `search` is the one seam a server index (Postgres full text)
 * replaces when the corpus outgrows a single file (docs/FEEDS_ARCHITECTURE.md).
 *
 * How a person actually searches decides the rules:
 *  - "news", "videos", "list of topics" ask for a KIND of thing, so they browse that kind instead of matching the word.
 *  - "python videos", "free courses", "beginner rag" narrow: the words are the topic, the rest are filters.
 *  - Exact and prefix matches come first. Typo tolerance only runs if nothing matched, so "news" never returns "new".
 *  - A title match beats a mention. A word found only in a description counts only when titles found little.
 *  - The same title never shows twice.
 */
export type SearchKind = "topic" | "video" | "course" | "book" | "repo" | "guide" | "paper" | "news" | "post" | "person" | "company";

export interface SearchDoc {
  id: string;
  kind: SearchKind;
  title: string;
  /** Shown under the title: who made it, where it sits. Searched at a lower weight than the title. */
  sub?: string;
  /** Searched only as a last resort, not shown. */
  text?: string;
  /** Where a click goes. */
  href: string;
  /** The picture, when there is one. */
  thumb?: string;
  /** The platform, for "search in platforms". */
  platform?: string;
  level?: string;
  free?: boolean;
  /** Added to the score: a story or topic should lead a page of mentions. */
  boost?: number;
  /** For the feed view of results. */
  url?: string;
  youtube?: { id?: string; list?: string };
  noEmbed?: boolean;
  date?: string;
}

export interface SearchHit {
  doc: SearchDoc;
  score: number;
}

export const KIND_LABELS: Record<SearchKind, { one: string; many: string }> = {
  topic: { one: "Topic", many: "Topics" },
  video: { one: "Video", many: "Videos" },
  course: { one: "Course", many: "Courses" },
  book: { one: "Book", many: "Books" },
  repo: { one: "Repo", many: "Repos" },
  guide: { one: "Guide", many: "Guides" },
  paper: { one: "Paper", many: "Papers" },
  news: { one: "News", many: "News" },
  post: { one: "Post", many: "Posts" },
  person: { one: "Person", many: "People" },
  company: { one: "Company", many: "Companies" },
};

const STOP = new Set("a an and are as at be by can do does for from how i in is it list me of on or show the to what where which who why with all any find get give want".split(" "));

/** Words that ask for a kind of thing rather than name a topic. */
const KIND_WORDS: Record<string, SearchKind[]> = {
  video: ["video"], videos: ["video"], watch: ["video"], youtube: ["video"],
  course: ["course"], courses: ["course"], class: ["course"], classes: ["course"],
  book: ["book"], books: ["book"],
  repo: ["repo"], repos: ["repo"], repository: ["repo"], repositories: ["repo"], github: ["repo"],
  guide: ["guide"], guides: ["guide"], article: ["guide"], articles: ["guide"], tutorial: ["guide", "video"], tutorials: ["guide", "video"],
  paper: ["paper"], papers: ["paper"], research: ["paper"],
  news: ["news"], headlines: ["news"], latest: ["news"], updates: ["news"], stories: ["news"], story: ["news"],
  post: ["post"], posts: ["post"], tweets: ["post"], social: ["post"],
  topic: ["topic"], topics: ["topic"], concept: ["topic"], concepts: ["topic"], subject: ["topic"], subjects: ["topic"],
  people: ["person"], person: ["person"], experts: ["person"], contributors: ["person"],
  company: ["company"], companies: ["company"],
};
const LEVEL_WORDS = new Set(["beginner", "beginners", "intermediate", "advanced"]);

const NEWS_NOISE = new Set(["ai", "tech", "technology", "business", "today", "breaking", "recent", "new", "top"]);
/** "what is available", "everything": asking what exists, which the box answers by listing it. */
const BROWSE = new Set(["available", "everything", "options", "have", "you", "we", "there", "here", "stuff", "things"]);

/** Short forms expand to the words people write in titles. */
const SHORT: Record<string, string[]> = {
  ai: ["artificial intelligence"],
  ml: ["machine learning"],
  dl: ["deep learning"],
  nn: ["neural network"],
  nlp: ["natural language processing"],
  llm: ["large language model"],
  llms: ["large language model"],
  rl: ["reinforcement learning"],
  cv: ["computer vision"],
  rag: ["retrieval augmented generation"],
  gan: ["generative adversarial"],
  gans: ["generative adversarial"],
  cnn: ["convolutional"],
  rnn: ["recurrent neural"],
};

export function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9+#]+/)
    .filter(Boolean);
}

export interface ParsedQuery {
  terms: string[];
  kinds: SearchKind[];
  level: string | null;
  free: boolean;
  phrase: string;
}

/** Separate what the person wants to know about from how they asked for it. */
export function parseQuery(query: string): ParsedQuery {
  const raw = tokens(query);
  const kinds = new Set<SearchKind>();
  let level: string | null = null;
  let free = false;
  const terms: string[] = [];
  for (const w of raw) {
    if (KIND_WORDS[w]) KIND_WORDS[w].forEach((k) => kinds.add(k));
    else if (LEVEL_WORDS.has(w)) level = w.startsWith("beginner") ? "beginner" : w;
    else if (w === "free") free = true;
    else if (!STOP.has(w)) terms.push(w);
  }
  // "ai news", "tech news", "latest business news" ask for the news, not for a story with the word "tech" in its title.
  const kept = kinds.has("news") ? terms.filter((w) => !NEWS_NOISE.has(w)) : terms;
  // Only stop words typed ("what is the"): search them as written rather than returning nothing.
  if (!kept.length && !kinds.size && !level && !free && !raw.every((w) => STOP.has(w) || BROWSE.has(w))) return { terms: raw, kinds: [], level: null, free: false, phrase: raw.join(" ") };
  return { terms: kept.filter((w) => !BROWSE.has(w) || kept.length > 1), kinds: [...kinds], level, free, phrase: kept.join(" ") };
}

/** Edit distance, stopping as soon as it passes `max`. */
function within(a: string, b: string, max: number): boolean {
  if (Math.abs(a.length - b.length) > max) return false;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      const v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      cur.push(v);
      if (v < best) best = v;
    }
    if (best > max) return false;
    prev = cur;
  }
  return prev[b.length] <= max;
}

interface Entry {
  doc: SearchDoc;
  title: string[];
  sub: string[];
  text: string[];
  titleText: string;
  subText: string;
  allText: string;
  key: string;
}

export type SearchIndex = Entry[];

export function buildIndex(docs: SearchDoc[]): SearchIndex {
  return docs.map((doc) => {
    const title = tokens(doc.title);
    const sub = tokens(doc.sub ?? "");
    const text = tokens(doc.text ?? "");
    return { doc, title, sub, text, titleText: title.join(" "), subText: sub.join(" "), allText: text.join(" "), key: `${doc.kind}:${title.join(" ")}` };
  });
}

/** 3 exact, 2 prefix, 0 none. A prefix needs two letters, so "a" matches nothing by itself. */
function strictIn(q: string, list: string[]): number {
  let best = 0;
  for (const t of list) {
    if (t === q) return 3;
    if (q.length >= 2 && t.startsWith(q)) best = 2;
  }
  return best;
}

function fuzzyIn(q: string, list: string[]): boolean {
  const max = q.length >= 9 ? 2 : q.length >= 5 ? 1 : 0;
  return max > 0 && list.some((t) => within(q, t, max));
}

type Tier = "strong" | "weak";

function scoreWord(q: string, e: Entry, tier: Tier, fuzzy: boolean): number {
  const short = SHORT[q] ?? [];
  const inTitle = strictIn(q, e.title);
  if (inTitle) return inTitle * 3;
  if (short.some((p) => e.titleText.includes(p))) return 8;
  const inSub = strictIn(q, e.sub);
  if (inSub) return inSub;
  if (short.some((p) => e.subText.includes(p))) return 2;
  if (fuzzy && fuzzyIn(q, e.title)) return 3;
  if (fuzzy && fuzzyIn(q, e.sub)) return 1;
  if (tier === "weak") {
    // A short word in a long description is noise ("ai" is in every description), so only real words count here.
    if (q.length >= 4 && strictIn(q, e.text)) return 1;
    if (short.some((p) => e.allText.includes(p))) return 1;
    if (fuzzy && fuzzyIn(q, e.text)) return 0.5;
  }
  return 0;
}

function run(index: SearchIndex, p: ParsedQuery, tier: Tier, fuzzy: boolean): SearchHit[] {
  const hits: SearchHit[] = [];
  const phrase = p.phrase.length > 2 && p.terms.length > 1 ? p.phrase : "";
  for (const e of index) {
    if (p.kinds.length && !p.kinds.includes(e.doc.kind)) continue;
    if (p.level && e.doc.level !== p.level) continue;
    if (p.free && !e.doc.free) continue;
    let total = 0;
    let all = true;
    for (const q of p.terms) {
      const s = scoreWord(q, e, tier, fuzzy);
      if (!s) {
        all = false;
        break;
      }
      total += s;
    }
    if (!all) continue;
    if (phrase && e.titleText.includes(phrase)) total += 8;
    if (p.terms.length && e.titleText === p.terms.join(" ")) total += 6;
    hits.push({ doc: e.doc, score: total + (e.doc.boost ?? 0) });
  }
  return hits;
}

function finish(index: SearchIndex, hits: SearchHit[], limit: number, keepOrder = false): SearchHit[] {
  const sorted = keepOrder ? hits : hits.sort((a, b) => b.score - a.score || (b.doc.date ?? "").localeCompare(a.doc.date ?? "") || a.doc.title.length - b.doc.title.length);
  const seen = new Set<string>();
  const out: SearchHit[] = [];
  const keys = new Map(index.map((e) => [e.doc, e.key]));
  for (const h of sorted) {
    const k = keys.get(h.doc) ?? h.doc.id;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(h);
    if (out.length >= limit) break;
  }
  return out;
}

export function search(index: SearchIndex, query: string, limit = 60): SearchHit[] {
  const p = parseQuery(query);
  if (!p.terms.length && !p.kinds.length && !p.level && !p.free) return [];
  if (!p.terms.length) {
    // Only a kind or filter was asked for: list what exists, in the order the index keeps (roadmap order, newest news).
    const hits = index
      .filter((e) => (!p.kinds.length || p.kinds.includes(e.doc.kind)) && (!p.level || e.doc.level === p.level) && (!p.free || e.doc.free))
      .map((e) => ({ doc: e.doc, score: e.doc.boost ?? 0 }));
    const order = hits.map((h, i) => ({ h, i })).sort((a, b) => b.h.score - a.h.score || a.i - b.i).map((x) => x.h);
    return finish(index, order, limit, true);
  }
  // Titles and credits first. Descriptions only widen a thin result, and typos only rescue an empty one.
  let hits = run(index, p, "strong", false);
  if (hits.length < 8) {
    const seen = new Set(hits.map((h) => h.doc));
    hits = [...hits, ...run(index, p, "weak", false).filter((h) => !seen.has(h.doc))];
  }
  if (!hits.length) hits = run(index, p, "weak", true);
  return finish(index, hits, limit);
}

/** Asking what exists rather than naming anything: the box answers with its list of what is here. */
export function isBrowseQuery(query: string): boolean {
  const raw = tokens(query);
  return raw.length > 0 && raw.every((w) => STOP.has(w) || BROWSE.has(w)) && raw.some((w) => BROWSE.has(w));
}

/** How many of each kind exist, for "what is available". */
export function countKinds(docs: SearchDoc[]): Partial<Record<SearchKind, number>> {
  const m: Partial<Record<SearchKind, number>> = {};
  for (const d of docs) m[d.kind] = (m[d.kind] ?? 0) + 1;
  return m;
}
