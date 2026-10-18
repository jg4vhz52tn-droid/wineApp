import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-side helpers for the AI routes. The Claude key lives only here
// (Vercel environment variable ANTHROPIC_API_KEY) and never reaches the app.

export const AI_MODEL = "claude-sonnet-5-5";
const API = "https://api.anthropic.com/v1/messages";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function errorResponse(error: unknown) {
  if (error instanceof HttpError) return Response.json({ error: error.message }, { status: error.status });
  console.error(error);
  return Response.json({ error: "Da ist etwas schiefgegangen." }, { status: 500 });
}

/** The signed-in user behind the request - and a Supabase client acting as them (RLS applies). */
export async function requireUser(request: Request): Promise<{ supabase: SupabaseClient; userId: string }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const token = request.headers.get("authorization")?.replace(/^Bearer /i, "");
  if (!url || !key) throw new HttpError(503, "Supabase ist nicht eingerichtet.");
  if (!token) throw new HttpError(401, "Bitte melde dich an.");
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) throw new HttpError(401, "Bitte melde dich an.");
  if (data.user.is_anonymous) throw new HttpError(403, "Dafür brauchst du ein Konto.");
  return { supabase, userId: data.user.id };
}

/** Counts the request against the daily limit (25 scans / 20 price searches). */
export async function claimCredit(supabase: SupabaseClient, kind: "scan" | "prices") {
  const { data, error } = await supabase.rpc("claim_ai_credit", { p_kind: kind });
  if (error) throw error;
  if (!data) throw new HttpError(429, "Für heute ist das Limit erreicht – morgen geht’s weiter.");
}

type Block = { type: string; name?: string; input?: unknown; text?: string };
type Reply = { content: Block[]; stop_reason: string };

/** One Messages API call; continues automatically while server tools (web search) are still working. */
export async function askClaude(body: Record<string, unknown>): Promise<Block[]> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new HttpError(503, "Die KI ist noch nicht eingerichtet (ANTHROPIC_API_KEY fehlt).");
  const messages = [...(body.messages as unknown[])];
  const collected: Block[] = [];
  for (let round = 0; round < 4; round++) {
    const res = await fetch(API, {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: AI_MODEL, ...body, messages }),
    });
    if (!res.ok) {
      console.error("Claude API", res.status, await res.text());
      throw new HttpError(502, "Die KI ist gerade nicht erreichbar. Bitte später noch einmal.");
    }
    const reply = (await res.json()) as Reply;
    collected.push(...reply.content);
    if (reply.stop_reason !== "pause_turn") break;
    messages.push({ role: "assistant", content: reply.content });
  }
  return collected;
}

/** The input of the first call to our reporting tool, or null. */
export function toolInput<T>(blocks: Block[], name: string): T | null {
  const block = blocks.find((b) => b.type === "tool_use" && b.name === name);
  return (block?.input as T) ?? null;
}
