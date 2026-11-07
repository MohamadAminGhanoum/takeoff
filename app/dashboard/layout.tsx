import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      <Sidebar
        user={{
          name: session.user.name ?? "Hacker",
          email: session.user.email ?? "",
          image: session.user.image ?? null,
        }}
      />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}