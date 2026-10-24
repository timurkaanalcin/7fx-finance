import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { isIndexableHost, MARKETING_PATHS, metadataOrigin, normalizeHost } from "@/lib/seo-hosts";

export default function sitemap(): MetadataRoute.Sitemap {
  const host = normalizeHost(headers().get("x-forwarded-host") || headers().get("host"));
  if (!isIndexableHost(host)) return [];
  const origin = metadataOrigin(host);
  return MARKETING_PATHS.map((path) => ({
    url: path === "/" ? origin : `${origin}${path}`,
    changeFrequency: path === "/" || path.startsWith("/markets") ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path === "/markets" || path === "/platform" ? 0.8 : path === "/ios" ? 0.4 : 0.6,
  }));
}
