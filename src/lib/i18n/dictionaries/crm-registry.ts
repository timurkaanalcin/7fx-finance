import type { Locale } from "../locales";
import type { Dict } from "../types";

/** Filled by the CRM layout. Public pages do not load these strings. */
export const CRM_DICTS: Partial<Record<Locale, Dict>> = {};

export function registerCrmDicts(dicts: Record<Locale, Dict>) {
  (Object.keys(dicts) as Locale[]).forEach((locale) => {
    CRM_DICTS[locale] = dicts[locale];
  });
}
