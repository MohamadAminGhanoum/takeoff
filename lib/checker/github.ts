import { pickSamples } from "./rules";
import type { CommitInfo, Snapshot, TreeEntry } from "./types";

export class CheckError extends Error {
  constructor(
    public code: "bad_url" | "not_found" | "rate_limit" | "github",
    message: string
  ) {
    super(message);
  }
}

const API = "https://api.github.com";
const NAME = /^[A-Za-z0-9_.-]{1,100}$/;

/** Accepts github.com URLs only. Returns null for anything else. */
export function parseRepoUrl(input: string): { owner: string; repo: string } | null {
  let u: URL;
  try {
    u = new URL(input.trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:" || !["github.com", "www.github.com"].includes(u.hostname)) {
    return null;
  }
  const [owner, rawRepo] = u.pathname.split("/").filter(Boolean);
  if (!owner || !rawRepo) return null;
  const repo = rawRepo.replace(/\.git$/i, "");
  if (!NAME.test(owner) || !NAME.test(repo)) return null;
  return { owner, repo };
}

function headers(accept = "application/vnd.github+json"): HeadersInit {
  const h: Record<string, string> = {
    Accept: accept,
    "User-Agent": "takeoff-repo-checker",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (process.env.GITHUB_TOKEN) h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return h;
}

async function gh(path: string, accept?: string): Promise<Response> {
  const res = await fetch(`${API}${path}`, {
    headers: headers(accept),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (res.status === 403 || res.status === 429) {
    const left = res.headers.get("x-ratelimit-remaining");
    if (left === "0" || res.status === 429) {
      throw new CheckError(
        "rate_limit",
        process.env.GITHUB_TOKEN
          ? "GitHub rate limit reached. Try again in a few minutes."
          : "GitHub rate limit reached. Add a GITHUB_TOKEN to .env.local to raise the limit."
      );
    }
  }
  return res;
}

async function ghJson<T>(path: string): Promise<T | null> {
  const res = await gh(path);
  if (res.status === 404 || res.status === 409 || res.status === 204) return null;
  if (!res.ok) throw new CheckError("github", `GitHub returned ${res.status} for ${path}.`);
  return (await res.json()) as T;
}

type RawCommit = {
  sha: string;
  commit: { message: string; author?: { date?: string; name?: string } };
  author?: { login?: string } | null;
};

const toCommit = (c: RawCommit): CommitInfo => ({
  sha: c.sha,
  date: c.commit.author?.date ?? "",
  message: c.commit.message ?? "",
  author: c.author?.login ?? c.commit.author?.name,
});

export async function getSnapshot(owner: string, repo: string): Promise<Snapshot> {
  const info = await ghJson<{
    full_name: string;
    html_url: string;
    description: string | null;
    topics?: string[];
    default_branch: string;
    fork: boolean;
    parent?: { full_name: string };
    archived: boolean;
    private?: boolean;
    created_at: string;
    pushed_at: string;
    license: { spdx_id: string | null } | null;
  }>(`/repos/${owner}/${repo}`);
  if (!info) {
    throw new CheckError("not_found", "Repo not found, or it is private. Reviewers can only check public repos.");
  }

  const base = `/repos/${owner}/${repo}`;

  const [treeRaw, commitsRes, readme, contributors] = await Promise.all([
    ghJson<{ tree: { path: string; type: string; size?: number }[]; truncated: boolean }>(
      `${base}/git/trees/${encodeURIComponent(info.default_branch)}?recursive=1`
    ).catch(rethrowRateLimit),
    gh(`${base}/commits?per_page=100`).catch(rethrowRateLimit),
    gh(`${base}/readme`, "application/vnd.github.raw+json")
      .then((r) => (r.ok ? r.text() : null))
      .catch(rethrowRateLimit),
    ghJson<{ login: string; contributions: number }[]>(`${base}/contributors?per_page=10`).catch(rethrowRateLimit),
  ]);

  const tree: TreeEntry[] = (treeRaw?.tree ?? [])
    .filter((t) => t.type === "blob")
    .map((t) => ({ path: t.path, size: t.size ?? 0 }));

  // Commits: newest 100, the total count, and the very first commit.
  let recentCommits: CommitInfo[] = [];
  let commitCount = 0;
  let firstCommit: Snapshot["firstCommit"] = null;

  if (commitsRes && commitsRes.ok) {
    const list = (await commitsRes.json()) as RawCommit[];
    recentCommits = list.map(toCommit);
    commitCount = list.length;

    if (list.length === 100) {
      // Count by asking for one commit per page and reading the last page number.
      const probe = await gh(`${base}/commits?per_page=1`).catch(rethrowRateLimit);
      const link = probe?.headers.get("link") ?? "";
      const last = /[?&]page=(\d+)>;\s*rel="last"/.exec(link);
      if (last) commitCount = Number(last[1]);
    }

    let firstRaw: RawCommit | undefined = list.at(-1);
    if (commitCount > list.length) {
      const page = await ghJson<RawCommit[]>(`${base}/commits?per_page=1&page=${commitCount}`).catch(rethrowRateLimit);
      if (page?.[0]) firstRaw = page[0];
    }
    if (firstRaw) {
      const detail = await ghJson<{ files?: unknown[] }>(`${base}/commits/${firstRaw.sha}`).catch(() => null);
      firstCommit = { ...toCommit(firstRaw), filesChanged: detail?.files ? detail.files.length : null };
    }
  }

  // Look inside a few hardware files so rules can tell empty designs from real ones.
  const fileText: Record<string, string> = {};
  await Promise.all(
    pickSamples(tree).map(async (path) => {
      try {
        const url = `https://raw.githubusercontent.com/${owner}/${repo}/${encodeURIComponent(info.default_branch)}/${path
          .split("/")
          .map(encodeURIComponent)
          .join("/")}`;
        const r = await fetch(url, {
          headers: { "User-Agent": "takeoff-repo-checker" },
          cache: "no-store",
          signal: AbortSignal.timeout(15_000),
        });
        if (r.ok) fileText[path] = (await r.text()).slice(0, 3_000_000);
      } catch {
        // A file that can't be read just means that rule is skipped.
      }
    })
  );

  return {
    owner,
    repo,
    fullName: info.full_name,
    htmlUrl: info.html_url,
    description: info.description,
    topics: info.topics ?? [],
    defaultBranch: info.default_branch,
    isFork: info.fork,
    parentFullName: info.parent?.full_name ?? null,
    archived: info.archived,
    createdAt: info.created_at,
    pushedAt: info.pushed_at,
    license: info.license?.spdx_id ?? null,
    tree,
    treeTruncated: !!treeRaw?.truncated,
    commitCount,
    recentCommits,
    firstCommit,
    contributors: contributors ?? [],
    readme: readme ?? null,
    fileText,
  };
}

// Non-essential calls may fail quietly, but a rate limit must reach the reviewer.
function rethrowRateLimit(e: unknown): null {
  if (e instanceof CheckError && e.code === "rate_limit") throw e;
  return null;
}
