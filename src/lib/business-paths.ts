/** Where Business Notebook pages live. Shared by server routes and client views. */
export const BUSINESS_BASE = "/notebook/business";
export const articleHref = (slug: string) => `${BUSINESS_BASE}/${slug}`;
export const companyHref = (slug: string) => `${BUSINESS_BASE}/companies/${slug}`;
export const personHref = (slug: string) => `${BUSINESS_BASE}/people/${slug}`;

/** Display names for [[person:slug]]-style links that carry no label of their own. */
export type NameMap = { person: Record<string, string>; company: Record<string, string>; article: Record<string, string> };

export function hrefFor(target: "person" | "company" | "article" | "page" | "url", ref: string): string {
  if (target === "person") return personHref(ref);
  if (target === "company") return companyHref(ref);
  if (target === "article") return articleHref(ref);
  return ref;
}

/** "Gary Millerchip" to "GM": the badge shown when there is no licensed photo. */
export const initialsOf = (name: string) =>
  name.split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
