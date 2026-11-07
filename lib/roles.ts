import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isReviewerRecord } from "@/lib/reviewers";

const parse = (v?: string) =>
  new Set((v ?? "").split(",").map((s) => s.trim()).filter(Boolean));

export async function getRoles() {
  const session = await auth();
  const id = session?.user.id;
  console.log("MY ID:", id);

  const isOrg = !!id && parse(process.env.ORG_IDS).has(id);

  let isReviewer = isOrg || (!!id && parse(process.env.REVIEWER_IDS).has(id));
  if (!isReviewer && session) {
    isReviewer = await isReviewerRecord([
      session.user.slack_id,
      session.user.email ?? undefined,
    ]);
  }

  return { session, isOrg, isReviewer };
}

export async function requireRole(role: "reviewer" | "org") {
  const { session, isOrg, isReviewer } = await getRoles();
  if (!session) redirect("/login");
  if (role === "org" ? !isOrg : !isReviewer) redirect("/dashboard");
  return session;
}
export async function requireSignedIn() {
  const session = await auth();
  if (!session) redirect("/login");
  return session;
}