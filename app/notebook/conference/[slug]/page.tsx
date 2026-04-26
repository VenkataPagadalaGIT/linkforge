import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ConferenceDetail from "@/views/ConferenceDetail";
import { conferences, getConferenceBySlug } from "@/data/conferences";

interface Props {
  params: { slug: string };
}

export const dynamicParams = false;

export async function generateStaticParams() {
  return conferences.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = getConferenceBySlug(params.slug);
  if (!c) {
    return { title: "Conference not found" };
  }
  const title = `${c.name} ${c.edition || c.year} · Conference Notebook`;
  const desc = c.summary;
  const url = `/notebook/conference/${c.slug}`;
  return {
    title,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      url,
      title: `${title} · Venkata Pagadala`,
      description: desc,
    },
  };
}

export default function Page({ params }: Props) {
  const c = getConferenceBySlug(params.slug);
  if (!c) notFound();
  return <ConferenceDetail conference={c} />;
}
