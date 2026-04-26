import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SpeakerProfile from "@/views/SpeakerProfile";
import { speakers, getSpeakerBySlug } from "@/data/speakers";

interface Props {
  params: { slug: string };
}

export const dynamicParams = false;

export async function generateStaticParams() {
  return speakers.map((s) => ({ slug: s.slug }));
}

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
