import { askClaude, claimCredit, errorResponse, HttpError, requireUser, toolInput } from "@/lib/server/ai";

export const maxDuration = 60;

export type PriceOffer = {
  shop: string;
  price: number;
  currency: string;
  url: string;
  bottle_ml: number | null;
  vintage: number | null;
};

const SCHEMA = {
  type: "object",
  properties: {
    offers: {
      type: "array",
      maxItems: 8,
      items: {
        type: "object",
        properties: {
          shop: { type: "string" },
          price: { type: "number", description: "Price per bottle incl. VAT" },
          currency: { type: "string", description: "ISO code, usually EUR" },
          url: { type: "string", description: "Direct https link to the product page" },
          bottle_ml: { type: ["integer", "null"] },
          vintage: { type: ["integer", "null"], description: "Vintage of the offer, if stated" },
        },
        required: ["shop", "price", "currency", "url", "bottle_ml", "vintage"],
      },
    },
    note: {
      type: ["string", "null"],
      description: "One short German sentence, e.g. if only other vintages were found",
    },
  },
  required: ["offers", "note"],
};

/**
 * Looks up current shop offers for a wine on the web (on demand) and stores
 * them in the price history. Results are "Fundstellen", not guaranteed prices.
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
    const blocks = await askClaude({
      max_tokens: 1500,
      tools: [
        {
          type: "web_search_20250305",
          name: "web_search",
          max_uses: 4,
          user_location: { type: "approximate", country: "DE", timezone: "Europe/Berlin" },
        },
        { name: "report_offers", description: "Report the shop offers you found.", input_schema: SCHEMA },
      ],
      messages: [
        {
          role: "user",
          content:
            `Finde aktuelle Online-Angebote für diesen Wein: „${wine}“ (0,75 l, bevorzugt Händler in Deutschland/EU). ` +
            "Nur echte Produktseiten mit Preis, keine Preisvergleich-Startseiten. Jahrgang genau angeben, " +
            "andere Jahrgänge nur, wenn der gesuchte nicht zu finden ist. Melde das Ergebnis mit report_offers.",
        },
      ],
    });
    const result = toolInput<{ offers: PriceOffer[]; note: string | null }>(blocks, "report_offers") ?? {
      offers: [],
      note: "Keine Angebote gefunden.",
    };
    const offers = result.offers.filter((o) => /^https:\/\//.test(o.url) && o.price > 0).slice(0, 8);
    const sameVintage = offers.filter((o) => !body.vintage || !o.vintage || o.vintage === body.vintage);
    if (sameVintage.length) {
      await supabase.rpc("record_price_offers", { p_vintage_id: body.vintageId, p_offers: sameVintage });
    }
    return Response.json({ offers: offers.sort((a, b) => a.price - b.price), note: result.note });
  } catch (error) {
    return errorResponse(error);
  }
}
