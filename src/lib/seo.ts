import type { Metadata } from "next";
import {
  PRIMARY_ORIGIN,
  isIndexableHost,
  metadataOrigin,
  normalizeHost,
} from "@/lib/seo-hosts";

export const TITLE = "7FX — Global multi-asset trading platform";
export const DESCRIPTION =
  "7FX is an international multi-asset trading platform for stocks, crypto, forex and commodities.";
export const IOS_TITLE = "Install 7FX on iPhone and iPad";
export const IOS_DESCRIPTION =
  "Add 7FX to your iPhone or iPad Home Screen for an app-like experience.";
export const OG_IMAGE = "/og/7fx-og.png";
export const OG_ALT = "7FX — global multi-asset trading platform";

const OG_LOCALES = ["tr_TR", "de_DE", "ru_RU", "ar_AR"];

function card(title: string, description: string, url: string): Pick<Metadata, "openGraph" | "twitter"> {
  return {
    openGraph: {
      type: "website",
      locale: "en_US",
      alternateLocale: OG_LOCALES,
      url,
      siteName: "7FX",
      title,
      description,
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: OG_ALT }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE],
    },
  };
}

/** Per-host metadata for the public marketing routes. Other routes stay noindex. */
export function marketingMetadata(hostHeader: string | null, path: "/" | "/ios"): Metadata {
  const host = normalizeHost(hostHeader);
  const indexable = isIndexableHost(host);
  const origin = indexable ? metadataOrigin(host) : PRIMARY_ORIGIN;
  const url = path === "/" ? origin : `${origin}${path}`;
  const title = path === "/ios" ? IOS_TITLE : TITLE;
  const description = path === "/ios" ? IOS_DESCRIPTION : DESCRIPTION;
  return {
    metadataBase: new URL(origin),
    title: { absolute: title },
    description,
    alternates: indexable ? { canonical: url } : undefined,
    robots: indexable
      ? { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } }
      : { index: false, follow: false },
    ...card(title, description, url),
  };
}

export function organizationJsonLd(origin: string): string {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "7FX",
        url: PRIMARY_ORIGIN,
        logo: `${PRIMARY_ORIGIN}/icons/v3/icon-512.png`,
      },
      {
        "@type": "WebSite",
        name: "7FX",
        url: origin,
        inLanguage: "en",
        description: DESCRIPTION,
        publisher: { "@type": "Organization", name: "7FX", url: PRIMARY_ORIGIN },
      },
    ],
  };
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
