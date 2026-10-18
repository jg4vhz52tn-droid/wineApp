import { askGemini, claimCredit, errorResponse, HttpError, parseJson, requireUser } from "@/lib/server/ai";
import { LABEL_SCHEMA as SCHEMA } from "@/lib/server/label-schema";

export const maxDuration = 60;

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
