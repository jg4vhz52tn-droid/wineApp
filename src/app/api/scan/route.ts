import { askClaude, claimCredit, errorResponse, HttpError, requireUser, toolInput } from "@/lib/server/ai";

export const maxDuration = 30;

export type LabelScan = {
  is_wine_label: boolean;
  producer: string | null;
  name: string | null;
  vintage: number | null;
  color: "white" | "red" | "rose" | "sparkling" | "sweet" | "orange" | null;
  grape: string | null;
  country: string | null;
  region: string | null;
  site: string | null;
  classification: string | null;
  /** Where the label sits in the photo, as fractions 0..1 - used to crop it. */
  label_box: { x: number; y: number; width: number; height: number } | null;
  confidence: number;
};

const SCHEMA = {
  type: "object",
  properties: {
    is_wine_label: { type: "boolean", description: "Is this a photo of a wine label/bottle?" },
    producer: { type: ["string", "null"], description: "Weingut / Produzent, e.g. 'Dönnhoff'" },
    name: {
      type: ["string", "null"],
      description: "Name of the wine without producer, e.g. 'Hermannshöhle Riesling GG'",
    },
    vintage: { type: ["integer", "null"] },
    color: { type: ["string", "null"], enum: ["white", "red", "rose", "sparkling", "sweet", "orange", null] },
    grape: {
      type: ["string", "null"],
      description: "Main grape in German, e.g. 'Riesling', 'Spätburgunder'",
    },
    country: { type: ["string", "null"], description: "ISO 3166-1 alpha-2, e.g. 'DE'" },
    region: {
      type: ["string", "null"],
      description: "Wine region in German, e.g. 'Nahe', 'Mosel', 'Burgund'",
    },
    site: { type: ["string", "null"], description: "Vineyard site (Lage) if printed, e.g. 'Hermannshöhle'" },
    classification: {
      type: ["string", "null"],
      description:
        "One of Gutswein, Ortswein, Erste Lage, GG, Kabinett, Spätlese, Auslese - or another printed level",
    },
    label_box: {
      type: ["object", "null"],
      properties: {
        x: { type: "number" },
        y: { type: "number" },
        width: { type: "number" },
        height: { type: "number" },
      },
      required: ["x", "y", "width", "height"],
    },
    confidence: { type: "number", description: "0..1, how sure you are about producer and name" },
  },
  required: [
    "is_wine_label",
    "producer",
    "name",
    "vintage",
    "color",
    "grape",
    "country",
    "region",
    "site",
    "classification",
    "label_box",
    "confidence",
  ],
};

/** Reads a wine label photo: producer, wine, vintage, grape, region, quality level. */
export async function POST(request: Request) {
  try {
    const { supabase } = await requireUser(request);
    const { image } = (await request.json()) as { image?: string };
    const data = image?.match(/^data:image\/(jpeg|png|webp);base64,(.+)$/);
    if (!data || data[2].length > 4_000_000) throw new HttpError(400, "Bitte ein Foto (JPEG) schicken.");
    await claimCredit(supabase, "scan");

    const blocks = await askClaude({
      max_tokens: 800,
      tools: [
        { name: "report_label", description: "Report what the wine label says.", input_schema: SCHEMA },
      ],
      tool_choice: { type: "tool", name: "report_label" },
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: `image/${data[1]}`, data: data[2] } },
            {
              type: "text",
              text:
                "Lies dieses Weinetikett. Gib nur an, was auf dem Etikett steht oder sich sicher daraus ergibt " +
                "(z. B. Rebsorte aus 'Riesling', Farbe aus der Rebsorte). Nichts erfinden – Unbekanntes ist null. " +
                "label_box: Rechteck des Etiketts im Bild als Anteile von Breite/Höhe.",
            },
          ],
        },
      ],
    });
    const scan = toolInput<LabelScan>(blocks, "report_label");
    if (!scan) throw new HttpError(502, "Das Etikett konnte nicht gelesen werden.");
    return Response.json(scan);
  } catch (error) {
    return errorResponse(error);
  }
}
