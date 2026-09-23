"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function UsersRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/traders");
  }, [router]);
  return <div className="text-xs text-slate-500">Traderlar sayfasına yönlendiriliyor…</div>;
}
