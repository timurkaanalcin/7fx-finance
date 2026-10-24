import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { isIndexableHost, metadataOrigin, normalizeHost } from "@/lib/seo-hosts";

export default function sitemap(): MetadataRoute.Sitemap {
  const host = normalizeHost(headers().get("x-forwarded-host") || headers().get("host"));
  if (!isIndexableHost(host)) return [];
  const origin = metadataOrigin(host);
  return [
    { url: origin, changeFrequency: "weekly", priority: 1 },
    { url: `${origin}/ios`, changeFrequency: "monthly", priority: 0.4 },
  ];
}
