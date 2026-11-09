import { mergeTickets, parseStats, parseTickets, type HelpTicket, type SupportStats } from "./summary";

/**
 * Talks to a Nephthys instance over its public JSON API.
 * No API key is ever sent, so Slack message text is never returned.
 * Set NEPHTHYS_URL, for example https://takeoff.nephthys.hackclub.com
 */

export type Failure = { ok: false; reason: "not_configured" | "unreachable" | "bad_response"; message: string };

const TTL_MS = 60_000;
const TIMEOUT_MS = 6_000;
const FAIL_PAUSE_MS = 30_000;
const cache = new Map<string, { at: number; value: unknown }>();
// After a failure, skip the network for a bit so a down server doesn't slow every page.
let lastFailure: { at: number; message: string } | null = null;

/** Returns the base URL without a trailing slash, or null if unset or not https. */
export function nephthysBase(): string | null {
  const raw = process.env.NEPHTHYS_URL?.trim();
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:" && !(u.protocol === "http:" && u.hostname === "localhost")) return null;
    return `${u.origin}`;
  } catch {
    return null;
  }
}

export const nephthysConfigured = () => nephthysBase() !== null;

async function getJson(path: string): Promise<unknown> {
  const base = nephthysBase();
  if (!base) throw new Error("not_configured");
  const hit = cache.get(path);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value;
  if (lastFailure && Date.now() - lastFailure.at < FAIL_PAUSE_MS) throw new Error(lastFailure.message);

  try {
    const res = await fetch(`${base}${path}`, {
      headers: { Accept: "application/json", "User-Agent": "takeoff-dashboard" },
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`status_${res.status}`);
    const value: unknown = await res.json();
    cache.set(path, { at: Date.now(), value });
    lastFailure = null;
    return value;
  } catch (e) {
    lastFailure = { at: Date.now(), message: e instanceof Error ? e.message : "unreachable" };
    throw e;
  }
}

function fail(e: unknown): Failure {
  const m = e instanceof Error ? e.message : "";
  if (m === "not_configured") {
    return { ok: false, reason: "not_configured", message: "NEPHTHYS_URL isn't set." };
  }
  if (m.startsWith("status_")) {
    return { ok: false, reason: "bad_response", message: `Nephthys answered with HTTP ${m.slice(7)}.` };
  }
  return { ok: false, reason: "unreachable", message: "Couldn't reach Nephthys. It may be down, or the URL is wrong." };
}

export async function loadStats(): Promise<{ ok: true; stats: SupportStats } | Failure> {
  try {
    const stats = parseStats(await getJson("/api/stats_v2"));
    if (!stats) return { ok: false, reason: "bad_response", message: "That URL didn't return Nephthys stats." };
    return { ok: true, stats };
  } catch (e) {
    return fail(e);
  }
}

/** Open and in-progress tickets (any age) plus everything created in the last `days`. */
export async function loadTickets(days = 60): Promise<{ ok: true; tickets: HelpTicket[] } | Failure> {
  try {
    const since = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
    const [open, progress, recent] = await Promise.all([
      getJson("/api/tickets?status=open"),
      getJson("/api/tickets?status=in_progress"),
      getJson(`/api/tickets?since=${since}`),
    ]);
    return { ok: true, tickets: mergeTickets(parseTickets(open), parseTickets(progress), parseTickets(recent)) };
  } catch (e) {
    return fail(e);
  }
}
