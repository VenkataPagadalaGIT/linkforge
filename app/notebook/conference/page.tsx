import { OG_IMAGE, SITE_NAME } from "@/lib/site";
import type { Metadata } from "next";
import ConferenceNotebook from "@/views/ConferenceNotebook";
import { speakers } from "@/data/speakers";
import { withSeoOverrides } from "@/lib/seo-overrides";

const metadata: Metadata = {
  title: "Conference Notebook",
  description:
    "Field notes, talks, and takeaways from AI, SEO, and engineering conferences — a live notebook by Venkata Pagadala.",
  alternates: { canonical: "/notebook/conference" },
  openGraph: {
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
    url: "/notebook/conference",
    title: "Conference Notebook · Venkata Pagadala",
    description: "Field notes from AI, SEO, and engineering conferences.",
  },
};
export const generateMetadata = withSeoOverrides("/notebook/conference", metadata);

export default function Page() {
  const all = [...speakers].sort((a, b) => a.name.localeCompare(b.name));
  return (
    <>
      <ConferenceNotebook />
      {/* Every speaker reachable from here, not only from the site map. Rendered on the server, so their bios stay out of the page's script. */}
      <section id="speakers" aria-labelledby="speakers-h" className="mx-auto max-w-7xl border-t border-border px-6 py-12">
        <h2 id="speakers-h" className="font-display text-xl font-bold text-foreground">Speakers</h2>
        <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[12px]">
          {all.map((s) => (
            <li key={s.slug}><a href={`/notebook/conference/speakers/${s.slug}`} className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">{s.name}</a></li>
          ))}
        </ul>
      </section>
    </>
  );
}
