import Link from "next/link";
import { redirect } from "next/navigation";
import { getRoles } from "@/lib/roles";

const card =
  "block rounded-xl border border-slate-700 bg-slate-800/50 p-6 transition-colors hover:border-sky-500";

export default async function Dashboard() {
  const { session, isOrg, isReviewer } = await getRoles();
  if (!session) redirect("/login");

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto w-full max-w-4xl">
        <Link
          href="/"
          className="font-bold tracking-widest text-slate-300 transition-colors hover:text-sky-400"
        >
          TAKEOFF
        </Link>

        <h1 className="mt-8 text-3xl font-bold text-sky-300">
          Hey {session.user.name ?? "there"}
        </h1>
        {session.user.email && (
          <p className="mt-2 text-sm text-slate-400">{session.user.email}</p>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/dashboard/participant" className={card}>
            <h2 className="text-lg font-semibold">Participant dash</h2>
            <p className="mt-1 text-sm text-slate-400">
              Your projects and submissions.
            </p>
          </Link>

          {isReviewer && (
            <Link href="/dashboard/reviewer" className={card}>
              <h2 className="text-lg font-semibold">Reviewer dash</h2>
              <p className="mt-1 text-sm text-slate-400">
                Review submitted projects.
              </p>
            </Link>
          )}

          {isOrg && (
            <Link href="/dashboard/org" className={card}>
              <h2 className="text-lg font-semibold">Org dash</h2>
              <p className="mt-1 text-sm text-slate-400">
                Manage reviewers and the program.
              </p>
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}