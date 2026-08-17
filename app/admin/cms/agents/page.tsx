import type { Metadata } from "next";
import AgentTokensClient from "./AgentTokensClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "CMS · Agents",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AgentTokensClient />;
}
