"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/roles";
import { addReviewer, removeReviewer } from "@/lib/reviewers";

export async function addReviewerAction(formData: FormData) {
  const session = await requireRole("org");
  const key = String(formData.get("key") ?? "").trim();
  if (!key || key.length > 100) return;
  await addReviewer(key, session.user.id);
  revalidatePath("/dashboard/org");
}

export async function removeReviewerAction(formData: FormData) {
  await requireRole("org");
  const key = String(formData.get("key") ?? "").trim();
  if (key) await removeReviewer(key);
  revalidatePath("/dashboard/org");
}