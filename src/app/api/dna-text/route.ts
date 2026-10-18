import type { Dna } from "@/lib/dna";
import { dnaFacts } from "@/lib/dna";
import { askGemini, claimCredit, errorResponse, HttpError, requireUser } from "@/lib/server/ai";

export const maxDuration = 30;

/**
 * Writes the short DNA text from your numbers (Gemini, free tier) and stores
 * it with your profile. Only the computed facts go to Google - no names.
 */
export async function POST(request: Request) {
  try {
    const { supabase } = await requireUser(request);
    const { data, error } = await supabase.rpc("taste_dna");
    if (error || !data) throw new HttpError(500, "Die DNA konnte nicht berechnet werden.");
    const dna = data as Dna;
    if (!dna.ready) throw new HttpError(400, "Noch zu wenige Bewertungen.");
    await claimCredit(supabase, "dna");

    const text = (
      await askGemini({
        parts: [
          {
            text:
              "Du bist ein freundlicher Sommelier. Schreib auf Deutsch, in der Du-Form, 2 bis 3 kurze Sätze " +
              "über den Weingeschmack dieser Person – konkret, warm, ohne Floskeln, ohne Aufzählungszeichen, " +
              "keine Zahlen außer höchstens einer. Erfinde nichts dazu. Fakten:\n- " +
              dnaFacts(dna).join("\n- "),
          },
        ],
      })
    )
      .trim()
      .replace(/^["„]|["“]$/g, "");
    if (!text) throw new HttpError(502, "Kein Text bekommen.");
    await supabase.rpc("set_taste_summary", { p_summary: text });
    return Response.json({ text });
  } catch (error) {
    return errorResponse(error);
  }
}
