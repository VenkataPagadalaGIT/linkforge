import newsFile from "../../content/ai-updates.json";

export type UpdateCategory = "product-launch" | "research" | "industry" | "open-source" | "policy";

export interface RelatedLink {
  label: string;
  to: string; // internal route
  description: string;
}

export interface UpdateHighlight {
  /** The big number, NYT front-page style. Keep it under 8 characters. */
  stat: string;
  label: string;
}

export interface UpdateDocument {
  label: string;
  /** Who hosts it: CourtListener, GovInfo, Justia, the administrator. */
  source: string;
  url: string;
}

export interface UpdateVideo {
  /** short = under a minute, clip = news segment, full = complete analysis. */
  kind: "short" | "clip" | "full";
  label: string;
  /** A leading slash means a locally hosted file rendered as a real player. */
  url: string;
  duration?: string;
}

/** Company logos for an M&A or partnership story (official brand assets). */
export interface UpdateDealLogo {
  name: string;
  onLight: string;
  onDark: string;
  source: string;
  height?: number;
}

export interface AIUpdate {
  id: string;
  slug: string;
  title: string;
  company: string;
  category: UpdateCategory;
  date: string;
  summary: string;
  takeaways: string[];
  tocSections: string[];
  videoUrl?: string;
  videoLabel?: string;
  body: string;
  /** Contributor ids this story is about. Renders as profile links here, and
   *  lets each profile list the news mentioning that person. */
  contributors?: string[];
  /** Scannable stat cards rendered above the fold. */
  highlights?: UpdateHighlight[];
  /** The analyst read: what the owner thinks it means, clearly labelled as
   *  opinion and kept separate from the reported facts above it. */
  myView?: { points: string[]; caveat?: string };
  /** Primary documents: court records first, never buried under the text. */
  documents?: UpdateDocument[];
  /** A 30-second version and the long version. Readers pick their depth. */
  videos?: UpdateVideo[];
  /** Two-company logo lockup, rendered above the summary. */
  dealLogos?: { left: UpdateDealLogo; right: UpdateDealLogo; connector?: string };
  sourceUrl: string;
  tags: string[];
  relatedLinks: RelatedLink[];
}

export const CATEGORY_META: Record<UpdateCategory, { label: string; color: string }> = {
  "product-launch": { label: "Product Launch", color: "hsl(var(--primary))" },
  research: { label: "Research", color: "#10b981" },
  industry: { label: "Industry", color: "#f59e0b" },
  "open-source": { label: "Open Source", color: "#8b5cf6" },
  policy: { label: "Policy & Safety", color: "#ef4444" },
};

// The articles live in content/ai-updates.json, the source of truth that is
// published without a deploy (docs/NO_DEPLOY_PUBLISHING.md). This import is
// the copy built into each deploy: the fallback when the published copy on
// GitHub cannot be read, and the data for build-time readers.

export const aiUpdates: AIUpdate[] = newsFile as AIUpdate[];

