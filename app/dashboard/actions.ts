"use server";

import { revalidatePath } from "next/cache";
import { sendSlackNotification } from "@/lib/sidekick/slack";

export async function updateShipStatus(projectId: string, nextStatus: "approved" | "rejected") {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

  try {
    const res = await fetch(`${baseUrl}/api/sidekick`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.SIDEKICK_SECRET}`,
      },
      body: JSON.stringify({
        action: nextStatus === "approved" ? "APPROVE_PROJECT" : "REJECT_PROJECT",
        input: { id: projectId },
      }),
    });

    if (!res.ok) {
      throw new Error(`Backend returned status code: ${res.status}`);
    }

    const projectInfoRes = await fetch(`${baseUrl}/api/sidekick`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.SIDEKICK_SECRET}`,
      },
      body: JSON.stringify({ action: "GET_PROJECT_BY_ID", input: { id: projectId } }),
    });

    if (projectInfoRes.ok) {
      const project = await projectInfoRes.json()

      await sendSlackNotification(
        nextStatus === "approved" ? "PROJECT_APPROVAL_COMMITTED" : "PROJECT_DECLINE_COMMITTED",
        {
          title: project.title || "Unknown Title",
          authorId: project.authorId || "Unknown Author",
          hours: project.ships?.[0]?.hoursSubmitted || 0
        }
      );
    }

    revalidatePath(`/dashboard`);
    revalidatePath(`/dashboard/reviewer`);
    revalidatePath(`/dashboard/${projectId}`);

    return { success: true };
  } catch (error) {
    console.error("[Server Action Error] Status update or Slack broadcast failure:", error);
    return { success: false, error: "Failed to submit evaluation to Sidekick." };
  }
}
