import { Suspense } from "react";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import CrmV4App from "@/components/crmv4/CrmV4App";
import "../../globals.css";
import "@/components/crmv4/crmv4.css";

export const dynamic = "force-dynamic";

export default async function CrmV4Page({ params }: { params: { section?: string[] } }) {
  const admin = await requireAdmin();
  if (!admin || admin.role !== "ADMIN") redirect("/login");
  return (
    <Suspense fallback={null}>
      <CrmV4App base="/crmv4" section={params.section ?? []} name={admin.name || "Admin"} />
    </Suspense>
  );
}
