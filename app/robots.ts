import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Never crawled, by anyone: the admin and any API routes. A crawler obeys only
// the most specific group that names it, so every group carries the same
// disallow list; putting it on "*" alone would leave the named AI bots free.
const NEVER_CRAWL = ["/admin", "/admin/", "/api/"];

// AI / LLM crawlers are named explicitly so our content can be retrieved.
const AI_CRAWLERS = [
  "GPTBot", "ChatGPT-User", "OAI-SearchBot", "ClaudeBot", "Claude-Web", "anthropic-ai",
  "PerplexityBot", "Perplexity-User", "Google-Extended", "Applebot-Extended", "CCBot",
  "Bytespider", "Amazonbot", "Meta-ExternalAgent", "DuckAssistBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: ["*", ...AI_CRAWLERS].map((userAgent) => ({ userAgent, allow: "/", disallow: NEVER_CRAWL })),
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
