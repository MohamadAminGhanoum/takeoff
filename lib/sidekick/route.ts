import { NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/sidekick/auth";
import { SidekickError, errorResponse } from "@/lib/sidekick/errors";
import { healthCheck } from "@/lib/sidekick/handlers/health";
import { getProgramStats } from "@/lib/sidekick/handlers/stats";

import { repo } from "@/lib/sidekick/repo";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  if (!isAuthorized(req.headers.get("authorization"))) {
    return errorResponse(new SidekickError(401, "UNAUTHORIZED", "Invalid secret."));
  }

  type SidekickRequestBody = {
    action?: string;
    input?: Record<string, unknown>;
  };

  let body: SidekickRequestBody;
  try {
    const parsedBody = await req.json();
    if (typeof parsedBody !== "object" || parsedBody === null) {
      return errorResponse(new SidekickError(400, "VALIDATION_ERROR", "Body must be an object."));
    }
    body = parsedBody as SidekickRequestBody;
  } catch {
    return errorResponse(new SidekickError(400, "VALIDATION_ERROR", "Body must be JSON."));
  }
  const { action, input = {} } = body;

  try {
    switch (action) {
      case "HEALTH_CHECK":
        return NextResponse.json(await healthCheck());

      case "GET_PROGRAM_STATS":
        return NextResponse.json(await getProgramStats());

      case "GET_ALL_PROJECTS": {
        const result = await repo.listProjects({ status: "all", limit: 100 });
        return NextResponse.json(result.projects);
      }

      case "GET_PROJECT_BY_ID": {
        const projectId = input.id;
        if (projectId === undefined || projectId === null || projectId === "") {
          return errorResponse(new SidekickError(400, "VALIDATION_ERROR", "Missing project ID reference."));
        }
        const targetProject = await repo.getProject(String(projectId));
        if (!targetProject) {
          return errorResponse(new SidekickError(404, "NOT_FOUND", "No project found with specified ID node."));
        }
        return NextResponse.json(targetProject);
      }

      default:
        return errorResponse(new SidekickError(400, "INVALID_ACTION", `Unknown action: ${action}`));
    }
  } catch (e) {
    if (e instanceof SidekickError) return errorResponse(e);
    console.error(e);
    return errorResponse(new SidekickError(500, "INTERNAL_ERROR", "Something went wrong."));
  }
}
