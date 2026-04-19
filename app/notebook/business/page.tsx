import type { Metadata } from "next";
import BusinessNotebook from "@/pages/BusinessNotebook";

export const metadata: Metadata = {
  title: "Business Notebook",
  description: "Business-side AI notes, market notes, and strategy frameworks by Venkata Pagadala.",
  alternates: { canonical: "/notebook/business" },
  openGraph: { url: "/notebook/business", title: "Business Notebook" },
};

export default function Page() {
  return <BusinessNotebook />;
}
