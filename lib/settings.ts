import { redis } from "./redis";

const KEY = "takeoff:settings";

export type Settings = { rsvpCount: number; submissionsOpen: boolean; banner: string };

const DEFAULTS: Settings = { rsvpCount: 49, submissionsOpen: true, banner: "" };

export async function getSettings(): Promise<Settings> {
  try {
    const flat = (await redis<string[] | null>("HGETALL", KEY)) ?? [];
    const m: Record<string, string> = {};
    for (let i = 0; i < flat.length; i += 2) m[flat[i]] = flat[i + 1];
    const n = m.rsvpCount !== undefined ? Number(m.rsvpCount) : NaN;
    return {
      rsvpCount: Number.isFinite(n) ? n : DEFAULTS.rsvpCount,
      submissionsOpen: m.submissionsOpen !== "0",
      banner: m.banner ?? "",
    };
  } catch {
    return DEFAULTS;
  }
}

export async function saveSettings(s: Settings) {
  await redis(
    "HSET",
    KEY,
    "rsvpCount",
    String(s.rsvpCount),
    "submissionsOpen",
    s.submissionsOpen ? "1" : "0",
    "banner",
    s.banner
  );
}