import { Suspense } from "react";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import CrmV2App from "@/components/crmv2/CrmV2App";
import "../../globals.css";

export const dynamic = "force-dynamic";

export default async function CrmV2Page({ params }: { params: { section?: string[] } }) {
  const admin = await requireAdmin();
  if (!admin || admin.role !== "ADMIN") redirect("/login");
  return (
    <Suspense fallback={null}>
      <CrmV2App base="/crmv2" section={params.section ?? []} name={admin.name || "Admin"} />
    </Suspense>
  );
}
