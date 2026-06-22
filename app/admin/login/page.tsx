import type { Metadata } from "next";
import LoginClient from "./LoginClient";

export const metadata: Metadata = {
  title: "Admin Login",
  description: "Admin access to Mono Mind dashboard.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/admin/login" },
};

export default function Page() {
  return <LoginClient />;
}
