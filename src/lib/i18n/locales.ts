export const LOCALES = ["en", "ru", "ar", "tr", "de"] as const;
export type Locale = (typeof LOCALES)[number];
export type I18nScope = "public" | "crm";

/**
 * Public site / terminal / auth default.
 * English is the primary language. A stored fx_lang still wins after mount.
 */
export const PUBLIC_DEFAULT_LOCALE: Locale = "en";
/** CRM / admin default */
export const CRM_DEFAULT_LOCALE: Locale = "tr";

/** @deprecated use PUBLIC_DEFAULT_LOCALE */
export const DEFAULT_LOCALE = PUBLIC_DEFAULT_LOCALE;

export const LOCALE_STORAGE: Record<I18nScope, string> = {
  public: "fx_lang",
  crm: "fx_crm_lang",
};
export const LOCALE_COOKIE: Record<I18nScope, string> = {
  public: "fx_lang",
  crm: "fx_crm_lang",
};

export const LOCALE_META: Record<
  Locale,
  { label: string; native: string; dir: "ltr" | "rtl"; htmlLang: string }
> = {
  en: { label: "English", native: "English", dir: "ltr", htmlLang: "en" },
  ru: { label: "Russian", native: "Русский", dir: "ltr", htmlLang: "ru" },
  ar: { label: "Arabic", native: "العربية", dir: "rtl", htmlLang: "ar" },
  tr: { label: "Turkish", native: "Türkçe", dir: "ltr", htmlLang: "tr" },
  de: { label: "German", native: "Deutsch", dir: "ltr", htmlLang: "de" },
};

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (LOCALES as readonly string[]).includes(v);
}

export function defaultLocaleFor(scope: I18nScope): Locale {
  return scope === "crm" ? CRM_DEFAULT_LOCALE : PUBLIC_DEFAULT_LOCALE;
}

export function normalizeLocale(v: unknown, scope: I18nScope = "public"): Locale {
  if (typeof v === "string") {
    const base = v.toLowerCase().split("-")[0];
    if (isLocale(base)) return base;
  }
  return defaultLocaleFor(scope);
}
