import type { Metadata } from "next";
import PostsListClient from "./PostsListClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "CMS · Posts",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <PostsListClient />;
}
