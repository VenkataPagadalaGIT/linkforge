import type { Metadata } from "next";
import PostEditorClient from "./PostEditorClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "CMS · Edit Post",
  robots: { index: false, follow: false },
};

export default function Page({ params }: { params: { slug: string } }) {
  return <PostEditorClient slug={params.slug} />;
}
