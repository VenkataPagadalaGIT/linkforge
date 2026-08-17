import type { Metadata } from "next";
import GlobalsClient from "./GlobalsClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "CMS · Global SEO",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <GlobalsClient />;
}
