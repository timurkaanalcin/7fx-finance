import type { Metadata } from "next";
import CrmxFrame from "@/components/crmx/CrmxFrame";

export const metadata: Metadata = {
  title: "CRM",
  robots: { index: false, follow: false },
};

export default function CrmxLayout({ children }: { children: React.ReactNode }) {
  return <CrmxFrame>{children}</CrmxFrame>;
}
