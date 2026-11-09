import Link from "next/link";
import type { ReactNode } from "react";
import type { Failure } from "@/lib/nephthys/client";
import {
  countLinked,
  fmtChange,
  fmtMinutes,
  projectsForTicket,
  type HelpTicket,
  type Period,
  type SupportStats,
} from "@/lib/nephthys/summary";
import { fmtAge } from "@/lib/org/format";
import type { Project } from "@/lib/sidekick/types";

type StatsResult = { ok: true; stats: SupportStats } | Failure;
type TicketsResult = { ok: true; tickets: HelpTicket[] } | Failure;

const th = "border-b border-slate-700 px-2 py-1.5 text-left text-[11px] font-medium uppercase tracking-wide text-slate-500";
const td = "border-b border-slate-800 px-2 py-1.5 align-middle";

function Panel({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="border border-slate-800">
      <header className="flex items-baseline justify-between gap-3 border-b border-slate-800 px-3 py-2">
        <h2 className="text-[13px] font-semibold text-slate-200">{title}</h2>
        {note && <p className="text-xs text-slate-500">{note}</p>}
      </header>
      <div className="p-3">{children}</div>
    </section>
  );
}

function Stat({ label, value, tone }: { label: string; value: ReactNode; tone?: string }) {
  return (
    <div className="border-r border-slate-800 px-3 py-2 last:border-r-0">
      <div className={`text-xl font-semibold tabular-nums ${tone ?? "text-slate-100"}`}>{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
    </div>
  );
}

const slackLink = (id: string) => (
  <a
    href={`https://hackclub.slack.com/team/${id}`}
    target="_blank"
    rel="noopener noreferrer"
    className="font-mono text-xs text-sky-400 hover:underline"
  >
    {id}
  </a>
);

function PeriodTable({ title, now, prev }: { title: string; now: Period; prev: Period }) {
  const rows: [string, number | null, number | null, boolean][] = [
    ["New tickets", now.newTickets, prev.newTickets, false],
    ["Closed", now.closed, prev.closed, false],
    ["Still open", now.stillOpen, prev.stillOpen, false],
    ["Avg first reply", now.meanFirstResponseMin, prev.meanFirstResponseMin, true],
    ["Avg time to resolve", now.meanResolutionMin, prev.meanResolutionMin, true],
  ];
  return (
    <Panel title={title} note="Compared with the period before">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={th}>Metric</th>
            <th className={`${th} text-right`}>Now</th>
            <th className={`${th} text-right`}>Before</th>
            <th className={`${th} text-right`}>Change</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, a, b, isTime]) => (
            <tr key={label}>
              <td className={td}>{label}</td>
              <td className={`${td} text-right tabular-nums`}>{isTime ? fmtMinutes(a) : a}</td>
              <td className={`${td} text-right tabular-nums text-slate-500`}>{isTime ? fmtMinutes(b) : b}</td>
              <td className={`${td} text-right tabular-nums text-slate-400`}>{fmtChange(a, b)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

export default function SupportTab({
  stats,
  tickets,
  projects,
  projectsOk,
}: {
  stats: StatsResult;
  tickets: TicketsResult;
  projects: Project[];
  projectsOk: boolean;
}) {
  if (!stats.ok && stats.reason === "not_configured") {
    return (
      <Panel title="Connect Nephthys" note="Not set up yet">
        <div className="max-w-xl space-y-2 text-slate-300">
          <p>
            This tab shows help-channel numbers from a Nephthys instance (the Slack support bot). Once someone has Nephthys
            running for Takeoff, set one variable in <code className="font-mono text-slate-100">.env.local</code> and in Vercel:
          </p>
          <pre className="border border-slate-800 bg-slate-900 px-3 py-2 font-mono text-xs text-slate-200">
            NEPHTHYS_URL=https://your-instance.nephthys.hackclub.com
          </pre>
          <p className="text-slate-400">
            Takeoff only reads counts, titles and tags. It never asks for message text. Setup steps are in{" "}
            <code className="font-mono text-slate-300">docs/nephthys.md</code>.
          </p>
        </div>
      </Panel>
    );
  }

  if (!stats.ok) {
    return <p className="border border-rose-800 bg-rose-950/40 px-3 py-2 text-rose-200">{stats.message}</p>;
  }

  const s = stats.stats;
  const open = tickets.ok
    ? tickets.tickets
        .filter((t) => t.status !== "closed")
        .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
    : [];
  const shown = open.slice(0, 50);
  const linked = projectsOk ? countLinked(projects, shown) : 0;

  return (
    <>
      <div className="grid grid-cols-2 border border-slate-800 sm:grid-cols-4 lg:grid-cols-7">
        <Stat label="Open" value={s.open} tone={s.open > 0 ? "text-amber-300" : undefined} />
        <Stat label="In progress" value={s.inProgress} />
        <Stat label="Closed" value={s.closed} />
        <Stat label="All tickets" value={s.total} />
        <Stat label="Avg first reply" value={fmtMinutes(s.meanFirstResponseMin)} />
        <Stat label="Avg to resolve" value={fmtMinutes(s.meanResolutionMin)} />
        <Stat
          label="Oldest unanswered"
          tone={s.oldestUnanswered && s.oldestUnanswered.ageMin > 2880 ? "text-rose-300" : undefined}
          value={
            s.oldestUnanswered ? (
              s.oldestUnanswered.link ? (
                <a href={s.oldestUnanswered.link} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  {fmtMinutes(s.oldestUnanswered.ageMin)}
                </a>
              ) : (
                fmtMinutes(s.oldestUnanswered.ageMin)
              )
            ) : (
              "none"
            )
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <PeriodTable title="Past 24 hours" now={s.day.now} prev={s.day.prev} />
        <PeriodTable title="Past 7 days" now={s.week.now} prev={s.week.prev} />
      </div>

      {s.leaderboard.length > 0 && (
        <Panel title="Top helpers" note="Tickets closed, all time">
          <table className="w-full max-w-md border-collapse">
            <tbody>
              {s.leaderboard.map((r, i) => (
                <tr key={r.slackId}>
                  <td className={`${td} w-8 tabular-nums text-slate-500`}>{i + 1}</td>
                  <td className={td}>{slackLink(r.slackId)}</td>
                  <td className={`${td} text-right tabular-nums`}>{r.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}

      <Panel title="Tickets waiting" note="Open and in progress, oldest first">
        {!tickets.ok ? (
          <p className="text-slate-400">{tickets.message}</p>
        ) : shown.length === 0 ? (
          <p className="text-slate-500">No open tickets.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse">
              <thead>
                <tr>
                  <th className={th}>Ticket</th>
                  <th className={th}>Status</th>
                  <th className={th}>Opened by</th>
                  <th className={th}>Category</th>
                  <th className={th}>Age</th>
                  <th className={th}>Project</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((t) => {
                  const ps = projectsForTicket(projects, t);
                  return (
                    <tr key={t.id} className="hover:bg-slate-900">
                      <td className={`${td} max-w-[18rem]`}>
                        <span className="tabular-nums text-slate-500">#{t.id}</span>{" "}
                        <span className="text-slate-200">{t.title || "(no title)"}</span>
                        {t.teamTags.length > 0 && <span className="ml-2 text-xs text-slate-500">{t.teamTags.join(", ")}</span>}
                      </td>
                      <td className={`${td} ${t.status === "open" ? "text-amber-300" : "text-slate-300"}`}>
                        {t.status === "open" ? "Open" : "In progress"}
                      </td>
                      <td className={td}>{t.openedBy ? slackLink(t.openedBy) : <span className="text-slate-600">–</span>}</td>
                      <td className={`${td} text-slate-400`}>{t.category ?? "–"}</td>
                      <td className={`${td} whitespace-nowrap tabular-nums text-slate-400`}>{fmtAge(t.createdAt)}</td>
                      <td className={td}>
                        {ps.length === 0 ? (
                          <span className="text-slate-600">–</span>
                        ) : (
                          ps.slice(0, 2).map((p) => (
                            <Link key={p.id} href={`/dashboard/reviewer/${p.id}`} className="mr-2 text-sky-400 hover:underline">
                              {p.title || p.id}
                            </Link>
                          ))
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {tickets.ok && open.length > shown.length && (
          <p className="mt-2 text-xs text-slate-500">Showing the oldest {shown.length} of {open.length}.</p>
        )}
        {tickets.ok && projectsOk && shown.length > 0 && (
          <p className="mt-2 text-xs text-slate-500">
            {linked} of {shown.length} matched a project. A ticket is matched by the opener&apos;s Slack ID, so this only works for
            projects whose author ID is a Slack ID.
          </p>
        )}
      </Panel>
    </>
  );
}
