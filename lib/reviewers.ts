import { redis } from "./redis";

const KEY = "takeoff:reviewers";
const INDEX = "takeoff:reviewer-index";

export type Reviewer = {
  key: string;
  email?: string;
  slackId?: string;
  addedBy: string;
  addedAt: string;
};

const norm = (k: string) => k.trim().toLowerCase();

export async function listReviewers(): Promise<Reviewer[]> {
  const flat = (await redis<string[] | null>("HGETALL", KEY)) ?? [];
  const out: Reviewer[] = [];
  for (let i = 1; i < flat.length; i += 2) {
    try {
      out.push(JSON.parse(flat[i]) as Reviewer);
    } catch {
    }
  }
  return out.sort((a, b) => a.addedAt.localeCompare(b.addedAt));
}

export async function addReviewer(r: Reviewer) {
  const key = norm(r.key);
  const entry: Reviewer = { ...r, key };
  await redis("HSET", KEY, key, JSON.stringify(entry));

  const aliases = new Set([key]);
  if (r.email) aliases.add(norm(r.email));
  if (r.slackId) aliases.add(norm(r.slackId));
  for (const a of aliases) await redis("HSET", INDEX, a, key);
}

export async function removeReviewer(key: string) {
  const k = norm(key);
  const raw = await redis<string | null>("HGET", KEY, k);
  const aliases = new Set([k]);
  if (raw) {
    try {
      const e = JSON.parse(raw) as Reviewer;
      if (e.email) aliases.add(norm(e.email));
      if (e.slackId) aliases.add(norm(e.slackId));
    } catch {
      // ignore
    }
  }
  for (const a of aliases) await redis("HDEL", INDEX, a);
  await redis("HDEL", KEY, k);
}

export async function isReviewerRecord(keys: (string | undefined)[]) {
  const wanted = keys.filter((k): k is string => !!k).map(norm);
  if (wanted.length === 0) return false;
  const hits = await Promise.all(wanted.map((k) => redis<number>("HEXISTS", INDEX, k)));
  return hits.some((h) => h === 1);
}