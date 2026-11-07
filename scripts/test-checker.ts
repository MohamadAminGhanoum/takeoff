// Run with: npx tsx scripts/test-checker.ts
// Offline tests for the repo checker rules. No network or API keys needed.
import assert from "node:assert/strict";
import { parseAi } from "../lib/checker/ai";
import { parseRepoUrl } from "../lib/checker/github";
import { analyzePcb, analyzeSchematic, bomRows, evaluate, pickSamples } from "../lib/checker/rules";
import type { Snapshot } from "../lib/checker/types";

const day = (n: number) => new Date(Date.UTC(2026, 9, 1 + n, 12)).toISOString();

const blank: Snapshot = {
  owner: "kid", repo: "thing", fullName: "kid/thing", htmlUrl: "https://github.com/kid/thing",
  description: null, topics: [], defaultBranch: "main", isFork: false, parentFullName: null,
  archived: false, createdAt: day(0), pushedAt: day(0), license: null,
  tree: [], treeTruncated: false, commitCount: 0, recentCommits: [], firstCommit: null,
  contributors: [], readme: null, fileText: {},
};

const ids = (s: Snapshot, ctx = {}) => evaluate(s, ctx).findings.map((f) => `${f.level}:${f.id}`);
let passed = 0;
const test = (name: string, fn: () => void) => {
  fn();
  passed++;
  console.log("ok  ", name);
};

/* ---- URL parsing ---- */
test("parseRepoUrl accepts normal github urls", () => {
  assert.deepEqual(parseRepoUrl("https://github.com/a/b"), { owner: "a", repo: "b" });
  assert.deepEqual(parseRepoUrl("https://github.com/a/b.git"), { owner: "a", repo: "b" });
  assert.deepEqual(parseRepoUrl("https://github.com/a/b/tree/main/pcb"), { owner: "a", repo: "b" });
});
test("parseRepoUrl rejects other hosts and junk", () => {
  assert.equal(parseRepoUrl("https://evil.com/a/b"), null);
  assert.equal(parseRepoUrl("http://github.com/a/b"), null);
  assert.equal(parseRepoUrl("https://github.com/a"), null);
  assert.equal(parseRepoUrl("https://github.com/a/b%2F..%2Fc"), null);
  assert.equal(parseRepoUrl("not a url"), null);
});

/* ---- content analysis ---- */
test("analyzePcb counts footprints, tracks and outline", () => {
  const a = analyzePcb('(footprint "R" ) (footprint "C" ) (segment (a)) (segment (b)) (via (at 1 1)) (layer "Edge.Cuts") (layer "Edge.Cuts")');
  assert.equal(a.footprints, 2);
  assert.equal(a.tracks, 2);
  assert.equal(a.vias, 1);
  assert.equal(a.outline, true);
});
test("analyzeSchematic ignores power symbols", () => {
  const a = analyzeSchematic('(symbol (lib_id "Device:R") ) (symbol (lib_id "power:GND") ) (wire (pts))');
  assert.equal(a.components, 1);
  assert.equal(a.wires, 1);
});
test("bomRows ignores header and blank lines", () => {
  assert.equal(bomRows("Ref,Value\nR1,10k\n\nR2,1k\n"), 2);
});
test("pickSamples prefers shallow files and skips huge ones", () => {
  const picked = pickSamples([
    { path: "a/b/c/deep.kicad_pcb", size: 1000 },
    { path: "board.kicad_pcb", size: 1000 },
    { path: "huge.kicad_pcb", size: 9_000_000 },
    { path: "bom.csv", size: 500 },
  ]);
  assert.deepEqual(picked, ["board.kicad_pcb", "a/b/c/deep.kicad_pcb", "bom.csv"]);
});

/* ---- scenarios ---- */
const emptyHardware: Snapshot = {
  ...blank,
  description: "A custom flight controller PCB for my RC plane",
  tree: [
    { path: "board.kicad_pcb", size: 5000 },
    { path: "main.ino", size: 800 },
    { path: "notes.txt", size: 10 },
  ],
  commitCount: 1,
  recentCommits: [{ sha: "a", date: day(1), message: "Add files via upload" }],
  firstCommit: { sha: "a", date: day(1), message: "Add files via upload", filesChanged: 40 },
  fileText: { "board.kicad_pcb": "(kicad_pcb (version 2))" },
};

test("empty hardware repo gets flagged hard", () => {
  const e = evaluate(emptyHardware, { hoursClaimed: 30 });
  const got = ids(emptyHardware, { hoursClaimed: 30 });
  assert.ok(got.includes("fail:one-commit"));
  assert.ok(got.includes("fail:no-readme"));
  assert.ok(got.includes("fail:pcb-empty:board.kicad_pcb"));
  assert.ok(got.includes("warn:no-bom"));
  assert.ok(got.includes("warn:no-photos"));
  assert.equal(e.verdict, "problems");
  assert.equal(e.kind, "both");
});

const goodReadme =
  "# Skyline flight controller\n\nA small flight controller for fixed-wing RC planes with an IMU and barometer. ".repeat(8) +
  "\n## Build\nParts are listed in the BOM. Wiring and pinout are in the schematic. Assembly takes an evening, then flash the firmware.\n" +
  "![assembled board](docs/photo.jpg)\n";
const goodDays = Array.from({ length: 12 }, (_, i) => day(i * 2));
const goodHardware: Snapshot = {
  ...blank,
  description: "Flight controller for RC planes",
  topics: ["drone", "kicad"],
  createdAt: day(0),
  tree: [
    { path: "hardware/fc.kicad_pcb", size: 90_000 },
    { path: "hardware/fc.kicad_sch", size: 60_000 },
    { path: "hardware/fc.kicad_pro", size: 3_000 },
    { path: "hardware/bom.csv", size: 900 },
    { path: "hardware/gerbers/fc-F_Cu.gbr", size: 4_000 },
    { path: "cad/case.f3d", size: 200_000 },
    { path: "cad/case.step", size: 300_000 },
    { path: "firmware/platformio.ini", size: 200 },
    { path: "firmware/src/main.cpp", size: 9_000 },
    { path: "firmware/src/imu.cpp", size: 4_000 },
    { path: "docs/photo.jpg", size: 500_000 },
    { path: "README.md", size: 1_200 },
  ],
  commitCount: 40,
  recentCommits: goodDays.map((d, i) => ({ sha: `c${i}`, date: d, message: `work ${i}` })).reverse(),
  firstCommit: { sha: "c0", date: day(0), message: "start", filesChanged: 3 },
  contributors: [{ login: "kid", contributions: 40 }],
  readme: goodReadme,
  fileText: {
    "hardware/fc.kicad_pcb": '(footprint "a") (footprint "b") (segment x) (segment y) (layer "Edge.Cuts") (layer "Edge.Cuts")',
    "hardware/fc.kicad_sch": '(symbol (lib_id "Device:R")) (wire (pts))',
    "hardware/bom.csv": "Ref,Value\nR1,10k\nR2,1k\nC1,1u\nU1,MCU\n",
  },
};

test("a solid hardware repo passes cleanly", () => {
  const e = evaluate(goodHardware, { hoursClaimed: 20 });
  const bad = e.findings.filter((f) => f.level === "fail" || f.level === "warn");
  assert.deepEqual(bad.map((f) => f.id), []);
  assert.equal(e.verdict, "solid");
  assert.equal(e.kind, "both");
  assert.ok(e.score >= 95);
});

test("claimed hours that exceed the commit timeline are warned", () => {
  const quick: Snapshot = {
    ...goodHardware,
    recentCommits: [
      { sha: "x2", date: "2026-10-01T15:00:00Z", message: "b" },
      { sha: "x1", date: "2026-10-01T12:00:00Z", message: "a" },
    ],
    firstCommit: { sha: "x1", date: "2026-10-01T12:00:00Z", message: "a", filesChanged: 3 },
    commitCount: 2,
  };
  assert.ok(ids(quick, { hoursClaimed: 40 }).includes("warn:hours-vs-span"));
  assert.ok(!ids(quick, { hoursClaimed: 2 }).includes("warn:hours-vs-span"));
});

test("template software repo is flagged", () => {
  const web: Snapshot = {
    ...blank,
    isFork: true,
    parentFullName: "someone/takeoff",
    tree: [
      { path: "app/page.tsx", size: 900 },
      { path: "package.json", size: 300 },
      { path: "node_modules/x/index.js", size: 10 },
      { path: ".env", size: 50 },
    ],
    commitCount: 2,
    recentCommits: [
      { sha: "b", date: day(1), message: "x" },
      { sha: "a", date: day(1), message: "y" },
    ],
    firstCommit: { sha: "a", date: day(1), message: "y", filesChanged: 4 },
    readme: "This is a Next.js project bootstrapped with `create-next-app`.\n".repeat(12),
  };
  const got = ids(web);
  assert.ok(got.includes("warn:fork"));
  assert.ok(got.includes("warn:junk"));
  assert.ok(got.includes("warn:secrets"));
  assert.ok(got.includes("warn:readme-template"));
  assert.ok(got.includes("warn:theme"));
  assert.ok(got.includes("warn:little-code"));
});

test("hardware claims without design files are flagged", () => {
  const talk: Snapshot = {
    ...blank,
    description: "Custom PCB and 3D printed drone",
    tree: [
      { path: "README.md", size: 800 },
      { path: "code.py", size: 3000 },
      { path: "image.png", size: 1000 },
    ],
    commitCount: 8,
    recentCommits: Array.from({ length: 8 }, (_, i) => ({ sha: `s${i}`, date: day(8 - i), message: "m" })),
    firstCommit: { sha: "s7", date: day(1), message: "m", filesChanged: 2 },
    readme: "A drone with a custom PCB and a printed frame. ".repeat(20),
  };
  assert.ok(ids(talk).includes("warn:no-hw-files"));
});

/* ---- AI reply parsing ---- */
test("parseAi handles reasoning blocks and bad values", () => {
  const raw = '<think>hmm {not json}</think>\nSure!\n{"matches_description":"maybe","aviation_theme":"yes","hardware_evidence":"strong","summary":"  Looks   fine.  ","concerns":["a","b","c","d"]}';
  const r = parseAi(raw, "m");
  assert.equal(r.matchesDescription, "unclear");
  assert.equal(r.aviationTheme, "yes");
  assert.equal(r.summary, "Looks fine.");
  assert.equal(r.concerns.length, 3);
});
test("parseAi throws on non-JSON", () => {
  assert.throws(() => parseAi("no json here", "m"));
});

console.log(`\n${passed} tests passed`);
