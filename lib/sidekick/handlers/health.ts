export async function healthCheck() {
  return { ok: true, version: "1.0.0" };
}