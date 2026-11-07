import Link from "next/link";
import { requireRole } from "@/lib/roles";
import { listReviewers, type Reviewer } from "@/lib/reviewers";
import { listAudit, type AuditEntry } from "@/lib/audit";
import { getSettings } from "@/lib/settings";
import { BOTS, BOT_LABEL, botStatus } from "@/lib/slack";
import {
  addReviewerAction,
  removeReviewerAction,
  postSlackAction,
  dmReviewersAction,
  saveSettingsAction,
  checkBotsAction,
} from "./actions";

const input =
  "w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none";
const primaryBtn =
  "rounded-md bg-sky-500 px-4 py-2 font-semibold text-white transition-colors hover:bg-sky-400";
const ghostBtn =
  "rounded-md border border-slate-600 px-4 py-2 text-sm text-slate-200 transition-colors hover:border-sky-500";

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="mt-10 rounded-xl border border-slate-800 bg-slate-900/40 p-6">
      <h2 className="text-lg font-semibold text-sky-300">{title}</h2>
      {hint && <p className="mt-1 text-sm text-slate-400">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default async function OrgDash({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; err?: string }>;
}) {
  await requireRole("org");
  const { ok, err } = await searchParams;

  const [reviewers, settings, audit] = await Promise.all([
    listReviewers().catch(() => [] as Reviewer[]),
    getSettings(),
    listAudit().catch(() => [] as AuditEntry[]),
  ]);
  const bots = botStatus();

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto w-full max-w-3xl">
        <Link href="/dashboard" className="text-sm text-slate-400 transition-colors hover:text-sky-400">
          ← Back to dashboard
        </Link>
        <h1 className="mt-6 text-3xl font-bold text-sky-300">Org dash</h1>

        {ok && (
          <div className="mt-6 rounded-md border border-emerald-700 bg-emerald-950/50 px-4 py-3 text-sm text-emerald-300">
            {ok}
          </div>
        )}
        {err && (
          <div className="mt-6 rounded-md border border-rose-700 bg-rose-950/50 px-4 py-3 text-sm text-rose-300">
            {err}
          </div>
        )}

        {/* STATS */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="text-2xl font-bold text-sky-300">{reviewers.length}</div>
            <div className="text-xs text-slate-400">Reviewers</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="text-2xl font-bold text-sky-300">{settings.rsvpCount}</div>
            <div className="text-xs text-slate-400">RSVPs</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <div className={`text-2xl font-bold ${settings.submissionsOpen ? "text-emerald-400" : "text-rose-400"}`}>
              {settings.submissionsOpen ? "Open" : "Closed"}
            </div>
            <div className="text-xs text-slate-400">Submissions</div>
          </div>
        </div>

        {/* REVIEWERS */}
        <Section
          title="Reviewers"
          hint="Add by Slack ID (U0123ABC) or email. Emails are matched to a Slack account automatically and the person gets a DM."
        >
          <form action={addReviewerAction} className="flex gap-2">
            <input name="key" placeholder="Slack ID or email" required maxLength={100} className={input} />
            <button type="submit" className={primaryBtn}>Add</button>
          </form>

          <ul className="mt-4 space-y-2">
            {reviewers.map((r) => (
              <li
                key={r.key}
                className="flex items-center justify-between rounded-md border border-slate-700 bg-slate-800/50 px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{r.email ?? r.slackId ?? r.key}</div>
                  <div className="text-xs text-slate-500">
                    {r.slackId ? (
                      <a
                        href={`https://hackclub.slack.com/team/${r.slackId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-400 hover:underline"
                      >
                        {r.slackId} on Slack
                      </a>
                    ) : (
                      "no Slack link"
                    )}{" "}
                    · added {new Date(r.addedAt).toLocaleDateString()}
                  </div>
                </div>
                <form action={removeReviewerAction}>
                  <input type="hidden" name="key" value={r.key} />
                  <button type="submit" className="text-sm text-slate-400 transition-colors hover:text-red-400">
                    Remove
                  </button>
                </form>
              </li>
            ))}
            {reviewers.length === 0 && <li className="text-sm text-slate-500">No reviewers yet.</li>}
          </ul>
        </Section>

        {/* SLACK BROADCAST */}
        <Section title="Post to Slack" hint="Sends as the selected bot. Message text is escaped, so it can't trigger mentions.">
          <form action={postSlackAction} className="space-y-3">
            <select name="channel" className={input} defaultValue="announcement">
              {BOTS.map((b) => (
                <option key={b} value={b}>
                  {BOT_LABEL[b]} channel
                </option>
              ))}
            </select>
            <textarea name="text" required rows={4} maxLength={3000} placeholder="Message…" className={input} />
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" name="ping" /> Ping @channel
            </label>
            <button type="submit" className={primaryBtn}>Send</button>
          </form>
        </Section>

        {/* DM REVIEWERS */}
        <Section title="Message all reviewers" hint="DMs every reviewer who has a linked Slack ID.">
          <form action={dmReviewersAction} className="space-y-3">
            <textarea name="text" required rows={3} maxLength={2000} placeholder="Message…" className={input} />
            <button type="submit" className={primaryBtn}>Send DMs</button>
          </form>
        </Section>

        {/* SETTINGS */}
        <Section title="Program settings">
          <form action={saveSettingsAction} className="space-y-4">
            <label className="block text-sm text-slate-300">
              RSVP count (shown on the landing page)
              <input
                name="rsvpCount"
                type="number"
                min={0}
                max={1000000}
                defaultValue={settings.rsvpCount}
                className={`${input} mt-1`}
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" name="submissionsOpen" defaultChecked={settings.submissionsOpen} />
              Submissions open
            </label>
            <label className="block text-sm text-slate-300">
              Banner message (optional)
              <input name="banner" maxLength={200} defaultValue={settings.banner} className={`${input} mt-1`} />
            </label>
            <button type="submit" className={primaryBtn}>Save settings</button>
          </form>
        </Section>

        {/* BOTS */}
        <Section title="Slack bots" hint="Shows whether each bot's token and channel are set. Check connection verifies the tokens with Slack.">
          <ul className="space-y-1 text-sm">
            {bots.map((b) => (
              <li key={b.bot} className="flex justify-between border-b border-slate-800 py-1">
                <span>{BOT_LABEL[b.bot]}</span>
                <span className="text-slate-400">
                  token {b.token ? "✓" : "✗"} · channel {b.channel ? "✓" : "✗"}
                </span>
              </li>
            ))}
          </ul>
          <form action={checkBotsAction} className="mt-4">
            <button type="submit" className={ghostBtn}>Check connections</button>
          </form>
        </Section>

        {/* AUDIT */}
        <Section title="Activity log" hint="Last 50 org and review actions.">
          <ul className="space-y-1 text-xs text-slate-400">
            {audit.map((a, i) => (
              <li key={i} className="border-b border-slate-800 py-1">
                <span className="text-slate-500">{new Date(a.at).toLocaleString()}</span>{" "}
                <span className="text-sky-300">{a.action}</span>{" "}
                <span className="text-slate-300">{a.detail}</span>{" "}
                <span className="text-slate-600">by {a.actor}</span>
              </li>
            ))}
            {audit.length === 0 && <li>Nothing yet.</li>}
          </ul>
        </Section>
      </div>
    </main>
  );
}