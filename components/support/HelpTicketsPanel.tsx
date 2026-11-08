import type { Failure } from "@/lib/nephthys/client";
import { isSlackId, ticketsForAuthor, type HelpTicket } from "@/lib/nephthys/summary";
import { fmtAge, fmtDate } from "@/lib/org/format";

type TicketsResult = { ok: true; tickets: HelpTicket[] } | Failure;

const STATUS = { open: "Open", in_progress: "In progress", closed: "Closed" } as const;
const TONE = { open: "text-amber-300", in_progress: "text-slate-300", closed: "text-slate-500" } as const;

/** Help-channel tickets opened by a project's author. Hidden when Nephthys isn't set up. */
export default function HelpTicketsPanel({ authorId, result }: { authorId: string; result: TicketsResult }) {
  if (!result.ok && result.reason === "not_configured") return null;

  let body: React.ReactNode;
  if (!result.ok) {
    body = <p className="text-slate-400">{result.message}</p>;
  } else if (!isSlackId(String(authorId).trim())) {
    body = <p className="text-slate-400">This author&apos;s ID isn&apos;t a Slack ID, so help tickets can&apos;t be matched.</p>;
  } else {
    const mine = ticketsForAuthor(result.tickets, authorId);
    const openCount = mine.filter((t) => t.status !== "closed").length;
    body =
      mine.length === 0 ? (
        <p className="text-slate-400">No help tickets from this author (open ones, or any from the last 60 days).</p>
      ) : (
        <>
          <p className="mb-2 text-xs text-slate-500">
            {mine.length} ticket{mine.length === 1 ? "" : "s"}, {openCount} still open
          </p>
          <ul className="divide-y divide-slate-800">
            {mine.slice(0, 8).map((t) => (
              <li key={t.id} className="flex flex-wrap items-baseline gap-x-3 py-1.5">
                <span className={`w-20 shrink-0 text-xs font-medium ${TONE[t.status]}`}>{STATUS[t.status]}</span>
                <span className="min-w-0 flex-1 text-slate-200">
                  <span className="tabular-nums text-slate-500">#{t.id}</span> {t.title || "(no title)"}
                  {t.category && <span className="ml-2 text-xs text-slate-500">{t.category}</span>}
                </span>
                <span className="text-xs tabular-nums text-slate-500">
                  {fmtDate(t.createdAt)}
                  {t.status !== "closed" && ` · ${fmtAge(t.createdAt)}`}
                </span>
              </li>
            ))}
          </ul>
        </>
      );
  }

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 text-sm">
      <h2 className="mb-2 text-base font-semibold text-slate-100">Help tickets from this author</h2>
      {body}
    </section>
  );
}
