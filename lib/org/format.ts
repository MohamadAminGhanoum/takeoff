const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const pad = (n: number) => String(n).padStart(2, "0");

/** "Nov 7". Always UTC so the server and browser agree. */
export function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

/** "Nov 7, 14:04" in UTC. */
export function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${fmtDate(iso)}, ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

/** "3d", "5h", "just now". */
export function fmtAge(iso: string, now = new Date()): string {
  const ms = now.getTime() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "";
  const h = ms / 3_600_000;
  if (h < 1) return "just now";
  if (h < 48) return `${Math.floor(h)}h`;
  return `${Math.floor(h / 24)}d`;
}
