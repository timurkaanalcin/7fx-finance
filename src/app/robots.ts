import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { isIndexableHost, metadataOrigin, normalizeHost } from "@/lib/seo-hosts";

const PRIVATE = [
  "/api",
  "/trade",
  "/admin",
  "/izcrm",
  "/login",
  "/register",
  "/profile",
  "/documents",
  "/assistant",
  "/membership",
  "/fx-css",
  "/fx-landing-css",
];

/** Prefix allows. A longer Disallow still wins, so /trade stays out while /markets is in. */
const PUBLIC = ["/", "/markets", "/platform", "/faq", "/ios"];

export default function robots(): MetadataRoute.Robots {
  const host = normalizeHost(headers().get("x-forwarded-host") || headers().get("host"));
  if (!isIndexableHost(host)) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  const origin = metadataOrigin(host);
  return {
    rules: [
      {
        userAgent: "*",
        allow: PUBLIC,
        disallow: PRIVATE,
      },
      { userAgent: "GPTBot", disallow: "/" },
      { userAgent: "CCBot", disallow: "/" },
    ],
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
