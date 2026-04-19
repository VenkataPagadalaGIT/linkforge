import type { Metadata } from "next";
import BlogPostPage from "@/pages/BlogPostPage";

type Params = { slug: string; postSlug: string };

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const title = params.postSlug
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
  return {
    title,
    description: `${title} — essay in the ${params.slug} cluster by Venkata Pagadala.`,
    alternates: { canonical: `/insights/${params.slug}/${params.postSlug}` },
    openGraph: {
      url: `/insights/${params.slug}/${params.postSlug}`,
      type: "article",
      title,
    },
  };
}

export default function Page() {
  return <BlogPostPage />;
}
