import { askGemini, claimCredit, errorResponse, HttpError, parseJson, requireUser } from "@/lib/server/ai";

export const maxDuration = 60;

export type PriceOffer = {
  shop: string;
  price: number;
  currency: string;
  url: string;
  bottle_ml: number | null;
  vintage: number | null;
};

/**
 * Looks up current shop offers for a wine with Gemini + Google Search (on
 * demand, free tier) and stores them in the price history. Results are
 * "Fundstellen", not guaranteed prices - the app also always offers search links.
 */
export async function POST(request: Request) {
  try {
    const { supabase } = await requireUser(request);
    const body = (await request.json()) as {
      vintageId?: string;
      producer?: string;
      name?: string | null;
      vintage?: number | null;
    };
    if (!body.vintageId || !body.producer) throw new HttpError(400, "Welcher Wein?");
    await claimCredit(supabase, "prices");

    const wine = [body.producer, body.name, body.vintage].filter(Boolean).join(" ");
    const answer = await askGemini({
      googleSearch: true,
      parts: [
        {
          text:
            `Suche aktuelle Online-Angebote für diesen Wein: „${wine}“ (0,75 l, bevorzugt Händler in Deutschland/EU). ` +
            "Nur echte Produktseiten von Weinhändlern mit Preis pro Flasche inkl. MwSt. – keine Preisvergleich-Startseiten. " +
            "Nenne den Jahrgang des Angebots. Antworte NUR mit JSON in dieser Form: " +
            '{"offers":[{"shop":"…","price":34.9,"currency":"EUR","url":"https://…","bottle_ml":750,"vintage":2021}],"note":"…"} ' +
            "Höchstens 6 Angebote. Wenn du nichts Verlässliches findest: offers leer und note mit einem kurzen Satz.",
        },
      ],
    });
    const result = parseJson<{ offers?: PriceOffer[]; note?: string | null }>(answer) ?? {};
    const offers = (result.offers ?? [])
      .filter((o) => typeof o.url === "string" && /^https:\/\//.test(o.url) && Number(o.price) > 0)
      .map((o) => ({ ...o, price: Number(o.price), currency: o.currency || "EUR" }))
      .slice(0, 6);
    const sameVintage = offers.filter((o) => !body.vintage || !o.vintage || o.vintage === body.vintage);
    if (sameVintage.length) {
      await supabase.rpc("record_price_offers", { p_vintage_id: body.vintageId, p_offers: sameVintage });
    }
    return Response.json({
      offers: offers.sort((a, b) => a.price - b.price),
      note: result.note ?? (offers.length ? null : "Keine verlässlichen Angebote gefunden."),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
