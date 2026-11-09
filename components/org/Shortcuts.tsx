"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const HELP: [string, string][] = [
  ["/", "Focus the search box"],
  ["j / k", "Next / previous row"],
  ["Enter", "Open the selected row"],
  ["1 – 7", "Switch tab"],
  ["?", "Show or hide this list"],
  ["Esc", "Close this list or leave a field"],
];

const typing = (el: EventTarget | null) =>
  el instanceof HTMLElement &&
  (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));

/** Keyboard shortcuts for the org dashboard. Renders only the help box. */
export default function Shortcuts() {
  const router = useRouter();
  const [help, setHelp] = useState(false);

  useEffect(() => {
    let current = -1;

    const rows = () => Array.from(document.querySelectorAll<HTMLElement>("[data-row-href]"));
    const select = (i: number) => {
      const list = rows();
      if (list.length === 0) return;
      current = Math.max(0, Math.min(list.length - 1, i));
      list.forEach((r, idx) => r.setAttribute("data-selected", String(idx === current)));
      list[current].scrollIntoView({ block: "nearest" });
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setHelp(false);
        if (typing(e.target)) (e.target as HTMLElement).blur();
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey || typing(e.target)) return;

      if (e.key === "?") {
        e.preventDefault();
        setHelp((v) => !v);
      } else if (e.key === "/") {
        const box = document.querySelector<HTMLInputElement>("[data-search]");
        if (box) {
          e.preventDefault();
          box.focus();
          box.select();
        }
      } else if (e.key === "j") select(current + 1);
      else if (e.key === "k") select(current - 1);
      else if (e.key === "Enter" && current >= 0) {
        const href = rows()[current]?.getAttribute("data-row-href");
        if (href) router.push(href);
      } else if (/^[1-7]$/.test(e.key)) {
        const link = document.querySelector<HTMLAnchorElement>(`[data-tab-key="${e.key}"]`);
        if (link) router.push(link.getAttribute("href") ?? "/dashboard/org");
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [router]);

  return (
    <>
      <button
        type="button"
        onClick={() => setHelp((v) => !v)}
        className="text-xs text-slate-500 hover:text-slate-300"
        aria-expanded={help}
      >
        Shortcuts (?)
      </button>
      {help && (
        <div
          role="dialog"
          aria-label="Keyboard shortcuts"
          className="fixed bottom-4 right-4 z-50 w-64 border border-slate-700 bg-slate-900 p-3 text-xs shadow-lg"
        >
          <table className="w-full">
            <tbody>
              {HELP.map(([k, d]) => (
                <tr key={k}>
                  <td className="py-0.5 pr-3 font-mono text-slate-200">{k}</td>
                  <td className="py-0.5 text-slate-400">{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
