import type { Locale } from "../locales";
import type { Dict } from "../types";
import { en } from "./en";
import { ru } from "./ru";
import { ar } from "./ar";
import { tr } from "./tr";
import { de } from "./de";
import { FEED_UI } from "./feed-ui";
import { CRM_DICTS } from "./crm-registry";

export const DICTS: Record<Locale, Dict> = {
  en: { ...en, ...FEED_UI.en },
  ru: { ...ru, ...FEED_UI.ru },
  ar: { ...ar, ...FEED_UI.ar },
  tr: { ...tr, ...FEED_UI.tr },
  de: { ...de, ...FEED_UI.de },
};

export function translate(locale: Locale, key: string, fallbackLocale: Locale = "en"): string {
  return (
    DICTS[locale]?.[key] ??
    DICTS[fallbackLocale]?.[key] ??
    CRM_DICTS[locale]?.[key] ??
    CRM_DICTS[fallbackLocale]?.[key] ??
    key
  );
}
