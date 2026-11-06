import { NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/sidekick/auth";
import { SidekickError, errorResponse } from "@/lib/sidekick/errors";
import { healthCheck } from "@/lib/sidekick/handlers/health";
import { getProgramStats } from "@/lib/sidekick/handlers/stats";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  if (!isAuthorized(req.headers.get("authorization"))) {
    return errorResponse(new SidekickError(401, "UNAUTHORIZED", "Invalid secret."));
  }

  let body: { action?: string; input?: any };
  try {
    body = await req.json();
  } catch {
    return errorResponse(new SidekickError(400, "VALIDATION_ERROR", "Body must be JSON."));
  }
  const { action, input = {} } = body;

  try {
    switch (action) {
      case "HEALTH_CHECK":     return NextResponse.json(await healthCheck());
      case "GET_PROGRAM_STATS": return NextResponse.json(await getProgramStats());
      default:
        return errorResponse(new SidekickError(400, "INVALID_ACTION", `Unknown action: ${action}`));
    }
  } catch (e) {
    if (e instanceof SidekickError) return errorResponse(e);
    console.error(e);
    return errorResponse(new SidekickError(500, "INTERNAL_ERROR", "Something went wrong."));
  }
}