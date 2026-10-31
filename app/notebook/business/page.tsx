import { OG_IMAGE, SITE_NAME } from "@/lib/site";
import type { Metadata } from "next";
import BusinessNotebook from "@/views/BusinessNotebook";
import { withSeoOverrides } from "@/lib/seo-overrides";
import { getBusiness, namesOf } from "@/lib/business-source";
import { articleHref, companyHref, personHref } from "@/lib/business-paths";
import { plainText } from "@/lib/business-validate";
import { getNews } from "@/lib/news-source";
import { businessEvents, businessNews, businessSectors } from "@/lib/business-graph";

const metadata: Metadata = {
  title: "Business Notebook",
  description: "Business-side AI notes, market notes, and strategy frameworks by Venkata Pagadala.",
  alternates: { canonical: "/notebook/business" },
  openGraph: {
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }], url: "/notebook/business", title: "Business Notebook" },
};
export const generateMetadata = withSeoOverrides("/notebook/business", metadata);

// The notes, companies and people come from the published content file, so one
// published without a deploy is listed here at once; so are the AI Updates.
export default async function Page() {
  const [b, updates] = await Promise.all([getBusiness(), getNews()]);
  const names = namesOf(b);
  const name = (target: string, ref: string) => names[target as keyof typeof names]?.[ref];
  return (
    <BusinessNotebook
      articles={b.articles.map((a) => ({
        href: articleHref(a.slug), title: a.title, summary: plainText(a.summary, name), kind: a.kind,
        eventDate: a.eventDate, company: names.company[a.company],
      }))}
      companies={b.companies.map((c) => ({ href: companyHref(c.slug), name: c.name, summary: plainText(c.summary, name) }))}
      people={b.people.map((p) => ({ href: personHref(p.slug), name: p.name, role: p.role }))}
      // The business side of the site's other datasets, linked to the pages that own them (src/lib/business-graph.ts).
      sectors={businessSectors()}
      news={businessNews(updates)}
      events={businessEvents()}
    />
  );
}
