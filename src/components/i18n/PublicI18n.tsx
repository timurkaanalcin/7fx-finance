"use client";

import { I18nProvider } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/locales";

/** Public site / auth / terminal — server-resolved initial locale, separate from CRM locale. */
export default function PublicI18n({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  return (
    <I18nProvider scope="public" initialLocale={initialLocale}>
      {children}
    </I18nProvider>
  );
}
