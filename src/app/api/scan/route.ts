import { askGemini, claimCredit, errorResponse, HttpError, parseJson, requireUser } from "@/lib/server/ai";

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

const text = (description: string) => ({ type: "STRING", nullable: true, description });

// Gemini's structured output (OpenAPI subset).
const SCHEMA = {
  type: "OBJECT",
  properties: {
    is_wine_label: { type: "BOOLEAN", description: "Is this a photo of a wine label/bottle?" },
    producer: text("Weingut / Produzent, e.g. 'Dönnhoff'"),
    name: text("Name of the wine without producer, e.g. 'Hermannshöhle Riesling GG'"),
    vintage: { type: "INTEGER", nullable: true },
    color: {
      type: "STRING",
      nullable: true,
      enum: ["white", "red", "rose", "sparkling", "sweet", "orange"],
    },
    grape: text("Main grape in German, e.g. 'Riesling', 'Spätburgunder'"),
    country: text("ISO 3166-1 alpha-2, e.g. 'DE'"),
    region: text("Wine region in German, e.g. 'Nahe', 'Mosel', 'Burgund'"),
    site: text("Vineyard site (Lage) if printed, e.g. 'Hermannshöhle'"),
    classification: text(
      "One of Gutswein, Ortswein, Erste Lage, GG, Kabinett, Spätlese, Auslese - or another printed level",
    ),
    label_box: {
      type: "OBJECT",
      nullable: true,
      description: "Rectangle of the label in the image, as fractions 0..1 of width/height",
      properties: {
        x: { type: "NUMBER" },
        y: { type: "NUMBER" },
        width: { type: "NUMBER" },
        height: { type: "NUMBER" },
      },
      required: ["x", "y", "width", "height"],
    },
    confidence: { type: "NUMBER", description: "0..1, how sure you are about producer and name" },
  },
  required: ["is_wine_label", "confidence"],
};

const EMPTY: Omit<LabelScan, "is_wine_label" | "confidence"> = {
  producer: null,
  name: null,
  vintage: null,
  color: null,
  grape: null,
  country: null,
  region: null,
  site: null,
  classification: null,
  label_box: null,
};

/** Reads a wine label photo: producer, wine, vintage, grape, region, quality level. */
export async function POST(request: Request) {
  try {
    const { supabase } = await requireUser(request);
    const { image } = (await request.json()) as { image?: string };
    const data = image?.match(/^data:image\/(jpeg|png|webp);base64,(.+)$/);
    if (!data || data[2].length > 4_000_000) throw new HttpError(400, "Bitte ein Foto (JPEG) schicken.");
    await claimCredit(supabase, "scan");

    const answer = await askGemini({
      schema: SCHEMA,
      parts: [
        { inline_data: { mime_type: `image/${data[1]}`, data: data[2] } },
        {
          text:
            "Lies dieses Weinetikett. Gib nur an, was auf dem Etikett steht oder sich sicher daraus ergibt " +
            "(z. B. Rebsorte aus 'Riesling', Farbe aus der Rebsorte). Nichts erfinden – Unbekanntes ist null.",
        },
      ],
    });
    const scan = parseJson<LabelScan>(answer);
    if (!scan) throw new HttpError(502, "Das Etikett konnte nicht gelesen werden.");
    return Response.json({ ...EMPTY, ...scan });
  } catch (error) {
    return errorResponse(error);
  }
}
