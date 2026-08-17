import type { Metadata } from "next";
import PagesListClient from "./PagesListClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "CMS · Pages",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <PagesListClient />;
}
