"use client";

import { I18nProvider } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/locales";
import type { Dict } from "@/lib/i18n/types";

/** Public site / auth / terminal — default English, separate from the CRM storage key. */
export default function PublicI18n({
  children,
  initialLocale,
  initialDict,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
  initialDict?: Dict;
}) {
  return (
    <I18nProvider scope="public" initialLocale={initialLocale} initialDict={initialDict}>
      {children}
    </I18nProvider>
  );
}
