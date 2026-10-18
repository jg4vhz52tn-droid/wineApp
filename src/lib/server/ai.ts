import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-side helpers for the AI routes, using Google Gemini (free tier).
// The key lives only here (Vercel environment variable GEMINI_API_KEY) and
// never reaches the app.

const API = "https://generativelanguage.googleapis.com/v1beta";
/** Override with GEMINI_MODEL if Google renames its models. */
export const DEFAULT_MODEL = "gemini-2.5-flash";

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

function apiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new HttpError(503, "Die KI ist noch nicht eingerichtet (GEMINI_API_KEY fehlt).");
  return key;
}

export const model = () => process.env.GEMINI_MODEL || DEFAULT_MODEL;

type Part = { text?: string; inline_data?: { mime_type: string; data: string } };

/** One generateContent call; returns the text of the answer. */
export async function askGemini(body: {
  parts: Part[];
  schema?: Record<string, unknown>;
  googleSearch?: boolean;
}): Promise<string> {
  const res = await fetch(`${API}/models/${model()}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": apiKey(), "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: body.parts }],
      ...(body.googleSearch ? { tools: [{ google_search: {} }] } : {}),
      generationConfig: {
        temperature: 0.1,
        ...(body.schema ? { responseMimeType: "application/json", responseSchema: body.schema } : {}),
      },
    }),
  });
  if (res.status === 429)
    throw new HttpError(429, "Das Gratis-Kontingent ist gerade aufgebraucht. Bitte später noch einmal.");
  if (!res.ok) {
    console.error("Gemini API", res.status, await res.text());
    throw new HttpError(502, "Die KI ist gerade nicht erreichbar. Bitte später noch einmal.");
  }
  const json = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  return (json.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");
}

/** The first JSON object in a text (answers with Google Search can't be forced into JSON mode). */
export function parseJson<T>(text: string): T | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

/** For the status page: does Google accept the key, and is the model there? */
export async function checkGemini() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { configured: false, valid: false, model: model(), modelAvailable: false };
  const res = await fetch(`${API}/models?pageSize=200`, { headers: { "x-goog-api-key": key } });
  if (!res.ok)
    return { configured: true, valid: false, model: model(), modelAvailable: false, status: res.status };
  const { models } = (await res.json()) as { models: { name: string }[] };
  return {
    configured: true,
    valid: true,
    model: model(),
    modelAvailable: models.some((m) => m.name === `models/${model()}`),
    flashModels: models
      .map((m) => m.name.replace("models/", ""))
      .filter((n) => n.includes("flash"))
      .slice(0, 8),
  };
}
