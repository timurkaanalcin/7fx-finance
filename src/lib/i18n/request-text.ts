import { CRM_UI } from "./dictionaries/crm-ui";
import { normalizeLocale, type Locale } from "./locales";

/** CRM UI language from the fx_crm_lang cookie. Missing or unknown values stay English. */
export function crmLocaleFromRequest(req: Request): Locale {
  const raw = req.headers.get("cookie") || "";
  const match = raw.match(/(?:^|;)\s*fx_crm_lang=([^;]*)/);
  let value = "";
  if (match) {
    try {
      value = decodeURIComponent(match[1]);
    } catch {
      value = match[1];
    }
  }
  return normalizeLocale(value, "crm");
}

export function crmApiText(req: Request, key: string): string {
  const locale = crmLocaleFromRequest(req);
  return CRM_UI[locale]?.[key] || CRM_UI.en[key] || key;
}
