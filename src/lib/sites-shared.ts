/**
 * Multi-site customers (client-safe): every customer row carries a lower-case `site` key
 * ("7fx", "mfx", …). The CRM shows all sites to admins with a filter.
 */

/** This deployment's own site key (customers registering here). */
export const DEFAULT_SITE = "7fx";

/** Sites always offered in the CRM filter even before they have customers. */
export const KNOWN_SITES: { key: string; label: string }[] = [
  { key: "7fx", label: "7FX" },
  { key: "mfx", label: "MFX" },
];

const SITE_RE = /^[a-z0-9][a-z0-9-]{0,31}$/;

/** Normalizes a site key; returns null when invalid. */
export function normalizeSiteKey(raw: unknown): string | null {
  if (raw == null) return null;
  const s = String(raw).trim().toLowerCase();
  return SITE_RE.test(s) ? s : null;
}

export function siteLabel(key: string | null | undefined): string {
  const k = (key || DEFAULT_SITE).toLowerCase();
  return KNOWN_SITES.find((s) => s.key === k)?.label ?? k.toUpperCase();
}

