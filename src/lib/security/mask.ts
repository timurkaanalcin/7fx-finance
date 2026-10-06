export function maskEmail(email: string | null | undefined): string {
  if (!email) return "—";
  const [u, d] = String(email).split("@");
  if (!d) return "***";
  const head = u.slice(0, Math.min(2, u.length));
  return `${head}***@${d}`;
}

export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "—";
  const s = String(phone).replace(/\s+/g, "");
  if (s.length <= 4) return "****";
  return `${"*".repeat(Math.max(0, s.length - 4))}${s.slice(-4)}`;
}

export function maskMoney(_n?: number | null): string {
  void _n;
  return "••••";
}

/** Apply RO masking to a membership / user JSON object (returns shallow copy). */
export function maskTraderForRoViewer<T extends Record<string, unknown>>(row: T): T {
  const o: Record<string, unknown> = { ...row };
  if ("email" in o) o.email = maskEmail(o.email as string);
  if ("phone" in o) o.phone = maskPhone(o.phone as string);
  if ("balance" in o) o.balance = null;
  if ("equity" in o) o.equity = null;
  if ("credit" in o) o.credit = null;
  if ("bonus" in o) o.bonus = null;
  if ("freeMargin" in o) o.freeMargin = null;
  if ("margin" in o) o.margin = null;
  if ("address" in o && o.address) o.address = "••••";
  return o as T;
}
