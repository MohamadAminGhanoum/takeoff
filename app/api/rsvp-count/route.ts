import { NextResponse } from "next/server";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await getSettings();
  return NextResponse.json({
    count: s.rsvpCount,
    submissionsOpen: s.submissionsOpen,
    banner: s.banner,
  });
}