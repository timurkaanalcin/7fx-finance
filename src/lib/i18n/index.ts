export {
  LOCALES,
  LOCALE_META,
  PUBLIC_DEFAULT_LOCALE,
  CRM_DEFAULT_LOCALE,
  DEFAULT_LOCALE,
  type Locale,
  type I18nScope,
  normalizeLocale,
  defaultLocaleFor,
} from "./locales";
export { I18nProvider, useI18n, useT } from "./context";
export { translate, DICTS } from "./dictionaries";
