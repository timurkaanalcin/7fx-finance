"use client";

import { I18nProvider } from "@/lib/i18n/context";
import { installDict } from "@/lib/i18n/dictionaries";
import { CRM_UI } from "@/lib/i18n/dictionaries/crm-ui";
import { registerCrmDicts } from "@/lib/i18n/dictionaries/crm-registry";
import { tr } from "@/lib/i18n/dictionaries/tr";

registerCrmDicts(CRM_UI);
// CRM default is Turkish. Keep that dictionary in this chunk so the first paint is not English.
installDict("tr", tr);

/** Admin CRM — default Turkish, separate storage key from public site. */
export default function CrmI18n({ children }: { children: React.ReactNode }) {
  return <I18nProvider scope="crm">{children}</I18nProvider>;
}
