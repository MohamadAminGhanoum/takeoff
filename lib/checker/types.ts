export type Level = "pass" | "warn" | "fail" | "info";

export type Group =
  | "Repository"
  | "History"
  | "Hardware"
  | "Software"
  | "Docs"
  | "Originality";

export type Finding = {
  id: string;
  group: Group;
  level: Level;
  title: string;
  detail: string;
};

export type TreeEntry = { path: string; size: number };

export type CommitInfo = {
  sha: string;
  date: string; // ISO 8601
  message: string;
  author?: string;
};

/** Everything the rules need, collected from GitHub. Pure data, no network. */
export type Snapshot = {
  owner: string;
  repo: string;
  fullName: string;
  htmlUrl: string;
  description: string | null;
  topics: string[];
  defaultBranch: string;
  isFork: boolean;
  parentFullName: string | null;
  archived: boolean;
  createdAt: string;
  pushedAt: string;
  license: string | null;
  tree: TreeEntry[];
  treeTruncated: boolean;
  commitCount: number;
  /** Newest first, up to 100. */
  recentCommits: CommitInfo[];
  firstCommit: (CommitInfo & { filesChanged: number | null }) | null;
  contributors: { login: string; contributions: number }[];
  readme: string | null;
  /** Contents of a few sampled hardware files, keyed by path. */
  fileText: Record<string, string>;
};

/** Facts from the submission itself (not from GitHub). */
export type Context = {
  description?: string;
  hoursClaimed?: number;
};

export type Kind = "hardware" | "software" | "both" | "unclear";
export type Verdict = "solid" | "review" | "problems";

export type Stats = {
  files: number;
  sourceFiles: number;
  sourceBytes: number;
  commits: number;
  spanDays: number | null;
  activeDays: number | null;
  pcbFiles: number;
  schematicFiles: number;
  gerberFiles: number;
  bomFiles: number;
  cadFiles: number;
  images: number;
};

export type Evaluation = {
  kind: Kind;
  verdict: Verdict;
  score: number;
  findings: Finding[];
  stats: Stats;
};

export type AiReview = {
  matchesDescription: "yes" | "partly" | "no" | "unclear";
  aviationTheme: "yes" | "weak" | "no";
  hardwareEvidence: "strong" | "some" | "none" | "n/a";
  summary: string;
  concerns: string[];
  model: string;
};

export type CheckResult = Evaluation & {
  repoUrl: string;
  fullName: string;
  htmlUrl: string;
  checkedAt: string;
  projectId?: string;
  /** Present when the AI step ran. */
  ai?: AiReview;
  /** Why the AI step did not run (shown to the reviewer). */
  aiSkipped?: string;
};
