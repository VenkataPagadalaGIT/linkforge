/**
 * The Business Notebook's content (content/business.json): earnings-call
 * notes, the companies they cover and the people who speak for them. The site
 * reads the published copy at runtime (src/lib/business-source.ts), so a new
 * article, company or person goes live on "publish" with no deploy
 * (docs/NO_DEPLOY_PUBLISHING.md). Pure, no imports: the same checks run in
 * Next.js and in the publisher (scripts/cms/publish.mjs).
 *
 * Text fields carry a small inline markup, rendered as text, never as HTML:
 *   ==words==                    green highlight: what a source said about AI and digital
 *   [^2]                         citation to source 2 of the same item
 *   [[person:slug]]              link to a person, shown as their name
 *   [[company:slug|label]]       link to a company, with custom text
 *   [[article:slug|label]]       link to an article
 *   [[page:/a/site/path|label]]  link to another page of this site, optionally with a #section
 *   [[url:https://...|label]]    link to another site (https only), opens in a new tab
 */

export type Source = { id: number; title: string; publisher: string; date: string; url: string; note?: string };
export type Fact = { label: string; value: string; cite?: number };
export type Stat = { value: string; label: string; cite?: number; highlight?: boolean };
export type Block = { type: "p"; text: string } | { type: "list"; items: string[]; ordered?: boolean } | { type: "stats"; items: Stat[] };
/** A photo or logo, shown with its credit. url is a site path (/logos/x.svg) or an https file on Wikimedia. */
export type Picture = { url: string; alt: string; credit: string };
/** A self-hosted video with its poster, captions and transcript. Paths are site paths (/videos/...). */
export type Video = { src: string; poster: string; captions?: string; title: string; duration: number; uploadDate: string; transcript?: string };
export type Section = { id: string; title: string; blocks: Block[] };
export type BusinessArticle = {
  slug: string; title: string; seoTitle: string; description: string; summary: string;
  date: string; eventDate: string; kind: string; company: string; people: string[];
  legend?: string; stats?: Stat[]; video?: Video; sections: Section[]; sources: Source[];
};
export type Company = {
  slug: string; name: string; legalName: string; summary: string; seoTitle: string; description: string;
  website: string; sameAs?: string[]; logo?: Picture; facts: Fact[]; sections: Section[]; sources: Source[];
};
export type Person = {
  slug: string; name: string; role: string; company: string; summary: string; seoTitle: string; description: string;
  photo?: Picture; facts: Fact[]; sections: Section[]; sources: Source[];
};
export type BusinessFile = { note?: string; articles: BusinessArticle[]; companies: Company[]; people: Person[] };
export type BusinessIssue = { level: "block" | "warn"; at?: string; message: string };
export type BusinessCheck = { ok: boolean; issues: BusinessIssue[]; changed: string[]; removed: string[] };

export type Segment =
  | { kind: "text"; text: string; highlight: boolean }
  | { kind: "cite"; id: number; highlight: boolean }
  | { kind: "link"; target: "person" | "company" | "article" | "page" | "url"; ref: string; label?: string; highlight: boolean };

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const PAGE = /^\/(?:[A-Za-z0-9._~%-]+(?:\/[A-Za-z0-9._~%-]+)*)?$/;
const TOKEN = /\[\^(\d+)\]|\[\[(person|company|article|page|url):([^\]|]+)(?:\|([^\]]+))?\]\]/g;
/** A page link may point at a section: /research-and-talks#brightonseo-san-diego-2026. */
const PAGE_REF = /^\/(?:[A-Za-z0-9._~%-]+(?:\/[A-Za-z0-9._~%-]+)*)?(?:#[A-Za-z0-9_-]+)?$/;
const URL_REF = /^https:\/\/[^\s<>"]+$/;
const EM_DASH = "\u2014";
/** Article slugs that would collide with the notebook's own folders. */
const RESERVED = new Set(["companies", "people"]);

/** Split a text field into plain text, highlights, citations and links. Throws on an unclosed ==. */
export function parseInline(text: string): Segment[] {
  const parts = text.split("==");
  if (parts.length % 2 === 0) throw new Error("an == highlight is not closed");
  const out: Segment[] = [];
  parts.forEach((part, i) => {
    const highlight = i % 2 === 1;
    let last = 0;
    for (const m of part.matchAll(TOKEN)) {
      if (m.index! > last) out.push({ kind: "text", text: part.slice(last, m.index), highlight });
      if (m[1]) out.push({ kind: "cite", id: Number(m[1]), highlight });
      else out.push({ kind: "link", target: m[2] as "person", ref: m[3], label: m[4], highlight });
      last = m.index! + m[0].length;
    }
    if (last < part.length) out.push({ kind: "text", text: part.slice(last), highlight });
  });
  return out.filter((s) => s.kind !== "text" || s.text.length);
}

/** The text a reader sees, without markup: for meta descriptions and search. */
export function plainText(text: string, names: (target: string, ref: string) => string | undefined = () => undefined): string {
  return parseInline(text)
    .map((s) => (s.kind === "text" ? s.text : s.kind === "cite" ? "" : s.label ?? names(s.target, s.ref) ?? s.ref))
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

const isStr = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

function texts(v: unknown, out: string[] = []): string[] {
  if (typeof v === "string") out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => texts(x, out));
  else if (isObj(v)) Object.values(v).forEach((x) => texts(x, out));
  return out;
}

/** Every marked-up text field of an item: summary, facts, stats, sections. */
function markedTexts(item: Record<string, unknown>): string[] {
  const out: string[] = [];
  if (isStr(item.summary)) out.push(item.summary);
  for (const f of (item.facts as Fact[] | undefined) ?? []) if (isStr(f?.value)) out.push(f.value);
  for (const s of (item.sections as Section[] | undefined) ?? []) {
    for (const b of s?.blocks ?? []) {
      if (b?.type === "p" && isStr(b.text)) out.push(b.text);
      if (b?.type === "list" && Array.isArray(b.items)) out.push(...b.items.filter(isStr));
    }
  }
  return out;
}

function checkSources(item: Record<string, unknown>, at: string, errs: string[]): Set<number> {
  const ids = new Set<number>();
  if (!Array.isArray(item.sources) || !item.sources.length) {
    errs.push(`${at}: needs at least one source`);
    return ids;
  }
  for (const s of item.sources as Record<string, unknown>[]) {
    if (!isObj(s) || !Number.isInteger(s.id) || (s.id as number) < 1) { errs.push(`${at}: each source needs a whole-number id from 1`); continue; }
    if (ids.has(s.id as number)) errs.push(`${at}: source ${s.id} is listed twice`);
    ids.add(s.id as number);
    for (const f of ["title", "publisher", "date", "url"]) if (!isStr(s[f])) errs.push(`${at}: source ${s.id} needs "${f}"`);
    if (isStr(s.date) && !DATE.test(s.date)) errs.push(`${at}: source ${s.id} date must be YYYY-MM-DD`);
    if (isStr(s.url) && !/^https:\/\/[^\s]+$/.test(s.url)) errs.push(`${at}: source ${s.id} url must be an https link`);
  }
  return ids;
}

function checkSections(item: Record<string, unknown>, at: string, errs: string[]) {
  if (!Array.isArray(item.sections)) return void errs.push(`${at}: "sections" must be a list`);
  const seen = new Set<string>();
  for (const s of item.sections as Record<string, unknown>[]) {
    if (!isObj(s) || !isStr(s.id) || !SLUG.test(s.id) || !isStr(s.title)) { errs.push(`${at}: each section needs an id (lowercase-with-hyphens) and a title`); continue; }
    if (seen.has(s.id)) errs.push(`${at}: section id "${s.id}" is used twice`);
    seen.add(s.id);
    if (!Array.isArray(s.blocks) || !s.blocks.length) errs.push(`${at}: section "${s.id}" has no blocks`);
    for (const b of (s.blocks as Record<string, unknown>[]) ?? []) {
      const okP = isObj(b) && b.type === "p" && isStr(b.text);
      const okList = isObj(b) && b.type === "list" && Array.isArray(b.items) && b.items.length > 0 && b.items.every(isStr);
      const okStats = isObj(b) && b.type === "stats" && Array.isArray(b.items) && b.items.length > 0 &&
        b.items.every((x) => isObj(x) && isStr(x.value) && isStr(x.label));
      if (!okP && !okList && !okStats) errs.push(`${at}: section "${s.id}" has a block that is not a paragraph, a list of text or a list of stats`);
    }
  }
}

/**
 * Check a business file. `published` is the copy now live (or last committed);
 * with it, the em dash rule blocks new and changed items only. `houseRules:
 * false` is the site's runtime check: structure, references and safety only.
 */
export function validateBusiness(data: unknown, published?: unknown, houseRules = true): BusinessCheck {
  const issues: BusinessIssue[] = [];
  const block = (at: string, message: string) => issues.push({ level: "block", at, message });
  if (!isObj(data) || !Array.isArray(data.articles) || !Array.isArray(data.companies) || !Array.isArray(data.people)) {
    return { ok: false, issues: [{ level: "block", message: 'the business file must have "articles", "companies" and "people" lists' }], changed: [], removed: [] };
  }
  for (const k of Object.keys(data)) if (!["note", "articles", "companies", "people"].includes(k)) block("file", `unknown top-level key "${k}"`);

  const slugs = { article: new Set<string>(), company: new Set<string>(), person: new Set<string>() };
  const lists: [keyof typeof slugs, unknown[]][] = [["article", data.articles], ["company", data.companies], ["person", data.people]];
  for (const [kind, list] of lists) {
    for (const raw of list) {
      const slug = isObj(raw) && isStr(raw.slug) ? raw.slug : "";
      if (slug && slugs[kind].has(slug)) block(`${kind}:${slug}`, `${kind} slug "${slug}" is used twice`);
      if (slug) slugs[kind].add(slug);
    }
  }

  const before = new Map<string, string>();
  if (isObj(published)) {
    for (const [kind, key] of [["article", "articles"], ["company", "companies"], ["person", "people"]] as const) {
      for (const p of (published[key] as Record<string, unknown>[] | undefined) ?? []) {
        if (isObj(p) && isStr(p.slug)) before.set(`${kind}:${p.slug}`, JSON.stringify(p));
      }
    }
  }
  const changed: string[] = [];
  const seen = new Set<string>();

  for (const [kind, list] of lists) {
    for (const [i, raw] of list.entries()) {
      if (!isObj(raw)) { block(`${kind} ${i + 1}`, `${kind} ${i + 1} must be an object`); continue; }
      const item = raw;
      const at = isStr(item.slug) ? `${kind}:${item.slug}` : `${kind} ${i + 1}`;
      const errs: string[] = [];
      const required = {
        article: ["slug", "title", "seoTitle", "description", "summary", "date", "eventDate", "kind", "company"],
        company: ["slug", "name", "legalName", "summary", "seoTitle", "description", "website"],
        person: ["slug", "name", "role", "company", "summary", "seoTitle", "description"],
      }[kind];
      for (const f of required) if (!isStr(item[f])) errs.push(`${at}: "${f}" must be non-empty text`);
      if (isStr(item.slug) && !SLUG.test(item.slug)) errs.push(`${at}: slug must be lowercase letters, digits and hyphens`);
      if (kind === "article" && isStr(item.slug) && RESERVED.has(item.slug)) errs.push(`${at}: "${item.slug}" is reserved for the notebook's own folder`);
      for (const f of ["date", "eventDate"]) if (kind === "article" && isStr(item[f]) && !DATE.test(item[f] as string)) errs.push(`${at}: ${f} must be YYYY-MM-DD`);
      if (kind === "company" && isStr(item.website) && !/^https:\/\//.test(item.website)) errs.push(`${at}: website must be an https link`);
      if ((kind === "article" || kind === "person") && isStr(item.company) && !slugs.company.has(item.company)) errs.push(`${at}: company "${item.company}" is not in the file`);
      if (kind === "article") {
        if (!Array.isArray(item.people) || !item.people.every(isStr)) errs.push(`${at}: "people" must be a list of person slugs`);
        else for (const p of item.people as string[]) if (!slugs.person.has(p)) errs.push(`${at}: person "${p}" is not in the file`);
      }
      if (kind !== "article" && !Array.isArray(item.facts)) errs.push(`${at}: "facts" must be a list`);
      for (const f of (item.facts as Record<string, unknown>[] | undefined) ?? []) {
        if (!isObj(f) || !isStr(f.label) || !isStr(f.value)) errs.push(`${at}: each fact needs a label and a value`);
      }
      for (const s of (item.stats as Record<string, unknown>[] | undefined) ?? []) {
        if (!isObj(s) || !isStr(s.value) || !isStr(s.label)) errs.push(`${at}: each stat needs a value and a label`);
      }
      checkSections(item, at, errs);
      const sourceIds = checkSources(item, at, errs);
      if (item.video !== undefined) {
        const v = item.video;
        if (!isObj(v) || !isStr(v.src) || !isStr(v.poster) || !isStr(v.title) || !isStr(v.uploadDate)) errs.push(`${at}: video needs src, poster, title and uploadDate`);
        else {
          for (const f of ["src", "poster", "captions"]) if (v[f] !== undefined && !(isStr(v[f]) && PAGE.test(v[f] as string))) errs.push(`${at}: video ${f} must be a site path such as /videos/name.mp4`);
          if (!DATE.test(v.uploadDate as string)) errs.push(`${at}: video uploadDate must be YYYY-MM-DD`);
          if (typeof v.duration !== "number" || !(v.duration > 0)) errs.push(`${at}: video duration must be a number of seconds`);
          if (v.transcript !== undefined && !isStr(v.transcript)) errs.push(`${at}: video transcript must be text`);
        }
      }
      for (const f of ["logo", "photo"]) {
        const pic = item[f];
        if (pic === undefined) continue;
        if (!isObj(pic) || !isStr(pic.url) || !isStr(pic.alt) || !isStr(pic.credit)) { errs.push(`${at}: ${f} needs url, alt and credit`); continue; }
        if (!(PAGE.test(pic.url) || /^https:\/\/upload\.wikimedia\.org\/[^\s]+$/.test(pic.url))) errs.push(`${at}: ${f} url must be a site path or a Wikimedia upload link`);
      }

      // references: every citation and link must resolve, and every highlight must close
      const blockStats = ((item.sections as Section[] | undefined) ?? [])
        .flatMap((s) => s?.blocks ?? [])
        .flatMap((b) => (b?.type === "stats" && Array.isArray(b.items) ? b.items : []));
      const cited = [
        ...((item.facts as Fact[] | undefined) ?? []).map((f) => f?.cite),
        ...((item.stats as Stat[] | undefined) ?? []).map((s) => s?.cite),
        ...blockStats.map((s) => s?.cite),
      ].filter((c) => c !== undefined);
      for (const c of cited) if (!sourceIds.has(c as number)) errs.push(`${at}: cites source ${c}, which is not in its sources`);
      for (const t of markedTexts(item)) {
        let segs: Segment[] = [];
        try { segs = parseInline(t); } catch (e) { errs.push(`${at}: ${(e as Error).message}: "${t.slice(0, 60)}"`); continue; }
        for (const s of segs) {
          if (s.kind === "cite" && !sourceIds.has(s.id)) errs.push(`${at}: cites [^${s.id}], which is not in its sources`);
          if (s.kind === "link") {
            const ok = s.target === "page" ? PAGE_REF.test(s.ref) : s.target === "url" ? URL_REF.test(s.ref) && !!s.label
              : slugs[s.target].has(s.ref);
            if (!ok) errs.push(`${at}: links to ${s.target} "${s.ref}", which does not exist`);
          }
        }
      }
      // safety: nothing is rendered as HTML, but no markup characters either
      if (texts(item).some((t) => /[<>]/.test(t))) errs.push(`${at}: text must not contain < or >`);

      for (const e of errs) block(at, e);
      if (!isStr(item.slug)) continue;
      const key = `${kind}:${item.slug}`;
      seen.add(key);
      const isChanged = before.get(key) !== JSON.stringify(item);
      if (isChanged) changed.push(key);
      if (!houseRules || !isChanged) continue;
      if (JSON.stringify(item).includes(EM_DASH)) block(at, `${at}: has an em dash; your rule is no em dashes`);
      if (isStr(item.seoTitle) && item.seoTitle.length > 60) issues.push({ level: "warn", at, message: `${at}: SEO title is ${item.seoTitle.length} characters (your rule: up to 60)` });
      if (isStr(item.description) && (item.description.length < 140 || item.description.length > 160)) {
        issues.push({ level: "warn", at, message: `${at}: description is ${item.description.length} characters (your rule: 140 to 160)` });
      }
    }
  }
  const removed = [...before.keys()].filter((k) => !seen.has(k));
  return { ok: !issues.some((x) => x.level === "block"), issues, changed, removed };
}
