import type { Locale } from "../locales";
import type { Dict } from "../types";
import { en } from "./en";
import { ru } from "./ru";
import { ar } from "./ar";
import { tr } from "./tr";
import { de } from "./de";
import { CRM_UI } from "./crm-ui";

export const DICTS: Record<Locale, Dict> = {
  en: { ...en, ...CRM_UI.en },
  ru: { ...ru, ...CRM_UI.ru },
  ar: { ...ar, ...CRM_UI.ar },
  tr: { ...tr, ...CRM_UI.tr },
  de: { ...de, ...CRM_UI.de },
};

export function translate(locale: Locale, key: string, fallbackLocale: Locale = "en"): string {
  return DICTS[locale]?.[key] ?? DICTS[fallbackLocale]?.[key] ?? key;
}
