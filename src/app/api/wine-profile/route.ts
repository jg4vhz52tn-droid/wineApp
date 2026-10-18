import { claimCredit, errorResponse, HttpError, requireUser } from "@/lib/server/ai";
import { generateWineProfile } from "@/lib/server/wine-profile";

export const maxDuration = 30;

export type WineProfile = {
  shade: string | null;
  color_note: string | null;
  aromas: { aroma: string; note: string | null }[];
  structure: { sweetness: number; acidity: number; body: number; tannin: number | null; finish: number };
  finish_seconds: number | null;
  note: string | null;
};

/**
 * The typical profile of a wine (colour, aromas, structure) - written once by
 * Gemini from producer, site, grape and vintage, then stored for everyone.
 * Shown as "So beschreiben Kenner diesen Wein typischerweise", never as truth.
 */
export async function POST(request: Request) {
  try {
    const { supabase } = await requireUser(request);
    const { vintageId } = (await request.json()) as { vintageId?: string };
    if (!vintageId) throw new HttpError(400, "Welcher Wein?");

    const stored = await supabase
      .from("wine_profiles")
      .select("profile")
      .eq("vintage_id", vintageId)
      .maybeSingle();
    if (stored.data) return Response.json({ profile: stored.data.profile, cached: true });

    const { data: v } = await supabase
      .from("wine_vintages")
      .select(
        "vintage, wines(producer, name, color, classification, grape_varieties(name), regions(name), vineyard_sites(name))",
      )
      .eq("id", vintageId)
      .maybeSingle();
    const w = (v as unknown as { vintage: number | null; wines: Record<string, unknown> | null } | null)
      ?.wines;
    if (!v || !w) throw new HttpError(404, "Wein nicht gefunden.");
    await claimCredit(supabase, "profile");

    const color = w.color as string;
    const name = (x: unknown) => (x as { name?: string } | null)?.name ?? null;
    const wine = [
      w.producer,
      w.name,
      (v as { vintage: number | null }).vintage,
      name(w.grape_varieties) && `Rebsorte ${name(w.grape_varieties)}`,
      name(w.regions) && `Region ${name(w.regions)}`,
      name(w.vineyard_sites) && `Lage ${name(w.vineyard_sites)}`,
      w.classification,
    ]
      .filter(Boolean)
      .join(", ");

    const profile = await generateWineProfile(wine, color);
    await supabase.rpc("save_wine_profile", { p_vintage_id: vintageId, p_profile: profile });
    return Response.json({ profile, cached: false });
  } catch (error) {
    return errorResponse(error);
  }
}
