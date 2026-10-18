import { connection } from "next/server";
import { checkGemini } from "@/lib/server/ai";

// Health check for the AI features: is the key set, does Google accept it,
// is the model there? Lists models only - free, and never returns the key.

let cache: { at: number; body: Record<string, unknown> } | null = null;

export async function GET() {
  await connection();
  if (cache && Date.now() - cache.at < 2 * 60_000) return Response.json(cache.body);
  const body = { provider: "Google Gemini", ...(await checkGemini()) };
  cache = { at: Date.now(), body };
  return Response.json(body);
}
