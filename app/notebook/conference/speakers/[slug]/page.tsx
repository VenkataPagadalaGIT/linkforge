import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SpeakerProfile from "@/views/SpeakerProfile";
import { speakers, getSpeakerBySlug } from "@/data/speakers";

interface Props {
  params: { slug: string };
}

// Render on-demand at request time. 78 speakers as SSG was using too much
// build memory; on-request render still produces full HTML for SEO bots.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const sp = getSpeakerBySlug(params.slug);
  if (!sp) return { title: "Speaker not found" };
  const title = `${sp.name} · ${sp.role}, ${sp.company} · Conference Notebook`;
  const desc = sp.bio;
  const url = `/notebook/conference/speakers/${sp.slug}`;
  return {
    title,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      url,
      title: `${sp.name} — ${sp.role} at ${sp.company}`,
      description: desc,
      images: sp.photo ? [sp.photo] : undefined,
    },
  };
}

export default function Page({ params }: Props) {
  const sp = getSpeakerBySlug(params.slug);
  if (!sp) notFound();
  return <SpeakerProfile speaker={sp} />;
}
