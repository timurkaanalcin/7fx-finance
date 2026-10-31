/** Pure helpers for CRM v4 round 38. Notices and segments stay on the loaded rows. */

export const READ_KEY = "crmv4-notif-read";

export type NoticeKind = "deposit" | "withdrawal" | "kyc" | "chat";

export type Notice = {
  id: string;
  kind: NoticeKind;
  name: string;
  amount?: number | null;
  currency?: string | null;
  at?: string | null;
};

export type NoticeInput = {
  deposits: { id: string; amount?: number | null; currency?: string | null; createdAt?: string | null; status?: string | null; user?: { name?: string | null } | null }[];
  withdrawals: { id: string; amount?: number | null; currency?: string | null; createdAt?: string | null; status?: string | null; user?: { name?: string | null } | null }[];
  people: { id: string; name?: string | null; documentsStatus?: string | null }[];
  threads: { traderId?: string | null; trader?: string | null; lastAt?: string | null; messages?: { workerId?: string | null; automatic?: boolean | null }[]; presence?: { adminLastReadAt?: string | null } | null }[];
};

export function readIds(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const ids: string[] = [];
    for (const item of parsed) {
      const id = String(item || "").trim();
      if (id && !ids.includes(id)) ids.push(id);
    }
    return ids.slice(-400);
  } catch {
    return [];
  }
}

export function withRead(ids: string[], id: string): string[] {
  if (!id || ids.includes(id)) return ids;
  return [...ids, id].slice(-400);
}

export function buildNotices(input: NoticeInput): Notice[] {
  const notes: Notice[] = [];
  for (const row of input.deposits) {
    if (row.status && String(row.status).toUpperCase() !== "PENDING") continue;
    notes.push({ id: `dep:${row.id}`, kind: "deposit", name: String(row.user?.name || ""), amount: row.amount, currency: row.currency, at: row.createdAt });
  }
  for (const row of input.withdrawals) {
    if (row.status && String(row.status).toUpperCase() !== "PENDING") continue;
    notes.push({ id: `wd:${row.id}`, kind: "withdrawal", name: String(row.user?.name || ""), amount: row.amount, currency: row.currency, at: row.createdAt });
  }
  for (const row of input.people) {
    if (String(row.documentsStatus || "NONE").toUpperCase() === "APPROVED") continue;
    notes.push({ id: `kyc:${row.id}`, kind: "kyc", name: String(row.name || "") });
  }
  for (const row of input.threads) {
    const last = row.messages && row.messages.length ? row.messages[row.messages.length - 1] : null;
    const open = (last && !last.workerId && !last.automatic) || !row.presence?.adminLastReadAt;
    if (!open || !row.traderId) continue;
    notes.push({ id: `chat:${row.traderId}`, kind: "chat", name: String(row.trader || ""), at: row.lastAt });
  }
  return notes;
}

export function unreadCount(notes: Notice[], read: string[]): number {
  return notes.filter((row) => !read.includes(row.id)).length;
}

export type SegCustomer = {
  id: string;
  name?: string | null;
  country?: string | null;
  saleStatus?: string | null;
  documentsStatus?: string | null;
  ftd?: boolean | null;
  currency?: string | null;
};

export type SegPick = { country: string; stage: string; kyc: string; deposit: "" | "yes" | "no"; currency: string };

export const EMPTY_PICK: SegPick = { country: "", stage: "", kyc: "", deposit: "", currency: "" };

export function segmentRows(rows: SegCustomer[], pick: SegPick): SegCustomer[] {
  return rows.filter((row) => {
    if (pick.country && String(row.country || "").trim().toUpperCase() !== pick.country.toUpperCase()) return false;
    if (pick.stage && String(row.saleStatus || "").trim().toUpperCase() !== pick.stage.toUpperCase()) return false;
    if (pick.kyc && String(row.documentsStatus || "NONE").trim().toUpperCase() !== pick.kyc.toUpperCase()) return false;
    if (pick.deposit === "yes" && !row.ftd) return false;
    if (pick.deposit === "no" && row.ftd) return false;
    if (pick.currency && String(row.currency || "").trim().toUpperCase() !== pick.currency.toUpperCase()) return false;
    return true;
  });
}

export function uniqueValues(rows: SegCustomer[], key: "country" | "saleStatus" | "documentsStatus" | "currency"): string[] {
  const list: string[] = [];
  for (const row of rows) {
    const value = String(row[key] || "").trim();
    if (value && !list.includes(value)) list.push(value);
  }
  return list.sort((a, b) => a.localeCompare(b));
}

/** Customer counts per currency. Amounts are not added. */
export function currencyCounts(rows: SegCustomer[]): { currency: string; count: number }[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const currency = String(row.currency || "").trim().toUpperCase();
    if (!currency) continue;
    map.set(currency, (map.get(currency) || 0) + 1);
  }
  const out: { currency: string; count: number }[] = [];
  map.forEach((count, currency) => out.push({ currency, count }));
  return out.sort((a, b) => a.currency.localeCompare(b.currency));
}

export function segmentLines(rows: SegCustomer[]): string[][] {
  return rows.map((row) => [
    String(row.name || ""),
    String(row.country || ""),
    String(row.saleStatus || ""),
    String(row.documentsStatus || "NONE"),
    row.ftd ? "yes" : "no",
    String(row.currency || ""),
  ]);
}
