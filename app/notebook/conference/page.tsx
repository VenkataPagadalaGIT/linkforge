import type { Metadata } from "next";
import ConferenceNotebook from "@/views/ConferenceNotebook";

export const metadata: Metadata = {
  title: "Conference Notebook",
  description:
    "Field notes, talks, and takeaways from AI, SEO, and engineering conferences — a live notebook by Venkata Pagadala.",
  alternates: { canonical: "/notebook/conference" },
  openGraph: {
    url: "/notebook/conference",
    title: "Conference Notebook · Venkata Pagadala",
    description: "Field notes from AI, SEO, and engineering conferences.",
  },
};

export default function Page() {
  return <ConferenceNotebook />;
}
