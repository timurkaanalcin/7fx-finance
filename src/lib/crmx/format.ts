const INTL_LOCALE: Record<string, string> = {
  en: "en",
  tr: "tr",
  de: "de",
  ru: "ru",
  ar: "ar",
};

function intlLocale(locale?: string): string {
  if (!locale) return "en";
  return INTL_LOCALE[locale] || "en";
}

export function formatMoney(
  amount: number | null | undefined,
  currency?: string | null,
  locale?: string
): string {
  const n = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(n)) return "—";
  const code = currency && /^[A-Z]{3}$/.test(currency) ? currency : "USD";
  try {
    return new Intl.NumberFormat(intlLocale(locale), {
      style: "currency",
      currency: code,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${n.toFixed(2)} ${code}`;
  }
}

export function formatNumber(amount: number | null | undefined, locale?: string): string {
  const n = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat(intlLocale(locale), { maximumFractionDigits: 2 }).format(n);
}

export function formatWhen(value: string | number | Date | null | undefined, locale?: string): string {
  if (value == null || value === "") return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(intlLocale(locale), {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function startOfLocalDayIso(now = new Date()): string {
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

export function asText(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

export type StatusTone = "pending" | "ok" | "bad" | "neutral";

export function statusTone(status: string | null | undefined): StatusTone {
  const s = (status || "").toUpperCase();
  if (s === "PENDING") return "pending";
  if (s === "APPROVED" || s === "OPEN" || s === "FILLED") return "ok";
  if (s === "REJECTED" || s === "CANCELLED" || s === "CANCELED") return "bad";
  return "neutral";
}
