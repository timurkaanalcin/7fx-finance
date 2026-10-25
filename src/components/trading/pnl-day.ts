import type { PositionRow } from "./types";

/** Local-time YYYY-MM-DD key for an ISO timestamp ("" when unparseable). */
export function localDayKey(iso: string | null | undefined): string {
  const t = Date.parse(String(iso ?? ""));
  if (!Number.isFinite(t)) return "";
  const d = new Date(t);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Day a closed trade is booked on (close time, falling back to open time). */
export function closedDayKey(p: Pick<PositionRow, "closedAt" | "openedAt">): string {
  return localDayKey(p.closedAt ?? p.openedAt);
}
