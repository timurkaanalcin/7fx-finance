export function fmtMoney(n: number, digits = 2): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) {
    return `USD ${(n / 1_000_000).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Mn`;
  }
  return `USD ${n.toLocaleString("tr-TR", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}

export function fmtNum(n: number, digits = 2): string {
  return n.toLocaleString("tr-TR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function fmtPct(n: number): string {
  return `%${fmtNum(n, 0)}`;
}

export function fmtDateTime(iso: string | Date | null | undefined): string {
  if (!iso) return "—";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleString("tr-TR", {
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
  if (h > 0) return `${h}s ${m}dk`;
  if (m > 0) return `${m}dk ${s}sn`;
  return `${s}sn`;
}
