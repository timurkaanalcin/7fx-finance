"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";

export default function LicensesSection() {
  const { t } = useI18n();
  return (
    <section id="licenses" className="fx-section fx-section--soft" aria-labelledby="licenses-title">
      <div className="fx-shell">
        <p className="fx-eyebrow inline-flex items-center gap-2">
          <span className="fx-eyebrow-dot" aria-hidden />
          {t("landing.licenses.eyebrow")}
        </p>
        <h2 id="licenses-title" className="fx-h2 mt-4">{t("landing.licenses.title")}</h2>
        <p className="fx-section-body mt-4 max-w-[640px]">{t("landing.licenses.summary")}</p>
        <Link href="/licenses" className="fx-btn-secondary mt-8 inline-flex min-h-12 items-center justify-center rounded-full px-6 text-sm font-medium">
          {t("landing.licenses.open")}
        </Link>
      </div>
    </section>
  );
}
