/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: false,
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse", "mammoth", "xlsx", "geoip-country"],
  },
  poweredByHeader: false,
  webpack: (config) => {
    // pdfjs-dist optionally requires node "canvas"; never bundle it.
    config.resolve.alias = { ...(config.resolve.alias || {}), canvas: false };
    return config;
  },
  async redirects() {
    return [
      { source: "/apk", destination: "/downloads/7FX.apk", permanent: false },
      { source: "/download/apk", destination: "/downloads/7FX.apk", permanent: false },
      {
        source: "/landing/7fx-hero-custom-v1.png",
        destination: "/landing/7fx-hero-custom-v1.webp",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        ],
      },
      {
        source: "/offline.html",
        headers: [
          { key: "Cache-Control", value: "no-cache" },
          { key: "Content-Type", value: "text/html; charset=utf-8" },
        ],
      },
      {
        source: "/izcrm/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        ],
      },
      {
        source: "/api/admin/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
      ...["/icons/:path*", "/landing/:path*", "/logos/:path*", "/og/:path*"].map((source) => ({
        source,
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      })),
      ...["/7fx-logo.png", "/7fx-mark.png", "/ing-logo.png"].map((source) => ({
        source,
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      })),
    ];
  },
};

export default nextConfig;
