/** Pure helpers for CRM v4 round 11. Display only. */

export type DeskRow = {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  country?: string | null;
  desk?: string | null;
  campaign?: string | null;
  address?: string | null;
  city?: string | null;
  balance?: number | null;
  equity?: number | null;
  lastLoginAt?: string | null;
  createdAt?: string | null;
};

const TYPOS: Record<string, string> = {
  "gmial.com": "gmail.com",
  "gmal.com": "gmail.com",
  "gamil.com": "gmail.com",
  "hotmal.com": "hotmail.com",
  "yahooo.com": "yahoo.com",
  "outloo.com": "outlook.com",
};

export function similarCustomers(row: DeskRow, rows: DeskRow[]): DeskRow[] {
  return rows.filter((other) => {
    if (other.id === row.id) return false;
    const country = row.country && other.country && row.country === other.country;
    const desk = row.desk && other.desk && row.desk === other.desk;
    const campaign = row.campaign && other.campaign && row.campaign === other.campaign;
    return Boolean(country || desk || campaign);
  }).slice(0, 5);
}

export function isChurn(row: DeskRow, now = Date.now()): boolean {
  const login = row.lastLoginAt ? new Date(row.lastLoginAt).getTime() : 0;
  const created = row.createdAt ? new Date(row.createdAt).getTime() : now;
  const seen = login || created;
  if (!Number.isFinite(seen)) return false;
  const days = (now - seen) / 86400000;
  const balance = Number(row.balance) || 0;
  const equity = Number(row.equity);
  const decline = Number.isFinite(equity) && equity < balance;
  return days >= 14 && decline;
}

export function cityOf(row: DeskRow): string {
  const city = String(row.city || "").trim();
  if (city) return city;
  const address = String(row.address || "").trim();
  if (!address) return "";
  if (address.includes(",")) {
    const part = address.split(",").pop()?.trim() || "";
    return part.length >= 2 && part.length <= 40 ? part : "";
  }
  if (address.length <= 40 && !/\d/.test(address)) return address;
  return "";
}

export function phoneIssue(phone: string): "short" | "long" | null {
  if (!phone.trim()) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8) return "short";
  if (digits.length > 15) return "long";
  return null;
}

export function emailHint(email: string): { kind: "typo" | "invalid"; fix?: string } | null {
  const value = email.trim().toLowerCase();
  if (!value) return null;
  const at = value.indexOf("@");
  if (at < 1 || !value.slice(at + 1).includes(".")) return { kind: "invalid" };
  const domain = value.slice(at + 1);
  const fix = TYPOS[domain];
  if (fix) return { kind: "typo", fix: `${value.slice(0, at)}@${fix}` };
  return null;
}

export function capitalizeName(name: string): string {
  return name.trim().split(/\s+/).filter(Boolean).map((part) => {
    const lower = part.toLocaleLowerCase();
    return lower.charAt(0).toLocaleUpperCase() + lower.slice(1);
  }).join(" ");
}

export function minutesBetween(opened?: string | null, closed?: string | null): number | null {
  if (!opened || !closed) return null;
  const start = new Date(opened).getTime();
  const end = new Date(closed).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;
  return Math.round((end - start) / 60000);
}

export function meanMinutes(rows: { openedAt?: string | null; closedAt?: string | null; status?: string | null }[], status = "APPROVED"): number | null {
  const values = rows
    .filter((row) => String(row.status || "").toUpperCase() === status)
    .map((row) => minutesBetween(row.openedAt, row.closedAt))
    .filter((value): value is number => value != null);
  if (!values.length) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function backlogDays(rows: { openedAt?: string | null; status?: string | null }[]): { day: string; count: number }[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    if (String(row.status || "").toUpperCase() !== "PENDING") continue;
    const day = String(row.openedAt || "").slice(0, 10);
    if (day.length < 10) continue;
    map.set(day, (map.get(day) || 0) + 1);
  }
  return Array.from(map.entries()).map(([day, count]) => ({ day, count })).slice(0, 7);
}

const STOPS = new Set(["the", "and", "for", "with", "bir", "ve", "ile", "this", "that", "from"]);

export function wordCloud(text: string): { word: string; count: number }[] {
  const map = new Map<string, number>();
  for (const raw of text.toLowerCase().split(/\s+/)) {
    const word = raw.replace(/^[^a-z0-9\u00c0-\u024f]+|[^a-z0-9\u00c0-\u024f]+$/gi, "");
    if (word.length < 3 || STOPS.has(word)) continue;
    map.set(word, (map.get(word) || 0) + 1);
  }
  return Array.from(map.entries())
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);
}

export function qualityRows(rows: DeskRow[]): { id: string; label: string; problems: string[] }[] {
  const out: { id: string; label: string; problems: string[] }[] = [];
  for (const row of rows) {
    const problems: string[] = [];
    if (emailHint(String(row.email || ""))) problems.push("email");
    if (phoneIssue(String(row.phone || ""))) problems.push("phone");
    if (problems.length) out.push({ id: row.id, label: row.name || row.email || row.id, problems });
  }
  return out;
}

export function tryAmount(usd: number, rate: number): number {
  if (!(rate > 0) || !Number.isFinite(usd)) return usd;
  return Math.round(usd * rate * 100) / 100;
}

export function fillGreeting(template: string, vars: { name?: string; holiday?: string }): string {
  return template.replace(/\{\{\s*name\s*\}\}/g, vars.name || "").replace(/\{\{\s*holiday\s*\}\}/g, vars.holiday || "");
}
