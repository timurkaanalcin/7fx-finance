import type { Locale } from "../locales";
import type { Dict } from "../types";
import { en } from "./en";
import { ru } from "./ru";
import { ar } from "./ar";
import { tr } from "./tr";
import { de } from "./de";

export const DICTS: Record<Locale, Dict> = { en, ru, ar, tr, de };

export function translate(locale: Locale, key: string, fallbackLocale: Locale = "en"): string {
  return DICTS[locale]?.[key] ?? DICTS[fallbackLocale]?.[key] ?? key;
}
