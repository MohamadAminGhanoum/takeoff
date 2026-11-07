import { redirect } from "next/navigation";
import { auth } from "@/auth";

const parse = (v?: string) =>
  new Set((v ?? "").split(",").map((s) => s.trim()).filter(Boolean));

export async function getRoles() {
  const session = await auth();
  const id = session?.user.id;
  const isOrg = !!id && parse(process.env.ORG_IDS).has(id);
  const isReviewer = isOrg || (!!id && parse(process.env.REVIEWER_IDS).has(id));
  return { session, isOrg, isReviewer };
}

export async function requireRole(role: "reviewer" | "org") {
  const { session, isOrg, isReviewer } = await getRoles();
  if (!session) redirect("/login");
  if (role === "org" ? !isOrg : !isReviewer) redirect("/dashboard");
  return session;
}