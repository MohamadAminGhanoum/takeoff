"use client";

import { useActionState } from "react";
import { runCheckAction, type CheckState } from "@/app/dashboard/reviewer/check/actions";
import type { CheckResult, Finding, Kind, Level, Verdict } from "@/lib/checker/types";

type Props = {
  /** A saved result to show before anything is run. */
  initial?: CheckResult | null;
  defaults?: { repoUrl?: string; description?: string; hours?: number; projectId?: string };
  /** Show the optional description and hours boxes (used on the standalone page). */
  askForDetails?: boolean;
  aiAvailable: boolean;
};

const VERDICT: Record<Verdict, { label: string; color: string }> = {
  solid: { label: "Looks solid", color: "text-emerald-300" },
  review: { label: "Worth a closer look", color: "text-amber-300" },
  problems: { label: "Likely has problems", color: "text-rose-300" },
};

const KIND: Record<Kind, string> = {
  hardware: "Hardware project",
  software: "Software project",
  both: "Hardware and software",
  unclear: "Type unclear",
};

const LEVEL: Record<Level, { label: string; color: string }> = {
  fail: { label: "Fail", color: "text-rose-300" },
  warn: { label: "Warn", color: "text-amber-300" },
  pass: { label: "OK", color: "text-emerald-300" },
  info: { label: "Note", color: "text-slate-400" },
};

const input =
  "w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none";

export default function CheckPanel({ initial, defaults, askForDetails, aiAvailable }: Props) {
  const [state, action, pending] = useActionState<CheckState, FormData>(runCheckAction, {
    result: initial ?? undefined,
  });
  const result = state.result;

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
      <h2 className="text-base font-semibold text-slate-100">Repo check</h2>

      <form action={action} className="mt-3 space-y-3">
        <label className="block">
          <span className="mb-1 block text-xs text-slate-400">GitHub repo</span>
          <input
            name="repoUrl"
            type="url"
            required
            defaultValue={state.fields?.repoUrl ?? defaults?.repoUrl ?? ""}
            placeholder="https://github.com/owner/repo"
            className={input}
          />
        </label>

        {askForDetails ? (
          <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
            <label className="block">
              <span className="mb-1 block text-xs text-slate-400">
                What the author says it is (optional)
              </span>
              <textarea
                name="description"
                rows={2}
                maxLength={4000}
                defaultValue={state.fields?.description ?? ""}
                className={input}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-slate-400">Hours claimed</span>
              <input
                name="hours"
                type="number"
                min={0}
                step="0.5"
                defaultValue={state.fields?.hours ?? ""}
                className={input}
              />
            </label>
          </div>
        ) : (
          <>
            <input type="hidden" name="description" value={defaults?.description ?? ""} />
            <input type="hidden" name="hours" value={defaults?.hours ?? ""} />
            <input type="hidden" name="projectId" value={defaults?.projectId ?? ""} />
          </>
        )}

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-60"
          >
            {pending ? "Checking..." : result ? "Run again" : "Run check"}
          </button>
          <label
            className={`flex items-center gap-2 text-sm ${aiAvailable ? "text-slate-300" : "text-slate-500"}`}
          >
            <input
              type="checkbox"
              name="withAi"
              defaultChecked={aiAvailable}
              disabled={!aiAvailable}
            />
            Add an AI read-through
            {!aiAvailable && <span className="text-xs">(set HACKCLUB_AI_KEY to enable)</span>}
          </label>
        </div>
      </form>

      {state.error && (
        <p className="mt-4 rounded-md border border-rose-900 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">
          {state.error}
        </p>
      )}

      {result && <Results result={result} />}
    </section>
  );
}

function Results({ result }: { result: CheckResult }) {
  const v = VERDICT[result.verdict];
  const fails = result.findings.filter((f) => f.level === "fail");
  const warns = result.findings.filter((f) => f.level === "warn");
  const rest = result.findings.filter((f) => f.level === "pass" || f.level === "info");
  const s = result.stats;

  return (
    <div className="mt-5 space-y-4 border-t border-slate-800 pt-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className={`text-lg font-semibold ${v.color}`}>
            {v.label} <span className="text-sm font-normal text-slate-400">({result.score}/100)</span>
          </p>
          <p className="text-sm text-slate-400">
            <a
              href={result.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-300 hover:underline"
            >
              {result.fullName}
            </a>{" "}
            · {KIND[result.kind]}
          </p>
        </div>
        <p className="text-xs text-slate-500">
          {s.commits} commits · {s.files} files
          {s.spanDays != null ? ` · ${Math.round(s.spanDays)} days of history` : ""}
          <br />
          Checked {result.checkedAt.slice(0, 16).replace("T", " ")} UTC
        </p>
      </div>

      {fails.length + warns.length === 0 ? (
        <p className="text-sm text-slate-300">No problems found by the rules.</p>
      ) : (
        <ul className="divide-y divide-slate-800/80 rounded-md border border-slate-800">
          {[...fails, ...warns].map((f) => (
            <FindingRow key={f.id} f={f} />
          ))}
        </ul>
      )}

      {rest.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-slate-400 hover:text-slate-200">
            {rest.length} passed or informational
          </summary>
          <ul className="mt-2 divide-y divide-slate-800/80 rounded-md border border-slate-800">
            {rest.map((f) => (
              <FindingRow key={f.id} f={f} />
            ))}
          </ul>
        </details>
      )}

      {result.ai ? (
        <div className="rounded-md border border-slate-800 p-3 text-sm">
          <p className="font-medium text-slate-200">AI read-through</p>
          <p className="mb-2 text-xs text-slate-500">
            Advisory only and not part of the score. Model: {result.ai.model}.
          </p>
          {result.ai.summary && <p className="text-slate-300">{result.ai.summary}</p>}
          <p className="mt-2 text-slate-400">
            Matches description: {result.ai.matchesDescription}. Aviation theme:{" "}
            {result.ai.aviationTheme}. Hardware evidence: {result.ai.hardwareEvidence}.
          </p>
          {result.ai.concerns.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-300">
              {result.ai.concerns.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        result.aiSkipped && <p className="text-xs text-slate-500">{result.aiSkipped}</p>
      )}

      <p className="text-xs text-slate-500">
        These checks look at files and history only. They can be wrong, so use them to decide
        what to look at, not whether to approve.
      </p>
    </div>
  );
}

function FindingRow({ f }: { f: Finding }) {
  const l = LEVEL[f.level];
  return (
    <li className="flex gap-3 px-3 py-2 text-sm">
      <span className={`w-10 shrink-0 pt-px text-xs font-medium ${l.color}`}>{l.label}</span>
      <div className="min-w-0">
        <p className="text-slate-200">{f.title}</p>
        <p className="break-words text-xs text-slate-400">{f.detail}</p>
      </div>
      <span className="ml-auto hidden shrink-0 pt-px text-xs text-slate-600 sm:block">{f.group}</span>
    </li>
  );
}
