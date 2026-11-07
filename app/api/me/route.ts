import { NextResponse } from "next/server";
import { getRoles } from "@/lib/roles";

export async function GET() {
  const { session, isReviewer, isOrg } = await getRoles();
  return NextResponse.json({ signedIn: !!session, isReviewer, isOrg });
}