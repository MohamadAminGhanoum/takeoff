import { redis } from "./redis";

const KEY = "takeoff:audit";

export type AuditEntry = { at: string; actor: string; action: string; detail: string };

export async function logAudit(actor: string, action: string, detail = "") {
  try {
    const entry: AuditEntry = {
      at: new Date().toISOString(),
      actor,
      action,
      detail: detail.slice(0, 300),
    };
    await redis("LPUSH", KEY, JSON.stringify(entry));
    await redis("LTRIM", KEY, 0, 199);
  } catch {
  }
}

export async function listAudit(limit = 50): Promise<AuditEntry[]> {
  const rows = (await redis<string[] | null>("LRANGE", KEY, 0, limit - 1)) ?? [];
  const out: AuditEntry[] = [];
  for (const r of rows) {
    try {
      out.push(JSON.parse(r) as AuditEntry);
    } catch {
    }
  }
  return out;
}