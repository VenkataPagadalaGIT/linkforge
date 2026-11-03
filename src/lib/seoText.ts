/**
 * Titles and meta descriptions that fit the owner's SEO rules (cms/rules.json, the one home of the numbers): a title
 * of at most `title.max` characters and a description of `description.min` to `description.max`, with no em dashes
 * and no < or > characters. Used by pages that generate their metadata from data (Venkata Pagadala - Universe).
 */
import rulesFile from "../../cms/rules.json";

const TITLE_MAX = rulesFile.fields.title.max;
const DESC_MIN = rulesFile.fields.description.min;
const DESC_MAX = rulesFile.fields.description.max;

/** One line of plain text: whitespace collapsed, dashes the rules forbid turned into " - ", no < or >. */
export const plain = (s: string) =>
  s
    .replace(/\s*[—–]\s*/g, " - ")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim();

/** Cut at a word boundary to at most `max` characters, ending in "..." when cut. */
export function clip(s: string, max: number) {
  const chars = Array.from(s);
  if (chars.length <= max) return s;
  return `${chars.slice(0, max - 3).join("").replace(/\s+\S*$/, "").replace(/[\s,;:.!?-]+$/, "")}...`;
}

/**
 * The longest title that fits: the text with the first suffix that fits (longest first, e.g. the Universe's name,
 * then "Venkata Pagadala"), else the text alone, else the text clipped with the last suffix.
 */
export function fitTitle(text: string, suffixes: string[]) {
  const t = plain(text);
  for (const s of suffixes) if (Array.from(t + s).length <= TITLE_MAX) return t + s;
  if (Array.from(t).length <= TITLE_MAX) return t;
  const last = suffixes[suffixes.length - 1] ?? "";
  return clip(t, TITLE_MAX - Array.from(last).length) + last;
}

/**
 * A description in range: the lead (links removed), topped up with the extras in order until it reaches the minimum,
 * then cut at a word to the maximum. Each part is a sentence or phrase; empty parts are skipped.
 */
export function fitDescription(lead: string, ...extras: string[]) {
  // Links say nothing in a search result, and clipping one cuts a whole run of characters.
  let d = plain(lead.replace(/(?:https?:\/\/|www\.|lnkd\.in\/)\S+/g, " "));
  for (const x of extras) {
    if (Array.from(d).length >= DESC_MIN) break;
    const e = plain(x);
    if (e) d = d ? `${/[.!?]$/.test(d) ? d : `${d.replace(/[\s,;:]+$/, "")}.`} ${e}` : e;
  }
  return clip(d, DESC_MAX);
}
