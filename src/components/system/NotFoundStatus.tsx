"use client";

import PlatformStatus from "@/components/system/PlatformStatus";
import { useT } from "@/lib/i18n/context";

export default function NotFoundStatus() {
  const t = useT();
  return (
    <PlatformStatus
      code="404"
      title={t("gap.nf.title")}
      body={t("gap.nf.body")}
      primary={{ href: "/trade", label: t("gap.err.terminal") }}
      secondary={{ href: "/", label: t("gap.nf.home") }}
    />
  );
}
