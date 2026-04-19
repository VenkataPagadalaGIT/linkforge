import type { Metadata } from "next";
import Contact from "@/pages/Contact";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Venkata Pagadala — engagements, collaborations, and inquiries.",
  alternates: { canonical: "/contact" },
  openGraph: { url: "/contact", title: "Contact · Venkata Pagadala" },
};

export default function Page() {
  return <Contact />;
}
