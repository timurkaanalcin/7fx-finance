"use client";

import { useI18n } from "@/lib/i18n/context";

export default function IosPageTitle() {
  const { t } = useI18n();
  return <h1 className="text-2xl font-semibold tracking-tight">{t("landing.ios.pageTitle")}</h1>;
}
