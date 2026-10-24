"use client";

import { I18nProvider } from "@/lib/i18n/context";
import { CRM_UI } from "@/lib/i18n/dictionaries/crm-ui";
import { registerCrmDicts } from "@/lib/i18n/dictionaries/crm-registry";

registerCrmDicts(CRM_UI);

/** Admin CRM — default Turkish, separate storage key from public site. */
export default function CrmI18n({ children }: { children: React.ReactNode }) {
  return <I18nProvider scope="crm">{children}</I18nProvider>;
}
