import { Suspense } from "react";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import CrmV3App from "@/components/crmv3/CrmV3App";
import "../../../../globals.css";
import "@/styles/luxury.css";
import "@/components/crmv3/crmv3.css";

export const dynamic = "force-dynamic";

export default async function IzcrmV3Page({ params }: { params: { section?: string[] } }) {
  const admin = await requireAdmin();
  if (!admin || admin.role !== "ADMIN") redirect("/login");
  return (
    <Suspense fallback={null}>
      <CrmV3App base="/izcrm/crmv3" section={params.section ?? []} name={admin.name || "Admin"} />
    </Suspense>
  );
}
