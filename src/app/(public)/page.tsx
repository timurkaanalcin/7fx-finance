import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession, postLoginPath } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LandingPage from "@/components/landing/LandingPage";
import { marketingMetadata, organizationJsonLd } from "@/lib/seo";
import { isIndexableHost, metadataOrigin, normalizeHost } from "@/lib/seo-hosts";

export async function generateMetadata(): Promise<Metadata> {
  const h = headers();
  return marketingMetadata(h.get("x-forwarded-host") || h.get("host"), "/");
}

export default async function Home() {
  const session = await getSession();
  if (session) {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { role: true, crmReadOnly: true },
    });
    redirect(user ? postLoginPath(user) : session.role === "ADMIN" ? "/izcrm" : "/trade");
  }

  const host = normalizeHost(headers().get("x-forwarded-host") || headers().get("host"));
  const jsonLd = isIndexableHost(host) ? organizationJsonLd(metadataOrigin(host)) : null;

  return (
    <>
      {jsonLd ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      ) : null}
      <LandingPage />
    </>
  );
}
