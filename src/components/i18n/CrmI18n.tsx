"use client";

import { I18nProvider } from "@/lib/i18n/context";
import { installDict } from "@/lib/i18n/dictionaries";
import { CRM_UI } from "@/lib/i18n/dictionaries/crm-ui";
import { registerCrmDicts } from "@/lib/i18n/dictionaries/crm-registry";
import { tr } from "@/lib/i18n/dictionaries/tr";

registerCrmDicts(CRM_UI);
// English is the first paint. Turkish stays in this chunk so the switcher does not flash keys.
installDict("tr", tr);

/** Admin CRM — English until a language is stored, separate key from the public site. */
export default function CrmI18n({ children }: { children: React.ReactNode }) {
  return <I18nProvider scope="crm">{children}</I18nProvider>;
}
