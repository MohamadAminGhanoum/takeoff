import { auth } from "@/auth";

const HC = "https://auth.hackclub.com";

export type HCIdentity = {
  id: string;
  first_name?: string;
  last_name?: string;
  primary_email?: string;
  slack_id?: string;
  verification_status?: "needs_submission" | "pending" | "verified" | "ineligible";
  ysws_eligible?: boolean;
};

export async function getMe(): Promise<{ identity: HCIdentity; scopes: string[] } | null> {
  const session = await auth();
  if (!session?.accessToken || session.error) return null;

  const res = await fetch(`${HC}/api/v1/me`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

export async function checkVerification(params: { email?: string; slack_id?: string; idv_id?: string }) {
  const qs = new URLSearchParams(params as Record<string, string>);
  const res = await fetch(`${HC}/api/external/check?${qs}`, { cache: "no-store" });
  if (!res.ok) return null;
  return (await res.json()) as { result: string };
}