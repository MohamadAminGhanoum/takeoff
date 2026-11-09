// Pure helpers for the org dashboard. No framework or network imports.
import type { Project, ShipStatus } from "../sidekick/types";

/* ---------------- projects ---------------- */

export type GroupedStatus = "pending" | "approved" | "rejected";

export function projectStatus(p: Project): ShipStatus {
  return p.ships?.length ? p.ships[p.ships.length - 1].status : "pending";
}

export const groupStatus = (s: ShipStatus): GroupedStatus =>
  s === "approved" ? "approved" : s === "rejected" ? "rejected" : "pending";

export function latestSubmitted(p: Project): string {
  return p.ships?.length ? p.ships[p.ships.length - 1].submittedAt : "";
}

export function latestHours(p: Project): number {
  return p.ships?.length ? p.ships[p.ships.length - 1].hoursSubmitted : 0;
}

export function statusCounts(projects: Project[]) {
  const c = { pending: 0, pendingHq: 0, approved: 0, rejected: 0, total: projects.length };
  for (const p of projects) {
    const s = projectStatus(p);
    if (s === "pending_hq") {
      c.pending++;
      c.pendingHq++;
    } else c[s]++;
  }
  return c;
}

export type ProjectQuery = {
  q: string;
  status: "all" | GroupedStatus;
  sort: "newest" | "oldest" | "hours";
  page: number;
};

export const PAGE_SIZE = 25;

export function parseProjectQuery(sp: Record<string, string | undefined>): ProjectQuery {
  const status = ["pending", "approved", "rejected"].includes(sp.status ?? "")
    ? (sp.status as GroupedStatus)
    : "all";
  const sort = ["oldest", "hours"].includes(sp.sort ?? "") ? (sp.sort as "oldest" | "hours") : "newest";
  const page = Math.max(1, Math.floor(Number(sp.page)) || 1);
  return { q: (sp.q ?? "").trim().slice(0, 100), status, sort, page };
}

export function filterProjects(projects: Project[], q: Pick<ProjectQuery, "q" | "status" | "sort">): Project[] {
  const needle = q.q.toLowerCase();
  const out = projects.filter((p) => {
    if (q.status !== "all" && groupStatus(projectStatus(p)) !== q.status) return false;
    if (!needle) return true;
    return [p.title, p.id, p.authorId, p.codeUrl].some((v) => (v ?? "").toLowerCase().includes(needle));
  });
  const time = (p: Project) => Date.parse(latestSubmitted(p)) || 0;
  if (q.sort === "hours") out.sort((a, b) => latestHours(b) - latestHours(a));
  else if (q.sort === "oldest") out.sort((a, b) => time(a) - time(b));
  else out.sort((a, b) => time(b) - time(a));
  return out;
}

export function paginate<T>(items: T[], page: number, size = PAGE_SIZE) {
  const pages = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(Math.max(1, page), pages);
  return { items: items.slice((current - 1) * size, current * size), page: current, pages, total: items.length };
}

/** Oldest unreviewed submissions first. */
export function waitingLongest(projects: Project[], n = 5): Project[] {
  return projects
    .filter((p) => groupStatus(projectStatus(p)) === "pending")
    .sort((a, b) => (Date.parse(latestSubmitted(a)) || 0) - (Date.parse(latestSubmitted(b)) || 0))
    .slice(0, n);
}

/* ---------------- time buckets ---------------- */

export type Bucket = { label: string; value: number };
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY = 86_400_000;

const startOfDayUtc = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
const startOfWeekUtc = (d: Date) => {
  const day = (d.getUTCDay() + 6) % 7; // Monday = 0
  return startOfDayUtc(d) - day * DAY;
};
const label = (ms: number) => {
  const d = new Date(ms);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
};

/** Counts per Monday-start week for the last `weeks` weeks, oldest first. */
export function weeklyBuckets(dates: string[], now = new Date(), weeks = 10): Bucket[] {
  const thisWeek = startOfWeekUtc(now);
  const buckets: Bucket[] = [];
  for (let i = weeks - 1; i >= 0; i--) buckets.push({ label: label(thisWeek - i * 7 * DAY), value: 0 });
  for (const iso of dates) {
    const t = Date.parse(iso);
    if (!Number.isFinite(t)) continue;
    const idx = weeks - 1 - Math.round((thisWeek - startOfWeekUtc(new Date(t))) / (7 * DAY));
    if (idx >= 0 && idx < weeks) buckets[idx].value++;
  }
  return buckets;
}

/** Counts per UTC day for the last `days` days, oldest first. */
export function dailyBuckets(dates: string[], now = new Date(), days = 14): Bucket[] {
  const today = startOfDayUtc(now);
  const buckets: Bucket[] = [];
  for (let i = days - 1; i >= 0; i--) buckets.push({ label: label(today - i * DAY), value: 0 });
  for (const iso of dates) {
    const t = Date.parse(iso);
    if (!Number.isFinite(t)) continue;
    const idx = days - 1 - Math.round((today - startOfDayUtc(new Date(t))) / DAY);
    if (idx >= 0 && idx < days) buckets[idx].value++;
  }
  return buckets;
}

/* ---------------- activity log ---------------- */

export type AuditLike = { at: string; actor: string; action: string; detail: string };

export const auditCategory = (action: string) => action.split(".")[0] || "other";

export type AuditQuery = { q: string; cat: string };

export function parseAuditQuery(sp: Record<string, string | undefined>): AuditQuery {
  return { q: (sp.q ?? "").trim().slice(0, 100), cat: /^[a-z_]{1,20}$/.test(sp.cat ?? "") ? (sp.cat as string) : "all" };
}

export function filterAudit<T extends AuditLike>(entries: T[], q: AuditQuery): T[] {
  const needle = q.q.toLowerCase();
  return entries.filter((e) => {
    if (q.cat !== "all" && auditCategory(e.action) !== q.cat) return false;
    if (!needle) return true;
    return [e.action, e.detail, e.actor].some((v) => v.toLowerCase().includes(needle));
  });
}

/* ---------------- reviewers ---------------- */

export type ReviewerLike = { key: string; email?: string; slackId?: string; addedAt: string };

export function filterReviewers<T extends ReviewerLike>(list: T[], q: string): T[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return list;
  return list.filter((r) => [r.key, r.email, r.slackId].some((v) => (v ?? "").toLowerCase().includes(needle)));
}

/** Split pasted text (lines, commas, spaces) into unique, trimmed entries. */
export function splitEntries(raw: string, max = 50): string[] {
  const seen = new Set<string>();
  for (const part of raw.split(/[\s,;]+/)) {
    const p = part.trim();
    if (p) seen.add(p.slice(0, 100));
    if (seen.size >= max) break;
  }
  return [...seen];
}
