/** Tiny JSON fetch helper for CRM pages (client-side). */
export type CrmApiResult = {
  ok: boolean;
  status: number;
  error?: string;
  data?: Record<string, unknown>;
};

export async function crmJson(url: string, method: string, body?: unknown): Promise<CrmApiResult> {
  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) return { ok: false, status: res.status, error: String(data.error || res.status), data };
    return { ok: true, status: res.status, data };
  } catch {
    return { ok: false, status: 0, error: "Connection error" };
  }
}

/** yyyy-mm-dd (local) → ISO at local start / end of that day */
export function dayStartIso(d: string): string | null {
  if (!d) return null;
  const t = new Date(`${d}T00:00:00`);
  return Number.isNaN(t.getTime()) ? null : t.toISOString();
}
export function dayEndIso(d: string): string | null {
  if (!d) return null;
  const t = new Date(`${d}T23:59:59.999`);
  return Number.isNaN(t.getTime()) ? null : t.toISOString();
}
