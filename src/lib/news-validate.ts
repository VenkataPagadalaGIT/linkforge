/**
 * The checks for the news file (content/ai-updates.json), shared by the site
 * (which refuses a broken published copy and keeps the last good one) and the
 * publisher (scripts/cms/publish.mjs, which refuses to publish). Pure, no
 * imports, so it runs unchanged in Next.js and under plain `node`.
 *
 * Two levels:
 *   - structure and safety (always): the shape the pages rely on, and no HTML
 *     that could run script, because the body is rendered as HTML;
 *   - house rules (publisher only): no em dashes in new or changed articles,
 *     and title and summary length warnings.
 */

export type NewsIssue = { level: "block" | "warn"; slug?: string; message: string };
export type NewsCheck = { ok: boolean; issues: NewsIssue[]; changed: string[]; removed: string[] };

export const NEWS_CATEGORIES = ["product-launch", "research", "industry", "open-source", "policy"];

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const EM_DASH = "\u2014";
const UNSAFE_HTML: [RegExp, string][] = [
  [/<\s*(script|iframe|object|embed|form|style|link|meta|base)\b/i, "a <$1> tag"],
  [/<[^>]*\son[a-z]+\s*=/i, "an on...= event handler"],
  [/\b(?:href|src|action|formaction|xlink:href)\s*=\s*["']?\s*(?:javascript|vbscript|data)\s*:/i, "a javascript:, vbscript: or data: link"],
];

const isStr = (v: unknown): v is string => typeof v === "string";
const isStrList = (v: unknown) => Array.isArray(v) && v.every(isStr);

function structural(item: Record<string, unknown>, at: string): string[] {
  const errs: string[] = [];
  for (const f of ["id", "slug", "title", "company", "category", "date", "summary", "body", "sourceUrl"]) {
    if (!isStr(item[f]) || !(item[f] as string).trim()) errs.push(`${at}: "${f}" must be non-empty text`);
  }
  for (const f of ["takeaways", "tocSections", "tags"]) {
    if (!isStrList(item[f])) errs.push(`${at}: "${f}" must be a list of text`);
  }
  if (!Array.isArray(item.relatedLinks)) errs.push(`${at}: "relatedLinks" must be a list`);
  if (item.contributors !== undefined && !isStrList(item.contributors)) errs.push(`${at}: "contributors" must be a list of ids`);
  if (isStr(item.slug) && !SLUG.test(item.slug)) errs.push(`${at}: slug must be lowercase letters, digits and hyphens`);
  if (isStr(item.category) && !NEWS_CATEGORIES.includes(item.category)) errs.push(`${at}: unknown category "${item.category}"`);
  if (isStr(item.date) && !DATE.test(item.date)) errs.push(`${at}: date must be YYYY-MM-DD`);
  if (isStr(item.sourceUrl) && !/^https?:\/\//.test(item.sourceUrl)) errs.push(`${at}: sourceUrl must be an http(s) link`);
  return errs;
}

/** Every text value in the article, as written (not JSON-escaped, where a
 *  quote becomes \" and would hide href="javascript:..." from the check). */
function texts(v: unknown, out: string[] = []): string[] {
  if (typeof v === "string") out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => texts(x, out));
  else if (v && typeof v === "object") Object.values(v).forEach((x) => texts(x, out));
  return out;
}

function unsafe(item: Record<string, unknown>): string[] {
  const text = texts(item).join("\n");
  return UNSAFE_HTML.flatMap(([re, what]) => {
    const m = text.match(re);
    return m ? [what.replace("$1", (m[1] || "").toLowerCase())] : [];
  });
}

/**
 * Check a news file. `published` is the copy now live (or the last committed
 * copy); with it, house rules apply to new and changed articles only, so the
 * 58 em dashes that predate the rule warn instead of blocking every publish.
 * `houseRules: false` is the site's runtime check: structure and safety only.
 */
export function validateNews(data: unknown, published?: unknown, houseRules = true): NewsCheck {
  const issues: NewsIssue[] = [];
  if (!Array.isArray(data)) {
    return { ok: false, issues: [{ level: "block", message: "the news file must be a list of articles" }], changed: [], removed: [] };
  }
  const before = new Map<string, string>();
  if (Array.isArray(published)) {
    for (const p of published) if (p && isStr((p as { slug?: unknown }).slug)) before.set((p as { slug: string }).slug, JSON.stringify(p));
  }
  const seen = new Set<string>();
  const changed: string[] = [];
  let legacyDashes = 0;
  data.forEach((raw, i) => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      issues.push({ level: "block", message: `article ${i + 1}: must be an object` });
      return;
    }
    const item = raw as Record<string, unknown>;
    const slug = isStr(item.slug) ? item.slug : undefined;
    const at = slug ? `"${slug}"` : `article ${i + 1}`;
    for (const e of structural(item, at)) issues.push({ level: "block", slug, message: e });
    for (const w of unsafe(item)) issues.push({ level: "block", slug, message: `${at}: unsafe HTML, ${w}` });
    if (slug) {
      if (seen.has(slug)) issues.push({ level: "block", slug, message: `${at}: slug used twice` });
      seen.add(slug);
    }
    const isChanged = !slug || !before.has(slug) || before.get(slug) !== JSON.stringify(item);
    if (slug && isChanged) changed.push(slug);
    if (!houseRules) return;
    const dashes = JSON.stringify(item).split(EM_DASH).length - 1;
    if (dashes && isChanged && before.size) {
      issues.push({ level: "block", slug, message: `${at}: ${dashes} em dash(es); your rule is no em dashes` });
    } else if (dashes) {
      legacyDashes += dashes;
    }
    if (isChanged && isStr(item.title) && item.title.length > 60) {
      issues.push({ level: "warn", slug, message: `${at}: title is ${item.title.length} characters (your rule: up to 60)` });
    }
    if (isChanged && isStr(item.summary) && (item.summary.length < 140 || item.summary.length > 160)) {
      issues.push({ level: "warn", slug, message: `${at}: summary is ${item.summary.length} characters (your rule: 140 to 160)` });
    }
  });
  if (legacyDashes) {
    issues.push({ level: "warn", message: `${legacyDashes} em dash(es) remain in unchanged articles; clean them up when you edit those articles` });
  }
  const removed = [...before.keys()].filter((s) => !seen.has(s));
  return { ok: !issues.some((x) => x.level === "block"), issues, changed, removed };
}
