/** Local porter slips, and customer counts grouped by the validation status already on each row. */

export const PORTER_KEY = "crmv4-porter-slips";
export const VALIDATION_KEY = "crmv4-val-hide";

export type Slip = {
  id: string;
  text: string;
  wing: string;
  pinned: boolean;
  called: boolean;
  hidden: boolean;
};

export type SlipTray = "open" | "called" | "hidden";

export type ValidationValue =
  | {
      validation?: unknown;
      saleStatus?: unknown;
      retentionStatus?: unknown;
      potentialStatus?: unknown;
      documentsStatus?: unknown;
      accountType?: unknown;
      role?: unknown;
      timezone?: unknown;
      language?: unknown;
    }
  | string
  | null
  | undefined;

export type ValidationRow = { validation?: ValidationValue; label?: string | null };

export type ValidationLine = { validation: string; count: number };

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

/** A blank slip is left out. The saved text stays short. */
export function slipText(raw: unknown): string {
  return clip(raw, 100);
}

/** A blank wing stays blank. It is not filled in. */
export function wingLabel(raw: unknown): string {
  return clip(raw, 12);
}

export function readSlips(raw: unknown): Slip[] {
  if (!Array.isArray(raw)) return [];
  const out: Slip[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Slip>;
    const id = String(row.id || "").trim();
    const text = slipText(row.text);
    if (!id || !text || out.some((slip) => slip.id === id)) continue;
    out.push({
      id,
      text,
      wing: wingLabel(row.wing),
      pinned: row.pinned === true,
      called: row.called === true,
      hidden: row.hidden === true,
    });
  }
  return out.slice(0, 36);
}

export function addSlip(slips: readonly Slip[], slip: { id: string; text: string; wing?: string }): Slip[] {
  const current = readSlips(slips);
  const id = String(slip.id || "").trim();
  const text = slipText(slip.text);
  const wing = wingLabel(slip.wing);
  if (!id || !text || current.some((item) => item.id === id || item.text === text)) return current;
  return [{ id, text, wing, pinned: false, called: false, hidden: false }, ...current].slice(0, 36);
}

export function toggleSlipPin(slips: readonly Slip[], id: string): Slip[] {
  return readSlips(slips).map((slip) => (slip.id === id ? { ...slip, pinned: !slip.pinned } : slip));
}

export function setSlipCalled(slips: readonly Slip[], id: string, called: boolean): Slip[] {
  return readSlips(slips).map((slip) => (slip.id === id ? { ...slip, called } : slip));
}

export function setSlipHidden(slips: readonly Slip[], id: string, hidden: boolean): Slip[] {
  return readSlips(slips).map((slip) => (slip.id === id ? { ...slip, hidden } : slip));
}

export function resetSlips(): Slip[] {
  return [];
}

/** Copy uses the slip text. A blank slip copies nothing. */
export function slipCopy(raw: unknown): string {
  return slipText(raw);
}

function csvCell(value: string): string {
  if (/[",]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the slips saved in this browser. The wing stays a column, not a search field. */
export function slipsCsv(raw: unknown): string {
  const lines = ["text,wing,pinned,called,hidden"];
  for (const slip of readSlips(raw)) {
    lines.push([
      csvCell(slip.text),
      csvCell(slip.wing),
      slip.pinned ? "1" : "0",
      slip.called ? "1" : "0",
      slip.hidden ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}

/** Search stays on the slip text. The wing is not part of the query. */
export function visibleSlips(slips: readonly Slip[], tray: SlipTray, query: string): Slip[] {
  const text = query.trim().toLowerCase();
  return readSlips(slips)
    .filter((slip) => {
      const inTray = tray === "hidden" ? slip.hidden : tray === "called" ? slip.called && !slip.hidden : !slip.called && !slip.hidden;
      return inTray && (!text || slip.text.toLowerCase().includes(text));
    })
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return a.text.localeCompare(b.text);
    });
}

/**
 * The validation status already on the trader row.
 * A sale status, a retention status, a potential status, a KYC status, an account type, a role, a timezone, or a language is not validation.
 */
export function validationText(value: ValidationValue): string {
  if (typeof value === "string") return value.replace(/\s+/g, " ").trim();
  if (!value || typeof value !== "object") return "";
  if (
    "saleStatus" in value
    || "retentionStatus" in value
    || "potentialStatus" in value
    || "documentsStatus" in value
    || "accountType" in value
    || "role" in value
    || "timezone" in value
    || "language" in value
  ) return "";
  return typeof value.validation === "string" ? value.validation.replace(/\s+/g, " ").trim() : "";
}

export function validationLines(rows: readonly ValidationRow[]): ValidationLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const validation = validationText(row.validation);
    map.set(validation, (map.get(validation) || 0) + 1);
  }
  const out: ValidationLine[] = [];
  map.forEach((count, validation) => out.push({ validation, count }));
  return out.sort((a, b) => {
    if (!a.validation) return -1;
    if (!b.validation) return 1;
    return a.validation.localeCompare(b.validation);
  });
}

export function namedValidations(rows: readonly ValidationRow[]): string[] {
  return validationLines(rows).map((line) => line.validation).filter(Boolean);
}

/** Share of the loaded rows. A zero total stays at zero. */
export function validationShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** The named status with the most loaded rows. A tie keeps the earlier name. */
export function leadingValidation(rows: readonly ValidationRow[]): string {
  const named = validationLines(rows).filter((line) => line.validation);
  if (!named.length) return "";
  return named
    .slice()
    .sort((a, b) => b.count - a.count || a.validation.localeCompare(b.validation))[0].validation;
}

export function readHiddenValidations(raw: unknown, present: readonly string[]): string[] {
  const allow = new Set(present.map((item) => validationText(item)).filter(Boolean));
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const validation = validationText(String(item || ""));
    if (!validation || !allow.has(validation) || out.includes(validation)) continue;
    out.push(validation);
  }
  return out;
}

export function toggleValidation(hidden: readonly string[], validation: string, present: readonly string[]): string[] {
  const current = readHiddenValidations(hidden, present);
  const next = validationText(validation);
  if (!next || !present.map((item) => validationText(item)).includes(next)) return current;
  return current.includes(next) ? current.filter((item) => item !== next) : [...current, next];
}

export function visibleValidations(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenValidations(hidden, present));
  return namedValidations(present.map((validation) => ({ validation }))).filter((validation) => (showHidden ? gone.has(validation) : !gone.has(validation)));
}

export function activeValidation(selected: string, visible: readonly string[]): string {
  const validation = validationText(selected);
  if (!validation) return "";
  return visible.some((item) => validationText(item) === validation) ? validation : "";
}

export function visibleCustomers<T extends ValidationRow>(rows: readonly T[], validation: string, blank: boolean, query: string): T[] {
  const want = validationText(validation);
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const got = validationText(row.validation);
    if (blank) {
      if (got) return false;
    } else if (want && got !== want) return false;
    if (!text) return true;
    return `${row.label || ""} ${got}`.toLowerCase().includes(text);
  });
}
