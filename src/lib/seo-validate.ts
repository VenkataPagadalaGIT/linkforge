/**
 * The checks for the page SEO file (content/seo-overrides.json), shared by the
 * site (which refuses a broken published copy and keeps the last good one) and
 * the publisher (scripts/cms/publish.mjs, which refuses to publish). Pure, no
 * imports, so it runs unchanged in Next.js and under plain `node`. The numbers
 * come in as an argument from cms/rules.json, the one home of the SEO rules.
 *
 * The file names pages by path and sets any of four fields; a page it does not
 * name keeps the metadata in its code:
 *
 *   { "pages": { "/about": { "title": "...", "description": "...",
 *                             "canonical": "/about", "robots": "index, follow" } } }
 *
 * Two levels:
 *   - structure and safety (always): paths on this site outside /admin and
 *     /api, known fields, text values, no < or >, a canonical on this site,
 *     an allowed robots value;
 *   - house rules (publisher only): the forbidden texts (no em dashes) block a
 *     new or changed entry, and title and description lengths warn.
 */

export type SeoOverride = { title?: string; description?: string; canonical?: string; robots?: string };
export type SeoFile = { note?: string; pages: Record<string, SeoOverride> };
export type SeoIssue = { level: "block" | "warn"; path?: string; message: string };
export type SeoCheck = { ok: boolean; issues: SeoIssue[]; changed: string[]; removed: string[] };

/** The parts of cms/rules.json these checks read. */
export type SeoRules = {
  site: string;
  fields: {
    title: { max: number };
    description: { min: number; max: number };
    robots: { allowed: string[] };
  };
  forbidden: { text: string; message: string }[];
};

export const SEO_FIELDS = ["title", "description", "canonical", "robots"];

const SEGMENT = "[A-Za-z0-9._~%-]+";
/** A page path: "/" or "/a/b", no trailing slash, query or fragment. */
export const PAGE_PATH = new RegExp(`^/(?:${SEGMENT}(?:/${SEGMENT})*)?$`);
const CLOSED = /^\/(?:admin|api|_next)(?:\/|$)/;
const UNSAFE = /[<>]/;
const NOT_HERE: Record<string, string> = {
  h1: "the H1 is part of the page's code and cannot be set in this file yet",
};

const isStr = (v: unknown): v is string => typeof v === "string";
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

function pathProblem(path: string): string | null {
  if (!PAGE_PATH.test(path) || path.split("/").some((s) => s === "." || s === "..")) {
    return "must be a page path such as /about: starts with /, no trailing slash, query or #";
  }
  if (CLOSED.test(path)) return "is not a public page (/admin, /api and /_next cannot be changed here)";
  return null;
}

/** A canonical must stay on this site: a page path, or this site's own address. */
function canonicalProblem(value: string, site: string): string | null {
  let path = value;
  if (!value.startsWith("/")) {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      return "must be a page path such as /about or a full address on this site";
    }
    if (url.origin !== new URL(site).origin) return `must stay on this site (${site})`;
    if (url.search || url.hash || value.endsWith("?") || value.endsWith("#")) return "must not carry a query or #";
    path = url.pathname;
  }
  if (!PAGE_PATH.test(path) || path.startsWith("//")) return "must be a page path such as /about: no trailing slash, query or #";
  return null;
}

function structural(path: string, entry: unknown, rules: SeoRules): string[] {
  const at = `"${path}"`;
  const errs: string[] = [];
  const bad = pathProblem(path);
  if (bad) errs.push(`${at}: ${bad}`);
  if (!isObj(entry)) return [...errs, `${at}: must be an object of fields`];
  const fields = Object.keys(entry);
  if (!fields.length) errs.push(`${at}: sets no fields; remove the page instead`);
  for (const f of fields) {
    if (!SEO_FIELDS.includes(f)) {
      errs.push(`${at}: "${f}" cannot be set here (${NOT_HERE[f] ?? `the fields are ${SEO_FIELDS.join(", ")}`})`);
      continue;
    }
    const v = entry[f];
    if (!isStr(v) || !v.trim()) {
      errs.push(`${at}: "${f}" must be non-empty text; remove the field to keep the page's own value`);
      continue;
    }
    if (UNSAFE.test(v)) errs.push(`${at}: "${f}" must not contain < or >`);
  }
  if (isStr(entry.canonical) && entry.canonical.trim()) {
    const c = canonicalProblem(entry.canonical, rules.site);
    if (c) errs.push(`${at}: canonical ${c}`);
  }
  if (isStr(entry.robots) && entry.robots.trim() && !rules.fields.robots.allowed.includes(entry.robots)) {
    errs.push(`${at}: robots must be one of: ${rules.fields.robots.allowed.join("; ")}`);
  }
  return errs;
}

/**
 * Check an SEO file. `published` is the copy now live (or the last committed
 * copy); new and changed entries are reported so the publisher can refresh and
 * verify exactly those pages. `houseRules: false` is the site's runtime check:
 * structure and safety only.
 */
export function validateSeo(
  data: unknown,
  rules: SeoRules,
  opts: { published?: unknown; houseRules?: boolean } = {},
): SeoCheck {
  const houseRules = opts.houseRules ?? true;
  const issues: SeoIssue[] = [];
  if (!isObj(data) || !isObj(data.pages)) {
    return { ok: false, issues: [{ level: "block", message: 'the SEO file must be an object with a "pages" object' }], changed: [], removed: [] };
  }
  for (const k of Object.keys(data)) {
    if (k !== "pages" && k !== "note") issues.push({ level: "block", message: `unknown top-level key "${k}" (allowed: pages, note)` });
  }
  if (data.note !== undefined && !isStr(data.note)) issues.push({ level: "block", message: '"note" must be text' });

  const before = new Map<string, string>();
  if (isObj(opts.published) && isObj(opts.published.pages)) {
    for (const [p, e] of Object.entries(opts.published.pages)) before.set(p, JSON.stringify(e));
  }
  const changed: string[] = [];
  let legacy = 0;
  const pages = data.pages;
  for (const [path, entry] of Object.entries(pages)) {
    for (const e of structural(path, entry, rules)) issues.push({ level: "block", path, message: e });
    const isChanged = before.get(path) !== JSON.stringify(entry);
    if (isChanged) changed.push(path);
    if (!houseRules || !isObj(entry)) continue;
    const at = `"${path}"`;
    for (const f of SEO_FIELDS) {
      const v = entry[f];
      if (!isStr(v)) continue;
      for (const rule of rules.forbidden) {
        if (UNSAFE.test(rule.text) || !v.includes(rule.text)) continue;
        if (isChanged) issues.push({ level: "block", path, message: `${at}: ${f}: ${rule.message}` });
        else legacy += 1;
      }
    }
    if (!isChanged) continue;
    const { title, description } = entry;
    if (isStr(title) && title.length > rules.fields.title.max) {
      issues.push({ level: "warn", path, message: `${at}: title is ${title.length} characters (your rule: up to ${rules.fields.title.max})` });
    }
    const d = rules.fields.description;
    if (isStr(description) && (description.length < d.min || description.length > d.max)) {
      issues.push({ level: "warn", path, message: `${at}: description is ${description.length} characters (your rule: ${d.min} to ${d.max})` });
    }
  }
  if (legacy) issues.push({ level: "warn", message: `${legacy} house-rule problem(s) in unchanged entries; fix them when you next edit those pages` });
  const removed = [...before.keys()].filter((p) => !(p in pages));
  return { ok: !issues.some((x) => x.level === "block"), issues, changed, removed };
}
