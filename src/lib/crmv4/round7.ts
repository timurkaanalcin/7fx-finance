/** Pure helpers for CRM v4 round 7. */

export type ProfileBits = {
  name?: string | null;
  phone?: string | null;
  country?: string | null;
  email?: string | null;
  language?: string | null;
  documentsStatus?: string | null;
};

const CHECKS: (keyof ProfileBits)[] = ["name", "phone", "country", "email", "language", "documentsStatus"];

export function completeness(row: ProfileBits): { score: number; missing: (keyof ProfileBits)[] } {
  const missing = CHECKS.filter((key) => {
    const value = String(row[key] || "").trim();
    if (!value) return true;
    if (key === "documentsStatus" && value.toUpperCase() !== "APPROVED") return true;
    return false;
  });
  const score = Math.round(((CHECKS.length - missing.length) / CHECKS.length) * 100);
  return { score, missing };
}

export function filterActivity<T extends { kind?: string | null }>(rows: T[], kind: string): T[] {
  if (!kind) return rows;
  return rows.filter((row) => String(row.kind || "").toUpperCase() === kind.toUpperCase());
}

export type LeadRow = { email: string; name: string; phone: string; country: string; line: number; error: string };

export function parseLeadCsv(text: string): LeadRow[] {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const start = lines[0] && /email/i.test(lines[0]) ? 1 : 0;
  return lines.slice(start).map((line, index) => {
    const [email = "", name = "", phone = "", country = ""] = line.split(",").map((cell) => cell.trim());
    let error = "";
    if (!email.includes("@")) error = "email";
    else if (!name) error = "name";
    return { email, name, phone, country, line: start + index + 1, error };
  });
}

export function duplicateLeads(rows: { email: string }[], known: string[]): string[] {
  const have = new Set(known.map((email) => email.toLowerCase()));
  const seen = new Set<string>();
  const dups: string[] = [];
  for (const row of rows) {
    const email = row.email.toLowerCase();
    if (!email) continue;
    if (have.has(email) || seen.has(email)) dups.push(email);
    seen.add(email);
  }
  return dups;
}

export function sourceMix(rows: { campaign?: string | null; utmSource?: string | null }[]): { source: string; count: number }[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const source = String(row.utmSource || row.campaign || "—").trim() || "—";
    map.set(source, (map.get(source) || 0) + 1);
  }
  return Array.from(map.entries()).map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count);
}

export function staleCallbacks<T extends { id: string; retentionFollowUpAt?: string | null }>(rows: T[], now = Date.now(), days = 2): T[] {
  return rows.filter((row) => {
    if (!row.retentionFollowUpAt) return false;
    const at = new Date(row.retentionFollowUpAt).getTime();
    return Number.isFinite(at) && now - at > days * 86400000;
  });
}

export function statusDiffs(prev: Record<string, string>, next: { id: string; saleStatus?: string | null; name?: string | null }[]): { id: string; name: string; from: string; to: string }[] {
  const found: { id: string; name: string; from: string; to: string }[] = [];
  for (const row of next) {
    const before = prev[row.id];
    const after = row.saleStatus || "";
    if (before != null && before !== after) found.push({ id: row.id, name: row.name || row.id, from: before || "—", to: after || "—" });
  }
  return found;
}

export function commissionOf(amount: number, ratePct: number): number {
  if (ratePct <= 0) return 0;
  return Math.round(amount * (ratePct / 100) * 100) / 100;
}

export function weekKeys(anchor = new Date()): string[] {
  const day = anchor.getUTCDay();
  const start = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), anchor.getUTCDate() - day));
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    return date.toISOString().slice(0, 10);
  });
}

export function sameDay(value: string | null | undefined, day: string): boolean {
  return Boolean(value && value.slice(0, 10) === day);
}
