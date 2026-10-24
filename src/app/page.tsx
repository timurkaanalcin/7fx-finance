import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession, postLoginPath } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LandingPage from "@/components/landing/LandingPage";
import { getPublicLocale, serverT } from "@/lib/i18n/server";

const OG_LOCALE: Record<string, string> = {
  tr: "tr_TR",
  en: "en_US",
  de: "de_DE",
  ru: "ru_RU",
  ar: "ar_AR",
};

export function generateMetadata(): Metadata {
  const locale = getPublicLocale();
  const t = serverT(locale);
  const title = t("lp.meta.title");
  const description = t("lp.meta.description");
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: "/" },
    robots: { index: true, follow: true },
    keywords: ["7FX", "forex", "altın", "emtia", "endeks", "kripto", "hisse", "işlem platformu", "trading platform"],
    openGraph: {
      type: "website",
      url: "/",
      siteName: "7FX",
      title,
      description,
      locale: OG_LOCALE[locale] ?? "en_US",
      images: [{ url: "/brand/og-7fx.png", width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/brand/og-7fx.png"],
    },
  };
}

function JsonLd() {
  const locale = getPublicLocale();
  const t = serverT(locale);
  const base = (process.env.NEXT_PUBLIC_APP_URL || "https://7fx.control.org.tr").replace(/\/$/, "");
  const faq = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
    "@type": "Question",
    name: t(`lp.q${n}`),
    acceptedAnswer: { "@type": "Answer", text: t(`lp.a${n}`) },
  }));
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${base}/#org`,
        name: "7FX",
        url: `${base}/`,
        logo: `${base}/icons/v3/icon-512.png`,
      },
      {
        "@type": "WebSite",
        "@id": `${base}/#website`,
        name: "7FX",
        url: `${base}/`,
        inLanguage: locale,
        publisher: { "@id": `${base}/#org` },
      },
      {
        "@type": "WebPage",
        "@id": `${base}/#webpage`,
        url: `${base}/`,
        name: t("lp.meta.title"),
        description: t("lp.meta.description"),
        inLanguage: locale,
        isPartOf: { "@id": `${base}/#website` },
      },
      { "@type": "FAQPage", "@id": `${base}/#faq`, inLanguage: locale, mainEntity: faq },
    ],
  };
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output with "<" escaped so content can never close the script tag.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
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

  return (
    <>
      <JsonLd />
      <LandingPage />
    </>
  );
}
