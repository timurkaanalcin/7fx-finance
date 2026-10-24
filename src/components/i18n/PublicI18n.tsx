"use client";

import { I18nProvider } from "@/lib/i18n/context";

/** Public site / auth / terminal — default Turkish, separate from the CRM storage key. */
export default function PublicI18n({ children }: { children: React.ReactNode }) {
  return <I18nProvider scope="public">{children}</I18nProvider>;
}
