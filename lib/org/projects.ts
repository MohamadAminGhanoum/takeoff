import { NextRequest } from "next/server";
import { POST as sidekick } from "@/lib/sidekick/route";
import type { Project } from "@/lib/sidekick/types";

export async function fetchProjects(): Promise<{ ok: boolean; projects: Project[] }> {
  try {
    const req = new NextRequest("http://localhost:3000/api/sidekick", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SIDEKICK_SECRET || ""}`,
      },
      body: JSON.stringify({ action: "GET_ALL_PROJECTS" }),
    });
    const res = await sidekick(req);
    if (!res.ok) return { ok: false, projects: [] };
    const data = await res.json();
    if (!Array.isArray(data)) return { ok: false, projects: [] };
    // Only projects that have been submitted at least once are reviewable.
    return { ok: true, projects: (data as Project[]).filter((p) => p.ships?.length > 0) };
  } catch {
    return { ok: false, projects: [] };
  }
}
