import type { Metadata } from "next";
import ReviewQueueClient from "./ReviewQueueClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "CMS · Review queue",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ReviewQueueClient />;
}
