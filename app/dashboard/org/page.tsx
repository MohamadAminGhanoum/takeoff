import Link from "next/link";
import type { ReactNode } from "react";
import { requireRole } from "@/lib/roles";
import { listReviewers, type Reviewer } from "@/lib/reviewers";
import { listAudit, type AuditEntry } from "@/lib/audit";
import { getSettings } from "@/lib/settings";
import { BOTS, BOT_LABEL, botStatus } from "@/lib/slack";
import { fetchProjects } from "@/lib/org/projects";
import { loadStats, loadTickets } from "@/lib/nephthys/client";
import SupportTab from "@/components/support/SupportTab";
import { fmtAge, fmtDate, fmtDateTime } from "@/lib/org/format";
import {
  PAGE_SIZE,
  auditCategory,
  dailyBuckets,
  filterAudit,
  filterProjects,
  filterReviewers,
  groupStatus,
  latestHours,
  latestSubmitted,
  paginate,
  parseAuditQuery,
  parseProjectQuery,
  projectStatus,
  statusCounts,
  waitingLongest,
  weeklyBuckets,
} from "@/lib/org/stats";
import type { Project, ShipStatus } from "@/lib/sidekick/types";
import BarChart from "@/components/org/BarChart";
import Shortcuts from "@/components/org/Shortcuts";
import {
  addReviewerAction,
  bulkAddReviewersAction,
  removeReviewerAction,
  postSlackAction,
  dmReviewersAction,
  saveSettingsAction,
  checkBotsAction,
} from "./actions";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "projects", label: "Projects" },
  { key: "support", label: "Support" },
  { key: "reviewers", label: "Reviewers" },
  { key: "messages", label: "Messages" },
  { key: "settings", label: "Settings" },
  { key: "log", label: "Log" },
] as const;
type Tab = (typeof TABS)[number]["key"];

type SP = Record<string, string | undefined>;

const field =
  "w-full border border-slate-700 bg-slate-950 px-2 py-1.5 text-[13px] text-slate-100 placeholder:text-slate-600 focus:border-slate-400 focus:outline-none";
const btn =
  "border border-slate-600 bg-slate-800 px-3 py-1.5 text-[13px] text-slate-100 hover:bg-slate-700";
const btnPrimary =
  "border border-sky-600 bg-sky-700 px-3 py-1.5 text-[13px] text-white hover:bg-sky-600";
const th = "border-b border-slate-700 px-2 py-1.5 text-left text-[11px] font-medium uppercase tracking-wide text-slate-500";
const td = "border-b border-slate-800 px-2 py-1.5 align-middle";
const rowCls = "data-[selected=true]:bg-slate-800 hover:bg-slate-900";

const STATUS_LABEL: Record<ShipStatus, string> = {
  pending: "Pending",
  pending_hq: "Pending HQ",
  approved: "Approved",
  rejected: "Rejected",
};
const STATUS_COLOR: Record<ShipStatus, string> = {
  pending: "text-amber-300",
  pending_hq: "text-amber-300",
  approved: "text-emerald-300",
  rejected: "text-rose-300",
};

function href(tab: Tab, params: SP = {}) {
  const u = new URLSearchParams({ tab });
  for (const [k, v] of Object.entries(params)) if (v) u.set(k, v);
  return `/dashboard/org?${u.toString()}`;
}

function Panel({ title, note, right, children }: { title: string; note?: string; right?: ReactNode; children: ReactNode }) {
  return (
    <section className="border border-slate-800">
      <header className="flex items-baseline justify-between gap-3 border-b border-slate-800 px-3 py-2">
        <h2 className="text-[13px] font-semibold text-slate-200">{title}</h2>
        {right ?? (note && <p className="text-xs text-slate-500">{note}</p>)}
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

export default async function OrgDash({ searchParams }: { searchParams: Promise<SP> }) {
  await requireRole("org");
  const sp = await searchParams;
  const tab: Tab = TABS.some((t) => t.key === sp.tab) ? (sp.tab as Tab) : "overview";

  const [reviewers, settings, audit, projectData] = await Promise.all([
    listReviewers().catch(() => [] as Reviewer[]),
    getSettings(),
    listAudit(200).catch(() => [] as AuditEntry[]),
    fetchProjects(),
  ]);
  const { ok: projectsOk, projects } = projectData;

  // Only talk to Nephthys when the Support tab is open.
  const [supportStats, supportTickets] =
    tab === "support" ? await Promise.all([loadStats(), loadTickets()]) : [null, null];

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-4 text-[13px] text-slate-200">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <div className="flex items-baseline gap-3">
            <Link href="/dashboard" className="text-xs text-slate-500 hover:text-slate-300">
              ← Dashboard
            </Link>
            <h1 className="text-base font-semibold text-slate-100">Org</h1>
          </div>
          <Shortcuts />
        </div>

        <nav className="mt-2 flex flex-wrap gap-1 border-b border-slate-800" aria-label="Org sections">
          {TABS.map((t, i) => (
            <Link
              key={t.key}
              href={href(t.key)}
              data-tab-key={i + 1}
              aria-current={tab === t.key ? "page" : undefined}
              className={`-mb-px border-b-2 px-3 py-1.5 ${
                tab === t.key
                  ? "border-sky-400 text-slate-100"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              {t.label}
              {t.key === "projects" && projectsOk ? (
                <span className="ml-1.5 text-xs tabular-nums text-slate-500">{statusCounts(projects).pending}</span>
              ) : null}
            </Link>
          ))}
        </nav>

        {sp.ok && <p className="mt-3 border border-emerald-800 bg-emerald-950/40 px-3 py-2 text-emerald-200">{sp.ok}</p>}
        {sp.err && <p className="mt-3 border border-rose-800 bg-rose-950/40 px-3 py-2 text-rose-200">{sp.err}</p>}

        <div className="mt-4 space-y-4">
          {tab === "overview" && (
            <Overview projects={projects} projectsOk={projectsOk} reviewers={reviewers} settings={settings} audit={audit} />
          )}
          {tab === "projects" && <ProjectsTab projects={projects} projectsOk={projectsOk} sp={sp} />}
          {tab === "support" && supportStats && supportTickets && (
            <SupportTab stats={supportStats} tickets={supportTickets} projects={projects} projectsOk={projectsOk} />
          )}
          {tab === "reviewers" && <ReviewersTab reviewers={reviewers} q={(sp.q ?? "").trim().slice(0, 100)} />}
          {tab === "messages" && <MessagesTab />}
          {tab === "settings" && <SettingsTab settings={settings} />}
          {tab === "log" && <LogTab audit={audit} sp={sp} />}
        </div>
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ */

function NoProjects() {
  return (
    <p className="border border-slate-800 px-3 py-2 text-slate-400">
      Project data isn&apos;t connected, so project numbers are empty. Reviewers, settings and messages still work.
    </p>
  );
}

function Overview({
  projects,
  projectsOk,
  reviewers,
  settings,
  audit,
}: {
  projects: Project[];
  projectsOk: boolean;
  reviewers: Reviewer[];
  settings: Awaited<ReturnType<typeof getSettings>>;
  audit: AuditEntry[];
}) {
  const c = statusCounts(projects);
  const decided = c.approved + c.rejected;
  const rate = decided > 0 ? `${Math.round((c.approved / decided) * 100)}%` : "–";
  const dates = projects.flatMap((p) => p.ships.map((s) => s.submittedAt));
  const hoursTotal = projects.reduce((n, p) => n + (projectStatus(p) === "approved" ? latestHours(p) : 0), 0);
  const waiting = waitingLongest(projects, 6);
  const now = new Date();

  return (
    <>
      {!projectsOk && <NoProjects />}

      <div className="grid grid-cols-2 border border-slate-800 sm:grid-cols-4 lg:grid-cols-8">
        <Stat label="Waiting" value={c.pending} tone={c.pending > 0 ? "text-amber-300" : undefined} />
        <Stat label="At HQ" value={c.pendingHq} />
        <Stat label="Approved" value={c.approved} />
        <Stat label="Rejected" value={c.rejected} />
        <Stat label="Approve rate" value={rate} />
        <Stat label="Hours approved" value={hoursTotal.toLocaleString("en-US")} />
        <Stat label="Reviewers" value={reviewers.length} />
        <Stat
          label="Submissions"
          value={settings.submissionsOpen ? "Open" : "Closed"}
          tone={settings.submissionsOpen ? "text-emerald-300" : "text-rose-300"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Submissions per week" note="Last 10 weeks, weeks start Monday (UTC)">
          <BarChart data={weeklyBuckets(dates, now, 10)} label="Submissions per week" />
        </Panel>
        <Panel title="Submissions per day" note="Last 14 days (UTC)">
          <BarChart data={dailyBuckets(dates, now, 14)} label="Submissions per day" />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="Waiting longest"
          right={
            <Link href={href("projects", { status: "pending", sort: "oldest" })} className="text-xs text-sky-400 hover:underline">
              See all
            </Link>
          }
        >
          {waiting.length === 0 ? (
            <p className="text-slate-500">Nothing waiting.</p>
          ) : (
            <table className="w-full border-collapse">
              <tbody>
                {waiting.map((p) => (
                  <tr key={p.id} data-row-href={`/dashboard/reviewer/${p.id}`} className={rowCls}>
                    <td className={td}>
                      <Link href={`/dashboard/reviewer/${p.id}`} className="text-sky-400 hover:underline">
                        {p.title}
                      </Link>
                    </td>
                    <td className={`${td} text-right tabular-nums text-slate-400`}>{latestHours(p)}h</td>
                    <td className={`${td} w-16 text-right tabular-nums text-amber-300`}>{fmtAge(latestSubmitted(p), now)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>

        <Panel
          title="Recent activity"
          right={
            <Link href={href("log")} className="text-xs text-sky-400 hover:underline">
              See all
            </Link>
          }
        >
          {audit.length === 0 ? (
            <p className="text-slate-500">Nothing yet.</p>
          ) : (
            <ul className="divide-y divide-slate-800">
              {audit.slice(0, 6).map((a, i) => (
                <li key={i} className="flex gap-2 py-1">
                  <span className="w-24 shrink-0 tabular-nums text-slate-500">{fmtDateTime(a.at)}</span>
                  <span className="shrink-0 font-mono text-xs text-slate-300">{a.action}</span>
                  <span className="min-w-0 truncate text-slate-400">{a.detail}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */

function ProjectsTab({ projects, projectsOk, sp }: { projects: Project[]; projectsOk: boolean; sp: SP }) {
  const query = parseProjectQuery(sp);
  const filtered = filterProjects(projects, query);
  const pg = paginate(filtered, query.page);
  const c = statusCounts(projects);
  const now = new Date();

  const keep: SP = { q: query.q, status: query.status === "all" ? "" : query.status, sort: query.sort === "newest" ? "" : query.sort };
  const exportParams = new URLSearchParams(Object.entries(keep).filter(([, v]) => v) as [string, string][]);

  const chip = (label: string, status: string, n: number) => {
    const active = (query.status === "all" ? "" : query.status) === status;
    return (
      <Link
        key={label}
        href={href("projects", { ...keep, status, page: "" })}
        className={`border px-2 py-1 text-xs ${
          active ? "border-slate-400 bg-slate-800 text-slate-100" : "border-slate-700 text-slate-400 hover:text-slate-200"
        }`}
      >
        {label} <span className="tabular-nums text-slate-500">{n}</span>
      </Link>
    );
  };

  return (
    <>
      {!projectsOk && <NoProjects />}

      <form method="get" action="/dashboard/org" className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="tab" value="projects" />
        {query.status !== "all" && <input type="hidden" name="status" value={query.status} />}
        <input
          name="q"
          data-search
          defaultValue={query.q}
          placeholder="Search title, author, id or repo   ( / )"
          className={`${field} max-w-sm`}
        />
        <select name="sort" defaultValue={query.sort} className={`${field} w-auto`} aria-label="Sort">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="hours">Most hours</option>
        </select>
        <button type="submit" className={btn}>
          Apply
        </button>
        <div className="ml-auto flex gap-1">
          {chip("All", "", c.total)}
          {chip("Pending", "pending", c.pending)}
          {chip("Approved", "approved", c.approved)}
          {chip("Rejected", "rejected", c.rejected)}
        </div>
      </form>

      <div className="overflow-x-auto border border-slate-800">
        <table className="w-full min-w-[640px] border-collapse">
          <thead className="bg-slate-900">
            <tr>
              <th className={th}>Project</th>
              <th className={th}>Author</th>
              <th className={th}>Status</th>
              <th className={`${th} text-right`}>Hours</th>
              <th className={th}>Submitted</th>
              <th className={th}>Repo</th>
            </tr>
          </thead>
          <tbody>
            {pg.items.map((p) => {
              const s = projectStatus(p);
              return (
                <tr key={p.id} data-row-href={`/dashboard/reviewer/${p.id}`} className={rowCls}>
                  <td className={td}>
                    <Link href={`/dashboard/reviewer/${p.id}`} className="text-sky-400 hover:underline">
                      {p.title || "(untitled)"}
                    </Link>
                  </td>
                  <td className={`${td} font-mono text-xs text-slate-400`}>{p.authorId}</td>
                  <td className={`${td} ${STATUS_COLOR[s]}`}>{STATUS_LABEL[s]}</td>
                  <td className={`${td} text-right tabular-nums`}>{latestHours(p)}</td>
                  <td className={`${td} whitespace-nowrap tabular-nums text-slate-400`}>
                    {fmtDate(latestSubmitted(p))}
                    {groupStatus(s) === "pending" && (
                      <span className="ml-1.5 text-amber-300">{fmtAge(latestSubmitted(p), now)}</span>
                    )}
                  </td>
                  <td className={`${td} max-w-[14rem] truncate`}>
                    {/^https:\/\//.test(p.codeUrl ?? "") ? (
                      <a href={p.codeUrl} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-sky-400 hover:underline">
                        {p.codeUrl.replace(/^https:\/\/(www\.)?/, "")}
                      </a>
                    ) : (
                      <span className="text-slate-600">–</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {pg.items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-2 py-6 text-center text-slate-500">
                  {projectsOk ? "No projects match." : "No project data."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span className="tabular-nums">
          {pg.total === 0 ? "0" : `${(pg.page - 1) * PAGE_SIZE + 1}–${Math.min(pg.page * PAGE_SIZE, pg.total)}`} of {pg.total}
        </span>
        <span className="flex items-center gap-3">
          {pg.page > 1 && (
            <Link href={href("projects", { ...keep, page: String(pg.page - 1) })} className="text-sky-400 hover:underline">
              Previous
            </Link>
          )}
          <span>
            Page {pg.page} of {pg.pages}
          </span>
          {pg.page < pg.pages && (
            <Link href={href("projects", { ...keep, page: String(pg.page + 1) })} className="text-sky-400 hover:underline">
              Next
            </Link>
          )}
          <a href={`/dashboard/org/export?${exportParams.toString()}`} className="text-sky-400 hover:underline">
            Download CSV
          </a>
        </span>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */

function ReviewersTab({ reviewers, q }: { reviewers: Reviewer[]; q: string }) {
  const list = filterReviewers(reviewers, q);
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Add a reviewer" note="Slack ID (U0123ABC) or email. They get a DM.">
          <form action={addReviewerAction} className="flex gap-2">
            <input name="key" placeholder="Slack ID or email" required maxLength={100} className={field} />
            <button type="submit" className={btnPrimary}>
              Add
            </button>
          </form>
        </Panel>
        <Panel title="Add several" note="Paste a list, up to 50. Separate with spaces, commas or new lines.">
          <form action={bulkAddReviewersAction} className="flex gap-2">
            <textarea name="list" required rows={2} maxLength={5000} placeholder="a@x.com, b@x.com, U0123ABC" className={field} />
            <button type="submit" className={btnPrimary}>
              Add all
            </button>
          </form>
        </Panel>
      </div>

      <form method="get" action="/dashboard/org" className="flex gap-2">
        <input type="hidden" name="tab" value="reviewers" />
        <input name="q" data-search defaultValue={q} placeholder="Search reviewers   ( / )" className={`${field} max-w-sm`} />
        <button type="submit" className={btn}>
          Search
        </button>
      </form>

      <div className="overflow-x-auto border border-slate-800">
        <table className="w-full min-w-[480px] border-collapse">
          <thead className="bg-slate-900">
            <tr>
              <th className={th}>Reviewer</th>
              <th className={th}>Slack</th>
              <th className={th}>Added</th>
              <th className={th} />
            </tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.key} className="hover:bg-slate-900">
                <td className={td}>{r.email ?? r.slackId ?? r.key}</td>
                <td className={`${td} font-mono text-xs`}>
                  {r.slackId ? (
                    <a
                      href={`https://hackclub.slack.com/team/${r.slackId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-400 hover:underline"
                    >
                      {r.slackId}
                    </a>
                  ) : (
                    <span className="text-slate-600">not linked</span>
                  )}
                </td>
                <td className={`${td} tabular-nums text-slate-400`}>{fmtDate(r.addedAt)}</td>
                <td className={`${td} text-right`}>
                  <form action={removeReviewerAction}>
                    <input type="hidden" name="key" value={r.key} />
                    <button type="submit" className="text-xs text-slate-500 hover:text-rose-300">
                      Remove
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={4} className="px-2 py-6 text-center text-slate-500">
                  {q ? "No reviewers match." : "No reviewers yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs tabular-nums text-slate-500">
        {list.length}
        {q ? ` of ${reviewers.length}` : ""} reviewer{list.length === 1 ? "" : "s"}
      </p>
    </>
  );
}

/* ------------------------------------------------------------------ */

function MessagesTab() {
  const bots = botStatus();
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Post to a channel" note="Text is escaped, so it can't trigger mentions.">
          <form action={postSlackAction} className="space-y-2">
            <select name="channel" className={field} defaultValue="announcement">
              {BOTS.map((b) => (
                <option key={b} value={b}>
                  {BOT_LABEL[b]} channel
                </option>
              ))}
            </select>
            <textarea name="text" required rows={4} maxLength={3000} placeholder="Message" className={field} />
            <label className="flex items-center gap-2 text-slate-300">
              <input type="checkbox" name="ping" /> Ping @channel
            </label>
            <button type="submit" className={btnPrimary}>
              Send
            </button>
          </form>
        </Panel>

        <div className="space-y-4">
          <Panel title="DM all reviewers" note="Everyone with a linked Slack ID.">
            <form action={dmReviewersAction} className="space-y-2">
              <textarea name="text" required rows={3} maxLength={2000} placeholder="Message" className={field} />
              <button type="submit" className={btnPrimary}>
                Send DMs
              </button>
            </form>
          </Panel>

          <Panel title="Slack bots" note="Whether each token and channel is set.">
            <table className="w-full border-collapse">
              <tbody>
                {bots.map((b) => (
                  <tr key={b.bot}>
                    <td className={td}>{BOT_LABEL[b.bot]}</td>
                    <td className={`${td} ${b.token ? "text-emerald-300" : "text-rose-300"}`}>{b.token ? "token set" : "no token"}</td>
                    <td className={`${td} ${b.channel ? "text-emerald-300" : "text-rose-300"}`}>{b.channel ? "channel set" : "no channel"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <form action={checkBotsAction} className="mt-2">
              <button type="submit" className={btn}>
                Check connections
              </button>
            </form>
          </Panel>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */

function SettingsTab({ settings }: { settings: Awaited<ReturnType<typeof getSettings>> }) {
  return (
    <Panel title="Program settings">
      <form action={saveSettingsAction} className="max-w-md space-y-3">
        <label className="block text-slate-300">
          RSVP count (shown on the landing page)
          <input name="rsvpCount" type="number" min={0} max={1000000} defaultValue={settings.rsvpCount} className={`${field} mt-1`} />
        </label>
        <label className="flex items-center gap-2 text-slate-300">
          <input type="checkbox" name="submissionsOpen" defaultChecked={settings.submissionsOpen} />
          Submissions open
        </label>
        <label className="block text-slate-300">
          Banner message (optional)
          <input name="banner" maxLength={200} defaultValue={settings.banner} className={`${field} mt-1`} />
        </label>
        <button type="submit" className={btnPrimary}>
          Save
        </button>
      </form>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */

function LogTab({ audit, sp }: { audit: AuditEntry[]; sp: SP }) {
  const query = parseAuditQuery(sp);
  const cats = [...new Set(audit.map((a) => auditCategory(a.action)))].sort();
  const list = filterAudit(audit, query);

  return (
    <>
      <form method="get" action="/dashboard/org" className="flex flex-wrap gap-2">
        <input type="hidden" name="tab" value="log" />
        <input name="q" data-search defaultValue={query.q} placeholder="Search action, detail or user   ( / )" className={`${field} max-w-sm`} />
        <select name="cat" defaultValue={query.cat} className={`${field} w-auto`} aria-label="Category">
          <option value="all">All actions</option>
          {cats.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button type="submit" className={btn}>
          Filter
        </button>
      </form>

      <div className="overflow-x-auto border border-slate-800">
        <table className="w-full min-w-[560px] border-collapse">
          <thead className="bg-slate-900">
            <tr>
              <th className={th}>When (UTC)</th>
              <th className={th}>Action</th>
              <th className={th}>Detail</th>
              <th className={th}>By</th>
            </tr>
          </thead>
          <tbody>
            {list.map((a, i) => (
              <tr key={i} className="hover:bg-slate-900">
                <td className={`${td} whitespace-nowrap tabular-nums text-slate-500`}>{fmtDateTime(a.at)}</td>
                <td className={`${td} whitespace-nowrap font-mono text-xs text-slate-300`}>{a.action}</td>
                <td className={`${td} break-words text-slate-400`}>{a.detail}</td>
                <td className={`${td} font-mono text-xs text-slate-500`}>{a.actor}</td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={4} className="px-2 py-6 text-center text-slate-500">
                  Nothing matches.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs tabular-nums text-slate-500">
        {list.length} of the last {audit.length} actions
      </p>
    </>
  );
}
