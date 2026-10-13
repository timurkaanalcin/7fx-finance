import { SALE_STATUSES, POTENTIAL_STATUSES } from "@/lib/membership";

export type LeadStatusMapping = {
  /** saleStatus values counted as Valid */
  valid: string[];
  /** saleStatus values counted as Invalid */
  invalid: string[];
  /** potentialStatus values counted as Potential */
  potential: string[];
};

/** Defaults aligned with CRM sales funnel (TR desk language). */
export const DEFAULT_LEAD_STATUS_MAPPING: LeadStatusMapping = {
  valid: ["INTERESTED", "DEPOSITED", "CONVERTED", "RETENTION", "CONTACTED"],
  invalid: ["NOT_INTERESTED", "WRONG_NUMBER", "LOST", "DO_NOT_CALL"],
  potential: ["MEDIUM", "HIGH", "HOT"],
};

export const CALLBACK_SALE_STATUS = "CALLBACK";

export function parseLeadStatusMapping(raw: string | null | undefined): LeadStatusMapping {
  if (!raw || !String(raw).trim()) return { ...DEFAULT_LEAD_STATUS_MAPPING, valid: [...DEFAULT_LEAD_STATUS_MAPPING.valid], invalid: [...DEFAULT_LEAD_STATUS_MAPPING.invalid], potential: [...DEFAULT_LEAD_STATUS_MAPPING.potential] };
  try {
    const j = JSON.parse(String(raw)) as Partial<LeadStatusMapping>;
    const known = new Set(SALE_STATUSES as readonly string[]);
    const potKnown = new Set(POTENTIAL_STATUSES as readonly string[]);
    const valid = Array.isArray(j.valid) ? j.valid.map(String).filter((s) => known.has(s)) : DEFAULT_LEAD_STATUS_MAPPING.valid;
    const invalid = Array.isArray(j.invalid) ? j.invalid.map(String).filter((s) => known.has(s)) : DEFAULT_LEAD_STATUS_MAPPING.invalid;
    const potential = Array.isArray(j.potential)
      ? j.potential.map(String).filter((s) => potKnown.has(s))
      : DEFAULT_LEAD_STATUS_MAPPING.potential;
    return {
      valid: valid.length ? valid : [...DEFAULT_LEAD_STATUS_MAPPING.valid],
      invalid: invalid.length ? invalid : [...DEFAULT_LEAD_STATUS_MAPPING.invalid],
      potential: potential.length ? potential : [...DEFAULT_LEAD_STATUS_MAPPING.potential],
    };
  } catch {
    return {
      valid: [...DEFAULT_LEAD_STATUS_MAPPING.valid],
      invalid: [...DEFAULT_LEAD_STATUS_MAPPING.invalid],
      potential: [...DEFAULT_LEAD_STATUS_MAPPING.potential],
    };
  }
}

export function classifySaleStatus(
  saleStatus: string | null | undefined,
  mapping: LeadStatusMapping
): "valid" | "invalid" | "callback" | "other" {
  const s = String(saleStatus || "").trim().toUpperCase();
  if (!s) return "other";
  if (s === CALLBACK_SALE_STATUS) return "callback";
  if (s.startsWith("INV_")) return "invalid";
  if (mapping.valid.includes(s)) return "valid";
  if (mapping.invalid.includes(s)) return "invalid";
  return "other";
}

export function isPotentialLead(
  potentialStatus: string | null | undefined,
  mapping: LeadStatusMapping
): boolean {
  const p = String(potentialStatus || "").trim().toUpperCase();
  return Boolean(p && mapping.potential.includes(p));
}
