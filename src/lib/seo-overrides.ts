/**
 * Page SEO fields that change without a deploy (docs/NO_DEPLOY_PUBLISHING.md).
 *
 * Every public page exports `generateMetadata = withSeoOverrides(route, its
 * own metadata)`. The wrapper looks the page's path up in the published copy
 * of content/seo-overrides.json on the repo's `content` branch and applies
 * the fields it sets (title, meta description, canonical, robots) over the
 * page's own. A page the file does not name renders exactly as its code says.
 *
 * - Cached under the "seo" tag. The signed /api/revalidate message refreshes
 *   it within seconds of a publish; otherwise it is re-read hourly. That makes
 *   every page hourly ISR: a page re-renders at most once an hour, and only
 *   when someone visits it.
 * - A copy that fails the structure and safety checks is refused, and the
 *   last good copy keeps serving. With no good copy yet (no file on the
 *   branch, GitHub down), the copy built into the deploy serves. Reading and
 *   the last good copy are shared by the whole server (src/lib/content-github.ts).
 *
 * Environment (optional): CONTENT_SEO_SOURCE_URL, a different URL serving the
 * raw JSON (tests), or "off" to use the built-in copy only. The GitHub
 * settings are in src/lib/content-github.ts.
 */
import type { Metadata, ResolvingMetadata } from "next";
import { unstable_cache } from "next/cache";
import builtInFile from "../../content/seo-overrides.json";
import rulesFile from "../../cms/rules.json";
import { readPublished } from "@/lib/content-github";
import { applySeoOverride, fillRoute } from "@/lib/seo-apply";
import { validateSeo, type SeoFile, type SeoOverride, type SeoRules } from "@/lib/seo-validate";
import { SITE_ROBOTS } from "@/lib/site";

export const SEO_TAG = "seo";

const rules = rulesFile as SeoRules;
const builtIn: SeoFile = validateSeo(builtInFile, rules, { houseRules: false }).ok ? (builtInFile as SeoFile) : { pages: {} };

function problem(data: unknown): string | null {
  const check = validateSeo(data, rules, { houseRules: false });
  return check.ok ? null : check.issues.find((i) => i.level === "block")?.message ?? "refused";
}

async function readSeo(): Promise<SeoFile | null> {
  return (await readPublished("content/seo-overrides.json", process.env.CONTENT_SEO_SOURCE_URL, problem, 3_600_000)) as SeoFile | null;
}

const cachedPublished = unstable_cache(readSeo, ["seo-published-v1"], {
  tags: [SEO_TAG],
  revalidate: 3600,
});

/** Every published override, by page path. */
export async function getSeoOverrides(): Promise<Record<string, SeoOverride>> {
  try {
    return ((await cachedPublished()) ?? builtIn).pages;
  } catch {
    return builtIn.pages;
  }
}

// Loose on purpose: pages type their params as interfaces, which a Record
// type would not accept.
type PageProps = { params?: object; searchParams?: object };
type Params = Record<string, string | string[] | undefined>;
type OwnMetadata<P> = Metadata | ((props: P, parent: ResolvingMetadata) => Metadata | Promise<Metadata>);

/** A page's generateMetadata: its own metadata (an object, or its old
 *  generateMetadata), with the published override for its path applied. */
export function withSeoOverrides<P extends PageProps = PageProps>(route: string, own: OwnMetadata<P>) {
  return async function generateMetadata(props: P, parent: ResolvingMetadata): Promise<Metadata> {
    const base = typeof own === "function" ? await own(props, parent) : own;
    const pages = await getSeoOverrides();
    return applySeoOverride(base, pages[fillRoute(route, props.params as Params | undefined)], SITE_ROBOTS.googleBot);
  };
}
