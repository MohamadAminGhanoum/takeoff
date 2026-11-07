import Link from "next/link";
import { requireRole } from "@/lib/roles";
import { listReviewers } from "@/lib/reviewers";
import { addReviewerAction, removeReviewerAction } from "./actions";

export default async function OrgDash() {
  await requireRole("org");
  const reviewers = await listReviewers();

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto w-full max-w-2xl">
        <Link
          href="/dashboard"
          className="text-sm text-slate-400 transition-colors hover:text-sky-400"
        >
          ← Back to dashboard
        </Link>

        <h1 className="mt-6 text-3xl font-bold text-sky-300">Org dash</h1>

        <h2 className="mt-10 text-lg font-semibold">Reviewers</h2>
        <p className="mt-1 text-sm text-slate-400">
          Add someone by Slack ID (e.g. U0123ABC) or email. They get reviewer
          access the next time they sign in.
        </p>

        <form action={addReviewerAction} className="mt-4 flex gap-2">
          <input
            name="key"
            placeholder="Slack ID or email"
            required
            maxLength={100}
            className="flex-1 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-md bg-sky-500 px-4 py-2 font-semibold text-white transition-colors hover:bg-sky-400"
          >
            Add
          </button>
        </form>

        <ul className="mt-6 space-y-2">
          {reviewers.map((r) => (
            <li
              key={r.key}
              className="flex items-center justify-between rounded-md border border-slate-700 bg-slate-800/50 px-4 py-3"
            >
              <div>
                <div className="font-medium">{r.key}</div>
                <div className="text-xs text-slate-500">
                  added {new Date(r.addedAt).toLocaleDateString()}
                </div>
              </div>
              <form action={removeReviewerAction}>
                <input type="hidden" name="key" value={r.key} />
                <button
                  type="submit"
                  className="text-sm text-slate-400 transition-colors hover:text-red-400"
                >
                  Remove
                </button>
              </form>
            </li>
          ))}
          {reviewers.length === 0 && (
            <li className="text-sm text-slate-500">No reviewers yet.</li>
          )}
        </ul>
      </div>
    </main>
  );
}