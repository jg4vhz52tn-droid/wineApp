import { connection } from "next/server";
import { AI_MODEL } from "@/lib/server/ai";

// Health check for the AI features: is the key set, and does Anthropic accept
// it? Uses the free model list - no tokens, no costs. Never returns the key.

let cache: { at: number; body: Record<string, unknown> } | null = null;

export async function GET() {
  await connection();
  if (cache && Date.now() - cache.at < 10 * 60_000) return Response.json(cache.body);

  const key = process.env.ANTHROPIC_API_KEY;
  let body: Record<string, unknown> = {
    configured: Boolean(key),
    valid: false,
    model: AI_MODEL,
    modelAvailable: false,
  };
  if (key) {
    const res = await fetch("https://api.anthropic.com/v1/models?limit=100", {
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01" },
    });
    if (res.ok) {
      const { data } = (await res.json()) as { data: { id: string }[] };
      body = { ...body, valid: true, modelAvailable: data.some((m) => m.id === AI_MODEL) };
    } else {
      body = { ...body, status: res.status };
    }
  }
  cache = { at: Date.now(), body };
  return Response.json(body);
}
