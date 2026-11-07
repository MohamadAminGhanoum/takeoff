import { auth } from "@/auth";
import Link from "next/link";

export default async function DashboardHome() {
  const session = await auth();
  const firstName = session?.user?.name?.split(" ")[0] ?? "hacker";

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-3xl font-bold">
        Welcome back, {firstName} 
      </h1>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <div className="text-xs uppercase tracking-widest text-sky-400">
            Design hours
          </div>
          <div className="mt-2 text-3xl font-bold">0</div>
          <p className="text-xs text-slate-500 mt-1">via Hackatime</p>
        </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <div className="text-xs uppercase tracking-widest text-sky-400">
            Build hours
          </div>
          <div className="mt-2 text-3xl font-bold">0</div>
          <p className="text-xs text-slate-500 mt-1">from journals</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <div className="text-xs uppercase tracking-widest text-sky-400">
            Projects
          </div>
          <div className="mt-2 text-3xl font-bold">0</div>
          <p className="text-xs text-slate-500 mt-1">shipped</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <div className="text-xs uppercase tracking-widest text-sky-400">
            Coins
          </div>
          <div className="mt-2 text-3xl font-bold">0</div>
          <p className="text-xs text-slate-500 mt-1">that you can spend in the shop</p>
        </div>
      </div>

      {/* Get started cards */}
      <h2 className="mt-12 text-xl font-bold text-sky-300">Get started</h2>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/dashboard/projects"
          className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 hover:border-sky-500 transition-colors"
        >
          <div className="text-2xl">🛩️</div>
          <h3 className="mt-2 font-semibold">Start a project</h3>
          <p className="mt-1 text-sm text-slate-400">
            Create your a new project.
          </p>
        </Link>
      </div>
    </div>
  );
}