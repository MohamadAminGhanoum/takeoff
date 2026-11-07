"use server";

import { revalidatePath } from "next/cache";
import { broadcastReviewEvent, broadcastShippedProject } from "@/lib/sidekick/slack";

export async function updateShipStatus(projectId: string, nextStatus: "approved" | "rejected", mockReviewerId = "admin-node-01") {
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

    if (!res.ok) throw new Error(`Backend server pipeline threw code: ${res.status}`);

    const lookup = await fetch(`${baseUrl}/api/sidekick`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.SIDEKICK_SECRET}`,
      },
      body: JSON.stringify({ action: "GET_PROJECT_BY_ID", input: { id: projectId } }),
    });

    if (lookup.ok) {
      const project = await lookup.json();
      const title = project.title || "Untitled Blueprint";
      
      await broadcastReviewEvent(
        title, 
        mockReviewerId, 
        nextStatus, 
        nextStatus === "approved" ? "Code verified against schema parameters. Verified to ship." : "Compliance audit failed. Insufficient project metrics."
      );

      if (nextStatus === "approved") {
        await broadcastShippedProject(title, project.authorId, project.codeUrl || "https://github.com");
      }
    }

    revalidatePath(`/dashboard`);
    revalidatePath(`/dashboard/reviewer`);
    revalidatePath(`/dashboard/${projectId}`);

    return { success: true };
  } catch (error) {
    console.error("[Server Mutation Link Error] Multi-bot event broadcast halted:", error);
    return { success: false, error: "Fulfillment transaction failed." };
  }
}
