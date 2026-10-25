"use client";

import { useEffect, useState } from "react";
import { I18nProvider } from "@/lib/i18n/context";
import { installDict } from "@/lib/i18n/dictionaries";
import { registerCrmDicts } from "@/lib/i18n/dictionaries/crm-registry";
import { tr } from "@/lib/i18n/dictionaries/tr";

installDict("tr", tr);

/** CRM copy is a separate chunk. English chrome waits for it instead of painting raw keys. */
const crmUi = import("@/lib/i18n/dictionaries/crm-ui").then(({ CRM_UI }) => {
  registerCrmDicts(CRM_UI);
});

/** Admin CRM — English until a language is stored, separate key from the public site. */
export default function CrmI18n({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let live = true;
    void crmUi.then(() => {
      if (live) setReady(true);
    });
    return () => {
      live = false;
    };
  }, []);
  if (!ready) {
    return (
      <div className="fx-crm min-h-screen bg-white p-6 text-sm font-normal text-neutral-600" role="status">
        Loading CRM…
      </div>
    );
  }
  return <I18nProvider scope="crm">{children}</I18nProvider>;
}
