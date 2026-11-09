import { getRoles } from "@/lib/roles";
import { fetchProjects } from "@/lib/org/projects";
import { toCsv } from "@/lib/org/csv";
import { filterProjects, latestHours, latestSubmitted, parseProjectQuery, projectStatus } from "@/lib/org/stats";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/** CSV of the project list with the same filters as the Projects tab. Org only. */
export async function GET(req: Request) {
  const { session, isOrg } = await getRoles();
  if (!session || !isOrg) return new Response("Forbidden", { status: 403 });

  const sp = Object.fromEntries(new URL(req.url).searchParams) as Record<string, string | undefined>;
  const query = parseProjectQuery(sp);
  const { projects } = await fetchProjects();
  const rows = filterProjects(projects, query).map((p) => [
    p.id,
    p.title,
    p.authorId,
    projectStatus(p),
    latestHours(p),
    latestSubmitted(p),
    p.ships.length,
    p.codeUrl,
  ]);

  await logAudit(session.user.id, "export.projects", `${rows.length} rows`);
  const csv = toCsv(["id", "title", "author", "status", "hours", "submitted_at", "ships", "repo"], rows);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="takeoff-projects-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
