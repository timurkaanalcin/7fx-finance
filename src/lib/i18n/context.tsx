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
  // Public site owns <html lang/dir>. CRM applies dir on .fx-crm root instead when nested.
  if (scope === "public") {
    document.documentElement.lang = meta.htmlLang;
    document.documentElement.dir = meta.dir;
  }
}

export function I18nProvider({
  scope,
  children,
  initialLocale,
  initialDict,
}: {
  scope: I18nScope;
  children: ReactNode;
  initialLocale?: Locale;
  /** Server-loaded public dictionary so the first paint matches the fx_lang cookie. */
  initialDict?: Dict;
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
    const next = stored ?? initialLocale ?? fallback;
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
  }, [scope, initialLocale, fallback]);

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

export function useT() {
  return useI18n().t;
}
