"use server";

import { requireRole } from "@/lib/roles";
import { logAudit } from "@/lib/audit";
import { CheckError } from "@/lib/checker/github";
import { runCheck, underRateLimit } from "@/lib/checker/service";
import type { CheckResult } from "@/lib/checker/types";

export type CheckState = {
  result?: CheckResult;
  error?: string;
  /** Echoed back so the form keeps what was typed after it runs. */
  fields?: { repoUrl: string; description: string; hours: string };
};

const text = (v: FormDataEntryValue | null, max: number) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

export async function runCheckAction(
  _prev: CheckState,
  form: FormData
): Promise<CheckState> {
  const session = await requireRole("reviewer");

  const repoUrl = text(form.get("repoUrl"), 300);
  const description = text(form.get("description"), 4000);
  const hours = text(form.get("hours"), 10);
  const fields = { repoUrl, description, hours };
  if (!repoUrl) return { error: "Paste a GitHub repo URL first.", fields };

  const hoursRaw = Number(hours);
  const hoursClaimed = Number.isFinite(hoursRaw) && hoursRaw > 0 ? hoursRaw : undefined;

  if (!(await underRateLimit(session.user.id))) {
    return { error: "That's a lot of checks this hour. Try again a bit later.", fields };
  }

  try {
    const result = await runCheck({
      repoUrl,
      projectId: text(form.get("projectId"), 100) || undefined,
      description: description || undefined,
      hoursClaimed,
      withAi: form.get("withAi") === "on",
    });
    await logAudit(session.user.id, "check.run", `${result.fullName} score ${result.score}`);
    return { result, fields };
  } catch (e) {
    if (e instanceof CheckError) return { error: e.message, fields };
    console.error("[repo check]", e);
    return { error: "Something went wrong while checking. Try again in a moment.", fields };
  }
}
