/** Safe CRM display helpers — avoid Invalid Date / raw float noise.
 *  All times use 24-hour clock (HH:mm:ss), never AM/PM.
 */

const DATE_TIME_OPTS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
};

export function fmtCrmDate(value: unknown): string {
  if (value == null || value === "") return "—";
  const d = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", DATE_TIME_OPTS);
}

/** datetime-local input value with seconds (local wall clock, 24h) */
export function toDatetimeLocalValue(value: unknown): string {
  if (value == null || value === "") return "";
  const d = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** Parse datetime-local / ISO to ISO string for API */
export function fromDatetimeLocalValue(value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function fmtCrmMoney(n: unknown, digits = 2): string {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return "—";
  return v.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function fmtCrmPrice(n: unknown, digits = 5): string {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return "—";
  const s = v.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: digits,
  });
  return s;
}

/** Opening notional / amount: lot × contractSize × price */
export function calcOpeningNotional(
  volume: number,
  contractSize: number,
  price: number
): number {
  if (![volume, contractSize, price].every(Number.isFinite) || volume <= 0 || price < 0) {
    return NaN;
  }
  return volume * contractSize * price;
}
