"use server";

import { revalidatePath } from "next/cache";

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

    if (!res.ok) throw new Error(`Backend server pipeline threw code: ${res.status}`);

    revalidatePath(`/dashboard`);
    revalidatePath(`/dashboard/reviewer`);
    revalidatePath(`/dashboard/${projectId}`);

    return { success: true };
  } catch (error) {
    console.error("[Server Mutation Error] Status update failed:", error);
    return { success: false, error: "Fulfillment transaction failed." };
  }
}
