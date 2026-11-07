import { requireRole } from "@/lib/roles";

export default async function ReviewerLayout({ children }: { children: React.ReactNode }) {
  await requireRole("reviewer");
  return <>{children}</>;
}