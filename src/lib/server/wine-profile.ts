import "server-only";
import type { WineProfile } from "@/app/api/wine-profile/route";
import { AROMA_FAMILIES } from "@/config/aromas";
import { colorFamily, SHADES } from "@/config/guided";
import { askGemini, HttpError, parseJson } from "./ai";

const ALL_AROMAS = AROMA_FAMILIES.flatMap((f) => f.aromas);

/** Asks Gemini for the typical profile of a wine described in words. */
export async function generateWineProfile(wine: string, color: string): Promise<WineProfile> {
  const shades = SHADES[colorFamily(color)];
  const answer = await askGemini({
    schema: {
      type: "OBJECT",
      properties: {
        shade: { type: "STRING", enum: shades.map((s) => s.id), nullable: true },
        color_note: {
          type: "STRING",
          nullable: true,
          description: "1 kurzer deutscher Satz zur typischen Farbe",
        },
        aromas: {
          type: "ARRAY",
          description: "3-6 typische Aromen, NUR aus der erlaubten Liste",
          items: {
            type: "OBJECT",
            properties: {
              aroma: { type: "STRING", enum: ALL_AROMAS },
              note: { type: "STRING", nullable: true, description: "Halbsatz, warum es typisch ist" },
            },
            required: ["aroma"],
          },
        },
        structure: {
          type: "OBJECT",
          description: "Typische Werte 0-10",
          properties: {
            sweetness: { type: "NUMBER" },
            acidity: { type: "NUMBER" },
            body: { type: "NUMBER" },
            tannin: { type: "NUMBER", nullable: true },
            finish: { type: "NUMBER" },
          },
          required: ["sweetness", "acidity", "body", "finish"],
        },
        finish_seconds: {
          type: "INTEGER",
          nullable: true,
          description: "Wie lange ein Einsteiger den Geschmack nach dem Schlucken bemerkt, 3-25 Sekunden",
        },
        note: {
          type: "STRING",
          nullable: true,
          description: "1 Satz für Einsteiger, was diesen Wein ausmacht",
        },
      },
      required: ["shade", "aromas", "structure"],
    },
    parts: [
      {
        text:
          `Beschreibe das typische Verkostungsprofil dieses Weins für eine Einsteiger-Verkostung: ${wine}. ` +
          `Farbe als eine dieser Stufen: ${shades.map((s) => `${s.id} = ${s.label}`).join("; ")}. ` +
          `Aromen nur aus dieser Liste: ${ALL_AROMAS.join(", ")}. Tannin nur bei Rotwein, sonst null. ` +
          "Beschreibe den Stil, wie Kenner ihn typischerweise beschreiben – nichts erfinden, im Zweifel vorsichtig.",
      },
    ],
  });
  const raw = parseJson<WineProfile>(answer);
  if (!raw) throw new HttpError(502, "Das Weinprofil konnte nicht erstellt werden.");
  const clamp = (n: unknown) =>
    typeof n === "number" ? Math.max(0, Math.min(10, Math.round(n * 10) / 10)) : null;
  const profile: WineProfile = {
    shade: shades.some((s) => s.id === raw.shade) ? raw.shade : null,
    color_note: raw.color_note ?? null,
    aromas: (raw.aromas ?? []).filter((a) => ALL_AROMAS.includes(a.aroma)).slice(0, 6),
    structure: {
      sweetness: clamp(raw.structure?.sweetness) ?? 2,
      acidity: clamp(raw.structure?.acidity) ?? 6,
      body: clamp(raw.structure?.body) ?? 5,
      tannin: color === "red" ? clamp(raw.structure?.tannin) : null,
      finish: clamp(raw.structure?.finish) ?? 5,
    },
    // Experts often count very long finishes ("60 seconds"); with a stopwatch at the table 3-25 s is realistic.
    finish_seconds:
      typeof raw.finish_seconds === "number"
        ? Math.max(3, Math.min(25, Math.round(raw.finish_seconds)))
        : null,
    note: raw.note ?? null,
  };
  return profile;
}
