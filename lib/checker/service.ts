import { redis } from "../redis";
import { aiConfigured, reviewWithAi } from "./ai";
import { CheckError, getSnapshot, parseRepoUrl } from "./github";
import { evaluate, grade } from "./rules";
import type { CheckResult, Finding } from "./types";

export type CheckInput = {
  repoUrl: string;
  projectId?: string;
  description?: string;
  hoursClaimed?: number;
  withAi?: boolean;
};

const REPO_KEY = "takeoff:chk:repo"; // hash: repo full name -> project id
const ROOT_KEY = "takeoff:chk:root"; // hash: first commit sha -> repo full name
const RESULT_PREFIX = "takeoff:chk:result:";
const RESULT_TTL = 60 * 60 * 24 * 14;

/** The AI step is skipped for clear failures, since rules already say enough. */
const AI_MIN_SCORE = 40;

export async function runCheck(input: CheckInput): Promise<CheckResult> {
  const parsed = parseRepoUrl(input.repoUrl);
  if (!parsed) {
    throw new CheckError("bad_url", "That doesn't look like a GitHub repo URL. Use https://github.com/owner/repo.");
  }

  const snap = await getSnapshot(parsed.owner, parsed.repo);
  const ev = evaluate(snap, {
    description: input.description,
    hoursClaimed: input.hoursClaimed,
  });

  // Cross-submission checks. These need Redis; without it they are skipped.
  const extra: Finding[] = [];
  const fullKey = snap.fullName.toLowerCase();
  const rootSha = snap.firstCommit?.sha;
  try {
    if (input.projectId) {
      const prev = await redis<string | null>("HGET", REPO_KEY, fullKey);
      if (prev && prev !== input.projectId) {
        extra.push({
          id: "dup-repo",
          group: "Originality",
          level: "fail",
          title: "Same repo was submitted by another project",
          detail: `This repo was already checked for project ${prev}.`,
        });
      }
    }
    if (rootSha && snap.commitCount > 1) {
      const other = await redis<string | null>("HGET", ROOT_KEY, rootSha);
      if (other && other.toLowerCase() !== fullKey) {
        extra.push({
          id: "dup-root",
          group: "Originality",
          level: "warn",
          title: "Shares its history with another repo",
          detail: `The first commit is identical to one in ${other}. One is a fork or a copy of the other.`,
        });
      }
    }
    // Only real submissions are remembered, so trying out a URL doesn't pollute the data.
    if (input.projectId) {
      await redis("HSET", REPO_KEY, fullKey, input.projectId);
      if (rootSha && snap.commitCount > 1) await redis("HSET", ROOT_KEY, rootSha, snap.fullName);
    }
  } catch {
    // Redis not configured or down.
  }

  const findings = [...ev.findings, ...extra];
  const { score, verdict } = grade(findings);

  const result: CheckResult = {
    ...ev,
    findings,
    score,
    verdict,
    repoUrl: input.repoUrl,
    fullName: snap.fullName,
    htmlUrl: snap.htmlUrl,
    checkedAt: new Date().toISOString(),
    projectId: input.projectId,
  };

  if (input.withAi) {
    if (!aiConfigured()) {
      result.aiSkipped = "AI is off: set HACKCLUB_AI_KEY to turn it on.";
    } else if (score < AI_MIN_SCORE) {
      result.aiSkipped = "Skipped, the rules already found serious problems.";
    } else {
      try {
        result.ai = await reviewWithAi(snap, result, input.description ?? snap.description ?? "");
      } catch (e) {
        result.aiSkipped = `AI step failed: ${e instanceof Error ? e.message : "unknown error"}`;
      }
    }
  }

  if (input.projectId) {
    try {
      await redis("SET", RESULT_PREFIX + input.projectId, JSON.stringify(result), "EX", RESULT_TTL);
    } catch {
      // Not being able to cache is fine.
    }
  }

  return result;
}

export async function loadLastCheck(projectId: string): Promise<CheckResult | null> {
  try {
    const raw = await redis<string | null>("GET", RESULT_PREFIX + projectId);
    return raw ? (JSON.parse(raw) as CheckResult) : null;
  } catch {
    return null;
  }
}

/** Simple per-user limit so one reviewer can't burn the GitHub or AI quota. */
export async function underRateLimit(userId: string, max = 30): Promise<boolean> {
  try {
    const bucket = Math.floor(Date.now() / 3_600_000);
    const key = `takeoff:chk:rl:${userId}:${bucket}`;
    const n = await redis<number>("INCR", key);
    if (n === 1) await redis("EXPIRE", key, 3600);
    return n <= max;
  } catch {
    return true;
  }
}
