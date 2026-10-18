import { connection } from "next/server";

export const maxDuration = 60;
import { askGemini, checkGemini } from "@/lib/server/ai";
import { LABEL_SCHEMA } from "@/lib/server/label-schema";
import { TEST_LABEL_JPEG } from "@/lib/server/test-label";
import { generateWineProfile } from "@/lib/server/wine-profile";

// Health check for the AI features: is the key set, does Google accept it,
// is the model there? With ?test=1 it also runs two tiny requests (same
// settings as label scan and price search) and reports Google's answer.
// Never returns the key.

let cache: { at: number; body: Record<string, unknown> } | null = null;

async function attempt(run: () => Promise<string>) {
  const start = Date.now();
  try {
    const text = await run();
    return { ok: true, ms: Date.now() - start, sample: text.slice(0, 600) };
  } catch (e) {
    return { ok: false, ms: Date.now() - start, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function GET(request: Request) {
  await connection();
  const params = new URL(request.url).searchParams;
  const test = params.has("test");
  const only = params.get("model");
  // Test the typical wine profile for the guided tasting: ?profile=1
  if (params.has("profile")) {
    return Response.json({
      profileTest: await attempt(async () =>
        JSON.stringify(
          await generateWineProfile(
            "Dönnhoff, Hermannshöhle Riesling, 2020, Rebsorte Riesling, Region Nahe, GG",
            "white",
          ),
        ),
      ),
    });
  }
  // Compare one model's speed on the test label: ?model=gemini-flash-lite-latest
  if (only && /^[a-z0-9.-]{3,60}$/.test(only)) {
    return Response.json({
      model: only,
      scanTest: await attempt(() =>
        askGemini({
          models: [only],
          schema: LABEL_SCHEMA,
          parts: [
            { inline_data: { mime_type: "image/jpeg", data: TEST_LABEL_JPEG } },
            { text: "Lies dieses Weinetikett. Unbekanntes ist null." },
          ],
        }),
      ),
    });
  }
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
            { inline_data: { mime_type: "image/jpeg", data: TEST_LABEL_JPEG } },
            { text: "Lies dieses Weinetikett. Unbekanntes ist null." },
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
