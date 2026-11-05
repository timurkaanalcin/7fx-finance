/** Rejected orders from the loaded list, and local vault labels. No secrets are stored. */

export const PIN_KEY = "crmv3-reject-pins";
export const VAULT_KEY = "crmv3-vault-hints";

export const EXCEPTION_STATUSES = ["REJECTED", "CANCELLED"] as const;

export type OrderRow = {
  id: string;
  symbol?: string | null;
  side?: string | null;
  type?: string | null;
  volume?: number | null;
  price?: number | null;
  status?: string | null;
  createdAt?: string | null;
  traderName?: string | null;
  userId?: string | null;
  user?: { id?: string | null; name?: string | null } | null;
};

export type VaultHint = {
  id: string;
  label: string;
  login?: string;
  pinned: boolean;
  at: string;
};

const SECRET = /password|passwd|secret|token|bearer|api[_-]?key|private key|BEGIN /i;

/** A label only. Passwords, tokens, and long secret-shaped text are refused. */
export function looksSecret(raw: string): boolean {
  const text = String(raw || "").trim();
  if (!text) return false;
  if (SECRET.test(text)) return true;
  const compact = text.replace(/\s+/g, "");
  return compact.length >= 24 && /^[A-Za-z0-9+/=._-]+$/.test(compact);
}

export function orderStatus(row: { status?: string | null }): string {
  return String(row.status || "").trim().toUpperCase();
}

/** Only rejected and cancelled rows. Other loaded statuses stay off the board. */
export function exceptionRows(rows: readonly OrderRow[]): OrderRow[] {
  return rows.filter((row) => {
    const status = orderStatus(row);
    return Boolean(row.id) && (EXCEPTION_STATUSES as readonly string[]).includes(status);
  });
}

export function filterExceptions(rows: readonly OrderRow[], status: string, query: string): OrderRow[] {
  const want = status.trim().toUpperCase();
  const text = query.trim().toLowerCase();
  return exceptionRows(rows).filter((row) => {
    if (want && orderStatus(row) !== want) return false;
    if (!text) return true;
    const name = row.traderName || row.user?.name || "";
    return `${row.symbol || ""} ${row.side || ""} ${row.type || ""} ${name} ${orderStatus(row)}`.toLowerCase().includes(text);
  });
}

export function readIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const id = String(item || "").trim();
    if (id && !out.includes(id)) out.push(id);
  }
  return out.slice(0, 200);
}

export function toggleId(ids: readonly string[], id: string): string[] {
  if (!id) return ids.slice();
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
}

export function sortExceptions(rows: readonly OrderRow[], pins: readonly string[]): OrderRow[] {
  return rows.slice().sort((a, b) => {
    const ap = pins.includes(a.id);
    const bp = pins.includes(b.id);
    if (ap !== bp) return ap ? -1 : 1;
    return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
  });
}

export function cleanLabel(raw: string): string {
  return String(raw || "").replace(/\s+/g, " ").trim().slice(0, 60);
}

export function readHints(raw: unknown): VaultHint[] {
  if (!Array.isArray(raw)) return [];
  const out: VaultHint[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<VaultHint>;
    const id = String(row.id || "").trim();
    const label = cleanLabel(String(row.label || ""));
    const login = cleanLabel(String(row.login || ""));
    if (!id || !label || looksSecret(label) || looksSecret(login)) continue;
    if (out.some((hint) => hint.id === id)) continue;
    out.push({ id, label, ...(login ? { login } : {}), pinned: row.pinned === true, at: String(row.at || "") });
  }
  return out.slice(0, 40);
}

/** A blank label is left out. A secret-shaped value is refused. */
export function addHint(hints: readonly VaultHint[], hint: { id: string; label: string; login: string; at: string }): VaultHint[] | null {
  const id = String(hint.id || "").trim();
  const label = cleanLabel(hint.label);
  const login = cleanLabel(hint.login);
  if (!id || !label) return hints.slice();
  if (looksSecret(label) || looksSecret(login)) return null;
  if (hints.some((item) => item.id === id)) return hints.slice();
  return [{ id, label, ...(login ? { login } : {}), pinned: false, at: hint.at }, ...hints].slice(0, 40);
}

export function toggleHintPin(hints: readonly VaultHint[], id: string): VaultHint[] {
  return hints.map((hint) => (hint.id === id ? { ...hint, pinned: !hint.pinned } : hint));
}

export function removeHint(hints: readonly VaultHint[], id: string): VaultHint[] {
  return hints.filter((hint) => hint.id !== id);
}

export function visibleHints(hints: readonly VaultHint[], query: string): VaultHint[] {
  const text = query.trim().toLowerCase();
  return hints
    .filter((hint) => !text || `${hint.label} ${hint.login || ""}`.toLowerCase().includes(text))
    .slice()
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return String(b.at).localeCompare(String(a.at));
    });
}
