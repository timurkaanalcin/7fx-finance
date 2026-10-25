"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { hasDict, installDict, loadLocaleDict, translate } from "./dictionaries";
import {
  LOCALE_META,
  LOCALE_STORAGE,
  defaultLocaleFor,
  normalizeLocale,
  publicLocaleFromCookie,
  type I18nScope,
  type Locale,
} from "./locales";
import type { Dict } from "./types";

type I18nContextValue = {
  locale: Locale;
  scope: I18nScope;
  dir: "ltr" | "rtl";
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function readStored(scope: I18nScope): Locale | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LOCALE_STORAGE[scope]);
    return raw ? normalizeLocale(raw, scope) : null;
  } catch {
    return null;
  }
}

function writeStored(scope: I18nScope, locale: Locale) {
  try {
    window.localStorage.setItem(LOCALE_STORAGE[scope], locale);
    document.cookie = `${LOCALE_STORAGE[scope]}=${locale};path=/;max-age=31536000;samesite=lax`;
  } catch {
    /* ignore */
  }
}

function applyDocumentLocale(locale: Locale, scope: I18nScope) {
  const meta = LOCALE_META[locale];
  // The public provider wraps CRM and its effect runs later. Leave <html> to CRM while that scope is mounted.
  if (scope === "public" && document.querySelector("[data-i18n-scope='crm']")) return;
  document.documentElement.lang = meta.htmlLang;
  document.documentElement.dir = meta.dir;
}

export function I18nProvider({
  scope,
  children,
  initialLocale,
  initialDict,
  hasLocaleCookie,
}: {
  scope: I18nScope;
  children: ReactNode;
  initialLocale?: Locale;
  /** Server-loaded public dictionary so the first paint matches the fx_lang cookie. */
  initialDict?: Dict;
  /**
   * Public pages pass false when fx_lang is missing. Undefined keeps the previous
   * hydration (CRM): a stored language applies on this visit.
   */
  hasLocaleCookie?: boolean;
}) {
  if (initialLocale && initialLocale !== "en" && initialDict) {
    installDict(initialLocale, initialDict);
  }
  const fallback = defaultLocaleFor(scope);
  const [locale, setLocaleState] = useState<Locale>(initialLocale ?? fallback);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancel = false;
    const stored = readStored(scope);
    const ssr = initialLocale ?? fallback;
    // No fx_lang cookie: keep this paint (English unless the server sent another locale).
    // Persist the saved language so the next response can paint it. A real cookie, including "en", still wins via storage.
    if (scope === "public" && hasLocaleCookie === false && stored && stored !== ssr) {
      writeStored(scope, stored);
      setLocaleState(ssr);
      applyDocumentLocale(ssr, scope);
      setHydrated(true);
      return;
    }
    const next = stored ?? ssr;
    const apply = () => {
      if (cancel) return;
      setLocaleState(next);
      applyDocumentLocale(next, scope);
      setHydrated(true);
    };
    if (!hasDict(next)) {
      void loadLocaleDict(next).then(apply);
    } else {
      apply();
    }
    return () => {
      cancel = true;
    };
  }, [scope, initialLocale, fallback, hasLocaleCookie]);

  useEffect(() => {
    if (scope !== "crm") return;
    applyDocumentLocale(locale, "crm");
    return () => {
      let raw: string | null = null;
      try {
        const match = document.cookie.match(/(?:^|; )fx_lang=([^;]*)/);
        raw = match ? decodeURIComponent(match[1]) : null;
      } catch {
        raw = null;
      }
      const pub = publicLocaleFromCookie(raw);
      document.documentElement.lang = LOCALE_META[pub].htmlLang;
      document.documentElement.dir = LOCALE_META[pub].dir;
    };
  }, [scope, locale]);

  const setLocale = useCallback(
    (next: Locale) => {
      const commit = () => {
        setLocaleState(next);
        writeStored(scope, next);
        applyDocumentLocale(next, scope);
      };
      if (!hasDict(next)) void loadLocaleDict(next).then(commit);
      else commit();
    },
    [scope]
  );

  const t = useCallback((key: string) => translate(locale, key), [locale]);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      scope,
      dir: LOCALE_META[locale].dir,
      setLocale,
      t,
    }),
    [locale, scope, setLocale, t]
  );

  return (
    <I18nContext.Provider value={value}>
      <div
        lang={LOCALE_META[locale].htmlLang}
        dir={LOCALE_META[locale].dir}
        data-i18n-scope={scope}
        data-i18n-hydrated={hydrated ? "1" : "0"}
        className="contents"
      >
        {children}
      </div>
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    const locale: Locale = "en";
    return {
      locale,
      scope: "public",
      dir: "ltr",
      setLocale: () => {},
      t: (key) => translate(locale, key),
    };
  }
  return ctx;
}

export function useT(): (key: string) => string {
  return useI18n().t;
}
