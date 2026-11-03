import type { Metadata } from "next";
import DashboardClient from "./DashboardClient";

export const metadata: Metadata = {
  title: "Admin",
  description: "Mono Mind admin dashboard.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/admin" },
};

export default function Page() {
  return <DashboardClient />;
}
