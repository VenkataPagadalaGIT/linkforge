/**
 * Search across the feeds: roadmap topics and resources, and the posts of each story. Small enough to run in the
 * browser from one static file, so there is no server and no cost. Forgiving where readers are not exact: prefixes
 * ("transform" finds "Transformers"), one typo ("pyton"), and the field's short forms ("ml", "llm", "rag").
 */
export type SearchKind = "topic" | "video" | "course" | "book" | "repo" | "post";

export interface SearchDoc {
  id: string;
  kind: SearchKind;
  title: string;
  /** Shown under the title: who made it, where it sits. Searched too, at a lower weight. */
  sub?: string;
  /** Searched, not shown. */
  text?: string;
  href: string;
  thumb?: string;
}

export interface SearchHit {
  doc: SearchDoc;
  score: number;
}

const STOP = new Set("a an and are as at be by for from how in is it of on or the to what with".split(" "));

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
  gpu: ["graphics processing"],
};

export function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9+#]+/)
    .filter(Boolean);
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
  rest: string[];
  titleText: string;
  allText: string;
}

export type SearchIndex = Entry[];

export function buildIndex(docs: SearchDoc[]): SearchIndex {
  return docs.map((doc) => {
    const title = tokens(doc.title);
    const rest = tokens(`${doc.sub ?? ""} ${doc.text ?? ""}`);
    return { doc, title, rest, titleText: title.join(" "), allText: [...title, ...rest].join(" ") };
  });
}

function bestIn(q: string, list: string[]): number {
  let best = 0;
  const fuzzy = q.length >= 8 ? 2 : q.length >= 4 ? 1 : 0;
  for (const t of list) {
    if (t === q) return 3;
    if (t.startsWith(q) && q.length >= 2) best = Math.max(best, 2);
    else if (fuzzy && best < 1 && within(q, t, fuzzy)) best = 1;
  }
  return best;
}

function scoreOf(q: string, e: Entry): number {
  const inTitle = bestIn(q, e.title);
  const inRest = inTitle ? 0 : bestIn(q, e.rest);
  let score = inTitle * 3 + inRest;
  for (const phrase of SHORT[q] ?? []) {
    if (e.titleText.includes(phrase)) score = Math.max(score, 7);
    else if (e.allText.includes(phrase)) score = Math.max(score, 2);
  }
  return score;
}

/** Every word the reader typed has to match somewhere; titles count most, an exact phrase in a title most of all. */
export function search(index: SearchIndex, query: string, limit = 60): SearchHit[] {
  const raw = tokens(query);
  const words = raw.filter((w) => !STOP.has(w));
  const qs = words.length ? words : raw;
  if (!qs.length) return [];
  const phrase = raw.join(" ");
  const hits: SearchHit[] = [];
  for (const e of index) {
    let total = 0;
    let all = true;
    for (const q of qs) {
      const s = scoreOf(q, e);
      if (!s) {
        all = false;
        break;
      }
      total += s;
    }
    if (!all) continue;
    if (raw.length > 1 && e.titleText.includes(phrase)) total += 8;
    if (e.doc.kind === "topic") total += 2;
    hits.push({ doc: e.doc, score: total });
  }
  return hits.sort((a, b) => b.score - a.score || a.doc.title.length - b.doc.title.length).slice(0, limit);
}
