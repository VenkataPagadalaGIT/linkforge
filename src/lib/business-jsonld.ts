/**
 * Schema.org for Business Notebook pages, so the article, the company and the
 * people resolve to each other as entities: the article is about the
 * Organization and mentions the Persons; each Person worksFor the
 * Organization; every source becomes a citation.
 */
import type { BusinessArticle, Company, Person, Source } from "@/lib/business-validate";
import { BUSINESS_BASE, articleHref, companyHref, personHref } from "@/lib/business-paths";
import { SITE_URL } from "@/lib/site";

const abs = (path: string) => `${SITE_URL}${path}`;
const author = { "@type": "Person", name: "Venkata Pagadala", url: SITE_URL };
const citations = (sources: Source[]) =>
  sources.map((s) => ({ "@type": "CreativeWork", name: s.title, url: s.url, datePublished: s.date, publisher: { "@type": "Organization", name: s.publisher } }));
const orgRef = (c: Company) => ({ "@type": "Organization", "@id": `${abs(companyHref(c.slug))}#org`, name: c.legalName, url: abs(companyHref(c.slug)) });
const personRef = (p: Person) => ({ "@type": "Person", "@id": `${abs(personHref(p.slug))}#person`, name: p.name, jobTitle: p.role, url: abs(personHref(p.slug)) });

export function breadcrumbLd(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "Notebooks", path: "/notebook" }, { name: "Business Notebook", path: BUSINESS_BASE }, ...trail].map((t, i) => ({
      "@type": "ListItem", position: i + 1, name: t.name, item: abs(t.path),
    })),
  };
}

export function articleLd(a: BusinessArticle, company: Company | undefined, people: Person[]) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.title,
    description: a.description,
    datePublished: a.date,
    dateModified: a.date,
    url: abs(articleHref(a.slug)),
    mainEntityOfPage: abs(articleHref(a.slug)),
    author,
    publisher: author,
    ...(company ? { about: orgRef(company) } : {}),
    mentions: people.map(personRef),
    citation: citations(a.sources),
  };
}

export function companyLd(c: Company, people: Person[]) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${abs(companyHref(c.slug))}#org`,
    name: c.legalName,
    alternateName: c.name,
    url: c.website,
    sameAs: c.sameAs ?? [],
    employee: people.map(personRef),
    subjectOf: { "@type": "WebPage", url: abs(companyHref(c.slug)), author },
  };
}

export function personLd(p: Person, company: Company | undefined) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${abs(personHref(p.slug))}#person`,
    name: p.name,
    jobTitle: p.role,
    url: abs(personHref(p.slug)),
    ...(company ? { worksFor: orgRef(company) } : {}),
    subjectOf: citations(p.sources),
  };
}

/** "PT5M57S" for 357 seconds. */
const isoDuration = (sec: number) => `PT${Math.floor(sec / 60)}M${Math.round(sec % 60)}S`;

export function videoLd(a: BusinessArticle) {
  if (!a.video) return null;
  const v = a.video;
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: v.title,
    description: a.description,
    thumbnailUrl: abs(v.poster),
    uploadDate: v.uploadDate,
    duration: isoDuration(v.duration),
    contentUrl: abs(v.src),
    author,
    ...(v.transcript ? { transcript: v.transcript } : {}),
  };
}
