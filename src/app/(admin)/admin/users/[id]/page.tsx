"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function UserDetailRedirect() {
  const params = useParams();
  const router = useRouter();
  useEffect(() => {
    router.replace(`/admin/traders/${params?.id}`);
  }, [router, params]);
  return <div className="text-xs text-slate-500">Trader detayına yönlendiriliyor…</div>;
}
