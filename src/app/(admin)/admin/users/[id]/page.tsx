"use client";

import { useCrmLabels } from "@/lib/i18n/crm-labels";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function UserDetailRedirect() {
  const { i18n } = useCrmLabels();
  const params = useParams();
  const router = useRouter();
  useEffect(() => {
    router.replace(`/admin/traders/${params?.id}`);
  }, [router, params]);
  return <div className="text-xs text-neutral-500">{i18n("crm.redirect.trader")}</div>;
}
