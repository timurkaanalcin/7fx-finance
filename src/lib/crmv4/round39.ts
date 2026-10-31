/** Pure helpers for CRM v4 round 39. Figures stay on the loaded rows. */

export const PHONE_WIDTHS = [360, 375, 390, 430] as const;

export function methodOn(row: { active?: boolean | null }): boolean {
  return row.active !== false;
}

export function activeMethods(rows: { active?: boolean | null }[]): number {
  return rows.filter((row) => methodOn(row)).length;
}

/** Customer counts per account currency. Amounts are not added. */
export function accountCurrencies(rows: { currency?: string | null }[]): { currency: string; count: number }[] {
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

export type SysSection = "methods" | "currencies" | "desks";

export function sysSection(raw: string | null): SysSection {
  if (raw === "currencies" || raw === "desks" || raw === "methods") return raw;
  return "methods";
}
