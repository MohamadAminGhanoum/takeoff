"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/roles";
import { addReviewer, removeReviewer, listReviewers, type Reviewer } from "@/lib/reviewers";
import { BOTS, dm, lookupSlackIdByEmail, postToChannel, testBot, type Bot } from "@/lib/slack";
import { logAudit } from "@/lib/audit";
import { saveSettings } from "@/lib/settings";
import { splitEntries } from "@/lib/org/stats";

const TABS = ["overview", "projects", "support", "reviewers", "messages", "settings", "log"];

function back(kind: "ok" | "err", msg: string, tab = "overview"): never {
  revalidatePath("/dashboard/org");
  const t = TABS.includes(tab) ? tab : "overview";
  redirect(`/dashboard/org?tab=${t}&${kind}=${encodeURIComponent(msg.slice(0, 300))}`);
}

const str = (fd: FormData, k: string, max: number) =>
  String(fd.get(k) ?? "").trim().slice(0, max);

/** Adds one reviewer. Returns a message instead of redirecting so bulk adds can reuse it. */
async function addOne(raw: string, actor: string): Promise<{ ok: boolean; msg: string }> {
  let email: string | undefined;
  let slackId: string | undefined;

  if (raw.includes("@")) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) return { ok: false, msg: `${raw}: not a valid email` };
    email = raw.toLowerCase();
    slackId = (await lookupSlackIdByEmail(email))?.id;
  } else if (/^[UW][A-Z0-9]{6,}$/i.test(raw)) {
    slackId = raw.toUpperCase();
  } else {
    return { ok: false, msg: `${raw}: use a Slack ID or an email` };
  }

  const key = (slackId ?? email) as string;
  const reviewer: Reviewer = { key, email, slackId, addedBy: actor, addedAt: new Date().toISOString() };

  try {
    await addReviewer(reviewer);
  } catch (e) {
    console.error("addReviewer failed", e);
    return { ok: false, msg: `${raw}: couldn't save (is Redis configured?)` };
  }
  if (slackId) {
    await dm("review", slackId, "You've been added as a Takeoff reviewer. Open the dashboard to start reviewing.");
  }
  await logAudit(actor, "reviewer.add", key);
  return { ok: true, msg: slackId ? key : `${key} (no Slack match, no DM sent)` };
}

export async function addReviewerAction(fd: FormData) {
  const session = await requireRole("org");
  const raw = str(fd, "key", 100);
  if (!raw) back("err", "Enter a Slack ID or an email.", "reviewers");
  const r = await addOne(raw, session.user.id);
  back(r.ok ? "ok" : "err", r.ok ? `Added ${r.msg}.` : r.msg, "reviewers");
}

export async function bulkAddReviewersAction(fd: FormData) {
  const session = await requireRole("org");
  const entries = splitEntries(str(fd, "list", 5000));
  if (entries.length === 0) back("err", "Paste at least one Slack ID or email.", "reviewers");

  const added: string[] = [];
  const failed: string[] = [];
  for (const e of entries) {
    const r = await addOne(e, session.user.id);
    (r.ok ? added : failed).push(r.msg);
  }
  const parts = [`Added ${added.length} of ${entries.length}.`];
  if (failed.length) parts.push(`Problems: ${failed.slice(0, 4).join("; ")}${failed.length > 4 ? "…" : ""}`);
  back(failed.length ? "err" : "ok", parts.join(" "), "reviewers");
}

export async function removeReviewerAction(fd: FormData) {
  const session = await requireRole("org");
  const key = str(fd, "key", 100);
  if (!key) back("err", "Missing reviewer.", "reviewers");
  let failed = false;
  try {
    await removeReviewer(key);
  } catch (e) {
    console.error("removeReviewer failed", e);
    failed = true;
  }
  if (failed) back("err", "Couldn't remove the reviewer.", "reviewers");
  await logAudit(session.user.id, "reviewer.remove", key);
  back("ok", `Removed ${key}.`, "reviewers");
}

export async function postSlackAction(fd: FormData) {
  const session = await requireRole("org");
  const channel = str(fd, "channel", 20) as Bot;
  const text = str(fd, "text", 3000);
  const ping = fd.get("ping") === "on";

  if (!BOTS.includes(channel)) back("err", "Pick a channel.", "messages");
  if (!text) back("err", "Write a message first.", "messages");

  const r = await postToChannel(channel, text, ping);
  if (!r.ok) back("err", `Slack said: ${r.error ?? "unknown error"}`, "messages");

  await logAudit(session.user.id, `slack.post.${channel}`, text.slice(0, 120));
  back("ok", `Posted to the ${channel} channel.`, "messages");
}

export async function dmReviewersAction(fd: FormData) {
  const session = await requireRole("org");
  const text = str(fd, "text", 2000);
  if (!text) back("err", "Write a message first.", "messages");

  const targets = (await listReviewers()).filter((r) => r.slackId).slice(0, 100);
  if (targets.length === 0) back("err", "No reviewers have a linked Slack ID.", "messages");

  let sent = 0;
  for (const r of targets) {
    const res = await dm("review", r.slackId as string, text);
    if (res.ok) sent++;
  }
  await logAudit(session.user.id, "slack.dm_reviewers", `${sent}/${targets.length}: ${text.slice(0, 100)}`);
  back("ok", `Sent to ${sent} of ${targets.length} reviewers.`, "messages");
}

export async function saveSettingsAction(fd: FormData) {
  const session = await requireRole("org");
  const n = Number.parseInt(str(fd, "rsvpCount", 10), 10);
  if (!Number.isFinite(n) || n < 0 || n > 1_000_000) {
    back("err", "RSVP count must be a number from 0 to 1,000,000.", "settings");
  }

  const settings = {
    rsvpCount: n,
    submissionsOpen: fd.get("submissionsOpen") === "on",
    banner: str(fd, "banner", 200),
  };

  let failed = false;
  try {
    await saveSettings(settings);
  } catch (e) {
    console.error("saveSettings failed", e);
    failed = true;
  }
  if (failed) back("err", "Couldn't save settings.", "settings");

  await logAudit(session.user.id, "settings.save", JSON.stringify(settings));
  revalidatePath("/");
  back("ok", "Settings saved.", "settings");
}

export async function checkBotsAction() {
  await requireRole("org");
  const parts: string[] = [];
  for (const bot of BOTS) {
    const r = await testBot(bot);
    parts.push(`${bot}: ${r.ok ? "ok" : (r.error ?? "failed")}`);
  }
  back("ok", parts.join(" · "), "messages");
}
