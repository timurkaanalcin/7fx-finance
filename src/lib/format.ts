export function fmtMoney(n: number, digits = 2, currency = "USD"): string {
  const code = String(currency || "USD")
    .trim()
    .toUpperCase()
    .slice(0, 8) || "USD";
  if (!Number.isFinite(n)) {
    return `${code} ${Number(0).toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
  }
  // Full amount — never abbreviate as K / M / Mn
  return `${code} ${n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}

export function fmtNum(n: number, digits = 2): string {
  if (!Number.isFinite(n)) {
    return Number(0).toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  }
  return n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function fmtPct(n: number): string {
  return `%${fmtNum(n, 0)}`;
}

export function fmtDateTime(iso: string | Date | null | undefined): string {
  if (!iso) return "—";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleString("en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function fmtDuration(from: string | Date, to?: string | Date | null): string {
  const start = new Date(from).getTime();
  const end = to ? new Date(to).getTime() : Date.now();
  const sec = Math.max(0, Math.floor((end - start) / 1000));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
