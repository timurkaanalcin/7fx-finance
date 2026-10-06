"use client";

import { useCrmLabels } from "@/lib/i18n/crm-labels";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function UsersRedirect() {
  const { i18n } = useCrmLabels();
  const router = useRouter();
  useEffect(() => {
    router.replace("/izcrm/traders");
  }, [router]);
  return <div className="text-xs text-neutral-500">{i18n("crm.redirect.traders")}</div>;
}
