// Pure parsing and matching for Nephthys data. No network or framework imports.
import type { Project } from "../sidekick/types";

export type TicketStatus = "open" | "in_progress" | "closed";

export type HelpTicket = {
  id: number;
  title: string; // "" when Nephthys has no title
  status: TicketStatus;
  openedBy: string | null; // Slack ID
  assignedTo: string | null; // Slack ID
  category: string | null;
  teamTags: string[];
  createdAt: string;
  closedAt: string | null;
};

export type Period = {
  newTickets: number;
  stillOpen: number;
  inProgress: number;
  closed: number;
  meanFirstResponseMin: number | null;
  meanResolutionMin: number | null;
};

export type LeaderboardRow = { slackId: string; count: number };

export type SupportStats = {
  total: number;
  open: number;
  inProgress: number;
  closed: number;
  meanFirstResponseMin: number | null;
  meanResolutionMin: number | null;
  oldestUnanswered: { id: number; ageMin: number; link: string | null } | null;
  leaderboard: LeaderboardRow[];
  day: { now: Period; prev: Period };
  week: { now: Period; prev: Period };
};

/* ------------------------------ guards ------------------------------ */

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
const int = (v: unknown): number => {
  const n = num(v);
  return n === null ? 0 : Math.max(0, Math.round(n));
};
const text = (v: unknown, max = 300): string => (typeof v === "string" ? v.slice(0, max) : "");

export const isSlackId = (v: unknown): v is string => typeof v === "string" && /^[UW][A-Z0-9]{6,}$/i.test(v);

function slackIdOf(user: unknown): string | null {
  if (!isObj(user)) return null;
  const id = user.slack_id;
  return isSlackId(id) ? id.toUpperCase() : null;
}

/* ------------------------------ parsing ------------------------------ */

function parsePeriod(v: unknown): Period {
  const o = isObj(v) ? v : {};
  return {
    newTickets: int(o.new_tickets_total),
    stillOpen: int(o.new_tickets_still_open),
    inProgress: int(o.new_tickets_in_progress),
    closed: int(o.closed_today),
    meanFirstResponseMin: num(o.mean_hang_time_minutes_all),
    meanResolutionMin: num(o.mean_resolution_time_minutes),
  };
}

/** Returns null when the response doesn't look like Nephthys' /api/stats_v2. */
export function parseStats(json: unknown): SupportStats | null {
  if (!isObj(json) || !isObj(json.all_time)) return null;
  const a = json.all_time;

  const leaderboard: LeaderboardRow[] = [];
  if (Array.isArray(a.helpers_leaderboard)) {
    for (const row of a.helpers_leaderboard) {
      if (isObj(row) && isSlackId(row.slack_id)) {
        leaderboard.push({ slackId: row.slack_id.toUpperCase(), count: int(row.count) });
      }
    }
  }

  let oldest: SupportStats["oldestUnanswered"] = null;
  const o = a.oldest_unanswered_ticket;
  if (isObj(o) && num(o.id) !== null) {
    const link = text(o.link, 500);
    oldest = { id: int(o.id), ageMin: Math.max(0, num(o.age_minutes) ?? 0), link: link.startsWith("https://") ? link : null };
  }

  return {
    total: int(a.tickets_total),
    open: int(a.tickets_open),
    inProgress: int(a.tickets_in_progress),
    closed: int(a.tickets_closed),
    meanFirstResponseMin: num(a.mean_hang_time_minutes_all),
    meanResolutionMin: num(a.mean_resolution_time_minutes),
    oldestUnanswered: oldest,
    leaderboard: leaderboard.slice(0, 5),
    day: { now: parsePeriod(json.past_24h), prev: parsePeriod(json.past_24h_previous) },
    week: { now: parsePeriod(json.past_7d), prev: parsePeriod(json.past_7d_previous) },
  };
}

const STATUS: Record<string, TicketStatus> = { OPEN: "open", IN_PROGRESS: "in_progress", CLOSED: "closed" };

/** Keeps only well-formed tickets. Message text is never read, only the title. */
export function parseTickets(json: unknown): HelpTicket[] {
  if (!Array.isArray(json)) return [];
  const out: HelpTicket[] = [];
  for (const t of json) {
    if (!isObj(t)) continue;
    const id = num(t.id);
    const status = STATUS[String(t.status ?? "").toUpperCase()];
    const createdAt = text(t.created_at, 40);
    if (id === null || !status || !createdAt) continue;
    const title = text(t.title, 200);
    out.push({
      id,
      title: /^no title provided/i.test(title) ? "" : title,
      status,
      openedBy: slackIdOf(t.opened_by),
      assignedTo: slackIdOf(t.assigned_to),
      category: text(t.category_tag, 80) || null,
      teamTags: Array.isArray(t.team_tags) ? t.team_tags.filter((x): x is string => typeof x === "string").map((x) => x.slice(0, 40)).slice(0, 6) : [],
      createdAt,
      closedAt: text(t.closed_at, 40) || null,
    });
  }
  return out;
}

export function mergeTickets(...lists: HelpTicket[][]): HelpTicket[] {
  const byId = new Map<number, HelpTicket>();
  for (const l of lists) for (const t of l) byId.set(t.id, t);
  return [...byId.values()].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

/* ------------------------------ display ------------------------------ */

/** 95 -> "1h 35m", 120 -> "2h", 2900 -> "2d 0h", null -> "–". */
export function fmtMinutes(m: number | null): string {
  if (m === null || !Number.isFinite(m) || m < 0) return "–";
  const total = Math.round(m);
  if (total < 1) return "<1m";
  if (total < 60) return `${total}m`;
  if (total < 48 * 60) {
    const h = Math.floor(total / 60);
    const mm = total % 60;
    return mm === 0 ? `${h}h` : `${h}h ${mm}m`;
  }
  return `${Math.floor(total / 1440)}d ${Math.floor((total % 1440) / 60)}h`;
}

/** Change from `prev` to `now` as text: "+12%", "-30%", "same", "new". */
export function fmtChange(now: number | null, prev: number | null): string {
  if (now === null || prev === null) return "–";
  if (now === prev) return "same";
  if (prev === 0) return "new";
  const pct = Math.round(((now - prev) / prev) * 100);
  return `${pct > 0 ? "+" : ""}${pct}%`;
}

/* ------------------------- tickets <-> projects ------------------------- */

const authorKey = (p: Project) => String(p.authorId ?? "").trim().toUpperCase();

/**
 * Matches by the ticket opener's Slack ID against the project's author ID.
 * This only works when a project's authorId is a Slack ID.
 */
export function ticketsForAuthor(tickets: HelpTicket[], authorId: string | undefined | null): HelpTicket[] {
  const key = String(authorId ?? "").trim().toUpperCase();
  if (!isSlackId(key)) return [];
  return tickets.filter((t) => t.openedBy === key);
}

export function projectsForTicket(projects: Project[], t: HelpTicket): Project[] {
  if (!t.openedBy) return [];
  return projects.filter((p) => authorKey(p) === t.openedBy);
}

export function countLinked(projects: Project[], tickets: HelpTicket[]): number {
  return tickets.filter((t) => projectsForTicket(projects, t).length > 0).length;
}
