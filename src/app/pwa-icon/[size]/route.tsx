import { ImageResponse } from "next/og";
import { AppIconArt } from "@/components/app/app-icon-art";

const SIZES = new Set([180, 192, 512]);

// Placeholder app icon until there is a final name and logo.
export async function GET(_request: Request, ctx: RouteContext<"/pwa-icon/[size]">) {
  const size = Number((await ctx.params).size);
  if (!SIZES.has(size)) return new Response("Not found", { status: 404 });
  return new ImageResponse(<AppIconArt size={size} />, { width: size, height: size });
}
