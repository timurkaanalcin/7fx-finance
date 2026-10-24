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
];

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
        allow: ["/$", "/ios"],
        disallow: PRIVATE,
      },
      { userAgent: "GPTBot", disallow: "/" },
      { userAgent: "CCBot", disallow: "/" },
    ],
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
