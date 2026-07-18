import type { Metadata } from "next";
import Projects from "@/views/Projects";

export const metadata: Metadata = {
  title: "Projects",
  description: "Selected AI projects and engineering work by Venkata Pagadala.",
  alternates: { canonical: "/projects" },
  openGraph: { url: "/projects", title: "Projects · Venkata Pagadala" },
};

export default function Page() {
  return <Projects />;
}
