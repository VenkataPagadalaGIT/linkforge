import type { Metadata } from "next";
import About from "@/views/About";

export const metadata: Metadata = {
  title: "About",
  description:
    "About Venkata Pagadala — AI systems architect, researcher, and the story behind Mono Mind.",
  alternates: { canonical: "/about" },
  openGraph: { url: "/about", title: "About · Venkata Pagadala" },
};

export default function Page() {
  return <About />;
}
