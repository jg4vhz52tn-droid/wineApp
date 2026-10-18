"use client";

import type { LabelScan } from "@/app/api/scan/route";
import type { PriceOffer } from "@/app/api/prices/route";
import { getSupabase } from "@/lib/supabase";

export type { LabelScan, PriceOffer };

const LABEL_BUCKET = "wine-labels";

async function post<T>(path: string, body: unknown): Promise<T> {
  const supabase = getSupabase();
  const { data } = (await supabase?.auth.getSession()) ?? { data: { session: null } };
  const token = data.session?.access_token;
  if (!token) throw new Error("Bitte melde dich an.");
  const res = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { error?: string }).error ?? "Das hat nicht geklappt.");
  return json as T;
}

/** Draws (a part of) an image into a JPEG of at most `max` px - also drops the location data. */
async function toJpeg(
  source: ImageBitmap,
  max: number,
  box?: { x: number; y: number; width: number; height: number } | null,
): Promise<Blob> {
  const sx = box ? Math.max(0, box.x) * source.width : 0;
  const sy = box ? Math.max(0, box.y) * source.height : 0;
  const sw = box ? Math.min(1 - Math.max(0, box.x), box.width) * source.width : source.width;
  const sh = box ? Math.min(1 - Math.max(0, box.y), box.height) * source.height : source.height;
  const scale = Math.min(1, max / Math.max(sw, sh));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(sw * scale));
  canvas.height = Math.max(1, Math.round(sh * scale));
  canvas.getContext("2d")!.drawImage(source, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("image"))), "image/jpeg", 0.85),
  );
}

const asDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

export type ScanResult = { scan: LabelScan; label: Blob; preview: string };

/** Photo → Claude reads the label → fields + the cropped label for the bottle. */
export async function scanLabel(file: File): Promise<ScanResult> {
  const bitmap = await createImageBitmap(file);
  try {
    const photo = await toJpeg(bitmap, 1400);
    const scan = await post<LabelScan>("/api/scan", { image: await asDataUrl(photo) });
    const box =
      scan.label_box && scan.label_box.width > 0.15 && scan.label_box.height > 0.1
        ? {
            // a little margin around the label
            x: scan.label_box.x - 0.02,
            y: scan.label_box.y - 0.02,
            width: scan.label_box.width + 0.04,
            height: scan.label_box.height + 0.04,
          }
        : null;
    const label = await toJpeg(bitmap, 900, box);
    return { scan, label, preview: URL.createObjectURL(label) };
  } finally {
    bitmap.close();
  }
}

const randomId = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => b.toString(16).padStart(2, "0")).join("");

/** Stores the cropped label and puts it on the wine (for everyone). */
export async function saveLabel(vintageId: string, label: Blob) {
  const supabase = getSupabase()!;
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  const path = `${data.user.id}/${randomId()}.jpg`;
  const { error } = await supabase.storage
    .from(LABEL_BUCKET)
    .upload(path, label, { contentType: "image/jpeg" });
  if (error) throw error;
  await supabase.rpc("set_wine_label", { p_vintage_id: vintageId, p_path: path });
}

/** Public link of a label photo. */
export function labelUrl(path: string | null | undefined) {
  if (!path) return null;
  return getSupabase()?.storage.from(LABEL_BUCKET).getPublicUrl(path).data.publicUrl ?? null;
}

export function findPrices(wine: {
  vintageId: string;
  producer: string;
  name: string | null;
  vintage: number | null;
}) {
  return post<{ offers: PriceOffer[]; note: string | null }>("/api/prices", wine);
}
