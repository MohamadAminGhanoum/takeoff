import { requireRole } from "@/lib/roles";

export default async function OrgLayout({ children }: { children: React.ReactNode }) {
  await requireRole("org");
  return <>{children}</>;
}