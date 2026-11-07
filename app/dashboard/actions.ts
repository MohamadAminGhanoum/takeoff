"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/roles";

export async function updateShipStatus(
  projectId: string,
  nextStatus: "approved" | "rejected"
) {
  await requireRole("reviewer");

  if (typeof projectId !== "string" || !projectId) {
    return { success: false, error: "Invalid project." };
  }
  if (nextStatus !== "approved" && nextStatus !== "rejected") {
    return { success: false, error: "Invalid status." };
  }

  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

  try {
    const res = await fetch(`${baseUrl}/api/sidekick`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SIDEKICK_SECRET}`,
      },
      body: JSON.stringify({
        action: nextStatus === "approved" ? "APPROVE_PROJECT" : "REJECT_PROJECT",
        input: { id: projectId },
      }),
    });

    if (!res.ok) {
      throw new Error(`Backend returned status code: ${res.status}`);
    }

    revalidatePath(`/dashboard`);
    revalidatePath(`/dashboard/reviewer`);
    revalidatePath(`/dashboard/${projectId}`);

    return { success: true };
  } catch (error) {
    console.error("[Server Action Error] Status update failed:", error);
    return { success: false, error: "Failed to submit evaluation to Sidekick." };
  }
}