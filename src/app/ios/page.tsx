import type { Metadata } from "next";
import { headers } from "next/headers";
import { marketingMetadata } from "@/lib/seo";
import IosInstallPage from "@/components/landing/IosInstallPage";

export async function generateMetadata(): Promise<Metadata> {
  const h = headers();
  return marketingMetadata(h.get("x-forwarded-host") || h.get("host"), "/ios");
}

export default function IosPage() {
  return <IosInstallPage />;
}
