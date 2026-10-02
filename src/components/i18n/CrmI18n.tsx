"use client";

import { I18nProvider } from "@/lib/i18n/context";

/** Admin CRM — default Turkish, separate storage key from public site. */
export default function CrmI18n({ children }: { children: React.ReactNode }) {
  return <I18nProvider scope="crm">{children}</I18nProvider>;
}
