"use client";

import Link from "next/link";
import { useMemo } from "react";
import { classicLinks } from "@/lib/crmx/nav";
import { scopedPageAllowed } from "@/lib/crm-scope-pages";
import { useI18n } from "@/lib/i18n/context";
import { useCrmxAccess } from "../Shell";
import { PageHead } from "../ui";

export default function Settings() {
  const { t } = useI18n();
  const { scoped } = useCrmxAccess();
  const groups = useMemo(() => {
    const links = classicLinks().filter((link) => !scoped || scopedPageAllowed(link.href));
    const order: string[] = [];
    const map = new Map<string, typeof links>();
    for (const link of links) {
      const bucket = map.get(link.groupKey);
      if (bucket) bucket.push(link);
      else {
        order.push(link.groupKey);
        map.set(link.groupKey, [link]);
      }
    }
    return order.map((key) => ({ key, items: map.get(key) || [] }));
  }, [scoped]);

  return (
    <section>
      <PageHead title={t("crm.nav.settings")} lead={t("crmx.settings.lead")} />
      <p className="crmx-lead" style={{ marginBottom: 16 }}>{t("crmx.settings.body")}</p>
      {groups.map((group) => (
        <div key={group.key} style={{ marginBottom: 18 }}>
          <h2 style={{ fontSize: 13, fontWeight: 500, margin: "0 0 8px" }}>{t(group.key)}</h2>
          <div className="crmx-links">
            {group.items.map((item) => (
              <Link key={item.href} href={item.href}>
                <strong>{t(item.labelKey)}</strong>
                <span>{item.href}</span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
