/**
 * Where the site reads the Business Notebook at runtime: the published copy of
 * content/business.json on the repo's `content` branch, so a new article,
 * company or person goes live without a deploy (docs/NO_DEPLOY_PUBLISHING.md).
 *
 * - Cached under the "business" tag. The signed /api/revalidate message
 *   refreshes it within seconds of a publish; otherwise it is re-read every
 *   5 minutes.
 * - A copy that fails the structure and safety checks is refused, and the
 *   last good copy keeps serving. With no good copy yet (no file on the
 *   branch, GitHub down), the copy built into the deploy serves. Reading and
 *   the last good copy are shared by the whole server (src/lib/content-github.ts).
 *
 * Environment (optional): CONTENT_BUSINESS_SOURCE_URL, a different URL serving
 * the raw JSON (tests), or "off" to use the built-in copy only.
 */
import { unstable_cache } from "next/cache";
import builtInFile from "../../content/business.json";
import { readPublished } from "@/lib/content-github";
import { validateBusiness, type BusinessFile } from "@/lib/business-validate";
import type { NameMap } from "@/lib/business-paths";

export const BUSINESS_TAG = "business";

const EMPTY: BusinessFile = { articles: [], companies: [], people: [] };
/** The copy built into this deploy: the fallback, and the pages prerendered at build. */
export const builtInBusiness: BusinessFile = validateBusiness(builtInFile, undefined, false).ok ? (builtInFile as BusinessFile) : EMPTY;

function problem(data: unknown): string | null {
  const check = validateBusiness(data, undefined, false);
  return check.ok ? null : check.issues.find((i) => i.level === "block")?.message ?? "refused";
}

async function readBusiness(): Promise<BusinessFile | null> {
  return (await readPublished("content/business.json", process.env.CONTENT_BUSINESS_SOURCE_URL, problem, 300_000)) as BusinessFile | null;
}

const cachedPublished = unstable_cache(readBusiness, ["business-published-v1"], {
  tags: [BUSINESS_TAG],
  revalidate: 300,
});

/** The whole Business Notebook: articles (newest first, the file's order), companies and people. */
export async function getBusiness(): Promise<BusinessFile> {
  try {
    return (await cachedPublished()) ?? builtInBusiness;
  } catch {
    return builtInBusiness;
  }
}

export function namesOf(b: BusinessFile): NameMap {
  return {
    person: Object.fromEntries(b.people.map((p) => [p.slug, p.name])),
    company: Object.fromEntries(b.companies.map((c) => [c.slug, c.name])),
    article: Object.fromEntries(b.articles.map((a) => [a.slug, a.title])),
  };
}
