import { connection } from "next/server";
import { askGemini, checkGemini } from "@/lib/server/ai";
import { LABEL_SCHEMA } from "@/lib/server/label-schema";

// Health check for the AI features: is the key set, does Google accept it,
// is the model there? With ?test=1 it also runs two tiny requests (same
// settings as label scan and price search) and reports Google's answer.
// Never returns the key.

let cache: { at: number; body: Record<string, unknown> } | null = null;

async function attempt(run: () => Promise<string>) {
  try {
    const text = await run();
    return { ok: true, sample: text.slice(0, 160) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function GET(request: Request) {
  await connection();
  const test = new URL(request.url).searchParams.has("test");
  if (cache && Date.now() - cache.at < 2 * 60_000 && (!test || "scanTest" in cache.body))
    return Response.json(cache.body);
  let body: Record<string, unknown> = { provider: "Google Gemini", ...(await checkGemini()) };
  if (test && body.valid) {
    body = {
      ...body,
      scanTest: await attempt(() =>
        askGemini({
          schema: LABEL_SCHEMA,
          parts: [
            { text: "Test ohne Foto: Das Etikett lautet 'Dönnhoff Hermannshöhle Riesling GG 2020, Nahe'." },
          ],
        }),
      ),
      searchTest: await attempt(() =>
        askGemini({
          googleSearch: true,
          parts: [{ text: "Was kostet ungefähr eine Flasche Dönnhoff Riesling trocken? Ein Satz." }],
        }),
      ),
    };
  }
  cache = { at: Date.now(), body };
  return Response.json(body);
}
