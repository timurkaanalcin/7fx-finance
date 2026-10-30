import type { Locale } from "../locales";
import type { Dict } from "../types";
import { en } from "./en";
import { FEED_UI } from "./feed-ui";
import { STATES_UI } from "./states-ui";
import { TW_UI } from "./tw-ui";
import { CRM_DICTS } from "./crm-registry";

/**
 * English is in the first load. Other public locales are separate chunks,
 * loaded when the visitor's saved language needs them.
 */
const loaded: Partial<Record<Locale, Dict>> = {
  en: { ...en, ...FEED_UI.en, ...STATES_UI.en, ...TW_UI.en },
};

export function hasDict(locale: Locale): boolean {
  return Boolean(loaded[locale]);
}

/** Merge a locale's public strings. Feed copy for that locale is added here. */
export function installDict(locale: Locale, dict: Dict): void {
  loaded[locale] = { ...dict, ...FEED_UI[locale], ...STATES_UI[locale], ...TW_UI[locale] };
}

const loaders: Record<Exclude<Locale, "en">, () => Promise<Dict>> = {
  ru: () => import("./ru").then((m) => m.ru),
  ar: () => import("./ar").then((m) => m.ar),
  tr: () => import("./tr").then((m) => m.tr),
  de: () => import("./de").then((m) => m.de),
};

const pending = new Map<Locale, Promise<void>>();

export function loadLocaleDict(locale: Locale): Promise<void> {
  if (locale === "en" || loaded[locale]) return Promise.resolve();
  const existing = pending.get(locale);
  if (existing) return existing;
  const job = loaders[locale]()
    .then((dict) => {
      installDict(locale, dict);
    })
    .finally(() => {
      pending.delete(locale);
    });
  pending.set(locale, job);
  return job;
}

/** Loaded public dictionaries. English is always present; other locales appear after load. */
export const DICTS: Partial<Record<Locale, Dict>> = loaded;

export function translate(locale: Locale, key: string, fallbackLocale: Locale = "en"): string {
  return (
    loaded[locale]?.[key] ??
    loaded[fallbackLocale]?.[key] ??
    CRM_DICTS[locale]?.[key] ??
    CRM_DICTS[fallbackLocale]?.[key] ??
    key
  );
}
