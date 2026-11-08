// Run with: npx tsx scripts/test-org.ts
// Offline tests for the org dashboard helpers.
import assert from "node:assert/strict";
import { csvCell, toCsv } from "../lib/org/csv";
import { fmtAge, fmtDate, fmtDateTime } from "../lib/org/format";
import {
  dailyBuckets, filterAudit, filterProjects, filterReviewers, paginate, parseAuditQuery,
  parseProjectQuery, splitEntries, statusCounts, waitingLongest, weeklyBuckets,
} from "../lib/org/stats";
import type { Project, ShipStatus } from "../lib/sidekick/types";

let passed = 0;
const test = (name: string, fn: () => void) => { fn(); passed++; console.log("ok  ", name); };

const NOW = new Date("2026-11-07T14:00:00Z"); // a Saturday; its week starts Mon Nov 2

const proj = (id: string, status: ShipStatus, submittedAt: string, hours = 5, extra: Partial<Project> = {}): Project => ({
  id, title: `Project ${id}`, description: "", codeUrl: `https://github.com/a/${id}`, authorId: `u-${id}`,
  hackatimeProjectKeys: [], ships: [{ id: `s${id}`, hoursSubmitted: hours, submittedAt, status }], ...extra,
});

const list: Project[] = [
  proj("a", "pending", "2026-11-05T10:00:00Z", 12),
  proj("b", "pending_hq", "2026-10-20T10:00:00Z", 3),
  proj("c", "approved", "2026-11-01T10:00:00Z", 40),
  proj("d", "rejected", "2026-10-28T10:00:00Z", 1),
];

test("csvCell escapes quotes, commas and formulas", () => {
  assert.equal(csvCell('a,"b"'), '"a,""b"""');
  assert.equal(csvCell("=SUM(A1)"), "'=SUM(A1)");
  assert.equal(csvCell("+1"), "'+1");
  assert.equal(csvCell(null), "");
  assert.equal(csvCell(7), "7");
});
test("toCsv joins rows with CRLF", () => {
  assert.equal(toCsv(["a", "b"], [[1, "x,y"]]), 'a,b\r\n1,"x,y"\r\n');
});

test("formatters use UTC", () => {
  assert.equal(fmtDate("2026-11-07T23:59:00Z"), "Nov 7");
  assert.equal(fmtDateTime("2026-11-07T04:05:00Z"), "Nov 7, 04:05");
  assert.equal(fmtDate("nope"), "");
  assert.equal(fmtAge("2026-11-07T13:30:00Z", NOW), "just now");
  assert.equal(fmtAge("2026-11-07T08:00:00Z", NOW), "6h");
  assert.equal(fmtAge("2026-11-02T14:00:00Z", NOW), "5d");
});

test("statusCounts groups pending_hq with pending", () => {
  const c = statusCounts(list);
  assert.deepEqual(c, { pending: 2, pendingHq: 1, approved: 1, rejected: 1, total: 4 });
});

test("weeklyBuckets counts per Monday week, oldest first", () => {
  const b = weeklyBuckets(
    ["2026-11-03T00:00:00Z", "2026-11-07T23:00:00Z", "2026-10-27T10:00:00Z", "2026-10-26T00:00:00Z", "2026-01-01T00:00:00Z", "bad"],
    NOW, 10
  );
  assert.equal(b.length, 10);
  assert.equal(b[9].label, "Nov 2");
  assert.equal(b[9].value, 2);
  assert.equal(b[8].label, "Oct 26");
  assert.equal(b[8].value, 2);
  assert.equal(b.reduce((n, x) => n + x.value, 0), 4);
});
test("weeklyBuckets ignores future dates", () => {
  assert.equal(weeklyBuckets(["2026-12-25T00:00:00Z"], NOW, 4).reduce((n, x) => n + x.value, 0), 0);
});
test("dailyBuckets covers today and drops older days", () => {
  const b = dailyBuckets(["2026-11-07T01:00:00Z", "2026-11-07T20:00:00Z", "2026-11-06T09:00:00Z", "2026-10-01T00:00:00Z"], NOW, 14);
  assert.equal(b.length, 14);
  assert.equal(b[13].label, "Nov 7");
  assert.equal(b[13].value, 2);
  assert.equal(b[12].value, 1);
  assert.equal(b.reduce((n, x) => n + x.value, 0), 3);
});

test("parseProjectQuery sanitises input", () => {
  assert.deepEqual(parseProjectQuery({ status: "weird", sort: "x", page: "-3", q: "  hi " }), { q: "hi", status: "all", sort: "newest", page: 1 });
  assert.deepEqual(parseProjectQuery({ status: "approved", sort: "hours", page: "2" }), { q: "", status: "approved", sort: "hours", page: 2 });
});
test("filterProjects filters by status, search and sort", () => {
  const ids = (q: Parameters<typeof filterProjects>[1]) => filterProjects(list, q).map((p) => p.id);
  assert.deepEqual(ids({ q: "", status: "pending", sort: "oldest" }), ["b", "a"]);
  assert.deepEqual(ids({ q: "", status: "pending", sort: "newest" }), ["a", "b"]);
  assert.deepEqual(ids({ q: "", status: "approved", sort: "newest" }), ["c"]);
  assert.deepEqual(ids({ q: "U-D", status: "all", sort: "newest" }), ["d"]);
  assert.deepEqual(ids({ q: "", status: "all", sort: "hours" }).slice(0, 2), ["c", "a"]);
});
test("paginate clamps the page", () => {
  const items = Array.from({ length: 60 }, (_, i) => i);
  const p = paginate(items, 99, 25);
  assert.equal(p.page, 3);
  assert.equal(p.pages, 3);
  assert.equal(p.items.length, 10);
  assert.equal(paginate([], 1).pages, 1);
});
test("waitingLongest lists the oldest pending first", () => {
  assert.deepEqual(waitingLongest(list, 2).map((p) => p.id), ["b", "a"]);
  assert.deepEqual(waitingLongest(list, 1).map((p) => p.id), ["b"]);
});

test("filterAudit filters by category and text", () => {
  const log = [
    { at: "1", actor: "u1", action: "reviewer.add", detail: "sam@x.com" },
    { at: "2", actor: "u2", action: "slack.post.help", detail: "Hello" },
    { at: "3", actor: "u1", action: "check.run", detail: "a/b score 90" },
  ];
  assert.equal(filterAudit(log, { q: "", cat: "slack" }).length, 1);
  assert.equal(filterAudit(log, { q: "SAM", cat: "all" }).length, 1);
  assert.equal(filterAudit(log, { q: "u1", cat: "all" }).length, 2);
  assert.deepEqual(parseAuditQuery({ cat: "../x", q: " a " }), { q: "a", cat: "all" });
});
test("filterReviewers and splitEntries", () => {
  const rs = [
    { key: "u0abc", slackId: "U0ABC", email: "sam@x.com", addedAt: "1" },
    { key: "bo@y.com", email: "bo@y.com", addedAt: "2" },
  ];
  assert.equal(filterReviewers(rs, "sam").length, 1);
  assert.equal(filterReviewers(rs, "").length, 2);
  assert.deepEqual(splitEntries("a@x.com, b@x.com\nU012345  a@x.com;"), ["a@x.com", "b@x.com", "U012345"]);
  assert.equal(splitEntries(Array.from({ length: 80 }, (_, i) => `u${i}`).join(" ")).length, 50);
});

console.log(`\n${passed} tests passed`);
