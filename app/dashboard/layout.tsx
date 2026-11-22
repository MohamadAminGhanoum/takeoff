import { redirect } from "next/navigation";
import { getRoles } from "@/lib/roles";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session } = await getRoles();
  if (!session) redirect("/login");

  return <>{children}</>;
}