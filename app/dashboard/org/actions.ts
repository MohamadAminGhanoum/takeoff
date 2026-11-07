"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/roles";
import { addReviewer, removeReviewer, listReviewers, type Reviewer } from "@/lib/reviewers";
import { BOTS, dm, lookupSlackIdByEmail, postToChannel, testBot, type Bot } from "@/lib/slack";
import { logAudit } from "@/lib/audit";
import { saveSettings } from "@/lib/settings";

function back(kind: "ok" | "err", msg: string): never {
  revalidatePath("/dashboard/org");
  redirect(`/dashboard/org?${kind}=${encodeURIComponent(msg.slice(0, 300))}`);
}

const str = (fd: FormData, k: string, max: number) =>
  String(fd.get(k) ?? "").trim().slice(0, max);

export async function addReviewerAction(fd: FormData) {
  const session = await requireRole("org");
  const raw = str(fd, "key", 100);
  if (!raw) back("err", "Enter a Slack ID or an email.");

  let email: string | undefined;
  let slackId: string | undefined;

  if (raw.includes("@")) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) back("err", "That email doesn't look valid.");
    email = raw.toLowerCase();
    const found = await lookupSlackIdByEmail(email);
    slackId = found?.id;
  } else if (/^[UW][A-Z0-9]{6,}$/i.test(raw)) {
    slackId = raw.toUpperCase();
  } else {
    back("err", "Use a Slack ID (like U0123ABC) or an email.");
  }

  const key = (slackId ?? email) as string;
  const reviewer: Reviewer = {
    key,
    email,
    slackId,
    addedBy: session.user.id,
    addedAt: new Date().toISOString(),
  };

  let failed = false;
  try {
    await addReviewer(reviewer);
  } catch (e) {
    console.error("addReviewer failed", e);
    failed = true;
  }
  if (failed) back("err", "Couldn't save the reviewer (is Redis configured?).");

  if (slackId) {
    await dm("review", slackId, "You've been added as a Takeoff reviewer. Open the dashboard to start reviewing.");
  }
  await logAudit(session.user.id, "reviewer.add", key);
  back(
    "ok",
    slackId
      ? `Added ${key}.`
      : `Added ${key}, but no Slack account matched that email, so no DM was sent.`
  );
}

export async function removeReviewerAction(fd: FormData) {
  const session = await requireRole("org");
  const key = str(fd, "key", 100);
  if (!key) back("err", "Missing reviewer.");
  let failed = false;
  try {
    await removeReviewer(key);
  } catch (e) {
    console.error("removeReviewer failed", e);
    failed = true;
  }
  if (failed) back("err", "Couldn't remove the reviewer.");
  await logAudit(session.user.id, "reviewer.remove", key);
  back("ok", `Removed ${key}.`);
}

export async function postSlackAction(fd: FormData) {
  const session = await requireRole("org");
  const channel = str(fd, "channel", 20) as Bot;
  const text = str(fd, "text", 3000);
  const ping = fd.get("ping") === "on";

  if (!BOTS.includes(channel)) back("err", "Pick a channel.");
  if (!text) back("err", "Write a message first.");

  const r = await postToChannel(channel, text, ping);
  if (!r.ok) back("err", `Slack said: ${r.error ?? "unknown error"}`);

  await logAudit(session.user.id, `slack.post.${channel}`, text.slice(0, 120));
  back("ok", `Posted to the ${channel} channel.`);
}

export async function dmReviewersAction(fd: FormData) {
  const session = await requireRole("org");
  const text = str(fd, "text", 2000);
  if (!text) back("err", "Write a message first.");

  const targets = (await listReviewers()).filter((r) => r.slackId).slice(0, 100);
  if (targets.length === 0) back("err", "No reviewers have a linked Slack ID.");

  let sent = 0;
  for (const r of targets) {
    const res = await dm("review", r.slackId as string, text);
    if (res.ok) sent++;
  }
  await logAudit(session.user.id, "slack.dm_reviewers", `${sent}/${targets.length}: ${text.slice(0, 100)}`);
  back("ok", `Sent to ${sent} of ${targets.length} reviewers.`);
}

export async function saveSettingsAction(fd: FormData) {
  const session = await requireRole("org");
  const n = Number.parseInt(str(fd, "rsvpCount", 10), 10);
  if (!Number.isFinite(n) || n < 0 || n > 1_000_000) back("err", "RSVP count must be a number from 0 to 1,000,000.");

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
  if (failed) back("err", "Couldn't save settings.");

  await logAudit(session.user.id, "settings.save", JSON.stringify(settings));
  revalidatePath("/");
  back("ok", "Settings saved.");
}

export async function checkBotsAction() {
  await requireRole("org");
  const parts: string[] = [];
  for (const bot of BOTS) {
    const r = await testBot(bot);
    parts.push(`${bot}: ${r.ok ? "ok" : (r.error ?? "failed")}`);
  }
  back("ok", parts.join(" · "));
}