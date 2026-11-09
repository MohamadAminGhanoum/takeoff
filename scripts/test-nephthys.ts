// Run with: npx tsx scripts/test-nephthys.ts
// Offline tests for the Nephthys helpers. No network needed.
import assert from "node:assert/strict";
import {
  countLinked, fmtChange, fmtMinutes, mergeTickets, parseStats, parseTickets,
  projectsForTicket, ticketsForAuthor,
} from "../lib/nephthys/summary";
import type { Project } from "../lib/sidekick/types";

let passed = 0;
const test = (name: string, fn: () => void) => { fn(); passed++; console.log("ok  ", name); };

const period = (o: Record<string, unknown> = {}) => ({
  new_tickets_total: 10, new_tickets_still_open: 3, new_tickets_in_progress: 2, closed_today: 5,
  mean_hang_time_minutes_all: 35, mean_resolution_time_minutes: 190, ...o,
});
const statsJson = {
  all_time: {
    tickets_total: 400, tickets_open: 12, tickets_closed: 380, tickets_in_progress: 8,
    helpers_leaderboard: [
      { id: 1, slack_id: "U0AAAAAA1", count: 90 },
      { id: 2, slack_id: "<script>", count: 5 },
      { id: 3, slack_id: "u0bbbbbb2", count: "x" },
    ],
    mean_hang_time_minutes_all: 42.5, mean_resolution_time_minutes: null,
    oldest_unanswered_ticket: { id: 77, created_at: "2026-11-01T00:00:00Z", age_minutes: 9000, link: "https://hackclub.slack.com/archives/C1/p1" },
  },
  past_24h: period(), past_24h_previous: period({ new_tickets_total: 8 }),
  past_7d: period({ new_tickets_total: 60 }), past_7d_previous: period({ new_tickets_total: 0 }),
};

test("parseStats reads a valid response", () => {
  const s = parseStats(statsJson)!;
  assert.equal(s.total, 400);
  assert.equal(s.open, 12);
  assert.equal(s.inProgress, 8);
  assert.equal(s.meanResolutionMin, null);
  assert.equal(s.day.now.newTickets, 10);
  assert.equal(s.day.prev.newTickets, 8);
  assert.equal(s.week.now.meanFirstResponseMin, 35);
  assert.equal(s.oldestUnanswered?.id, 77);
  assert.equal(s.oldestUnanswered?.link, "https://hackclub.slack.com/archives/C1/p1");
});
test("parseStats drops bad leaderboard rows and normalises ids", () => {
  const s = parseStats(statsJson)!;
  assert.deepEqual(s.leaderboard, [{ slackId: "U0AAAAAA1", count: 90 }, { slackId: "U0BBBBBB2", count: 0 }]);
});
test("parseStats refuses non-https links and junk input", () => {
  const bad = structuredClone(statsJson);
  bad.all_time.oldest_unanswered_ticket.link = "javascript:alert(1)";
  assert.equal(parseStats(bad)!.oldestUnanswered?.link, null);
  assert.equal(parseStats(null), null);
  assert.equal(parseStats([]), null);
  assert.equal(parseStats({ all_time: 5 }), null);
});
test("parseStats tolerates missing periods", () => {
  const s = parseStats({ all_time: { tickets_total: 3 } })!;
  assert.equal(s.total, 3);
  assert.equal(s.day.now.newTickets, 0);
  assert.equal(s.oldestUnanswered, null);
});

const raw = (o: Record<string, unknown> = {}) => ({
  id: 1, title: "Where is my package?", status: "OPEN",
  opened_by: { id: 5, slack_id: "u0aaaaaa1", username: "kid" }, assigned_to: null,
  category_tag: "Fulfillment", team_tags: ["shipping", 7], created_at: "2026-11-05T10:00:00Z", closed_at: null,
  description: "SECRET MESSAGE TEXT", ...o,
});

test("parseTickets keeps good tickets and ignores message text", () => {
  const [t] = parseTickets([raw()]);
  assert.equal(t.id, 1);
  assert.equal(t.status, "open");
  assert.equal(t.openedBy, "U0AAAAAA1");
  assert.deepEqual(t.teamTags, ["shipping"]);
  assert.ok(!JSON.stringify(t).includes("SECRET"));
});
test("parseTickets skips malformed entries and blanks AI placeholder titles", () => {
  const out = parseTickets([
    raw({ id: 2, title: "No title provided by AI." }),
    raw({ id: "x" }), raw({ status: "WEIRD" }), raw({ created_at: "" }), null, "str",
    raw({ id: 3, status: "in_progress", opened_by: null }),
  ]);
  assert.deepEqual(out.map((t) => t.id), [2, 3]);
  assert.equal(out[0].title, "");
  assert.equal(out[1].openedBy, null);
  assert.equal(out[1].status, "in_progress");
  assert.deepEqual(parseTickets({ error: "x" }), []);
});
test("mergeTickets dedupes by id, newest first", () => {
  const a = parseTickets([raw({ id: 1, created_at: "2026-11-01T00:00:00Z" }), raw({ id: 2, created_at: "2026-11-03T00:00:00Z" })]);
  const b = parseTickets([raw({ id: 1, status: "CLOSED", created_at: "2026-11-01T00:00:00Z" })]);
  const m = mergeTickets(a, b);
  assert.deepEqual(m.map((t) => t.id), [2, 1]);
  assert.equal(m[1].status, "closed");
});

test("fmtMinutes", () => {
  assert.equal(fmtMinutes(null), "–");
  assert.equal(fmtMinutes(0.2), "<1m");
  assert.equal(fmtMinutes(42.5), "43m");
  assert.equal(fmtMinutes(95), "1h 35m");
  assert.equal(fmtMinutes(120), "2h");
  assert.equal(fmtMinutes(119.7), "2h");
  assert.equal(fmtMinutes(2900), "2d 0h");
  assert.equal(fmtMinutes(-5), "–");
});
test("fmtChange", () => {
  assert.equal(fmtChange(12, 10), "+20%");
  assert.equal(fmtChange(5, 10), "-50%");
  assert.equal(fmtChange(4, 4), "same");
  assert.equal(fmtChange(3, 0), "new");
  assert.equal(fmtChange(null, 3), "–");
});

const proj = (id: string, authorId: string): Project => ({
  id, title: id, description: "", codeUrl: "", authorId, hackatimeProjectKeys: [], ships: [],
});
const tickets = parseTickets([
  raw({ id: 1 }), raw({ id: 2, opened_by: { slack_id: "U0CCCCCC3" } }), raw({ id: 3, opened_by: null }),
]);

test("ticketsForAuthor matches Slack IDs case-insensitively", () => {
  assert.deepEqual(ticketsForAuthor(tickets, " u0aaaaaa1 ").map((t) => t.id), [1]);
  assert.deepEqual(ticketsForAuthor(tickets, "U0CCCCCC3").map((t) => t.id), [2]);
});
test("ticketsForAuthor never matches non-Slack author ids", () => {
  assert.deepEqual(ticketsForAuthor(tickets, "kid@example.com"), []);
  assert.deepEqual(ticketsForAuthor(tickets, "6c97dab4-7b30-4ae8-9149-6c6c2aa616f5"), []);
  assert.deepEqual(ticketsForAuthor(tickets, undefined), []);
  assert.deepEqual(ticketsForAuthor(tickets, ""), []);
});
test("projectsForTicket and countLinked", () => {
  const ps = [proj("p1", "U0AAAAAA1"), proj("p2", "u0aaaaaa1"), proj("p3", "someone@x.com")];
  assert.deepEqual(projectsForTicket(ps, tickets.find((t) => t.id === 2)!), []); // opener has no project
  const t1 = tickets.find((t) => t.id === 1)!;
  assert.deepEqual(projectsForTicket(ps, t1).map((p) => p.id), ["p1", "p2"]);
  assert.deepEqual(projectsForTicket(ps, tickets.find((t) => t.id === 3)!), []);
  assert.equal(countLinked(ps, tickets), 1);
});

console.log(`\n${passed} tests passed`);
