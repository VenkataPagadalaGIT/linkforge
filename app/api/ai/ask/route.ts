import { NextResponse } from "next/server";
import { SYSTEM_PROMPT, entitiesFor, evidenceFor } from "@/lib/ai-ask";

/**
 * POST /api/ai/ask {question}: a plain-English question answered by Claude
 * from the graph's own evidence, with citations. Off until the owner sets
 * AI_ASK_ENABLED=1 and ANTHROPIC_API_KEY (it spends money per call). Caps:
 * AI_ASK_DAILY_CAP calls a day (default 150) and 12 an hour per address.
 */
export const dynamic = "force-dynamic";

const MODEL = process.env.AI_ASK_MODEL || "claude-sonnet-5-5";
const DAILY_CAP = Number(process.env.AI_ASK_DAILY_CAP || 150);
const PER_IP_HOUR = 12;
const day = { key: "", n: 0 };
const perIp = new Map<string, number[]>();

function allow(ip: string): string | null {
  const today = new Date().toISOString().slice(0, 10);
  if (day.key !== today) {
    day.key = today;
    day.n = 0;
  }
  if (day.n >= DAILY_CAP) return "The daily limit for questions is reached. Try again tomorrow.";
  const now = Date.now();
  const recent = (perIp.get(ip) ?? []).filter((t) => now - t < 3600_000);
  if (recent.length >= PER_IP_HOUR) return "That is 12 questions in an hour from this address. Try again later.";
  recent.push(now);
  perIp.set(ip, recent);
  day.n += 1;
  return null;
}

export async function POST(req: Request) {
  if (process.env.AI_ASK_ENABLED !== "1" || !process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ enabled: false, message: "Ask is not switched on yet. The graph's search, dossiers and the Compare tool answer most questions meanwhile." }, { status: 503 });
  }
  let question = "";
  try {
    question = String(((await req.json()) as { question?: unknown }).question ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Send JSON: {\"question\": \"...\"}" }, { status: 400 });
  }
  if (question.length < 3 || question.length > 300) return NextResponse.json({ error: "A question is 3 to 300 characters." }, { status: 400 });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  const refused = allow(ip);
  if (refused) return NextResponse.json({ error: refused }, { status: 429 });

  const ids = entitiesFor(question);
  const evidence = evidenceFor(ids);
  if (!evidence.length) return NextResponse.json({ answer: "The graph has no entity matching that question. Try a company, chip, mineral or policy by name.", evidence: [], entities: [] });
  const blocks = evidence.map((b) => `[E${b.n}] (${b.entityName}, ${b.kind}) ${b.text}`).join("\n\n");
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: `Evidence:\n\n${blocks}\n\nQuestion: ${question}` }],
    }),
  });
  if (!r.ok) return NextResponse.json({ error: `The model did not answer (${r.status}).` }, { status: 502 });
  const data = (await r.json()) as { content?: { type: string; text?: string }[]; usage?: { input_tokens: number; output_tokens: number } };
  const answer = (data.content ?? []).map((c) => c.text ?? "").join("").trim();
  return NextResponse.json({
    answer,
    entities: ids,
    evidence: evidence.map((b) => ({ n: b.n, entity: b.entity, entityName: b.entityName, kind: b.kind, url: b.url, text: b.text.slice(0, 280) })),
    model: MODEL,
    usage: data.usage ?? null,
    notice: "Not investment advice. Answers come only from the graph's sourced facts.",
  });
}
