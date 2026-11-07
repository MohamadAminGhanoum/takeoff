import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN!,
});

const KEY = "takeoff:reviewers";

export type Reviewer = { key: string; addedBy: string; addedAt: string };

const norm = (k: string) => k.trim().toLowerCase();

export async function listReviewers(): Promise<Reviewer[]> {
  const all = await redis.hgetall<Record<string, Reviewer>>(KEY);
  if (!all) return [];
  return Object.values(all).sort((a, b) => a.addedAt.localeCompare(b.addedAt));
}

export async function addReviewer(key: string, addedBy: string) {
  const k = norm(key);
  const entry: Reviewer = { key: k, addedBy, addedAt: new Date().toISOString() };
  await redis.hset(KEY, { [k]: entry });
}

export async function removeReviewer(key: string) {
  await redis.hdel(KEY, norm(key));
}

export async function isReviewerRecord(keys: (string | undefined)[]) {
  const wanted = keys.filter((k): k is string => !!k).map(norm);
  if (wanted.length === 0) return false;
  const hits = await Promise.all(wanted.map((k) => redis.hexists(KEY, k)));
  return hits.some((h) => h === 1);
}